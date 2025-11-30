// frontend/src/components/PropertyHTMLGeneratorModal/PropertyHTMLGeneratorModal.tsx
import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  Stack,
  Group,
  Text,
  Select,
  Checkbox,
  Radio,
  Button,
  Stepper,
  Alert,
  Paper,
  NumberInput,
  Divider,
  Badge,
  ThemeIcon,
  Progress,
  Card,
  Grid,
  Loader,
  Center,
  ActionIcon,
  Collapse,
  Drawer
} from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import {
  IconFileText,
  IconDownload,
  IconLanguage,
  IconSettings,
  IconCurrencyBaht,
  IconPercentage,
  IconHome,
  IconCalendar,
  IconClock,
  IconCheck,
  IconAlertCircle,
  IconInfoCircle,
  IconChevronRight,
  IconSparkles,
  IconCalculator,
  IconEdit
} from '@tabler/icons-react';
import { propertiesApi, PriceMarkup, PropertyPricesInfo } from '@/api/properties.api';

interface PropertyHTMLGeneratorModalProps {
  visible: boolean;
  onClose: () => void;
  propertyId: number;
  propertyNumber?: string;
  dealType?: 'rent' | 'sale' | 'both';
}

const PropertyHTMLGeneratorModal: React.FC<PropertyHTMLGeneratorModalProps> = ({
  visible,
  onClose,
  propertyId,
  propertyNumber,
  dealType = 'rent'
}) => {
  const { t } = useTranslation();
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // Основные состояния
  const [loading, setLoading] = useState(false);
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [pricesInfo, setPricesInfo] = useState<PropertyPricesInfo | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  
  // Настройки генерации
  const [language, setLanguage] = useState('ru');
  const [displayMode, setDisplayMode] = useState<'rent' | 'sale' | 'both'>(
    dealType === 'both' ? 'both' : dealType
  );
  const [showRentalPrices, setShowRentalPrices] = useState(true);
  const [showSalePrices, setShowSalePrices] = useState(true);
  const [includeSeasonalPrices, setIncludeSeasonalPrices] = useState(true);
  const [includeMonthlyPrices, setIncludeMonthlyPrices] = useState(true);
  const [includeYearlyPrice, setIncludeYearlyPrice] = useState(true);
  const [forAgent, setForAgent] = useState(false);

  // Наценки
  const [yearlyMarkupType, setYearlyMarkupType] = useState<'percent' | 'fixed'>('percent');
  const [yearlyMarkupValue, setYearlyMarkupValue] = useState<number>(0);
  const [yearlyMarkupEnabled, setYearlyMarkupEnabled] = useState(false);

  const [seasonalMarkupType, setSeasonalMarkupType] = useState<'percent' | 'fixed'>('percent');
  const [seasonalMarkupValue, setSeasonalMarkupValue] = useState<number>(0);
  const [seasonalMarkupEnabled, setSeasonalMarkupEnabled] = useState(false);

  const [monthlyMarkupType, setMonthlyMarkupType] = useState<'percent' | 'fixed'>('percent');
  const [monthlyMarkupValues, setMonthlyMarkupValues] = useState<{ [key: number]: number }>({});
  const [monthlyMarkupEnabled, setMonthlyMarkupEnabled] = useState(false);
  const [applyToAllMonths, setApplyToAllMonths] = useState(false);
  const [allMonthsValue, setAllMonthsValue] = useState<number>(0);

  const [saleMarkupType, setSaleMarkupType] = useState<'percent' | 'fixed'>('percent');
  const [saleMarkupValue, setSaleMarkupValue] = useState<number>(0);
  const [saleMarkupEnabled, setSaleMarkupEnabled] = useState(false);

  // Раскрытие секций
  const [rentMarkupsOpened, { toggle: toggleRentMarkups }] = useDisclosure(false);
  const [saleMarkupsOpened, { toggle: toggleSaleMarkups }] = useDisclosure(false);
  
  // Модальное окно для месячных наценок
  const [monthlyMarkupsModalOpened, { open: openMonthlyMarkupsModal, close: closeMonthlyMarkupsModal }] = useDisclosure(false);

  // Загрузка цен при открытии модального окна
  useEffect(() => {
    if (visible && propertyId) {
      loadPrices();
    }
  }, [visible, propertyId]);

  useEffect(() => {
    if (pricesInfo?.dealType && visible) {
      setDisplayMode(pricesInfo.dealType);
    }
  }, [pricesInfo, visible]);

  const loadPrices = async () => {
    try {
      setLoadingPrices(true);
      const response: any = await propertiesApi.getPropertyPrices(propertyId);
      console.log('📊 Loaded prices info:', response.data);
      
      // ✅ Правильно извлекаем данные из вложенной структуры
      const pricesData = response.data.data || response.data;
      setPricesInfo(pricesData);
      
      // ✅ Обновляем displayMode на основе deal_type из данных
      if (pricesData.dealType) {
        setDisplayMode(pricesData.dealType);
      }
    } catch (error: any) {
      console.error('Load prices error:', error);
      notifications.show({
        title: t('errors.generic'),
        message: t('htmlGenerator.errorLoadingPrices'),
        color: 'red',
        icon: <IconAlertCircle size={18} />
      });
    } finally {
      setLoadingPrices(false);
    }
  };

  // Сброс наценок при изменении displayMode
  useEffect(() => {
    if (displayMode === 'sale') {
      setYearlyMarkupEnabled(false);
      setSeasonalMarkupEnabled(false);
      setMonthlyMarkupEnabled(false);
    } else if (displayMode === 'rent') {
      setSaleMarkupEnabled(false);
    }
  }, [displayMode]);

  // Применить наценку ко всем месяцам
  useEffect(() => {
    if (applyToAllMonths && allMonthsValue >= 0) {
      const newValues: { [key: number]: number } = {};
      for (let i = 1; i <= 12; i++) {
        newValues[i] = allMonthsValue;
      }
      setMonthlyMarkupValues(newValues);
    }
  }, [applyToAllMonths, allMonthsValue]);

  // ✅ Функция для парсинга чисел с запятой
  const parseNumberWithComma = (value: string | number | null | undefined): number => {
    if (value === undefined || value === null || value === '') return 0;
    if (typeof value === 'number') return value;
    // Заменяем запятую на точку для правильного парсинга
    const normalized = value.toString().replace(',', '.');
    const parsed = parseFloat(normalized);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Функция для расчета наценки
  const calculateMarkup = (originalPrice: number, type: 'percent' | 'fixed', value: number): number => {
    if (type === 'percent') {
      return Math.round(originalPrice + (originalPrice * value / 100));
    } else {
      return Math.round(originalPrice + value);
    }
  };

  // Форматирование цены
  const formatPrice = (price: number): string => {
    return `฿${Math.round(price).toLocaleString('en-US')}`;
  };

  const handleGenerate = async () => {
    try {
      setLoading(true);

      // ✅ Подготавливаем наценки с логированием
      const yearlyPriceMarkup: PriceMarkup | undefined = yearlyMarkupEnabled && yearlyMarkupValue > 0
        ? { type: yearlyMarkupType, value: yearlyMarkupValue }
        : undefined;

      const seasonalPricesMarkup: PriceMarkup | undefined = seasonalMarkupEnabled && seasonalMarkupValue > 0
        ? { type: seasonalMarkupType, value: seasonalMarkupValue }
        : undefined;

      const monthlyPricesMarkup: { [key: number]: PriceMarkup } | undefined = monthlyMarkupEnabled
        ? Object.entries(monthlyMarkupValues).reduce((acc, [month, value]) => {
            if (value > 0) {
              acc[parseInt(month)] = { type: monthlyMarkupType, value };
            }
            return acc;
          }, {} as { [key: number]: PriceMarkup })
        : undefined;

      const salePriceMarkup: PriceMarkup | undefined = saleMarkupEnabled && saleMarkupValue > 0
        ? { type: saleMarkupType, value: saleMarkupValue }
        : undefined;

      // ✅ КРИТИЧЕСКОЕ ЛОГИРОВАНИЕ
      console.log('🔥 ГЕНЕРАЦИЯ HTML - НАЦЕНКИ:');
      console.log('Sale Markup Enabled:', saleMarkupEnabled);
      console.log('Sale Markup Value:', saleMarkupValue);
      console.log('Sale Markup Type:', saleMarkupType);
      console.log('Sale Price Markup Object:', salePriceMarkup);
      console.log('Yearly Price Markup:', yearlyPriceMarkup);
      console.log('Seasonal Prices Markup:', seasonalPricesMarkup);
      console.log('Monthly Prices Markup:', monthlyPricesMarkup);

      const requestData = {
        language,
        displayMode,
        showRentalPrices: displayMode !== 'sale' && showRentalPrices,
        showSalePrices: displayMode !== 'rent' && showSalePrices,
        includeSeasonalPrices,
        includeMonthlyPrices,
        includeYearlyPrice,
        forAgent,
        yearlyPriceMarkup,
        seasonalPricesMarkup,
        monthlyPricesMarkup,
        salePriceMarkup
      };

      console.log('📤 Request Data:', requestData);

      const response = await propertiesApi.generateHTML(propertyId, requestData);

      const blob = new Blob([response.data], { type: 'text/html;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `property_${propertyNumber || propertyId}_${language}_${displayMode}.html`;
      document.body.appendChild(link);
      link.click();
      
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      notifications.show({
        title: t('common.success'),
        message: t('htmlGenerator.success'),
        color: 'green',
        icon: <IconCheck size={18} />
      });
      
      onClose();
    } catch (error: any) {
      console.error('Generate HTML error:', error);
      notifications.show({
        title: t('errors.generic'),
        message: error.response?.data?.message || t('htmlGenerator.error'),
        color: 'red',
        icon: <IconAlertCircle size={18} />
      });
    } finally {
      setLoading(false);
    }
  };

  const languages = [
    { value: 'ru', label: 'Русский 🇷🇺' },
    { value: 'en', label: 'English 🇬🇧' },
    { value: 'th', label: 'ไทย 🇹🇭' },
    { value: 'zh', label: '中文 🇨🇳' },
    { value: 'he', label: 'עברית 🇮🇱' }
  ];

  const availableModes = useMemo(() => {
    if (dealType === 'rent') {
      return [{ value: 'rent' as const, label: t('htmlGenerator.rentOnly') }];
    } else if (dealType === 'sale') {
      return [{ value: 'sale' as const, label: t('htmlGenerator.saleOnly') }];
    } else {
      return [
        { value: 'rent' as const, label: t('htmlGenerator.rentOnly') },
        { value: 'sale' as const, label: t('htmlGenerator.saleOnly') },
        { value: 'both' as const, label: t('htmlGenerator.both') }
      ];
    }
  }, [dealType, t]);

  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];

  // ✅ Проверяем наличие цен
  const hasYearlyPrice = pricesInfo?.yearlyPrice && pricesInfo.yearlyPrice > 0;
  const hasSeasonalPrices = pricesInfo?.seasonalPrices && pricesInfo.seasonalPrices.length > 0;
  const hasMonthlyPrices = pricesInfo?.monthlyPrices && pricesInfo.monthlyPrices.length > 0;
  const hasSalePrice = pricesInfo?.salePrice && pricesInfo.salePrice > 0;

  // ✅ НОВЫЙ КОД (показывает секции на основе наличия цен):
  const showRentSection = hasYearlyPrice || hasSeasonalPrices || hasMonthlyPrices;
  const showSaleSection = hasSalePrice;

  // Подсчет настроенных месяцев
  const configuredMonthsCount = Object.values(monthlyMarkupValues).filter(v => v > 0).length;

  // ✅ ИСПРАВЛЕНО: Добавлена проверка pricesInfo
  const renderMonthlyMarkupsModal = () => {
    // ✅ КРИТИЧЕСКИ ВАЖНО: Проверяем pricesInfo перед использованием
    if (!pricesInfo || !pricesInfo.monthlyPrices) {
      return null;
    }

    const ModalComponent = isMobile ? Drawer : Modal;
    const modalProps = isMobile
      ? {
          opened: monthlyMarkupsModalOpened,
          onClose: closeMonthlyMarkupsModal,
          position: 'bottom' as const,
          size: '90%',
          title: t('htmlGenerator.monthlyMarkupsSettings')
        }
      : {
          opened: monthlyMarkupsModalOpened,
          onClose: closeMonthlyMarkupsModal,
          size: 'lg',
          centered: true,
          title: t('htmlGenerator.monthlyMarkupsSettings')
        };

    return (
      <ModalComponent {...modalProps}>
        <Stack gap="lg">
          {/* Тип наценки */}
          <Card shadow="sm" padding="md" radius="md" withBorder>
            <Stack gap="sm">
              <Text size="sm" fw={500}>{t('htmlGenerator.markupType')}</Text>
              <Radio.Group
                value={monthlyMarkupType}
                onChange={(value: string) => setMonthlyMarkupType(value as 'percent' | 'fixed')}
              >
                <Group>
                  <Radio value="percent" label={t('htmlGenerator.percent')} />
                  <Radio value="fixed" label={t('htmlGenerator.fixed')} />
                </Group>
              </Radio.Group>
            </Stack>
          </Card>

          {/* Применить ко всем */}
          <Card shadow="sm" padding="md" radius="md" withBorder>
            <Stack gap="md">
              <Checkbox
                checked={applyToAllMonths}
                onChange={(e) => setApplyToAllMonths(e.currentTarget.checked)}
                label={t('htmlGenerator.applyToAllMonths')}
              />

              {applyToAllMonths && (
                <NumberInput
                  placeholder={monthlyMarkupType === 'percent' ? '0%' : '฿0'}
                  value={allMonthsValue}
                  onChange={(value) => setAllMonthsValue(parseNumberWithComma(value))}
                  min={0}
                  step={monthlyMarkupType === 'percent' ? 0.1 : 1000}
                  leftSection={monthlyMarkupType === 'percent' ? <IconPercentage size={16} /> : <IconCurrencyBaht size={16} />}
                  decimalSeparator=","
                  size="md"
                  styles={{ input: { fontSize: '16px' } }}
                />
              )}
            </Stack>
          </Card>

          <Divider label={t('htmlGenerator.individualSettings')} labelPosition="center" />

          {/* Список месяцев */}
          <Stack gap="sm">
            {pricesInfo.monthlyPrices.map((monthPrice) => {
              const monthIndex = monthPrice.month_number - 1;
              const currentMarkup = monthlyMarkupValues[monthPrice.month_number] || 0;
              const finalPrice = currentMarkup > 0
                ? calculateMarkup(monthPrice.price_per_month, monthlyMarkupType, currentMarkup)
                : monthPrice.price_per_month;

              return (
                <Card key={monthPrice.month_number} shadow="sm" padding="md" radius="md" withBorder>
                  <Stack gap="md">
                    <Group justify="space-between">
                      <div>
                        <Text size="sm" fw={600}>{monthNames[monthIndex]}</Text>
                        <Group gap="xs" mt={4}>
                          <Badge size="sm" color="blue" variant="light">
                            {formatPrice(monthPrice.price_per_month)}
                          </Badge>
                          {currentMarkup > 0 && (
                            <>
                              <IconChevronRight size={14} />
                              <Badge size="sm" color="green" variant="filled">
                                {formatPrice(finalPrice)}
                              </Badge>
                            </>
                          )}
                        </Group>
                      </div>
                    </Group>

                    <NumberInput
                      placeholder={monthlyMarkupType === 'percent' ? '0%' : '฿0'}
                      value={currentMarkup}
                      onChange={(value) => {
                        setMonthlyMarkupValues(prev => ({
                          ...prev,
                          [monthPrice.month_number]: parseNumberWithComma(value)
                        }));
                      }}
                      min={0}
                      step={monthlyMarkupType === 'percent' ? 0.1 : 1000}
                      leftSection={monthlyMarkupType === 'percent' ? <IconPercentage size={16} /> : <IconCurrencyBaht size={16} />}
                      decimalSeparator=","
                      size="md"
                      disabled={applyToAllMonths}
                      styles={{ input: { fontSize: '16px' } }}
                    />
                  </Stack>
                </Card>
              );
            })}
          </Stack>

          <Group justify="flex-end" mt="md">
            <Button
              variant="gradient"
              gradient={{ from: 'violet', to: 'grape' }}
              onClick={closeMonthlyMarkupsModal}
            >
              {t('common.apply')}
            </Button>
          </Group>
        </Stack>
      </ModalComponent>
    );
  };
// Шаг 1: Основные настройки
  const renderStep1 = () => (
    <Stack gap="lg">
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Stack gap="md">
          <Group gap="sm">
            <ThemeIcon size="lg" radius="md" variant="light" color="blue">
              <IconLanguage size={20} stroke={1.5} />
            </ThemeIcon>
            <div>
              <Text fw={600} size="md">{t('htmlGenerator.selectLanguage')}</Text>
              <Text size="xs" c="dimmed">{t('htmlGenerator.languageDescription')}</Text>
            </div>
          </Group>

          <Select
            data={languages}
            value={language}
            onChange={(value) => setLanguage(value || 'ru')}
            size={isMobile ? 'sm' : 'md'}
            styles={{
              input: { fontSize: '16px' }
            }}
          />
        </Stack>
      </Card>

      {availableModes.length > 1 && (
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Stack gap="md">
            <Group gap="sm">
              <ThemeIcon size="lg" radius="md" variant="light" color="grape">
                <IconSettings size={20} stroke={1.5} />
              </ThemeIcon>
              <div>
                <Text fw={600} size="md">{t('htmlGenerator.displayMode')}</Text>
                <Text size="xs" c="dimmed">{t('htmlGenerator.displayModeDescription')}</Text>
              </div>
            </Group>

            <Radio.Group
              value={displayMode}
              onChange={(value: string) => setDisplayMode(value as 'rent' | 'sale' | 'both')}
            >
              <Stack gap="xs">
                {availableModes.map(mode => (
                  <Radio
                    key={mode.value}
                    value={mode.value}
                    label={mode.label}
                  />
                ))}
              </Stack>
            </Radio.Group>
          </Stack>
        </Card>
      )}

      <Alert icon={<IconInfoCircle size={18} />} color="blue" variant="light">
        <Text size="sm">{t('htmlGenerator.step1Info')}</Text>
      </Alert>
    </Stack>
  );

  // Шаг 2: Настройки цен
  const renderStep2 = () => (
    <Stack gap="md">
      {/* Цены аренды */}
      {showRentSection && displayMode !== 'sale' && (
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Stack gap="md">
            <Group justify="space-between">
              <Group gap="sm">
                <ThemeIcon size="lg" radius="md" variant="light" color="teal">
                  <IconHome size={20} stroke={1.5} />
                </ThemeIcon>
                <div>
                  <Text fw={600} size="md">{t('htmlGenerator.rentalPrices')}</Text>
                  <Text size="xs" c="dimmed">{t('htmlGenerator.rentalPricesDescription')}</Text>
                </div>
              </Group>
              <Checkbox
                checked={showRentalPrices}
                onChange={(e) => setShowRentalPrices(e.currentTarget.checked)}
              />
            </Group>

            <Collapse in={showRentalPrices}>
              <Stack gap="sm" mt="md">
                {/* Годовая цена */}
                <Paper p="md" radius="md" withBorder>
                  <Group justify="space-between">
                    <div>
                      <Group gap="xs">
                        <IconClock size={16} />
                        <Text size="sm" fw={500}>{t('htmlGenerator.yearlyPrice')}</Text>
                      </Group>
                      {hasYearlyPrice && (
                        <Text size="xs" c="dimmed" mt={4}>
                          {formatPrice(pricesInfo!.yearlyPrice!)}
                        </Text>
                      )}
                    </div>
                    <Badge color={hasYearlyPrice ? 'green' : 'red'} variant="light">
                      {hasYearlyPrice ? t('common.available') : t('common.unavailable')}
                    </Badge>
                    <Checkbox
                      checked={includeYearlyPrice}
                      onChange={(e) => setIncludeYearlyPrice(e.currentTarget.checked)}
                      disabled={!hasYearlyPrice}
                    />
                  </Group>
                </Paper>

                {/* Сезонные цены */}
                <Paper p="md" radius="md" withBorder>
                  <Group justify="space-between">
                    <div>
                      <Group gap="xs">
                        <IconCalendar size={16} />
                        <Text size="sm" fw={500}>{t('htmlGenerator.seasonalPrices')}</Text>
                      </Group>
                      {hasSeasonalPrices && (
                        <Text size="xs" c="dimmed" mt={4}>
                          {pricesInfo!.seasonalPrices.length} {t('htmlGenerator.periods')}
                        </Text>
                      )}
                    </div>
                    <Badge color={hasSeasonalPrices ? 'green' : 'red'} variant="light">
                      {hasSeasonalPrices ? t('common.available') : t('common.unavailable')}
                    </Badge>
                    <Checkbox
                      checked={includeSeasonalPrices}
                      onChange={(e) => setIncludeSeasonalPrices(e.currentTarget.checked)}
                      disabled={!hasSeasonalPrices}
                    />
                  </Group>
                </Paper>

                {/* Месячные цены */}
                <Paper p="md" radius="md" withBorder>
                  <Group justify="space-between">
                    <div>
                      <Group gap="xs">
                        <IconCalendar size={16} />
                        <Text size="sm" fw={500}>{t('htmlGenerator.monthlyPrices')}</Text>
                      </Group>
                      {hasMonthlyPrices && (
                        <Text size="xs" c="dimmed" mt={4}>
                          {pricesInfo!.monthlyPrices.length} {t('htmlGenerator.months')}
                        </Text>
                      )}
                    </div>
                    <Badge color={hasMonthlyPrices ? 'green' : 'red'} variant="light">
                      {hasMonthlyPrices ? t('common.available') : t('common.unavailable')}
                    </Badge>
                    <Checkbox
                      checked={includeMonthlyPrices}
                      onChange={(e) => setIncludeMonthlyPrices(e.currentTarget.checked)}
                      disabled={!hasMonthlyPrices}
                    />
                  </Group>
                </Paper>
              </Stack>
            </Collapse>
          </Stack>
        </Card>
      )}

      {/* Цена продажи */}
      {showSaleSection && displayMode !== 'rent' && (
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Stack gap="md">
            <Group justify="space-between">
              <Group gap="sm">
                <ThemeIcon size="lg" radius="md" variant="light" color="violet">
                  <IconCurrencyBaht size={20} stroke={1.5} />
                </ThemeIcon>
                <div>
                  <Text fw={600} size="md">{t('htmlGenerator.salePrice')}</Text>
                  <Text size="xs" c="dimmed">{t('htmlGenerator.salePriceDescription')}</Text>
                </div>
              </Group>
              <Checkbox
                checked={showSalePrices}
                onChange={(e) => setShowSalePrices(e.currentTarget.checked)}
                disabled={!hasSalePrice}
              />
            </Group>

            {hasSalePrice && (
              <Paper p="md" radius="md" withBorder>
                <Group justify="space-between">
                  <div>
                    <Text size="sm" fw={500}>{t('htmlGenerator.propertyPrice')}</Text>
                    <Text size="xs" c="dimmed" mt={4}>
                      {formatPrice(pricesInfo!.salePrice!)}
                    </Text>
                  </div>
                  <Badge color="green" variant="light">
                    {t('common.available')}
                  </Badge>
                </Group>
              </Paper>
            )}
          </Stack>
        </Card>
      )}

      <Alert icon={<IconInfoCircle size={18} />} color="blue" variant="light">
        <Text size="sm">{t('htmlGenerator.step2Info')}</Text>
      </Alert>
    </Stack>
  );

  // Шаг 3: Наценки
  const renderStep3 = () => (
    <Stack gap="md">
      {/* Наценки для аренды */}
      {showRentSection && displayMode !== 'sale' && showRentalPrices && (
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Stack gap="md">
            <Group justify="space-between" style={{ cursor: 'pointer' }} onClick={toggleRentMarkups}>
              <Group gap="sm">
                <ThemeIcon size="lg" radius="md" variant="light" color="orange">
                  <IconCalculator size={20} stroke={1.5} />
                </ThemeIcon>
                <div>
                  <Text fw={600} size="md">{t('htmlGenerator.rentMarkups')}</Text>
                  <Text size="xs" c="dimmed">{t('htmlGenerator.rentMarkupsDescription')}</Text>
                </div>
              </Group>
              <ActionIcon variant="subtle" color="gray">
                <IconChevronRight
                  size={18}
                  style={{
                    transform: rentMarkupsOpened ? 'rotate(90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s'
                  }}
                />
              </ActionIcon>
            </Group>

            <Collapse in={rentMarkupsOpened}>
              <Stack gap="md" mt="md">
                {/* Наценка на годовую цену */}
                {hasYearlyPrice && includeYearlyPrice && (
                  <Paper p="md" radius="md" withBorder>
                    <Stack gap="md">
                      <Checkbox
                        checked={yearlyMarkupEnabled}
                        onChange={(e) => setYearlyMarkupEnabled(e.currentTarget.checked)}
                        label={<Text fw={500}>{t('htmlGenerator.yearlyPriceMarkup')}</Text>}
                      />

                      {yearlyMarkupEnabled && (
                        <Stack gap="sm" pl="lg">
                          <Group>
                            <Text size="sm" c="dimmed">{t('htmlGenerator.originalPrice')}:</Text>
                            <Badge size="sm" color="blue">{formatPrice(pricesInfo!.yearlyPrice!)}</Badge>
                            {yearlyMarkupValue > 0 && (
                              <>
                                <IconChevronRight size={14} />
                                <Badge size="sm" color="green">
                                  {formatPrice(calculateMarkup(pricesInfo!.yearlyPrice!, yearlyMarkupType, yearlyMarkupValue))}
                                </Badge>
                              </>
                            )}
                          </Group>

                          <Radio.Group
                            value={yearlyMarkupType}
                            onChange={(value: string) => setYearlyMarkupType(value as 'percent' | 'fixed')}
                          >
                            <Group>
                              <Radio value="percent" label={t('htmlGenerator.percent')} />
                              <Radio value="fixed" label={t('htmlGenerator.fixed')} />
                            </Group>
                          </Radio.Group>

                          <NumberInput
                            placeholder={yearlyMarkupType === 'percent' ? '0%' : '฿0'}
                            value={yearlyMarkupValue}
                            onChange={(value) => setYearlyMarkupValue(parseNumberWithComma(value))}
                            min={0}
                            step={yearlyMarkupType === 'percent' ? 0.1 : 1000}
                            leftSection={yearlyMarkupType === 'percent' ? <IconPercentage size={16} /> : <IconCurrencyBaht size={16} />}
                            decimalSeparator=","
                            styles={{ input: { fontSize: '16px' } }}
                          />
                        </Stack>
                      )}
                    </Stack>
                  </Paper>
                )}

                {/* Наценка на сезонные цены */}
                {hasSeasonalPrices && includeSeasonalPrices && (
                  <Paper p="md" radius="md" withBorder>
                    <Stack gap="md">
                      <Checkbox
                        checked={seasonalMarkupEnabled}
                        onChange={(e) => setSeasonalMarkupEnabled(e.currentTarget.checked)}
                        label={<Text fw={500}>{t('htmlGenerator.seasonalPricesMarkup')}</Text>}
                      />

                      {seasonalMarkupEnabled && (
                        <Stack gap="sm" pl="lg">
                          <Group>
                            <Text size="sm" c="dimmed">{t('htmlGenerator.periodsCount')}:</Text>
                            <Badge size="sm" color="blue">{pricesInfo!.seasonalPrices.length}</Badge>
                          </Group>

                          <Radio.Group
                            value={seasonalMarkupType}
                            onChange={(value: string) => setSeasonalMarkupType(value as 'percent' | 'fixed')}
                          >
                            <Group>
                              <Radio value="percent" label={t('htmlGenerator.percent')} />
                              <Radio value="fixed" label={t('htmlGenerator.fixed')} />
                            </Group>
                          </Radio.Group>

                          <NumberInput
                            placeholder={seasonalMarkupType === 'percent' ? '0%' : '฿0'}
                            value={seasonalMarkupValue}
                            onChange={(value) => setSeasonalMarkupValue(parseNumberWithComma(value))}
                            min={0}
                            step={seasonalMarkupType === 'percent' ? 0.1 : 1000}
                            leftSection={seasonalMarkupType === 'percent' ? <IconPercentage size={16} /> : <IconCurrencyBaht size={16} />}
                            decimalSeparator=","
                            styles={{ input: { fontSize: '16px' } }}
                          />
                        </Stack>
                      )}
                    </Stack>
                  </Paper>
                )}

                {/* Наценка на месячные цены - КНОПКА ДЛЯ ОТКРЫТИЯ МОДАЛЬНОГО ОКНА */}
                {hasMonthlyPrices && includeMonthlyPrices && (
                  <Paper p="md" radius="md" withBorder>
                    <Stack gap="md">
                      <Checkbox
                        checked={monthlyMarkupEnabled}
                        onChange={(e) => setMonthlyMarkupEnabled(e.currentTarget.checked)}
                        label={<Text fw={500}>{t('htmlGenerator.monthlyPricesMarkup')}</Text>}
                      />

                      {monthlyMarkupEnabled && (
                        <Button
                          variant="light"
                          color="violet"
                          fullWidth
                          leftSection={<IconEdit size={18} />}
                          rightSection={
                            configuredMonthsCount > 0 && (
                              <Badge size="sm" color="green" variant="filled">
                                {configuredMonthsCount}
                              </Badge>
                            )
                          }
                          onClick={openMonthlyMarkupsModal}
                        >
                          {t('htmlGenerator.configureMonthlyMarkups')}
                        </Button>
                      )}
                    </Stack>
                  </Paper>
                )}
              </Stack>
            </Collapse>
          </Stack>
        </Card>
      )}

      {/* Наценки для продажи */}
      {showSaleSection && displayMode !== 'rent' && showSalePrices && (
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Stack gap="md">
            <Group justify="space-between" style={{ cursor: 'pointer' }} onClick={toggleSaleMarkups}>
              <Group gap="sm">
                <ThemeIcon size="lg" radius="md" variant="light" color="violet">
                  <IconCalculator size={20} stroke={1.5} />
                </ThemeIcon>
                <div>
                  <Text fw={600} size="md">{t('htmlGenerator.saleMarkup')}</Text>
                  <Text size="xs" c="dimmed">{t('htmlGenerator.saleMarkupDescription')}</Text>
                </div>
              </Group>
              <ActionIcon variant="subtle" color="gray">
                <IconChevronRight
                  size={18}
                  style={{
                    transform: saleMarkupsOpened ? 'rotate(90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s'
                  }}
                />
              </ActionIcon>
            </Group>

            <Collapse in={saleMarkupsOpened}>
              <Paper p="md" radius="md" withBorder mt="md">
                <Stack gap="md">
                  <Checkbox
                    checked={saleMarkupEnabled}
                    onChange={(e) => {
                      console.log('🔥 Sale Markup Checkbox Changed:', e.currentTarget.checked);
                      setSaleMarkupEnabled(e.currentTarget.checked);
                    }}
                    label={<Text fw={500}>{t('htmlGenerator.salePriceMarkup')}</Text>}
                  />

                  {saleMarkupEnabled && (
                    <Stack gap="sm" pl="lg">
                      <Group>
                        <Text size="sm" c="dimmed">{t('htmlGenerator.originalPrice')}:</Text>
                        <Badge size="sm" color="blue">{formatPrice(pricesInfo!.salePrice!)}</Badge>
                        {saleMarkupValue > 0 && (
                          <>
                            <IconChevronRight size={14} />
                            <Badge size="sm" color="green">
                              {formatPrice(calculateMarkup(pricesInfo!.salePrice!, saleMarkupType, saleMarkupValue))}
                            </Badge>
                          </>
                        )}
                      </Group>

                      <Radio.Group
                        value={saleMarkupType}
                        onChange={(value: string) => {
                          console.log('🔥 Sale Markup Type Changed:', value);
                          setSaleMarkupType(value as 'percent' | 'fixed');
                        }}
                      >
                        <Group>
                          <Radio value="percent" label={t('htmlGenerator.percent')} />
                          <Radio value="fixed" label={t('htmlGenerator.fixed')} />
                        </Group>
                      </Radio.Group>

                      <NumberInput
                        placeholder={saleMarkupType === 'percent' ? '0%' : '฿0'}
                        value={saleMarkupValue}
                        onChange={(value) => {
                          const parsed = parseNumberWithComma(value);
                          console.log('🔥 Sale Markup Value Changed:', value, '→', parsed);
                          setSaleMarkupValue(parsed);
                        }}
                        min={0}
                        step={saleMarkupType === 'percent' ? 0.1 : 1000}
                        leftSection={saleMarkupType === 'percent' ? <IconPercentage size={16} /> : <IconCurrencyBaht size={16} />}
                        decimalSeparator=","
                        styles={{ input: { fontSize: '16px' } }}
                      />
                    </Stack>
                  )}
                </Stack>
              </Paper>
            </Collapse>
          </Stack>
        </Card>
      )}

      <Alert icon={<IconInfoCircle size={18} />} color="blue" variant="light">
        <Text size="sm">{t('htmlGenerator.step3Info')}</Text>
      </Alert>
    </Stack>
  );

  // Шаг 4: Дополнительные опции
  const renderStep4 = () => (
    <Stack gap="md">
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Stack gap="md">
          <Group gap="sm">
            <ThemeIcon size="lg" radius="md" variant="light" color="cyan">
              <IconSparkles size={20} stroke={1.5} />
            </ThemeIcon>
            <div>
              <Text fw={600} size="md">{t('htmlGenerator.additionalOptions')}</Text>
              <Text size="xs" c="dimmed">{t('htmlGenerator.additionalOptionsDescription')}</Text>
            </div>
          </Group>

          <Checkbox
            checked={forAgent}
            onChange={(e) => setForAgent(e.currentTarget.checked)}
            label={
              <div>
                <Text size="sm" fw={500}>{t('htmlGenerator.forAgent')}</Text>
                <Text size="xs" c="dimmed">{t('htmlGenerator.forAgentDescription')}</Text>
              </div>
            }
          />
        </Stack>
      </Card>

      <Alert icon={<IconInfoCircle size={18} />} color="cyan" variant="light">
        <Stack gap="xs">
          <Text size="sm" fw={500}>{t('htmlGenerator.finalInfo')}</Text>
          <Text size="xs">
            {displayMode === 'both'
              ? t('htmlGenerator.bothModeInfo')
              : t('htmlGenerator.standaloneInfo')}
          </Text>
        </Stack>
      </Alert>

      {/* Сводка настроек */}
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Stack gap="md">
          <Text fw={600}>{t('htmlGenerator.summary')}</Text>
          <Divider />

          <Grid>
            <Grid.Col span={6}>
              <Text size="sm" c="dimmed">{t('htmlGenerator.language')}:</Text>
            </Grid.Col>
            <Grid.Col span={6}>
              <Text size="sm" fw={500}>{languages.find(l => l.value === language)?.label}</Text>
            </Grid.Col>

            <Grid.Col span={6}>
              <Text size="sm" c="dimmed">{t('htmlGenerator.displayMode')}:</Text>
            </Grid.Col>
            <Grid.Col span={6}>
              <Text size="sm" fw={500}>{availableModes.find(m => m.value === displayMode)?.label}</Text>
            </Grid.Col>

            {showRentalPrices && displayMode !== 'sale' && (
              <>
                <Grid.Col span={6}>
                  <Text size="sm" c="dimmed">{t('htmlGenerator.rentalPricesIncluded')}:</Text>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Stack gap={4}>
                    {includeYearlyPrice && hasYearlyPrice && <Badge size="sm" variant="light">{t('htmlGenerator.yearly')}</Badge>}
                    {includeSeasonalPrices && hasSeasonalPrices && <Badge size="sm" variant="light">{t('htmlGenerator.seasonal')}</Badge>}
                    {includeMonthlyPrices && hasMonthlyPrices && <Badge size="sm" variant="light">{t('htmlGenerator.monthly')}</Badge>}
                  </Stack>
                </Grid.Col>
              </>
            )}

            {showSalePrices && displayMode !== 'rent' && (
              <>
                <Grid.Col span={6}>
                  <Text size="sm" c="dimmed">{t('htmlGenerator.salePrice')}:</Text>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Badge size="sm" variant="light" color="green">{t('common.included')}</Badge>
                </Grid.Col>
              </>
            )}

            <Grid.Col span={6}>
              <Text size="sm" c="dimmed">{t('htmlGenerator.forAgent')}:</Text>
            </Grid.Col>
            <Grid.Col span={6}>
              <Badge size="sm" variant="light" color={forAgent ? 'blue' : 'gray'}>
                {forAgent ? t('common.yes') : t('common.no')}
              </Badge>
            </Grid.Col>
          </Grid>
        </Stack>
      </Card>
    </Stack>
  );

  if (loadingPrices) {
    return (
      <Modal
        opened={visible}
        onClose={onClose}
        title={t('htmlGenerator.title')}
        size={isMobile ? 'full' : 'xl'}
        centered
      >
        <Center p="xl">
          <Stack align="center" gap="md">
            <Loader size="xl" variant="dots" />
            <Text c="dimmed">{t('htmlGenerator.loadingPrices')}</Text>
          </Stack>
        </Center>
      </Modal>
    );
  }

  return (
    <>
      {/* Основное модальное окно */}
      <Modal
        opened={visible}
        onClose={onClose}
        title={
          <Group gap="sm">
            <ThemeIcon size="lg" radius="md" variant="gradient" gradient={{ from: 'violet', to: 'grape' }}>
              <IconFileText size={20} stroke={1.5} />
            </ThemeIcon>
            <div>
              <Text fw={600}>{t('htmlGenerator.title')}</Text>
              <Text size="xs" c="dimmed">{t('htmlGenerator.subtitle')}</Text>
            </div>
          </Group>
        }
        size={isMobile ? 'full' : 'xl'}
        centered
        styles={{
          content: {
            maxHeight: '90vh'
          },
          body: {
            maxHeight: 'calc(90vh - 120px)',
            overflowY: 'auto'
          }
        }}
      >
        <Stack gap="lg">
          {/* Stepper */}
          <Stepper
            active={activeStep}
            onStepClick={setActiveStep}
            size={isMobile ? 'sm' : 'md'}
            iconSize={isMobile ? 32 : 42}
          >
            <Stepper.Step
              label={t('htmlGenerator.step1')}
              description={t('htmlGenerator.step1Description')}
              icon={<IconLanguage size={18} />}
            >
              {renderStep1()}
            </Stepper.Step>

            <Stepper.Step
              label={t('htmlGenerator.step2')}
              description={t('htmlGenerator.step2Description')}
              icon={<IconCurrencyBaht size={18} />}
            >
              {renderStep2()}
            </Stepper.Step>

            <Stepper.Step
              label={t('htmlGenerator.step3')}
              description={t('htmlGenerator.step3Description')}
              icon={<IconCalculator size={18} />}
            >
              {renderStep3()}
            </Stepper.Step>

            <Stepper.Step
              label={t('htmlGenerator.step4')}
              description={t('htmlGenerator.step4Description')}
              icon={<IconCheck size={18} />}
            >
              {renderStep4()}
            </Stepper.Step>
          </Stepper>

          <Divider />

          {/* Кнопки навигации */}
          <Group justify="space-between">
            <Button
              variant="subtle"
              onClick={onClose}
            >
              {t('common.cancel')}
            </Button>

            <Group gap="sm">
              {activeStep > 0 && (
                <Button
                  variant="light"
                  onClick={() => setActiveStep(activeStep - 1)}
                >
                  {t('common.back')}
                </Button>
              )}

              {activeStep < 3 ? (
                <Button
                  variant="gradient"
                  gradient={{ from: 'violet', to: 'grape' }}
                  onClick={() => setActiveStep(activeStep + 1)}
                  rightSection={<IconChevronRight size={16} />}
                >
                  {t('common.next')}
                </Button>
              ) : (
                <Button
                  variant="gradient"
                  gradient={{ from: 'teal', to: 'green' }}
                  leftSection={<IconDownload size={18} />}
                  onClick={handleGenerate}
                  loading={loading}
                >
                  {loading ? t('htmlGenerator.generating') : t('htmlGenerator.generate')}
                </Button>
              )}
            </Group>
          </Group>

          {/* Прогресс */}
          <Progress
            value={((activeStep + 1) / 4) * 100}
            size="sm"
            radius="xl"
            style={{
              background: 'var(--mantine-color-dark-6)'
            }}
          />
        </Stack>
      </Modal>

      {/* Модальное окно для месячных наценок */}
      {renderMonthlyMarkupsModal()}
    </>
  );
};

export default PropertyHTMLGeneratorModal;