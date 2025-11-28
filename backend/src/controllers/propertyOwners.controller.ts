// backend/src/controllers/propertyOwners.controller.ts
import { Response } from 'express';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { AuthRequest } from '../types';
import db from '../config/database';
import logger from '../utils/logger';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const OWNER_ACCESS_TOKEN_EXPIRY = '2h'; // Access token на 2 часа
const OWNER_REFRESH_TOKEN_EXPIRY = '30d'; // Refresh token на 30 дней

interface OwnerTokenPayload {
  id: number;
  owner_name: string;
  type: 'owner';
}

class PropertyOwnersController {
  
  /**
   * Генерация случайного пароля
   */
  private generatePassword(length: number = 10): string {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  }

  /**
   * Генерация уникального токена для URL
   */
  private generateAccessToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Генерация JWT токенов для владельца
   */
  private generateOwnerTokens(payload: OwnerTokenPayload) {
    const accessToken = jwt.sign(payload, JWT_SECRET, { 
      expiresIn: OWNER_ACCESS_TOKEN_EXPIRY 
    });
    
    const refreshToken = jwt.sign(payload, JWT_SECRET, { 
      expiresIn: OWNER_REFRESH_TOKEN_EXPIRY 
    });
    
    return { accessToken, refreshToken };
  }

  /**
   * Создать доступ для владельца
   * POST /api/property-owners/create
   */
  async createOwnerAccess(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { owner_name } = req.body;
      const adminId = req.admin!.id;

      if (!owner_name || !owner_name.trim()) {
        res.status(400).json({
          success: false,
          message: 'Имя владельца обязательно'
        });
        return;
      }

      // Проверяем существует ли уже доступ для этого владельца
      const existingOwner = await db.queryOne<any>(
        'SELECT * FROM property_owners WHERE owner_name = ?',
        [owner_name.trim()]
      );

      if (existingOwner) {
        res.status(400).json({
          success: false,
          message: 'Доступ для этого владельца уже создан',
          data: {
            access_token: existingOwner.access_token,
            initial_password: existingOwner.current_password || existingOwner.initial_password,
            created_at: existingOwner.created_at
          }
        });
        return;
      }

      // Проверяем есть ли объекты с таким именем владельца
      const propertiesCount = await db.queryOne<any>(
        'SELECT COUNT(*) as count FROM properties WHERE owner_name = ? AND deleted_at IS NULL',
        [owner_name.trim()]
      );

      if (!propertiesCount || propertiesCount.count === 0) {
        res.status(400).json({
          success: false,
          message: 'Не найдено объектов с таким именем владельца'
        });
        return;
      }

      // Генерируем данные
      const accessToken = this.generateAccessToken();
      const initialPassword = this.generatePassword(10);
      const passwordHash = await bcrypt.hash(initialPassword, 10);

      // Создаём запись в БД
      await db.query(
        `INSERT INTO property_owners 
         (owner_name, access_token, password_hash, initial_password, current_password, created_by) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [owner_name.trim(), accessToken, passwordHash, initialPassword, initialPassword, adminId]
      );

      logger.info(`Owner access created for ${owner_name} by admin ${req.admin?.username}`);

      res.json({
        success: true,
        message: 'Доступ для владельца успешно создан',
        data: {
          owner_name: owner_name.trim(),
          access_url: `https://owner.novaestate.company/owner/${accessToken}`,
          password: initialPassword,
          properties_count: propertiesCount.count
        }
      });
    } catch (error) {
      logger.error('Create owner access error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка создания доступа для владельца'
      });
    }
  }

  /**
   * Проверить токен владельца и получить информацию
   * GET /api/property-owners/verify/:token
   */
  async verifyOwnerToken(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { token } = req.params;

      const owner = await db.queryOne<any>(
        `SELECT id, owner_name, access_token, is_active, last_login_at 
         FROM property_owners 
         WHERE access_token = ? AND is_active = 1`,
        [token]
      );

      if (!owner) {
        res.status(404).json({
          success: false,
          message: 'Доступ не найден или деактивирован'
        });
        return;
      }

      // Получаем количество объектов
      const propertiesCount = await db.queryOne<any>(
        'SELECT COUNT(*) as count FROM properties WHERE owner_name = ? AND deleted_at IS NULL',
        [owner.owner_name]
      );

      res.json({
        success: true,
        data: {
          owner_name: owner.owner_name,
          properties_count: propertiesCount?.count || 0,
          last_login_at: owner.last_login_at
        }
      });
    } catch (error) {
      logger.error('Verify owner token error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка проверки токена'
      });
    }
  }

  /**
   * Авторизация владельца
   * POST /api/property-owners/login
   */
  async login(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { access_token, password } = req.body;

      if (!access_token || !password) {
        res.status(400).json({
          success: false,
          message: 'Токен и пароль обязательны'
        });
        return;
      }

      // Ищем владельца
      const owner = await db.queryOne<any>(
        `SELECT id, owner_name, access_token, password_hash, is_active 
         FROM property_owners 
         WHERE access_token = ?`,
        [access_token]
      );

      if (!owner) {
        res.status(401).json({
          success: false,
          message: 'Неверный токен или пароль'
        });
        return;
      }

      if (!owner.is_active) {
        res.status(403).json({
          success: false,
          message: 'Доступ деактивирован. Свяжитесь с администратором'
        });
        return;
      }

      // Проверяем пароль
      const isPasswordValid = await bcrypt.compare(password, owner.password_hash);

      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          message: 'Неверный токен или пароль'
        });
        return;
      }

      // Генерируем JWT токены
      const tokenPayload: OwnerTokenPayload = {
        id: owner.id,
        owner_name: owner.owner_name,
        type: 'owner'
      };

      const { accessToken: jwtAccessToken, refreshToken } = this.generateOwnerTokens(tokenPayload);

      // Сохраняем refresh token в БД
      await db.query(
        `INSERT INTO property_owner_refresh_tokens (owner_id, token, expires_at) 
         VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 30 DAY))`,
        [owner.id, refreshToken]
      );

      // Обновляем время последнего входа
      await db.query(
        'UPDATE property_owners SET last_login_at = NOW() WHERE id = ?',
        [owner.id]
      );

      // Получаем количество объектов
      const propertiesCount = await db.queryOne<any>(
        'SELECT COUNT(*) as count FROM properties WHERE owner_name = ? AND deleted_at IS NULL',
        [owner.owner_name]
      );

      logger.info(`Owner ${owner.owner_name} logged in`);

      res.json({
        success: true,
        data: {
          owner: {
            id: owner.id,
            owner_name: owner.owner_name,
            access_token: owner.access_token,
            properties_count: propertiesCount?.count || 0
          },
          accessToken: jwtAccessToken,
          refreshToken: refreshToken
        }
      });
    } catch (error) {
      logger.error('Owner login error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка авторизации'
      });
    }
  }

  /**
   * Обновление токена владельца
   * POST /api/property-owners/refresh
   */
  async refreshToken(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          message: 'Refresh token обязателен'
        });
        return;
      }

      // Проверяем токен
      let decoded: any;
      try {
        decoded = jwt.verify(refreshToken, JWT_SECRET) as OwnerTokenPayload;
      } catch (error) {
        res.status(401).json({
          success: false,
          message: 'Недействительный refresh token'
        });
        return;
      }

      // Проверяем существование токена в БД
      const tokenRecord = await db.queryOne<any>(
        `SELECT ot.*, o.owner_name, o.is_active 
         FROM property_owner_refresh_tokens ot
         JOIN property_owners o ON ot.owner_id = o.id
         WHERE ot.token = ? AND ot.expires_at > NOW()`,
        [refreshToken]
      );

      if (!tokenRecord || !tokenRecord.is_active) {
        res.status(401).json({
          success: false,
          message: 'Refresh token недействителен или доступ деактивирован'
        });
        return;
      }

      // Генерируем новые токены
      const tokenPayload: OwnerTokenPayload = {
        id: decoded.id,
        owner_name: decoded.owner_name,
        type: 'owner'
      };

      const { accessToken, refreshToken: newRefreshToken } = this.generateOwnerTokens(tokenPayload);

      // Удаляем старый refresh token
      await db.query(
        'DELETE FROM property_owner_refresh_tokens WHERE token = ?',
        [refreshToken]
      );

      // Сохраняем новый refresh token
      await db.query(
        `INSERT INTO property_owner_refresh_tokens (owner_id, token, expires_at) 
         VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 30 DAY))`,
        [decoded.id, newRefreshToken]
      );

      res.json({
        success: true,
        data: {
          accessToken,
          refreshToken: newRefreshToken
        }
      });
    } catch (error) {
      logger.error('Owner refresh token error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка обновления токена'
      });
    }
  }

  /**
   * Смена пароля владельцем
   * POST /api/property-owners/change-password
   */
  async changePassword(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { current_password, new_password } = req.body;
      const ownerId = (req as any).owner?.id;

      if (!ownerId) {
        res.status(401).json({
          success: false,
          message: 'Не авторизован'
        });
        return;
      }

      if (!current_password || !new_password) {
        res.status(400).json({
          success: false,
          message: 'Текущий и новый пароль обязательны'
        });
        return;
      }

      if (new_password.length < 6) {
        res.status(400).json({
          success: false,
          message: 'Новый пароль должен содержать минимум 6 символов'
        });
        return;
      }

      // Получаем данные владельца
      const owner = await db.queryOne<any>(
        'SELECT id, password_hash FROM property_owners WHERE id = ?',
        [ownerId]
      );

      if (!owner) {
        res.status(404).json({
          success: false,
          message: 'Владелец не найден'
        });
        return;
      }

      // Проверяем текущий пароль
      const isPasswordValid = await bcrypt.compare(current_password, owner.password_hash);

      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          message: 'Неверный текущий пароль'
        });
        return;
      }

      // Хешируем новый пароль
      const newPasswordHash = await bcrypt.hash(new_password, 10);

      // Обновляем пароль
      await db.query(
        'UPDATE property_owners SET password_hash = ?, current_password = ? WHERE id = ?',
        [newPasswordHash, new_password, ownerId]
      );

      logger.info(`Owner ${ownerId} changed password`);

      res.json({
        success: true,
        message: 'Пароль успешно изменён'
      });
    } catch (error) {
      logger.error('Owner change password error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка смены пароля'
      });
    }
  }

/**
 * Получить список объектов владельца
 * GET /api/property-owners/properties
 */
async getOwnerProperties(req: AuthRequest, res: Response) {
  try {
    const owner = (req as any).owner;
    
    if (!owner || !owner.id || !owner.owner_name) {
      logger.error('Owner data not found in request:', owner);
      res.status(401).json({
        success: false,
        message: 'Не авторизован'
      });
      return;
    }

    const ownerId = owner.id;
    const ownerName = owner.owner_name;

    logger.info(`Loading properties for owner: ${ownerName} (ID: ${ownerId})`);

    const propertiesResult: any = await db.query(
      `SELECT 
        p.id,
        p.property_number,
        p.property_name,
        p.deal_type,
        p.bedrooms,
        p.bathrooms,
        p.sale_price,
        p.year_price,
        p.deposit_type,
        p.deposit_amount,
        p.electricity_rate,
        p.water_rate,
        p.sale_commission_type,
        p.rent_commission_type,
        (SELECT photo_url FROM property_photos WHERE property_id = p.id AND is_primary = 1 LIMIT 1) as cover_photo
      FROM properties p
      WHERE p.owner_name = ? AND p.deleted_at IS NULL
      ORDER BY p.created_at DESC`,
      [ownerName]
    );

    let properties: any[];
    if (Array.isArray(propertiesResult)) {
      properties = propertiesResult;
    } else if (propertiesResult && Array.isArray(propertiesResult[0])) {
      properties = propertiesResult[0];
    } else if (propertiesResult && (propertiesResult as any).rows) {
      properties = (propertiesResult as any).rows;
    } else {
      logger.error('Unexpected query result format:', propertiesResult);
      res.status(500).json({
        success: false,
        message: 'Unexpected database response format'
      });
      return;
    }

    logger.info(`Found ${properties.length} properties for owner ${ownerName}`);

    if (!Array.isArray(properties)) {
      logger.error('Properties is not an array:', properties);
      res.status(500).json({
        success: false,
        message: 'Invalid properties data'
      });
      return;
    }

    const propertiesWithDetails = await Promise.all(
      properties.map(async (property) => {
        try {
          const photosResult: any = await db.query(
            `SELECT photo_url FROM property_photos 
             WHERE property_id = ? 
             ORDER BY is_primary DESC, id ASC 
             LIMIT 5`,
            [property.id]
          );
          const photos = Array.isArray(photosResult) ? photosResult : 
                        Array.isArray(photosResult[0]) ? photosResult[0] : 
                        (photosResult as any).rows || [];

          const seasonalResult: any = await db.query(
            `SELECT COUNT(*) as count
             FROM property_pricing 
             WHERE property_id = ? AND price_per_night > 0`,
            [property.id]
          );
          let seasonalCount = 0;
          if (Array.isArray(seasonalResult)) {
            seasonalCount = seasonalResult[0]?.count || 0;
          } else if (Array.isArray(seasonalResult[0])) {
            seasonalCount = seasonalResult[0][0]?.count || 0;
          } else if ((seasonalResult as any).count !== undefined) {
            seasonalCount = seasonalResult.count;
          }

          const monthlyResult: any = await db.query(
            `SELECT COUNT(*) as count
             FROM property_pricing_monthly 
             WHERE property_id = ? AND price_per_month > 0`,
            [property.id]
          );
          let monthlyCount = 0;
          if (Array.isArray(monthlyResult)) {
            monthlyCount = monthlyResult[0]?.count || 0;
          } else if (Array.isArray(monthlyResult[0])) {
            monthlyCount = monthlyResult[0][0]?.count || 0;
          } else if ((monthlyResult as any).count !== undefined) {
            monthlyCount = monthlyResult.count;
          }

          const blockedResult: any = await db.query(
            `SELECT blocked_date FROM property_calendar 
             WHERE property_id = ? AND blocked_date >= CURDATE()
             ORDER BY blocked_date ASC`,
            [property.id]
          );
          const blockedDates = Array.isArray(blockedResult) ? blockedResult : 
                              Array.isArray(blockedResult[0]) ? blockedResult[0] : 
                              (blockedResult as any).rows || [];

          let nearestBlockedPeriod = null;
          if (blockedDates.length > 0) {
            const firstDate = blockedDates[0].blocked_date;
            let endDate = firstDate;
            
            for (let i = 1; i < blockedDates.length; i++) {
              const currentDate = new Date(blockedDates[i].blocked_date);
              const prevDate = new Date(blockedDates[i - 1].blocked_date);
              const diffDays = (currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24);
              
              if (diffDays === 1) {
                endDate = blockedDates[i].blocked_date;
              } else {
                break;
              }
            }

            nearestBlockedPeriod = {
              start_date: firstDate,
              end_date: endDate
            };
          }

          // ✅ РАСЧЕТ ЗАПОЛНЕННОСТИ С ДЕТАЛИЗАЦИЕЙ
          let completeness = 0;
          const dealType = property.deal_type;
          const filledFields: Array<{name: string, weight: number}> = [];
          const missingFields: Array<{name: string, weight: number}> = [];
          
          // Определяем веса в зависимости от типа сделки
          let weights: any = {};
          
          if (dealType === 'sale') {
            weights = {
              salePrice: 40,
              commission: 30,
              calendar: 30
            };
          } else if (dealType === 'rent') {
            weights = {
              yearPrice: 15,
              seasonalPrices: 20,
              monthlyPrices: 25,
              calendar: 20,
              commission: 10,
              deposit: 5,
              utilities: 5
            };
          } else {
            weights = {
              salePrice: 15,
              yearPrice: 10,
              seasonalPrices: 15,
              monthlyPrices: 20,
              calendar: 20,
              commission: 10,
              deposit: 5,
              utilities: 5
            };
          }

          // Проверяем цену продажи
          if (weights.salePrice) {
            if (property.sale_price && property.sale_price > 0) {
              completeness += weights.salePrice;
              filledFields.push({name: 'Цена продажи', weight: weights.salePrice});
            } else {
              missingFields.push({name: 'Цена продажи', weight: weights.salePrice});
            }
          }

          // Проверяем годовую цену
          if (weights.yearPrice) {
            if (property.year_price && property.year_price > 0) {
              completeness += weights.yearPrice;
              filledFields.push({name: 'Годовая аренда', weight: weights.yearPrice});
            } else {
              missingFields.push({name: 'Годовая аренда', weight: weights.yearPrice});
            }
          }

          // Проверяем сезонные цены
          if (weights.seasonalPrices) {
            if (seasonalCount > 0) {
              completeness += weights.seasonalPrices;
              filledFields.push({name: 'Сезонные цены', weight: weights.seasonalPrices});
            } else {
              missingFields.push({name: 'Сезонные цены', weight: weights.seasonalPrices});
            }
          }

          // Проверяем месячные цены
          if (weights.monthlyPrices) {
            if (monthlyCount > 0) {
              const monthlyRatio = Math.min(monthlyCount / 12, 1);
              const monthlyPoints = weights.monthlyPrices * monthlyRatio;
              completeness += monthlyPoints;
              if (monthlyCount >= 12) {
                filledFields.push({name: 'Месячные цены', weight: weights.monthlyPrices});
              } else {
                filledFields.push({name: `Месячные цены (${monthlyCount}/12)`, weight: monthlyPoints});
                missingFields.push({name: `Месячные цены (не все месяцы)`, weight: weights.monthlyPrices - monthlyPoints});
              }
            } else {
              missingFields.push({name: 'Месячные цены', weight: weights.monthlyPrices});
            }
          }

          // Проверяем календарь
          if (weights.calendar) {
            if (blockedDates.length > 0) {
              completeness += weights.calendar;
              filledFields.push({name: 'Календарь занятости', weight: weights.calendar});
            } else {
              missingFields.push({name: 'Календарь занятости', weight: weights.calendar});
            }
          }

          // Проверяем комиссии
          if (weights.commission) {
            let commissionFilled = 0;
            const commissionParts: string[] = [];
            const missingCommissionParts: string[] = [];
            
            if (dealType === 'sale' || dealType === 'both') {
              if (property.sale_commission_type) {
                commissionFilled += 0.5;
                commissionParts.push('продажа');
              } else {
                missingCommissionParts.push('продажа');
              }
            }
            if (dealType === 'rent' || dealType === 'both') {
              if (property.rent_commission_type) {
                commissionFilled += 0.5;
                commissionParts.push('аренда');
              } else {
                missingCommissionParts.push('аренда');
              }
            }
            
            const commissionPoints = weights.commission * commissionFilled;
            completeness += commissionPoints;
            
            if (commissionParts.length > 0) {
              filledFields.push({name: `Комиссия (${commissionParts.join(', ')})`, weight: commissionPoints});
            }
            if (missingCommissionParts.length > 0) {
              missingFields.push({name: `Комиссия (${missingCommissionParts.join(', ')})`, weight: weights.commission - commissionPoints});
            }
          }

          // Проверяем депозит
          if (weights.deposit) {
            if (property.deposit_type) {
              completeness += weights.deposit;
              filledFields.push({name: 'Депозит', weight: weights.deposit});
            } else {
              missingFields.push({name: 'Депозит', weight: weights.deposit});
            }
          }

          // Проверяем коммунальные услуги
          if (weights.utilities) {
            let utilitiesFilled = 0;
            const utilitiesParts: string[] = [];
            const missingUtilitiesParts: string[] = [];
            
            if (property.electricity_rate && property.electricity_rate > 0) {
              utilitiesFilled += 0.5;
              utilitiesParts.push('электричество');
            } else {
              missingUtilitiesParts.push('электричество');
            }
            
            if (property.water_rate && property.water_rate > 0) {
              utilitiesFilled += 0.5;
              utilitiesParts.push('вода');
            } else {
              missingUtilitiesParts.push('вода');
            }
            
            const utilitiesPoints = weights.utilities * utilitiesFilled;
            completeness += utilitiesPoints;
            
            if (utilitiesParts.length > 0) {
              filledFields.push({name: `Коммунальные услуги (${utilitiesParts.join(', ')})`, weight: utilitiesPoints});
            }
            if (missingUtilitiesParts.length > 0) {
              missingFields.push({name: `Коммунальные услуги (${missingUtilitiesParts.join(', ')})`, weight: weights.utilities - utilitiesPoints});
            }
          }

          const finalCompleteness = Math.round(completeness);
          logger.info(`Property ${property.id} final completeness: ${finalCompleteness}%`);
          logger.info(`Property ${property.id} filled fields:`, filledFields);
          logger.info(`Property ${property.id} missing fields:`, missingFields);

          return {
            id: property.id,
            property_number: property.property_number,
            property_name: property.property_name,
            deal_type: property.deal_type,
            bedrooms: property.bedrooms || 0,
            bathrooms: property.bathrooms || 0,
            cover_photo: property.cover_photo ? `https://admin.novaestate.company${property.cover_photo}` : null,
            photos: photos.map((p: any) => ({ url: `https://admin.novaestate.company${p.photo_url}` })),
            completeness: finalCompleteness,
            completeness_details: {
              filled: filledFields,
              missing: missingFields
            },
            nearest_blocked_period: nearestBlockedPeriod,
            has_blocked_dates: blockedDates.length > 0
          };
        } catch (propertyError) {
          logger.error(`Error processing property ${property.id}:`, propertyError);
          return {
            id: property.id,
            property_number: property.property_number,
            property_name: property.property_name,
            deal_type: property.deal_type,
            bedrooms: property.bedrooms || 0,
            bathrooms: property.bathrooms || 0,
            cover_photo: property.cover_photo ? `https://admin.novaestate.company${property.cover_photo}` : null,
            photos: [],
            completeness: 0,
            completeness_details: {
              filled: [],
              missing: []
            },
            nearest_blocked_period: null,
            has_blocked_dates: false
          };
        }
      })
    );

    res.json({
      success: true,
      data: propertiesWithDetails
    });
  } catch (error) {
    logger.error('Get owner properties error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get properties',
      error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
}

  /**
   * Получить информацию о владельце (для админов)
   * GET /api/property-owners/info/:ownerName
   */
  async getOwnerInfo(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { ownerName } = req.params;

      const owner = await db.queryOne<any>(
        `SELECT 
          id, 
          owner_name, 
          access_token, 
          initial_password, 
          current_password,
          is_active, 
          last_login_at, 
          created_at
        FROM property_owners 
        WHERE owner_name = ?`,
        [ownerName]
      );

      if (!owner) {
        res.status(404).json({
          success: false,
          message: 'Доступ для этого владельца не создан'
        });
        return;
      }

      res.json({
        success: true,
        data: {
          access_url: `https://owner.novaestate.company/owner/${owner.access_token}`,
          password: owner.current_password || owner.initial_password,
          is_active: owner.is_active,
          last_login_at: owner.last_login_at,
          created_at: owner.created_at
        }
      });
    } catch (error) {
      logger.error('Get owner info error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка получения информации о владельце'
      });
    }
  }
}

export default new PropertyOwnersController();