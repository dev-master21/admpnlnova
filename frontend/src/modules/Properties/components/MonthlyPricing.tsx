// frontend/src/modules/Properties/components/MonthlyPricing.tsx
import { useState, useEffect } from 'react';
import {
  Card,
  Stack,
  Group,
  Text,
  ThemeIcon,
  Button,
  NumberInput,
  Alert,
  Accordion,
  Badge,
  Grid,
  ActionIcon,
  Tooltip,
  Modal,
  SegmentedControl,
  SimpleGrid
} from '@mantine/core';
import {
  IconDeviceFloppy,
  IconTrash,
  IconCoin,
  IconInfoCircle,
  IconAlertTriangle,
  IconCalendar,
  IconCopy,
  IconSun,
  IconX,
  IconCheck,
  IconCurrencyBaht,
  IconCloudRain,
  IconSunFilled
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useMediaQuery } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import { propertiesApi, MonthlyPrice } from '@/api/properties.api';

interface MonthlyPricingProps {
  propertyId: number;
  initialPricing?: MonthlyPrice[];
  viewMode?: boolean;
  onChange?: (pricing: MonthlyPrice[]) => void;
}

// ✅ Исправлен тип: добавлен undefined
interface MonthPriceData {
  price: number | null | undefined;
  days: number | null | undefined;
}

const MonthlyPricing = ({ 
  propertyId, 
  initialPricing = [], 
  viewMode = false,
  onChange
}: MonthlyPricingProps) => {
  const { t } = useTranslation();
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  const [loading, setLoading] = useState(false);
  const [prices, setPrices] = useState<{ [key: number]: MonthPriceData }>({});
  const [quickFillModalOpened, setQuickFillModalOpened] = useState(false);
  const [quickFillPrice, setQuickFillPrice] = useState<number>(0);
  const [quickFillDays, setQuickFillDays] = useState<number | null>(null);
  const [viewMode_internal, setViewMode_internal] = useState<'list' | 'grid'>('list');

  const months = [
    { number: 1, name: t('monthlyPricing.months.january'), season: 'high', icon: IconSunFilled },
    { number: 2, name: t('monthlyPricing.months.february'), season: 'high', icon: IconSunFilled },
    { number: 3, name: t('monthlyPricing.months.march'), season: 'high', icon: IconSunFilled },
    { number: 4, name: t('monthlyPricing.months.april'), season: 'low', icon: IconSun },
    { number: 5, name: t('monthlyPricing.months.may'), season: 'low', icon: IconCloudRain },
    { number: 6, name: t('monthlyPricing.months.june'), season: 'low', icon: IconCloudRain },
    { number: 7, name: t('monthlyPricing.months.july'), season: 'low', icon: IconCloudRain },
    { number: 8, name: t('monthlyPricing.months.august'), season: 'low', icon: IconCloudRain },
    { number: 9, name: t('monthlyPricing.months.september'), season: 'low', icon: IconSun },
    { number: 10, name: t('monthlyPricing.months.october'), season: 'low', icon: IconSun },
    { number: 11, name: t('monthlyPricing.months.november'), season: 'high', icon: IconSunFilled },
    { number: 12, name: t('monthlyPricing.months.december'), season: 'high', icon: IconSunFilled }
  ];

  useEffect(() => {
    if (initialPricing && initialPricing.length > 0) {
      const newPrices: { [key: number]: MonthPriceData } = {};
      initialPricing.forEach(price => {
        newPrices[price.month_number] = {
          price: price.price_per_month,
          days: price.minimum_days
        };
      });
      setPrices(newPrices);
    }
  }, [initialPricing]);

  const notifyParentOfChanges = (newPrices: typeof prices) => {
    if (!onChange) return;

    const monthlyPricing: MonthlyPrice[] = [];
    
    for (let i = 1; i <= 12; i++) {
      const monthData = newPrices[i];
      if (monthData?.price && monthData.price > 0) {
        monthlyPricing.push({
          month_number: i,
          price_per_month: monthData.price,
          minimum_days: monthData.days || null
        });
      }
    }

    onChange(monthlyPricing);
  };

  const handlePriceChange = (monthNumber: number, field: 'price' | 'days', value: number | string) => {
    const numValue = typeof value === 'number' ? value : null;
    
    const newPrices = {
      ...prices,
      [monthNumber]: {
        ...prices[monthNumber],
        [field]: numValue
      }
    };
    setPrices(newPrices);
    notifyParentOfChanges(newPrices);
  };

  const handleSave = async () => {
    if (!propertyId || propertyId === 0) {
      notifications.show({
        title: t('monthlyPricing.warning'),
        message: t('monthlyPricing.saveAfterCreate'),
        color: 'orange',
        icon: <IconAlertTriangle size={16} />
      });
      return;
    }

    setLoading(true);
    try {
      const monthlyPricing: MonthlyPrice[] = [];
      
      for (let i = 1; i <= 12; i++) {
        const monthData = prices[i];
        if (monthData?.price && monthData.price > 0) {
          monthlyPricing.push({
            month_number: i,
            price_per_month: monthData.price,
            minimum_days: monthData.days || null
          });
        }
      }

      await propertiesApi.updateMonthlyPricing(propertyId, monthlyPricing);
      
      notifications.show({
        title: t('monthlyPricing.success'),
        message: t('monthlyPricing.pricesUpdated'),
        color: 'green',
        icon: <IconCheck size={16} />
      });
      
      notifyParentOfChanges(prices);
    } catch (error: any) {
      notifications.show({
        title: t('monthlyPricing.error'),
        message: error.response?.data?.message || t('monthlyPricing.errorUpdating'),
        color: 'red',
        icon: <IconX size={16} />
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClearMonth = (monthNumber: number) => {
    const newPrices = { ...prices };
    delete newPrices[monthNumber];
    setPrices(newPrices);
    notifyParentOfChanges(newPrices);
  };

  const handleClearAll = () => {
    modals.openConfirmModal({
      title: (
        <Group gap="sm">
          <ThemeIcon size="lg" color="red" variant="light">
            <IconTrash size={20} />
          </ThemeIcon>
          <Text fw={600}>{t('monthlyPricing.clearAllConfirm')}</Text>
        </Group>
      ),
      children: (
        <Text size="sm">{t('monthlyPricing.clearAllDescription')}</Text>
      ),
      labels: { confirm: t('common.clear'), cancel: t('common.cancel') },
      confirmProps: { color: 'red' },
      onConfirm: () => {
        setPrices({});
        notifyParentOfChanges({});
        notifications.show({
          title: t('monthlyPricing.success'),
          message: t('monthlyPricing.allPricesCleared'),
          color: 'blue',
          icon: <IconCheck size={16} />
        });
      },
      centered: true
    });
  };

  const handleQuickFill = () => {
    if (!quickFillPrice || quickFillPrice <= 0) {
      notifications.show({
        title: t('monthlyPricing.warning'),
        message: t('monthlyPricing.enterValidPrice'),
        color: 'orange',
        icon: <IconAlertTriangle size={16} />
      });
      return;
    }

    const newPrices: typeof prices = {};
    for (let i = 1; i <= 12; i++) {
      newPrices[i] = {
        price: quickFillPrice,
        days: quickFillDays
      };
    }
    
    setPrices(newPrices);
    notifyParentOfChanges(newPrices);
    setQuickFillModalOpened(false);
    
    notifications.show({
      title: t('monthlyPricing.success'),
      message: t('monthlyPricing.pricesApplied'),
      color: 'green',
      icon: <IconCheck size={16} />
    });
  };

  const getFilledMonthsCount = () => {
    return Object.keys(prices).filter(key => prices[parseInt(key)]?.price && prices[parseInt(key)]?.price! > 0).length;
  };

  const renderMonthAccordionItem = (month: typeof months[0]) => {
    const monthData = prices[month.number];
    const hasPrice = monthData?.price && monthData.price > 0;
    const SeasonIcon = month.icon;

    return (
      <Accordion.Item key={month.number} value={`month-${month.number}`}>
        <Accordion.Control
          icon={
            <ThemeIcon
              size="lg"
              radius="md"
              variant="light"
              color={month.season === 'high' ? 'blue' : 'orange'}
            >
              <SeasonIcon size={20} />
            </ThemeIcon>
          }
        >
          <Group justify="space-between" wrap="nowrap" style={{ flex: 1, marginRight: 16 }}>
            <div>
              <Text fw={500} size="sm">
                {month.name}
              </Text>
              {hasPrice && (
                <Text size="xs" c="dimmed">
                  {monthData.price?.toLocaleString('ru-RU')} THB
                  {monthData.days && ` • ${monthData.days} ${t('monthlyPricing.daysMin')}`}
                </Text>
              )}
            </div>
            
            <Group gap="xs">
              {hasPrice ? (
                <Badge size="lg" variant="filled" color="green">
                  {monthData.price?.toLocaleString('ru-RU')} ฿
                </Badge>
              ) : (
                <Badge size="sm" variant="light" color="gray">
                  {t('monthlyPricing.notSet')}
                </Badge>
              )}
            </Group>
          </Group>
        </Accordion.Control>

        <Accordion.Panel>
          <Stack gap="md">
            <Grid gutter="md">
              <Grid.Col span={{ base: 12, xs: 6 }}>
                <Stack gap="xs">
                  <Group gap="xs">
                    <ThemeIcon size="sm" radius="md" variant="light" color="green">
                      <IconCurrencyBaht size={14} />
                    </ThemeIcon>
                    <Text size="sm" fw={500}>
                      {t('monthlyPricing.pricePerMonth')}
                    </Text>
                  </Group>
                  <NumberInput
                    value={monthData?.price ?? undefined}
                    onChange={(value) => handlePriceChange(month.number, 'price', value)}
                    min={0}
                    step={1000}
                    thousandSeparator=" "
                    disabled={viewMode}
                    leftSection={<IconCurrencyBaht size={16} />}
                    rightSection={
                      <Text size="xs" c="dimmed" style={{ marginRight: 8 }}>
                        THB
                      </Text>
                    }
                    placeholder="0"
                    styles={{
                      input: {
                        fontSize: '16px',
                        background: viewMode ? 'var(--mantine-color-dark-7)' : undefined
                      }
                    }}
                  />
                </Stack>
              </Grid.Col>

              <Grid.Col span={{ base: 12, xs: 6 }}>
                <Stack gap="xs">
                  <Group gap="xs">
                    <ThemeIcon size="sm" radius="md" variant="light" color="blue">
                      <IconCalendar size={14} />
                    </ThemeIcon>
                    <Text size="sm" fw={500}>
                      {t('monthlyPricing.minimumDays')}
                    </Text>
                  </Group>
                  <NumberInput
                    value={monthData?.days ?? undefined}
                    onChange={(value) => handlePriceChange(month.number, 'days', value)}
                    min={1}
                    disabled={viewMode}
                    placeholder={t('monthlyPricing.notSpecified')}
                    leftSection={<IconCalendar size={16} />}
                    styles={{
                      input: {
                        fontSize: '16px',
                        background: viewMode ? 'var(--mantine-color-dark-7)' : undefined
                      }
                    }}
                  />
                </Stack>
              </Grid.Col>
            </Grid>

            {!viewMode && hasPrice && (
              <Button
                variant="light"
                color="red"
                size="xs"
                leftSection={<IconTrash size={14} />}
                onClick={() => handleClearMonth(month.number)}
              >
                {t('monthlyPricing.clearMonth')}
              </Button>
            )}
          </Stack>
        </Accordion.Panel>
      </Accordion.Item>
    );
  };

  const renderGridView = () => {
    return (
      <SimpleGrid cols={{ base: 1, xs: 2, sm: 3, md: 4 }} spacing="md">
        {months.map(month => {
          const monthData = prices[month.number];
          const hasPrice = monthData?.price && monthData.price > 0;
          const SeasonIcon = month.icon;

          return (
            <Card
              key={month.number}
              shadow="sm"
              padding="md"
              radius="md"
              withBorder
              style={{
                background: hasPrice 
                  ? 'var(--mantine-color-dark-6)' 
                  : 'var(--mantine-color-dark-7)',
                borderColor: hasPrice 
                  ? month.season === 'high' ? 'var(--mantine-color-blue-5)' : 'var(--mantine-color-orange-5)'
                  : undefined
              }}
            >
              <Stack gap="md">
                <Group justify="space-between" wrap="nowrap">
                  <Group gap="xs">
                    <ThemeIcon
                      size="md"
                      radius="md"
                      variant="light"
                      color={month.season === 'high' ? 'blue' : 'orange'}
                    >
                      <SeasonIcon size={16} />
                    </ThemeIcon>
                    <Text size="sm" fw={500}>
                      {month.name}
                    </Text>
                  </Group>

                  {!viewMode && hasPrice && (
                    <ActionIcon
                      variant="light"
                      color="red"
                      size="sm"
                      onClick={() => handleClearMonth(month.number)}
                    >
                      <IconTrash size={14} />
                    </ActionIcon>
                  )}
                </Group>

                <NumberInput
                  value={monthData?.price ?? undefined}
                  onChange={(value) => handlePriceChange(month.number, 'price', value)}
                  min={0}
                  step={1000}
                  thousandSeparator=" "
                  disabled={viewMode}
                  leftSection={<IconCurrencyBaht size={14} />}
                  placeholder={t('monthlyPricing.pricePerMonth')}
                  size="xs"
                  styles={{
                    input: {
                      fontSize: '14px',
                      background: viewMode ? 'var(--mantine-color-dark-8)' : undefined
                    }
                  }}
                />

                <NumberInput
                  value={monthData?.days ?? undefined}
                  onChange={(value) => handlePriceChange(month.number, 'days', value)}
                  min={1}
                  disabled={viewMode}
                  placeholder={t('monthlyPricing.minimumDays')}
                  leftSection={<IconCalendar size={14} />}
                  size="xs"
                  styles={{
                    input: {
                      fontSize: '14px',
                      background: viewMode ? 'var(--mantine-color-dark-8)' : undefined
                    }
                  }}
                />
              </Stack>
            </Card>
          );
        })}
      </SimpleGrid>
    );
  };

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack gap="lg">
        {/* Header */}
        <Group justify="space-between" wrap="nowrap">
          <Group gap="md">
            <ThemeIcon size="xl" radius="md" variant="gradient" gradient={{ from: 'yellow', to: 'orange' }}>
              <IconCoin size={24} />
            </ThemeIcon>
            <div>
              <Text fw={700} size="xl">{t('monthlyPricing.title')}</Text>
              <Text size="xs" c="dimmed">
                {t('monthlyPricing.filledMonths', { count: getFilledMonthsCount() })}
              </Text>
            </div>
          </Group>

          {!viewMode && (
            <Group gap="xs">
              {isMobile ? (
                <>
                  <Tooltip label={t('monthlyPricing.quickFill')}>
                    <ActionIcon
                      variant="light"
                      color="violet"
                      size="lg"
                      onClick={() => setQuickFillModalOpened(true)}
                    >
                      <IconCopy size={18} />
                    </ActionIcon>
                  </Tooltip>
                  <Tooltip label={t('common.save')}>
                    <ActionIcon
                      variant="gradient"
                      gradient={{ from: 'teal', to: 'green' }}
                      size="lg"
                      onClick={handleSave}
                      loading={loading}
                    >
                      <IconDeviceFloppy size={18} />
                    </ActionIcon>
                  </Tooltip>
                </>
              ) : (
                <>
                  <Button
                    variant="light"
                    color="violet"
                    leftSection={<IconCopy size={18} />}
                    onClick={() => setQuickFillModalOpened(true)}
                  >
                    {t('monthlyPricing.quickFill')}
                  </Button>
                  <Button
                    variant="light"
                    color="red"
                    leftSection={<IconTrash size={18} />}
                    onClick={handleClearAll}
                  >
                    {t('monthlyPricing.clearAll')}
                  </Button>
                  <Button
                    variant="gradient"
                    gradient={{ from: 'teal', to: 'green' }}
                    leftSection={<IconDeviceFloppy size={18} />}
                    onClick={handleSave}
                    loading={loading}
                  >
                    {t('common.save')}
                  </Button>
                </>
              )}
            </Group>
          )}
        </Group>

        {/* Info Alert */}
        <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
          <Text size="sm">{t('monthlyPricing.infoDescription')}</Text>
        </Alert>

        {/* View Mode Switcher */}
        {!isMobile && (
          <Group justify="center">
            <SegmentedControl
              value={viewMode_internal}
              onChange={(value) => setViewMode_internal(value as 'list' | 'grid')}
              data={[
                { label: t('monthlyPricing.listView'), value: 'list' },
                { label: t('monthlyPricing.gridView'), value: 'grid' }
              ]}
            />
          </Group>
        )}

        {/* Content */}
        {viewMode_internal === 'list' || isMobile ? (
          <Accordion variant="separated" radius="md">
            {months.map(renderMonthAccordionItem)}
          </Accordion>
        ) : (
          renderGridView()
        )}

        {/* Warning Alert */}
        <Alert icon={<IconAlertTriangle size={16} />} color="yellow" variant="light">
          <Text size="sm" fw={600} mb={4}>
            {t('monthlyPricing.importantInfoTitle')}
          </Text>
          <Text size="sm">{t('monthlyPricing.importantInfoDescription')}</Text>
        </Alert>
      </Stack>

      {/* Quick Fill Modal */}
      <Modal
        opened={quickFillModalOpened}
        onClose={() => setQuickFillModalOpened(false)}
        title={
          <Group gap="sm">
            <ThemeIcon size="lg" radius="md" variant="gradient" gradient={{ from: 'violet', to: 'grape' }}>
              <IconCopy size={20} />
            </ThemeIcon>
            <Text fw={600} size="lg">{t('monthlyPricing.quickFill')}</Text>
          </Group>
        }
        centered
        size="md"
      >
        <Stack gap="md">
          <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
            <Text size="sm">{t('monthlyPricing.quickFillDescription')}</Text>
          </Alert>

          <NumberInput
            label={t('monthlyPricing.pricePerMonth')}
            value={quickFillPrice}
            onChange={(value) => setQuickFillPrice(typeof value === 'number' ? value : 0)}
            min={0}
            step={1000}
            thousandSeparator=" "
            leftSection={<IconCurrencyBaht size={16} />}
            rightSection={
              <Text size="xs" c="dimmed" style={{ marginRight: 8 }}>
                THB
              </Text>
            }
            styles={{ input: { fontSize: '16px' } }}
          />

          <NumberInput
            label={t('monthlyPricing.minimumDays')}
            value={quickFillDays ?? undefined}
            onChange={(value) => setQuickFillDays(typeof value === 'number' ? value : null)}
            min={1}
            placeholder={t('monthlyPricing.notSpecified')}
            leftSection={<IconCalendar size={16} />}
            styles={{ input: { fontSize: '16px' } }}
          />

          <Group gap="xs" grow>
            <Button
              variant="light"
              color="gray"
              leftSection={<IconX size={18} />}
              onClick={() => setQuickFillModalOpened(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="gradient"
              gradient={{ from: 'violet', to: 'grape' }}
              leftSection={<IconCheck size={18} />}
              onClick={handleQuickFill}
            >
              {t('monthlyPricing.apply')}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Card>
  );
};

export default MonthlyPricing;