// backend/src/services/priceCalculation.service.ts
import db from '../config/database';
import logger from '../utils/logger';

interface PriceBreakdown {
  period: string;
  nights: number;
  price_per_night?: number;
  price_per_month?: number;
  total: number;
  season_type?: string;
  month_number?: number;
}

interface CalculatedPrice {
  total_price: number;
  currency: string;
  nights: number;
  daily_average: number;
  monthly_equivalent: number;
  breakdown: PriceBreakdown[];
  pricing_method: 'seasonal' | 'monthly' | 'yearly' | 'combined';
  yearly_only_warning?: boolean;
  calculation_log?: string[];
}

interface AvailablePeriod {
  check_in: string;
  check_out: string;
  nights: number;
  total_price: number;
  daily_average: number;
}

// ✅ ТИПЫ ПЕРИОДОВ
enum PeriodType {
  SHORT_TERM = 'SHORT_TERM',        // 1-26 дней
  MONTHLY_EXACT = 'MONTHLY_EXACT',  // 27-31 день
  LONG_TERM = 'LONG_TERM',          // 32-364 дня
  YEARLY = 'YEARLY'                 // 365+ дней
}

class PriceCalculationService {
  /**
   * ========================================
   * ГЛАВНЫЙ МЕТОД - рассчитать цену
   * ========================================
   */
  async calculatePrice(
    propertyId: number,
    checkIn: string,
    checkOut: string
  ): Promise<CalculatedPrice | null> {
    try {
      const start = new Date(checkIn);
      const end = new Date(checkOut);
      const nights = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

      if (nights <= 0) {
        logger.warn(`Invalid nights: ${nights}`);
        return null;
      }

      const calculationLog: string[] = [];
      calculationLog.push(`=== РАСЧЕТ ДЛЯ ОБЪЕКТА ${propertyId} ===`);
      calculationLog.push(`Период: ${checkIn} → ${checkOut} (${nights} ночей)`);

      // Проверяем существование объекта
      const propertyExists = await db.queryOne<any>(
        'SELECT id, property_number, property_type FROM properties WHERE id = ?',
        [propertyId]
      );

      if (!propertyExists) {
        logger.error(`❌ Property ${propertyId} NOT FOUND`);
        return null;
      }

      calculationLog.push(`Объект: #${propertyExists.property_number} (${propertyExists.property_type})`);

      // Загружаем все данные о ценах
      const [seasonalPrices, monthlyPrices, yearPrice] = await Promise.all([
        this.getSeasonalPrices(propertyId),
        this.getMonthlyPrices(propertyId),
        this.getYearPrice(propertyId)
      ]);

      // ✅ Компактное логирование данных о ценах
      calculationLog.push(`Сезонных цен: ${seasonalPrices.length}`);
      if (seasonalPrices.length > 0) {
        calculationLog.push(`  Сезоны: ${seasonalPrices.map(p => 
          `${p.season_type} (${p.start_date_recurring}→${p.end_date_recurring}: ${p.price_per_night} THB)`
        ).join(', ')}`);
      }

      calculationLog.push(`Месячных цен: ${monthlyPrices.length}`);
      if (monthlyPrices.length > 0) {
        calculationLog.push(`  Месяцы: ${monthlyPrices.map(p => 
          `${p.month_number}=${p.price_per_month} THB`
        ).join(', ')}`);
      }

      calculationLog.push(`Годовая цена: ${yearPrice ? `${yearPrice} THB/мес` : 'нет'}`);

      // Если вообще нет никаких цен
      if (seasonalPrices.length === 0 && monthlyPrices.length === 0 && !yearPrice) {
        logger.warn(`❌ NO PRICING DATA for property ${propertyId}`);
        return null;
      }

      // ✅ ОПРЕДЕЛЯЕМ ТИП ПЕРИОДА
      const periodType = this.determinePeriodType(nights);
      calculationLog.push(`Тип периода: ${periodType}`);

      // ✅ ОПРЕДЕЛЯЕМ yearly_only_warning
      const hasOnlyYearPrice = !!(
        yearPrice && 
        seasonalPrices.length === 0 && 
        monthlyPrices.length === 0 && 
        nights < 365
      );

      if (hasOnlyYearPrice) {
        calculationLog.push(`⚠️ ТОЛЬКО годовая цена для периода < 365 дней`);
      }

      // ✅ ВЫБИРАЕМ МЕТОД РАСЧЕТА ПО ПРИОРИТЕТУ
      let result: CalculatedPrice | null = null;

      switch (periodType) {
        case PeriodType.SHORT_TERM:
          result = await this.calculateShortTerm(
            start, end, nights, seasonalPrices, monthlyPrices, yearPrice, calculationLog
          );
          break;

        case PeriodType.MONTHLY_EXACT:
          result = await this.calculateMonthlyExact(
            start, end, nights, monthlyPrices, seasonalPrices, yearPrice, calculationLog
          );
          break;

        case PeriodType.LONG_TERM:
          result = await this.calculateLongTerm(
            start, end, nights, monthlyPrices, seasonalPrices, yearPrice, calculationLog
          );
          break;

        case PeriodType.YEARLY:
          result = await this.calculateYearly(
            nights, monthlyPrices, seasonalPrices, yearPrice, calculationLog
          );
          break;
      }

      if (result) {
        result.yearly_only_warning = hasOnlyYearPrice;
        result.calculation_log = calculationLog;
        
        // Выводим calculation_log в консоль для отладки
        logger.info(`=== CALCULATION LOG FOR PROPERTY ${propertyId} ===`);
        calculationLog.forEach((line: string) => logger.info(line));
      }

      return result;
    } catch (error) {
      logger.error(`❌ Price calculation error for property ${propertyId}:`, error);
      return null;
    }
  }

  /**
   * ========================================
   * МЕТОДЫ РАСЧЕТА ПО ТИПАМ ПЕРИОДОВ
   * ========================================
   */

  /**
   * Определить тип периода
   */
  private determinePeriodType(nights: number): PeriodType {
    if (nights <= 26) return PeriodType.SHORT_TERM;
    if (nights >= 27 && nights <= 31) return PeriodType.MONTHLY_EXACT;
    if (nights >= 32 && nights <= 364) return PeriodType.LONG_TERM;
    return PeriodType.YEARLY;
  }

  /**
   * РАСЧЕТ ДЛЯ 1-26 ДНЕЙ (SHORT_TERM)
   * Приоритет: Сезонные → Месячные → Годовые
   */
  private async calculateShortTerm(
    start: Date,
    end: Date,
    nights: number,
    seasonalPrices: any[],
    monthlyPrices: any[],
    yearPrice: number | null,
    log: string[]
  ): Promise<CalculatedPrice | null> {
    log.push(`--- SHORT_TERM (1-26 дней) ---`);

    // 1. Пытаемся по сезонным ценам
    if (seasonalPrices.length > 0) {
      log.push(`Попытка #1: Сезонные цены`);
      const result = await this.calculateFromSeasonalPrices(start, end, nights, seasonalPrices, log);
      if (result) {
        log.push(`✅ Успешно рассчитано по сезонным ценам`);
        return result;
      }
    }

    // 2. Пытаемся по месячным ценам (делим на дни)
    if (monthlyPrices.length > 0) {
      log.push(`Попытка #2: Месячные цены (деление на дни)`);
      const result = await this.calculateFromMonthlyDaily(start, end, nights, monthlyPrices, log);
      if (result) {
        log.push(`✅ Успешно рассчитано по месячным ценам`);
        return result;
      }
    }

    // 3. Пытаемся по годовой цене
    if (yearPrice) {
      log.push(`Попытка #3: Годовая цена`);
      const result = this.calculateFromYearPrice(nights, yearPrice, log);
      log.push(`✅ Успешно рассчитано по годовой цене`);
      return result;
    }

    log.push(`❌ Не удалось рассчитать SHORT_TERM`);
    return null;
  }

  /**
   * РАСЧЕТ ДЛЯ 27-31 ДЕНЬ (MONTHLY_EXACT)
   * Приоритет: Месячные → Сезонные → Годовые
   */
  private async calculateMonthlyExact(
    start: Date,
    end: Date,
    nights: number,
    monthlyPrices: any[],
    seasonalPrices: any[],
    yearPrice: number | null,
    log: string[]
  ): Promise<CalculatedPrice | null> {
    log.push(`--- MONTHLY_EXACT (27-31 день) ---`);

    const month = start.getMonth() + 1;

    // 1. Пытаемся найти месячную цену
    if (monthlyPrices.length > 0) {
      log.push(`Попытка #1: Месячная цена для месяца ${month}`);
      const monthPrice = monthlyPrices.find(p => p.month_number === month);
      
      if (monthPrice) {
        const totalPrice = monthPrice.price_per_month;
        log.push(`✅ Найдена месячная цена: ${totalPrice} THB (ПОЛНАЯ, БЕЗ деления)`);

        return {
          total_price: Math.round(totalPrice),
          currency: 'THB',
          nights,
          daily_average: Math.round(totalPrice / nights),
          monthly_equivalent: Math.round(totalPrice),
          breakdown: [{
            period: `Month ${month}`,
            nights,
            price_per_month: Math.round(totalPrice),
            total: Math.round(totalPrice),
            month_number: month
          }],
          pricing_method: 'monthly'
        };
      }
    }

    // 2. Если есть сезонные и годовая - используем сезонные
    if (seasonalPrices.length > 0 && yearPrice) {
      log.push(`Попытка #2: Сезонные цены (есть годовая, но приоритет у сезонных)`);
      const result = await this.calculateFromSeasonalPrices(start, end, nights, seasonalPrices, log);
      if (result) {
        log.push(`✅ Успешно рассчитано по сезонным ценам`);
        return result;
      }
    }

    // 3. Если только сезонные (без годовой)
    if (seasonalPrices.length > 0) {
      log.push(`Попытка #3: Сезонные цены (без годовой)`);
      const result = await this.calculateFromSeasonalPrices(start, end, nights, seasonalPrices, log);
      if (result) {
        log.push(`✅ Успешно рассчитано по сезонным ценам`);
        return result;
      }
    }

    // 4. Годовая цена
    if (yearPrice) {
      log.push(`Попытка #4: Годовая цена`);
      const result = this.calculateFromYearPrice(nights, yearPrice, log);
      log.push(`✅ Успешно рассчитано по годовой цене`);
      return result;
    }

    log.push(`❌ Не удалось рассчитать MONTHLY_EXACT`);
    return null;
  }

  /**
   * РАСЧЕТ ДЛЯ 32-364 ДНЕЙ (LONG_TERM)
   * Приоритет: Месячные (пропорционально) → Сезонные → Годовые
   */
  private async calculateLongTerm(
    start: Date,
    end: Date,
    nights: number,
    monthlyPrices: any[],
    seasonalPrices: any[],
    yearPrice: number | null,
    log: string[]
  ): Promise<CalculatedPrice | null> {
    log.push(`--- LONG_TERM (32-364 дня) ---`);

    // 1. Пытаемся по месячным ценам (пропорционально)
    if (monthlyPrices.length > 0) {
      log.push(`Попытка #1: Месячные цены (пропорциональный расчет)`);
      const result = await this.calculateLongTermFromMonthly(start, end, nights, monthlyPrices, log);
      if (result) {
        log.push(`✅ Успешно рассчитано по месячным ценам`);
        return result;
      }
    }

    // 2. Если есть сезонные и годовая - используем сезонные
    if (seasonalPrices.length > 0 && yearPrice) {
      log.push(`Попытка #2: Сезонные цены (есть годовая, но приоритет у сезонных)`);
      const result = await this.calculateFromSeasonalPrices(start, end, nights, seasonalPrices, log);
      if (result) {
        log.push(`✅ Успешно рассчитано по сезонным ценам`);
        return result;
      }
    }

    // 3. Только сезонные
    if (seasonalPrices.length > 0) {
      log.push(`Попытка #3: Сезонные цены (без годовой)`);
      const result = await this.calculateFromSeasonalPrices(start, end, nights, seasonalPrices, log);
      if (result) {
        log.push(`✅ Успешно рассчитано по сезонным ценам`);
        return result;
      }
    }

    // 4. Годовая цена
    if (yearPrice) {
      log.push(`Попытка #4: Годовая цена`);
      const result = this.calculateFromYearPrice(nights, yearPrice, log);
      log.push(`✅ Успешно рассчитано по годовой цене`);
      return result;
    }

    log.push(`❌ Не удалось рассчитать LONG_TERM`);
    return null;
  }

  /**
   * РАСЧЕТ ДЛЯ 365+ ДНЕЙ (YEARLY)
   */
  private async calculateYearly(
    nights: number,
    monthlyPrices: any[],
    seasonalPrices: any[],
    yearPrice: number | null,
    log: string[]
  ): Promise<CalculatedPrice | null> {
    log.push(`--- YEARLY (365+ дней) ---`);

    // 1. year_price
    if (yearPrice) {
      log.push(`Попытка #1: Годовая цена`);
      const monthlyPrice = yearPrice;
      const yearlyTotal = yearPrice * 12;
      const totalPrice = (nights / 365) * yearlyTotal;

      log.push(`✅ Месячная цена: ${monthlyPrice} THB`);
      log.push(`✅ Годовая стоимость: ${yearlyTotal} THB`);

      return {
        total_price: Math.round(totalPrice),
        currency: 'THB',
        nights,
        daily_average: Math.round(yearlyTotal / 365),
        monthly_equivalent: Math.round(monthlyPrice),
        breakdown: [{
          period: 'yearly_contract',
          nights,
          price_per_month: Math.round(monthlyPrice),
          total: Math.round(totalPrice)
        }],
        pricing_method: 'yearly'
      };
    }

    // 2. Минимальная месячная * 12
    if (monthlyPrices.length > 0) {
      log.push(`Попытка #2: Минимальная месячная цена * 12`);
      const minMonthlyPrice = Math.min(...monthlyPrices.map((p: any) => p.price_per_month));
      const yearlyTotal = minMonthlyPrice * 12;
      const totalPrice = (nights / 365) * yearlyTotal;

      log.push(`✅ Минимальная месячная: ${minMonthlyPrice} THB`);

      return {
        total_price: Math.round(totalPrice),
        currency: 'THB',
        nights,
        daily_average: Math.round(yearlyTotal / 365),
        monthly_equivalent: Math.round(minMonthlyPrice),
        breakdown: [{
          period: 'yearly_from_monthly',
          nights,
          price_per_month: Math.round(minMonthlyPrice),
          total: Math.round(totalPrice)
        }],
        pricing_method: 'monthly'
      };
    }

    // 3. Средняя из сезонных
    if (seasonalPrices.length > 0) {
      log.push(`Попытка #3: Средняя из сезонных цен`);
      const avgDailyPrice = this.calculateYearlyAverageFromSeasonal(seasonalPrices);
      const yearlyTotal = avgDailyPrice * 365;
      const monthlyEquivalent = yearlyTotal / 12;
      const totalPrice = (nights / 365) * yearlyTotal;

      log.push(`✅ Средняя дневная: ${avgDailyPrice} THB`);

      return {
        total_price: Math.round(totalPrice),
        currency: 'THB',
        nights,
        daily_average: Math.round(avgDailyPrice),
        monthly_equivalent: Math.round(monthlyEquivalent),
        breakdown: [{
          period: 'yearly_from_seasonal',
          nights,
          price_per_month: Math.round(monthlyEquivalent),
          total: Math.round(totalPrice)
        }],
        pricing_method: 'seasonal'
      };
    }

    log.push(`❌ Не удалось рассчитать YEARLY`);
    return null;
  }

  /**
   * ========================================
   * МЕТОДЫ РАСЧЕТА ПО ИСТОЧНИКАМ ЦЕН
   * ========================================
   */

  /**
   * РАСЧЕТ ПО СЕЗОННЫМ ЦЕНАМ (с обработкой per_night и per_period)
   */
  private async calculateFromSeasonalPrices(
    start: Date,
    end: Date,
    nights: number,
    seasonalPrices: any[],
    log: string[]
  ): Promise<CalculatedPrice | null> {
    log.push(`  → Расчет по сезонным ценам...`);

    let totalPrice = 0;
    const currentDate = new Date(start);
    
    let coveredNights = 0;
    let uncoveredDays: Date[] = [];

    while (currentDate < end) {
      const mmdd = this.getMMDD(currentDate);
      const season = this.findSeasonForDate(mmdd, seasonalPrices);

      if (season) {
        const pricePerNight = parseFloat(String(season.price_per_night)) || 0;

        if (pricePerNight === 0) {
          log.push(`  ⚠️ Цена по запросу для даты ${mmdd}`);
          return {
            total_price: 0,
            currency: 'THB',
            nights,
            daily_average: 0,
            monthly_equivalent: 0,
            breakdown: [{
              period: 'price_on_request',
              nights,
              total: 0,
              season_type: 'Цена по запросу'
            }],
            pricing_method: 'seasonal'
          };
        }

        // ✅ ОБРАБОТКА per_night vs per_period
        if (season.pricing_type === 'per_period') {
          // Цена за весь период - нужно вычислить дневную
          const seasonStart = this.parseRecurringDate(season.start_date_recurring, currentDate.getFullYear());
          const seasonEnd = this.parseRecurringDate(season.end_date_recurring, currentDate.getFullYear());
          const seasonDays = this.getDaysBetween(seasonStart, seasonEnd) + 1;
          const dailyPrice = pricePerNight / seasonDays;

          log.push(`  → ${mmdd}: per_period (${pricePerNight} THB / ${seasonDays} дней = ${dailyPrice.toFixed(2)} THB/день)`);
          totalPrice += dailyPrice;
        } else {
          // per_night - цена за ночь
          log.push(`  → ${mmdd}: per_night (${pricePerNight} THB/ночь)`);
          totalPrice += pricePerNight;
        }

        coveredNights++;
      } else {
        log.push(`  ⚠️ Нет сезона для ${mmdd}`);
        uncoveredDays.push(new Date(currentDate));
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // ✅ ОБРАБОТКА НЕДОСТАЮЩИХ ДНЕЙ
    if (uncoveredDays.length > 0) {
      log.push(`  ⚠️ Недостающих дней: ${uncoveredDays.length}`);
      
      // Находим ближайший сезон и вычисляем его суточную цену
      const nearestSeasonPrice = this.findNearestSeasonDailyPrice(seasonalPrices, uncoveredDays[0], log);
      
      if (nearestSeasonPrice > 0) {
        const uncoveredTotal = nearestSeasonPrice * uncoveredDays.length;
        totalPrice += uncoveredTotal;
        log.push(`  → Применена ближайшая цена: ${nearestSeasonPrice.toFixed(2)} THB/день * ${uncoveredDays.length} = ${uncoveredTotal.toFixed(2)} THB`);
      } else {
        log.push(`  ❌ Не удалось найти цену для недостающих дней`);
        return null;
      }
    }

    if (totalPrice === 0) {
      log.push(`  ❌ Итоговая цена = 0`);
      return null;
    }

    log.push(`  ✅ Итого: ${totalPrice.toFixed(2)} THB за ${nights} ночей`);

    return {
      total_price: Math.round(totalPrice),
      currency: 'THB',
      nights,
      daily_average: Math.round(totalPrice / nights),
      monthly_equivalent: Math.round((totalPrice / nights) * 30),
      breakdown: [{
        period: 'seasonal',
        nights,
        price_per_night: Math.round(totalPrice / nights),
        total: Math.round(totalPrice)
      }],
      pricing_method: 'seasonal'
    };
  }

  /**
   * НАЙТИ БЛИЖАЙШУЮ СЕЗОННУЮ ЦЕНУ ЗА ДЕНЬ
   */
  private findNearestSeasonDailyPrice(
    seasonalPrices: any[],
    targetDate: Date,
    log: string[]
  ): number {
    if (seasonalPrices.length === 0) return 0;

    log.push(`  → Поиск ближайшего сезона для ${this.getMMDD(targetDate)}...`);

    // Берем первый доступный сезон
    const season = seasonalPrices[0];
    const pricePerNight = parseFloat(String(season.price_per_night)) || 0;

    if (season.pricing_type === 'per_period') {
      const seasonStart = this.parseRecurringDate(season.start_date_recurring, targetDate.getFullYear());
      const seasonEnd = this.parseRecurringDate(season.end_date_recurring, targetDate.getFullYear());
      const seasonDays = this.getDaysBetween(seasonStart, seasonEnd) + 1;
      const dailyPrice = pricePerNight / seasonDays;
      log.push(`  → Ближайший сезон: per_period (${pricePerNight} / ${seasonDays} = ${dailyPrice.toFixed(2)} THB/день)`);
      return dailyPrice;
    } else {
      log.push(`  → Ближайший сезон: per_night (${pricePerNight} THB/день)`);
      return pricePerNight;
    }
  }

  /**
   * РАСЧЕТ ПО МЕСЯЧНЫМ ЦЕНАМ (для SHORT_TERM - деление на дни)
   */
  private async calculateFromMonthlyDaily(
    start: Date,
    end: Date,
    nights: number,
    monthlyPrices: any[],
    log: string[]
  ): Promise<CalculatedPrice | null> {
    log.push(`  → Расчет по месячным ценам (посуточно)...`);

    let totalPrice = 0;
    const currentDate = new Date(start);

    while (currentDate < end) {
      const month = currentDate.getMonth() + 1;
      const monthPrice = monthlyPrices.find(p => p.month_number === month);

      if (monthPrice) {
        const daysInMonth = new Date(currentDate.getFullYear(), month, 0).getDate();
        const dailyPrice = monthPrice.price_per_month / daysInMonth;
        totalPrice += dailyPrice;
        log.push(`  → Месяц ${month}: ${monthPrice.price_per_month} / ${daysInMonth} = ${dailyPrice.toFixed(2)} THB/день`);
      } else {
        log.push(`  ❌ Нет месячной цены для месяца ${month}`);
        return null;
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    log.push(`  ✅ Итого: ${totalPrice.toFixed(2)} THB`);

    return {
      total_price: Math.round(totalPrice),
      currency: 'THB',
      nights,
      daily_average: Math.round(totalPrice / nights),
      monthly_equivalent: Math.round((totalPrice / nights) * 30),
      breakdown: [{
        period: 'monthly_daily',
        nights,
        total: Math.round(totalPrice)
      }],
      pricing_method: 'monthly'
    };
  }

  /**
   * РАСЧЕТ LONG_TERM ПО МЕСЯЧНЫМ ЦЕНАМ (пропорционально)
   */
  private async calculateLongTermFromMonthly(
    start: Date,
    end: Date,
    nights: number,
    monthlyPrices: any[],
    log: string[]
  ): Promise<CalculatedPrice | null> {
    log.push(`  → Расчет long-term по месячным ценам (пропорционально)...`);

    let totalPrice = 0;
    const breakdown: PriceBreakdown[] = [];
    const currentDate = new Date(start);

    while (currentDate < end) {
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();
      const daysInMonth = new Date(year, month, 0).getDate();
      
      // Сколько дней этого месяца входит в период?
      const monthEnd = new Date(year, month, 0); // Последний день месяца
      const periodEnd = end > monthEnd ? monthEnd : new Date(end.getTime() - 24 * 60 * 60 * 1000);
      
      const daysInPeriod = Math.min(
        this.getDaysBetween(currentDate, periodEnd) + 1,
        daysInMonth
      );

      const monthPrice = monthlyPrices.find(p => p.month_number === month);
      
      if (monthPrice) {
        const proportion = daysInPeriod / daysInMonth;
        const monthTotal = monthPrice.price_per_month * proportion;
        totalPrice += monthTotal;

        log.push(`  → Месяц ${month}: ${daysInPeriod}/${daysInMonth} дней * ${monthPrice.price_per_month} = ${monthTotal.toFixed(2)} THB`);

        breakdown.push({
          period: `Month ${month}`,
          nights: daysInPeriod,
          price_per_month: monthPrice.price_per_month,
          total: Math.round(monthTotal),
          month_number: month
        });
      } else {
        log.push(`  ❌ Нет месячной цены для месяца ${month}`);
        return null;
      }

      // Переходим к следующему месяцу
      currentDate.setDate(1);
      currentDate.setMonth(currentDate.getMonth() + 1);
      if (currentDate >= end) break;
    }

    log.push(`  ✅ Итого: ${totalPrice.toFixed(2)} THB`);

    return {
      total_price: Math.round(totalPrice),
      currency: 'THB',
      nights,
      daily_average: Math.round(totalPrice / nights),
      monthly_equivalent: Math.round(totalPrice / (nights / 30)),
      breakdown,
      pricing_method: 'monthly'
    };
  }

  /**
   * РАСЧЕТ ПО ГОДОВОЙ ЦЕНЕ
   */
  private calculateFromYearPrice(
    nights: number,
    yearPrice: number,
    log: string[]
  ): CalculatedPrice {
    log.push(`  → Расчет по годовой цене...`);

    const monthlyPrice = yearPrice;
    const yearlyTotal = yearPrice * 12;
    const pricePerDay = yearlyTotal / 365;
    const totalPrice = pricePerDay * nights;

    log.push(`  → Месячная цена: ${monthlyPrice} THB`);
    log.push(`  → Годовая стоимость: ${yearlyTotal} THB`);
    log.push(`  → Цена за день: ${pricePerDay.toFixed(2)} THB`);
    log.push(`  ✅ Итого: ${totalPrice.toFixed(2)} THB`);

    return {
      total_price: Math.round(totalPrice),
      currency: 'THB',
      nights,
      daily_average: Math.round(pricePerDay),
      monthly_equivalent: Math.round(monthlyPrice),
      breakdown: [{
        period: 'from_year_price',
        nights,
        price_per_month: Math.round(monthlyPrice),
        total: Math.round(totalPrice)
      }],
      pricing_method: 'yearly'
    };
  }

  /**
   * ========================================
   * НАЙТИ ДОСТУПНЫЕ ПЕРИОДЫ
   * ========================================
   */
  async findAvailablePeriods(
    propertyId: number,
    nights: number,
    monthNumber?: number,
    year?: number
  ): Promise<AvailablePeriod[]> {
    try {
      logger.info(`Finding available ${nights}-night periods for property ${propertyId}`);

      // Определяем диапазон поиска
      const searchStart = monthNumber && year 
        ? new Date(year, monthNumber - 1, 1)
        : new Date();
      
      const searchEnd = monthNumber && year
        ? new Date(year, monthNumber, 0) // последний день месяца
        : new Date(new Date().setMonth(new Date().getMonth() + 3)); // 3 месяца вперед

      logger.info(`Search range: ${searchStart.toISOString().split('T')[0]} to ${searchEnd.toISOString().split('T')[0]}`);

      // Получаем все заблокированные даты
      const blockedDates = await db.query<any>(
        `SELECT blocked_date 
         FROM property_calendar 
         WHERE property_id = ? 
         AND blocked_date BETWEEN ? AND ?
         ORDER BY blocked_date`,
        [propertyId, searchStart.toISOString().split('T')[0], searchEnd.toISOString().split('T')[0]]
      );

      const blockedSet = new Set(blockedDates.map((d: any) => d.blocked_date));

      // Ищем свободные периоды
      const availablePeriods: AvailablePeriod[] = [];
      const currentDate = new Date(searchStart);
      
      // ✅ ОПТИМИЗАЦИЯ: Ограничение на количество проверок
      let checksCount = 0;
      const MAX_CHECKS = 100; // Не более 100 проверок

      while (currentDate <= searchEnd && checksCount < MAX_CHECKS) {
        checksCount++;
        
        const checkIn = currentDate.toISOString().split('T')[0];
        const checkOutDate = new Date(currentDate);
        checkOutDate.setDate(checkOutDate.getDate() + nights);
        const checkOut = checkOutDate.toISOString().split('T')[0];

        // Проверяем все даты в периоде
        let isAvailable = true;
        const testDate = new Date(currentDate);
        
        for (let i = 0; i < nights; i++) {
          const dateStr = testDate.toISOString().split('T')[0];
          if (blockedSet.has(dateStr)) {
            isAvailable = false;
            break;
          }
          testDate.setDate(testDate.getDate() + 1);
        }

        if (isAvailable && checkOutDate <= searchEnd) {
          // Рассчитываем цену для этого периода
          const price = await this.calculatePrice(propertyId, checkIn, checkOut);
          
          if (price && price.total_price > 0) {
            availablePeriods.push({
              check_in: checkIn,
              check_out: checkOut,
              nights,
              total_price: price.total_price,
              daily_average: price.daily_average
            });
          }
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }

      logger.info(`Found ${availablePeriods.length} available periods after ${checksCount} checks`);
      
      // Сортируем по цене (от дешевых к дорогим)
      availablePeriods.sort((a, b) => a.total_price - b.total_price);

      // ✅ Возвращаем только первые 20 для экономии времени
      return availablePeriods.slice(0, 20);
    } catch (error) {
      logger.error('Find available periods error:', error);
      return [];
    }
  }

  /**
   * ========================================
   * ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ
   * ========================================
   */
  
  private getDaysBetween(start: Date, end: Date): number {
    return Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }

  private getMMDD(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${month}-${day}`;
  }

  private parseRecurringDate(mmdd: string, year: number): Date {
    const [month, day] = mmdd.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  private findSeasonForDate(mmdd: string, seasonalPrices: any[]): any | null {
    for (const season of seasonalPrices) {
      if (this.isDateInSeason(mmdd, season.start_date_recurring, season.end_date_recurring)) {
        return season;
      }
    }
    return null;
  }

  private isDateInSeason(mmdd: string, start: string, end: string): boolean {
    const [month, day] = mmdd.split('-').map(Number);
    const [startMonth, startDay] = start.split('-').map(Number);
    const [endMonth, endDay] = end.split('-').map(Number);

    const dateValue = month * 100 + day;
    const startValue = startMonth * 100 + startDay;
    const endValue = endMonth * 100 + endDay;

    if (startValue <= endValue) {
      return dateValue >= startValue && dateValue <= endValue;
    } else {
      return dateValue >= startValue || dateValue <= endValue;
    }
  }

  private calculateYearlyAverageFromSeasonal(seasonalPrices: any[]): number {
    let totalDays = 0;
    let totalPrice = 0;

    for (const season of seasonalPrices) {
      const days = this.getDaysInSeason(season.start_date_recurring, season.end_date_recurring);
      const pricePerNight = parseFloat(String(season.price_per_night)) || 0;

      if (season.pricing_type === 'per_period') {
        const dailyPrice = pricePerNight / days;
        totalDays += days;
        totalPrice += days * dailyPrice;
      } else {
        totalDays += days;
        totalPrice += days * pricePerNight;
      }
    }

    return totalDays > 0 ? totalPrice / totalDays : 0;
  }

  private getDaysInSeason(start: string, end: string): number {
    const [startMonth, startDay] = start.split('-').map(Number);
    const [endMonth, endDay] = end.split('-').map(Number);

    if (startMonth <= endMonth) {
      const startDate = new Date(2024, startMonth - 1, startDay);
      const endDate = new Date(2024, endMonth - 1, endDay);
      return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    } else {
      const endYear = new Date(2024, endMonth - 1, endDay);
      const startYear = new Date(2024, startMonth - 1, startDay);
      const yearEnd = new Date(2024, 11, 31);
      const yearStart = new Date(2024, 0, 1);

      const days1 = Math.ceil((yearEnd.getTime() - startYear.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const days2 = Math.ceil((endYear.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      return days1 + days2;
    }
  }

  /**
   * ========================================
   * ЗАГРУЗКА ЦЕН ИЗ БД
   * ========================================
   */
  
  private async getSeasonalPrices(propertyId: number): Promise<any[]> {
    const prices = await db.query<any>(
      `SELECT season_type, start_date_recurring, end_date_recurring, 
              price_per_night, minimum_nights, pricing_type
       FROM property_pricing
       WHERE property_id = ?
       ORDER BY start_date_recurring`,
      [propertyId]
    );

    return prices.map((p: any) => ({
      ...p,
      price_per_night: parseFloat(p.price_per_night) || 0,
      minimum_nights: parseInt(p.minimum_nights) || 0
    }));
  }

  private async getMonthlyPrices(propertyId: number): Promise<any[]> {
    const prices = await db.query<any>(
      `SELECT month_number, price_per_month, minimum_days
       FROM property_pricing_monthly
       WHERE property_id = ?
       ORDER BY month_number`,
      [propertyId]
    );

    return prices.map((p: any) => ({
      ...p,
      month_number: parseInt(p.month_number),
      price_per_month: parseFloat(p.price_per_month) || 0,
      minimum_days: parseInt(p.minimum_days) || 0
    }));
  }

  private async getYearPrice(propertyId: number): Promise<number | null> {
    const result = await db.queryOne<any>(
      'SELECT year_price FROM properties WHERE id = ?',
      [propertyId]
    );
    
    if (!result?.year_price) return null;
    
    const yearPrice = parseFloat(result.year_price);
    return yearPrice > 0 ? yearPrice : null;
  }
}

export default new PriceCalculationService();