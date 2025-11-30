// frontend/src/modules/Properties/components/SeasonalPricing.tsx
import { useState } from 'react';
import {
  Card,
  Stack,
  Group,
  Text,
  ThemeIcon,
  Button,
  NumberInput,
  Alert,
  Badge,
  ActionIcon,
  Tooltip,
  Modal,
  Radio,
  Grid,
  Paper,
  Divider,
  Timeline,
  SegmentedControl,
  Center,
  Stepper,
  List
} from '@mantine/core';
import {
  IconPlus,
  IconTrash,
  IconEdit,
  IconInfoCircle,
  IconCalendar,
  IconCurrencyBaht,
  IconSnowflake,
  IconSun,
  IconFlame,
  IconSparkles,
  IconGift,
  IconCheck,
  IconX,
  IconBeach,
  IconEye,
  IconBulb
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useMediaQuery } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import dayjs from 'dayjs';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface PricingPeriod {
  id?: number;
  season_type: string | null;
  start_date_recurring: string;
  end_date_recurring: string;
  price_per_night: number;
  source_price_per_night?: number | null;
  minimum_nights: number | null;
  pricing_type?: 'per_night' | 'per_period';
}

interface SeasonalPricingProps {
  value?: PricingPeriod[];
  onChange?: (value: PricingPeriod[]) => void;
  viewMode?: boolean;
}

interface EditFormState {
  season_type: string | null;
  startDate: Date | null;
  endDate: Date | null;
  price_per_night: number | string;
  source_price_per_night: number | string;
  minimum_nights: number | string;
  pricing_type: 'per_night' | 'per_period';
}

const initialFormState: EditFormState = {
  season_type: null,
  startDate: null,
  endDate: null,
  price_per_night: '',
  source_price_per_night: '',
  minimum_nights: 1,
  pricing_type: 'per_night'
};

const SeasonalPricing = ({ value = [], onChange, viewMode = false }: SeasonalPricingProps) => {
  const { t } = useTranslation();
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  const [modalOpened, setModalOpened] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [detailsModalOpened, setDetailsModalOpened] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<PricingPeriod | null>(null);
  const [formState, setFormState] = useState<EditFormState>(initialFormState);
  const [viewMode_internal, setViewMode_internal] = useState<'list' | 'timeline'>('list');
  const [activeStep, setActiveStep] = useState(0);

  const seasonTypes = [
    { 
      value: 'low', 
      label: t('properties.pricing.seasonTypes.low'),
      color: 'teal',
      icon: IconBeach,
      description: t('seasonalPricing.seasonDescriptions.low')
    },
    { 
      value: 'mid', 
      label: t('properties.pricing.seasonTypes.mid'),
      color: 'blue',
      icon: IconSun,
      description: t('seasonalPricing.seasonDescriptions.mid')
    },
    { 
      value: 'high', 
      label: t('properties.pricing.seasonTypes.high'),
      color: 'orange',
      icon: IconFlame,
      description: t('seasonalPricing.seasonDescriptions.high')
    },
    { 
      value: 'peak', 
      label: t('properties.pricing.seasonTypes.peak'),
      color: 'red',
      icon: IconSparkles,
      description: t('seasonalPricing.seasonDescriptions.peak')
    },
    { 
      value: 'prime', 
      label: t('seasonalPricing.seasonTypes.prime'),
      color: 'violet',
      icon: IconSnowflake,
      description: t('seasonalPricing.seasonDescriptions.prime')
    },
    { 
      value: 'holiday', 
      label: t('seasonalPricing.seasonTypes.holiday'),
      color: 'pink',
      icon: IconGift,
      description: t('seasonalPricing.seasonDescriptions.holiday')
    },
    { 
      value: null, 
      label: t('properties.pricing.seasonTypes.custom'),
      color: 'gray',
      icon: IconCalendar,
      description: t('seasonalPricing.seasonDescriptions.custom')
    }
  ];

  const getSeasonConfig = (type: string | null) => {
    return seasonTypes.find(s => s.value === type) || seasonTypes[seasonTypes.length - 1];
  };

  const handleAdd = () => {
    setEditingId(null);
    setActiveStep(0);
    
    if (value.length > 0) {
      const lastPeriod = value[value.length - 1];
      const lastEndDate = dayjs(lastPeriod.end_date_recurring, 'DD-MM').toDate();
      const nextStartDate = dayjs(lastEndDate).add(1, 'day').toDate();
      
      setFormState({
        ...initialFormState,
        startDate: nextStartDate,
        endDate: null
      });
    } else {
      setFormState(initialFormState);
    }
    
    setModalOpened(true);
  };

  const handleEdit = (period: PricingPeriod) => {
    setEditingId(period.id || null);
    setActiveStep(0);
    
    setFormState({
      season_type: period.season_type,
      startDate: dayjs(period.start_date_recurring, 'DD-MM').toDate(),
      endDate: dayjs(period.end_date_recurring, 'DD-MM').toDate(),
      price_per_night: period.price_per_night,
      source_price_per_night: period.source_price_per_night || '',
      minimum_nights: period.minimum_nights || 1,
      pricing_type: period.pricing_type || 'per_night'
    });
    
    setModalOpened(true);
  };

  const handleSubmit = () => {
    if (!formState.startDate || !formState.endDate) {
      notifications.show({
        title: t('validation.error'),
        message: t('validation.datesRequired'),
        color: 'red',
        icon: <IconX size={16} />
      });
      return;
    }

    if (!formState.price_per_night || Number(formState.price_per_night) <= 0) {
      notifications.show({
        title: t('validation.error'),
        message: t('validation.priceRequired'),
        color: 'red',
        icon: <IconX size={16} />
      });
      return;
    }

    const newPeriod: PricingPeriod = {
      id: editingId || Date.now(),
      season_type: formState.season_type || null,
      start_date_recurring: dayjs(formState.startDate).format('DD-MM'),
      end_date_recurring: dayjs(formState.endDate).format('DD-MM'),
      price_per_night: Number(formState.price_per_night),
      source_price_per_night: formState.source_price_per_night ? Number(formState.source_price_per_night) : null,
      minimum_nights: formState.minimum_nights ? Number(formState.minimum_nights) : null,
      pricing_type: formState.pricing_type || 'per_night'
    };

    let updated: PricingPeriod[];
    
    if (editingId) {
      updated = value.map(p => p.id === editingId ? newPeriod : p);
      notifications.show({
        title: t('success'),
        message: t('properties.pricing.periodUpdated'),
        color: 'green',
        icon: <IconCheck size={16} />
      });
    } else {
      updated = [...value, newPeriod];
      notifications.show({
        title: t('success'),
        message: t('properties.pricing.periodAdded'),
        color: 'green',
        icon: <IconCheck size={16} />
      });
    }

    if (onChange) {
      onChange(updated);
    }
    
    setModalOpened(false);
    setFormState(initialFormState);
    setActiveStep(0);
  };

  const handleDelete = (id: number) => {
    modals.openConfirmModal({
      title: (
        <Group gap="sm">
          <ThemeIcon size="lg" color="red" variant="light">
            <IconTrash size={20} />
          </ThemeIcon>
          <Text fw={600}>{t('common.confirmDelete')}</Text>
        </Group>
      ),
      children: (
        <Text size="sm">{t('seasonalPricing.deleteConfirmation')}</Text>
      ),
      labels: { confirm: t('common.delete'), cancel: t('common.cancel') },
      confirmProps: { color: 'red' },
      onConfirm: () => {
        const updated = value.filter(p => p.id !== id);
        if (onChange) {
          onChange(updated);
        }
        notifications.show({
          title: t('success'),
          message: t('properties.pricing.periodDeleted'),
          color: 'green',
          icon: <IconCheck size={16} />
        });
      },
      centered: true
    });
  };

  const showDetails = (period: PricingPeriod) => {
    setSelectedPeriod(period);
    setDetailsModalOpened(true);
  };

  const canProceedToStep = (step: number): boolean => {
    switch (step) {
      case 1: // Даты
        return formState.season_type !== null;
      case 2: // Цена
        return formState.startDate !== null && formState.endDate !== null;
      case 3: // Превью
        return formState.price_per_night !== '' && Number(formState.price_per_night) > 0;
      default:
        return true;
    }
  };

  const renderPeriodCard = (period: PricingPeriod) => {
    const seasonConfig = getSeasonConfig(period.season_type);
    const SeasonIcon = seasonConfig.icon;

    return (
      <Card
        key={period.id}
        shadow="md"
        padding="md"
        radius="md"
        withBorder
        style={{
          borderColor: `var(--mantine-color-${seasonConfig.color}-5)`,
          transition: 'all 0.3s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = `0 8px 16px var(--mantine-color-${seasonConfig.color}-3)`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '';
        }}
      >
        <Stack gap="md">
          <Group justify="space-between" wrap="nowrap">
            <Group gap="sm">
              <ThemeIcon
                size="lg"
                radius="md"
                variant="light"
                color={seasonConfig.color}
              >
                <SeasonIcon size={20} />
              </ThemeIcon>
              <div>
                <Text fw={600} size="sm">
                  {seasonConfig.label}
                </Text>
                <Group gap={4}>
                  <Text size="xs" c="dimmed">
                    {period.start_date_recurring}
                  </Text>
                  <Text size="xs" c="dimmed">—</Text>
                  <Text size="xs" c="dimmed">
                    {period.end_date_recurring}
                  </Text>
                </Group>
              </div>
            </Group>

            {!viewMode && (
              <Group gap={4}>
                {isMobile && (
                  <Tooltip label={t('seasonalPricing.details')}>
                    <ActionIcon
                      variant="light"
                      color="blue"
                      onClick={() => showDetails(period)}
                    >
                      <IconInfoCircle size={16} />
                    </ActionIcon>
                  </Tooltip>
                )}
                <Tooltip label={t('common.edit')}>
                  <ActionIcon
                    variant="light"
                    color="blue"
                    onClick={() => handleEdit(period)}
                  >
                    <IconEdit size={16} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label={t('common.delete')}>
                  <ActionIcon
                    variant="light"
                    color="red"
                    onClick={() => handleDelete(period.id!)}
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            )}
          </Group>

          <Paper p="sm" radius="md" withBorder style={{ background: 'var(--mantine-color-dark-6)' }}>
            <Grid gutter="xs">
              <Grid.Col span={6}>
                <Stack gap={4}>
                  <Text size="xs" c="dimmed">{t('seasonalPricing.price')}</Text>
                  <Text size="lg" fw={700} c={seasonConfig.color}>
                    {period.price_per_night.toLocaleString()} ฿
                  </Text>
                  <Text size="xs" c="dimmed">
                    {period.pricing_type === 'per_period' 
                      ? t('properties.pricing.forWholePeriod')
                      : t('properties.pricing.perNight')
                    }
                  </Text>
                </Stack>
              </Grid.Col>
              <Grid.Col span={6}>
                <Stack gap={4}>
                  <Text size="xs" c="dimmed">{t('seasonalPricing.minimumNights')}</Text>
                  <Text size="lg" fw={700}>
                    {period.minimum_nights || '—'}
                  </Text>
                  {period.source_price_per_night && (
                    <Text size="xs" c="dimmed">
                      {t('seasonalPricing.sourcePrice')}: {period.source_price_per_night.toLocaleString()} ฿
                    </Text>
                  )}
                </Stack>
              </Grid.Col>
            </Grid>
          </Paper>
        </Stack>
      </Card>
    );
  };

  const renderTimelineView = () => {
    return (
      <Timeline
        active={value.length}
        bulletSize={32}
        lineWidth={2}
      >
        {value.map((period) => {
          const seasonConfig = getSeasonConfig(period.season_type);
          const SeasonIcon = seasonConfig.icon;

          return (
            <Timeline.Item
              key={period.id}
              bullet={
                <ThemeIcon size="lg" radius="xl" variant="light" color={seasonConfig.color}>
                  <SeasonIcon size={18} />
                </ThemeIcon>
              }
              title={
                <Group gap="xs">
                  <Text fw={600} size="sm">{seasonConfig.label}</Text>
                  <Badge size="sm" variant="filled" color={seasonConfig.color}>
                    {period.price_per_night.toLocaleString()} ฿
                  </Badge>
                </Group>
              }
            >
              <Stack gap="xs">
                <Group gap="xs">
                  <IconCalendar size={14} color="var(--mantine-color-dimmed)" />
                  <Text size="sm" c="dimmed">
                    {period.start_date_recurring} — {period.end_date_recurring}
                  </Text>
                </Group>
                
                {period.minimum_nights && (
                  <Text size="xs" c="dimmed">
                    {t('seasonalPricing.minimumNights')}: {period.minimum_nights}
                  </Text>
                )}

                {!viewMode && (
                  <Group gap="xs" mt="xs">
                    <Button
                      variant="light"
                      size="xs"
                      color="blue"
                      leftSection={<IconEdit size={14} />}
                      onClick={() => handleEdit(period)}
                    >
                      {t('common.edit')}
                    </Button>
                    <Button
                      variant="light"
                      size="xs"
                      color="red"
                      leftSection={<IconTrash size={14} />}
                      onClick={() => handleDelete(period.id!)}
                    >
                      {t('common.delete')}
                    </Button>
                  </Group>
                )}
              </Stack>
            </Timeline.Item>
          );
        })}
      </Timeline>
    );
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0: // Тип сезона
        return (
          <Stack gap="md">
            <Alert icon={<IconBulb size={16} />} color="blue" variant="light">
              <Text size="sm" fw={500} mb={4}>
                {t('seasonalPricing.stepGuides.seasonType.title')}
              </Text>
              <Text size="xs">
                {t('seasonalPricing.stepGuides.seasonType.description')}
              </Text>
            </Alert>

            <Stack gap="xs">
              {seasonTypes.map((season) => {
                const SeasonIcon = season.icon;
                const isSelected = formState.season_type === season.value;

                return (
                  <Paper
                    key={season.value || 'custom'}
                    p="md"
                    radius="md"
                    withBorder
                    onClick={() => setFormState(prev => ({ ...prev, season_type: season.value }))}
                    style={{
                      cursor: 'pointer',
                      borderWidth: isSelected ? '2px' : '1px',
                      borderColor: isSelected 
                        ? `var(--mantine-color-${season.color}-6)` 
                        : 'var(--mantine-color-dark-4)',
                      background: isSelected 
                        ? `linear-gradient(135deg, var(--mantine-color-${season.color}-9) 0%, var(--mantine-color-dark-7) 100%)`
                        : 'var(--mantine-color-dark-7)',
                      transition: 'all 0.2s',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = `var(--mantine-color-${season.color}-7)`;
                        e.currentTarget.style.background = `linear-gradient(135deg, var(--mantine-color-${season.color}-9) 0%, var(--mantine-color-dark-6) 100%)`;
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.borderColor = 'var(--mantine-color-dark-4)';
                        e.currentTarget.style.background = 'var(--mantine-color-dark-7)';
                      }
                    }}
                  >
                    {isSelected && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          height: '3px',
                          background: `linear-gradient(90deg, var(--mantine-color-${season.color}-6), var(--mantine-color-${season.color}-4))`
                        }}
                      />
                    )}
                    
                    <Group gap="md" wrap="nowrap">
                      <ThemeIcon
                        size="xl"
                        radius="md"
                        variant={isSelected ? 'gradient' : 'light'}
                        gradient={isSelected ? { from: season.color, to: `${season.color}.9` } : undefined}
                        color={season.color}
                      >
                        <SeasonIcon size={24} />
                      </ThemeIcon>
                      <div style={{ flex: 1 }}>
                        <Text fw={600} size="sm" c={isSelected ? season.color : undefined}>
                          {season.label}
                        </Text>
                        <Text size="xs" c="dimmed" lineClamp={2}>
                          {season.description}
                        </Text>
                      </div>
                      {isSelected && (
                        <ThemeIcon size="md" radius="xl" variant="gradient" gradient={{ from: season.color, to: `${season.color}.9` }}>
                          <IconCheck size={16} />
                        </ThemeIcon>
                      )}
                    </Group>
                  </Paper>
                );
              })}
            </Stack>
          </Stack>
        );

      case 1: // Даты
        const selectedSeason = getSeasonConfig(formState.season_type);
        return (
          <Stack gap="md">
            <Alert icon={<IconBulb size={16} />} color="blue" variant="light">
              <Text size="sm" fw={500} mb={4}>
                {t('seasonalPricing.stepGuides.dates.title')}
              </Text>
              <Text size="xs">
                {t('seasonalPricing.stepGuides.dates.description')}
              </Text>
            </Alert>

            {formState.season_type && (
              <Paper 
                p="md" 
                radius="md" 
                withBorder 
                style={{ 
                  background: `linear-gradient(135deg, var(--mantine-color-${selectedSeason.color}-9) 0%, var(--mantine-color-dark-7) 100%)`,
                  borderColor: `var(--mantine-color-${selectedSeason.color}-6)`
                }}
              >
                <Group gap="sm">
                  <ThemeIcon size="lg" radius="md" variant="gradient" gradient={{ from: selectedSeason.color, to: `${selectedSeason.color}.9` }}>
                    {(() => {
                      const Icon = selectedSeason.icon;
                      return <Icon size={20} />;
                    })()}
                  </ThemeIcon>
                  <Text size="sm" fw={600} c={selectedSeason.color}>
                    {selectedSeason.label}
                  </Text>
                </Group>
              </Paper>
            )}

            <Grid gutter="md">
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Stack gap="xs">
                  <Text size="sm" fw={500}>
                    {t('seasonalPricing.startDate')} <Text component="span" c="red">*</Text>
                  </Text>
                  <div className="custom-datepicker-wrapper">
                    <DatePicker
                      selected={formState.startDate}
                      onChange={(date) => setFormState(prev => ({ ...prev, startDate: date }))}
                      dateFormat="dd-MM"
                      placeholderText={t('seasonalPricing.selectDate')}
                      className="custom-datepicker-input"
                    />
                  </div>
                  <Text size="xs" c="dimmed">
                    {t('seasonalPricing.stepGuides.dates.startHint')}
                  </Text>
                </Stack>
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Stack gap="xs">
                  <Text size="sm" fw={500}>
                    {t('seasonalPricing.endDate')} <Text component="span" c="red">*</Text>
                  </Text>
                  <div className="custom-datepicker-wrapper">
                    <DatePicker
                      selected={formState.endDate}
                      onChange={(date) => setFormState(prev => ({ ...prev, endDate: date }))}
                      dateFormat="dd-MM"
                      placeholderText={t('seasonalPricing.selectDate')}
                      className="custom-datepicker-input"
                      minDate={formState.startDate || undefined}
                    />
                  </div>
                  <Text size="xs" c="dimmed">
                    {t('seasonalPricing.stepGuides.dates.endHint')}
                  </Text>
                </Stack>
              </Grid.Col>
            </Grid>

            {formState.startDate && formState.endDate && (
              <Alert icon={<IconInfoCircle size={16} />} color="teal" variant="light">
                <Text size="sm">
                  {t('seasonalPricing.periodDuration')}: {dayjs(formState.startDate).format('DD-MM')} — {dayjs(formState.endDate).format('DD-MM')}
                </Text>
              </Alert>
            )}
          </Stack>
        );

      case 2: // Цены
        return (
          <Stack gap="md">
            <Alert icon={<IconBulb size={16} />} color="blue" variant="light">
              <Text size="sm" fw={500} mb={4}>
                {t('seasonalPricing.stepGuides.pricing.title')}
              </Text>
              <Text size="xs">
                {t('seasonalPricing.stepGuides.pricing.description')}
              </Text>
            </Alert>

            <Radio.Group
              label={t('properties.pricing.pricingType')}
              value={formState.pricing_type}
              onChange={(value) => setFormState(prev => ({ ...prev, pricing_type: value as 'per_night' | 'per_period' }))}
            >
              <Stack gap="xs" mt="xs">
                <Paper 
                  p="md" 
                  radius="md" 
                  withBorder
                  style={{
                    borderColor: formState.pricing_type === 'per_night' 
                      ? 'var(--mantine-color-blue-6)' 
                      : 'var(--mantine-color-dark-4)',
                    background: formState.pricing_type === 'per_night'
                      ? 'linear-gradient(135deg, var(--mantine-color-blue-9) 0%, var(--mantine-color-dark-7) 100%)'
                      : 'var(--mantine-color-dark-7)'
                  }}
                >
                  <Radio
                    value="per_night"
                    label={
                      <Stack gap={4}>
                        <Text size="sm" fw={500}>{t('properties.pricing.perNightOption')}</Text>
                        <Text size="xs" c="dimmed">{t('properties.pricing.perNightHint')}</Text>
                        <List size="xs" spacing={4} mt={4}>
                          <List.Item>
                            <Text size="xs" c="dimmed">{t('seasonalPricing.stepGuides.pricing.perNightExample')}</Text>
                          </List.Item>
                        </List>
                      </Stack>
                    }
                  />
                </Paper>
                <Paper 
                  p="md" 
                  radius="md" 
                  withBorder
                  style={{
                    borderColor: formState.pricing_type === 'per_period' 
                      ? 'var(--mantine-color-violet-6)' 
                      : 'var(--mantine-color-dark-4)',
                    background: formState.pricing_type === 'per_period'
                      ? 'linear-gradient(135deg, var(--mantine-color-violet-9) 0%, var(--mantine-color-dark-7) 100%)'
                      : 'var(--mantine-color-dark-7)'
                  }}
                >
                  <Radio
                    value="per_period"
                    label={
                      <Stack gap={4}>
                        <Text size="sm" fw={500}>{t('properties.pricing.perPeriodOption')}</Text>
                        <Text size="xs" c="dimmed">{t('properties.pricing.perPeriodHint')}</Text>
                        <List size="xs" spacing={4} mt={4}>
                          <List.Item>
                            <Text size="xs" c="dimmed">{t('seasonalPricing.stepGuides.pricing.perPeriodExample')}</Text>
                          </List.Item>
                        </List>
                      </Stack>
                    }
                  />
                </Paper>
              </Stack>
            </Radio.Group>

            <NumberInput
              label={
                <Group gap="xs">
                  <Text size="sm" fw={500}>
                    {t('properties.pricing.pricePerNight')} <Text component="span" c="red">*</Text>
                  </Text>
                </Group>
              }
              description={t('seasonalPricing.stepGuides.pricing.priceDescription')}
              placeholder="0"
              value={formState.price_per_night}
              onChange={(value) => setFormState(prev => ({ ...prev, price_per_night: value }))}
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
              label={t('properties.pricing.sourcePricePerNight')}
              description={t('seasonalPricing.sourcePriceDescription')}
              placeholder="0"
              value={formState.source_price_per_night}
              onChange={(value) => setFormState(prev => ({ ...prev, source_price_per_night: value }))}
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
              label={t('properties.pricing.minimumNights')}
              description={t('seasonalPricing.stepGuides.pricing.minNightsDescription')}
              placeholder="1"
              value={formState.minimum_nights}
              onChange={(value) => setFormState(prev => ({ ...prev, minimum_nights: value }))}
              min={1}
              leftSection={<IconCalendar size={16} />}
              styles={{ input: { fontSize: '16px' } }}
            />
          </Stack>
        );

      case 3: // Превью
        const previewSeason = getSeasonConfig(formState.season_type);
        const PreviewIcon = previewSeason.icon;
        
        return (
          <Stack gap="md">
            <Alert icon={<IconEye size={16} />} color="violet" variant="light">
              <Text size="sm" fw={500} mb={4}>
                {t('seasonalPricing.stepGuides.preview.title')}
              </Text>
              <Text size="xs">
                {t('seasonalPricing.stepGuides.preview.description')}
              </Text>
            </Alert>

            <Card
              shadow="md"
              padding="lg"
              radius="md"
              withBorder
              style={{
                borderWidth: '2px',
                borderColor: `var(--mantine-color-${previewSeason.color}-6)`,
                background: `linear-gradient(135deg, var(--mantine-color-${previewSeason.color}-9) 0%, var(--mantine-color-dark-7) 100%)`,
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '4px',
                  background: `linear-gradient(90deg, var(--mantine-color-${previewSeason.color}-6), var(--mantine-color-${previewSeason.color}-4))`
                }}
              />
              
              <Stack gap="md" mt={4}>
                <Group gap="md">
                  <ThemeIcon
                    size="xl"
                    radius="md"
                    variant="gradient"
                    gradient={{ from: previewSeason.color, to: `${previewSeason.color}.9` }}
                  >
                    <PreviewIcon size={28} />
                  </ThemeIcon>
                  <div>
                    <Text fw={700} size="lg" c={previewSeason.color}>
                      {previewSeason.label}
                    </Text>
                    <Group gap={4}>
                      <Text size="sm" c="dimmed">
                        {formState.startDate ? dayjs(formState.startDate).format('DD-MM') : '—'}
                      </Text>
                      <Text size="sm" c="dimmed">—</Text>
                      <Text size="sm" c="dimmed">
                        {formState.endDate ? dayjs(formState.endDate).format('DD-MM') : '—'}
                      </Text>
                    </Group>
                  </div>
                </Group>

                <Divider />

                <Grid gutter="md">
                  <Grid.Col span={6}>
                    <Paper p="md" radius="md" withBorder style={{ background: 'var(--mantine-color-dark-6)' }}>
                      <Stack gap={4}>
                        <Text size="xs" c="dimmed">{t('seasonalPricing.price')}</Text>
                        <Text size="xl" fw={700} c={previewSeason.color}>
                          {formState.price_per_night ? Number(formState.price_per_night).toLocaleString() : '0'} ฿
                        </Text>
                        <Text size="xs" c="dimmed">
                          {formState.pricing_type === 'per_period' 
                            ? t('properties.pricing.forWholePeriod')
                            : t('properties.pricing.perNight')
                          }
                        </Text>
                      </Stack>
                    </Paper>
                  </Grid.Col>

                  {formState.source_price_per_night && Number(formState.source_price_per_night) > 0 && (
                    <Grid.Col span={6}>
                      <Paper p="md" radius="md" withBorder style={{ background: 'var(--mantine-color-dark-6)' }}>
                        <Stack gap={4}>
                          <Text size="xs" c="dimmed">{t('seasonalPricing.sourcePrice')}</Text>
                          <Text size="lg" fw={600}>
                            {Number(formState.source_price_per_night).toLocaleString()} ฿
                          </Text>
                        </Stack>
                      </Paper>
                    </Grid.Col>
                  )}

                  <Grid.Col span={6}>
                    <Paper p="md" radius="md" withBorder style={{ background: 'var(--mantine-color-dark-6)' }}>
                      <Stack gap={4}>
                        <Text size="xs" c="dimmed">{t('seasonalPricing.minimumNights')}</Text>
                        <Text size="lg" fw={600}>
                          {formState.minimum_nights || 1}
                        </Text>
                      </Stack>
                    </Paper>
                  </Grid.Col>
                </Grid>
              </Stack>
            </Card>

            <Alert icon={<IconCheck size={16} />} color="green" variant="light">
              <Text size="sm">
                {t('seasonalPricing.stepGuides.preview.readyMessage')}
              </Text>
            </Alert>
          </Stack>
        );

      default:
        return null;
    }
  };

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack gap="lg">
        {/* Header */}
        <Group justify="space-between" wrap="nowrap">
          <Group gap="md">
            <ThemeIcon size="xl" radius="md" variant="gradient" gradient={{ from: 'orange', to: 'red' }}>
              <IconCalendar size={24} />
            </ThemeIcon>
            <div>
              <Text fw={700} size="xl">{t('properties.pricing.title')}</Text>
              <Text size="xs" c="dimmed">
                {t('seasonalPricing.periodsCount', { count: value.length })}
              </Text>
            </div>
          </Group>

          {!viewMode && (
            <Button
              variant="gradient"
              gradient={{ from: 'teal', to: 'green' }}
              leftSection={<IconPlus size={18} />}
              onClick={handleAdd}
              size={isMobile ? 'sm' : 'md'}
            >
              {!isMobile && (value.length === 0 
                ? t('properties.pricing.addPeriod')
                : t('seasonalPricing.addAnotherSeason')
              )}
            </Button>
          )}
        </Group>

        {/* Info Alert */}
        <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
          <Stack gap={4}>
            <Text size="sm" fw={500}>
              {t('properties.pricing.seasonalDisclaimer')}
            </Text>
            <Text size="xs" c="dimmed">
              {t('properties.pricing.seasonalDisclaimerDescription')}
            </Text>
          </Stack>
        </Alert>

        {/* View Mode Switcher */}
        {value.length > 0 && !isMobile && (
          <Group justify="center">
            <SegmentedControl
              value={viewMode_internal}
              onChange={(value) => setViewMode_internal(value as 'list' | 'timeline')}
              data={[
                { label: t('seasonalPricing.cardView'), value: 'list' },
                { label: t('seasonalPricing.timelineView'), value: 'timeline' }
              ]}
            />
          </Group>
        )}

        {/* Periods List */}
        {value.length > 0 ? (
          viewMode_internal === 'timeline' && !isMobile ? (
            renderTimelineView()
          ) : (
            <Stack gap="md">
              {value.map(renderPeriodCard)}
            </Stack>
          )
        ) : (
          <Center p={40}>
            <Stack align="center" gap="md">
              <ThemeIcon size={80} radius="md" variant="light" color="gray">
                <IconCalendar size={40} />
              </ThemeIcon>
              <Stack gap={4} align="center">
                <Text size="lg" fw={500} c="dimmed">
                  {t('seasonalPricing.noPeriods')}
                </Text>
                <Text size="sm" c="dimmed">
                  {t('seasonalPricing.addFirstPeriod')}
                </Text>
              </Stack>
            </Stack>
          </Center>
        )}
      </Stack>

      {/* Add/Edit Modal with Stepper */}
      <Modal
        opened={modalOpened}
        onClose={() => {
          setModalOpened(false);
          setFormState(initialFormState);
          setActiveStep(0);
        }}
        title={
          <Group gap="sm">
            <ThemeIcon size="lg" radius="md" variant="gradient" gradient={{ from: 'violet', to: 'grape' }}>
              {editingId ? <IconEdit size={20} /> : <IconPlus size={20} />}
            </ThemeIcon>
            <Text fw={600} size="lg">
              {editingId ? t('seasonalPricing.editPeriod') : t('seasonalPricing.addPeriod')}
            </Text>
          </Group>
        }
        size={isMobile ? 'full' : 'xl'}
        centered
      >
        <Stack gap="xl">
          <Stepper active={activeStep} onStepClick={setActiveStep} allowNextStepsSelect={false}>
            <Stepper.Step 
              label={t('seasonalPricing.steps.seasonType')} 
              description={t('seasonalPricing.steps.seasonTypeDesc')}
            >
              {renderStepContent()}
            </Stepper.Step>
            
            <Stepper.Step 
              label={t('seasonalPricing.steps.dates')} 
              description={t('seasonalPricing.steps.datesDesc')}
            >
              {renderStepContent()}
            </Stepper.Step>
            
            <Stepper.Step 
              label={t('seasonalPricing.steps.pricing')} 
              description={t('seasonalPricing.steps.pricingDesc')}
            >
              {renderStepContent()}
            </Stepper.Step>
            
            <Stepper.Step 
              label={t('seasonalPricing.steps.preview')} 
              description={t('seasonalPricing.steps.previewDesc')}
            >
              {renderStepContent()}
            </Stepper.Step>
          </Stepper>

          {/* Navigation Buttons */}
          <Group justify="space-between">
            <Button
              variant="light"
              color="gray"
              leftSection={<IconX size={18} />}
              onClick={() => {
                setModalOpened(false);
                setFormState(initialFormState);
                setActiveStep(0);
              }}
            >
              {t('common.cancel')}
            </Button>

            <Group gap="xs">
              {activeStep > 0 && (
                <Button
                  variant="light"
                  onClick={() => setActiveStep(prev => prev - 1)}
                >
                  {t('seasonalPricing.back')}
                </Button>
              )}
              
              {activeStep < 3 ? (
                <Button
                  variant="gradient"
                  gradient={{ from: 'violet', to: 'grape' }}
                  onClick={() => setActiveStep(prev => prev + 1)}
                  disabled={!canProceedToStep(activeStep + 1)}
                >
                  {t('seasonalPricing.next')}
                </Button>
              ) : (
                <Button
                  variant="gradient"
                  gradient={{ from: 'teal', to: 'green' }}
                  leftSection={<IconCheck size={18} />}
                  onClick={handleSubmit}
                >
                  {editingId ? t('common.save') : t('common.add')}
                </Button>
              )}
            </Group>
          </Group>
        </Stack>
      </Modal>

      {/* Details Modal */}
      <Modal
        opened={detailsModalOpened}
        onClose={() => setDetailsModalOpened(false)}
        title={
          <Group gap="sm">
            <ThemeIcon size="lg" radius="md" variant="light" color="blue">
              <IconInfoCircle size={20} />
            </ThemeIcon>
            <Text fw={600} size="lg">{t('seasonalPricing.seasonDetails')}</Text>
          </Group>
        }
        centered
      >
        {selectedPeriod && (() => {
          const seasonConfig = getSeasonConfig(selectedPeriod.season_type);
          const SeasonIcon = seasonConfig.icon;

          return (
            <Stack gap="md">
              <Paper p="md" radius="md" withBorder>
                <Stack gap="md">
                  <Group gap="sm">
                    <ThemeIcon size="lg" radius="md" variant="light" color={seasonConfig.color}>
                      <SeasonIcon size={20} />
                    </ThemeIcon>
                    <div>
                      <Text fw={600}>{seasonConfig.label}</Text>
                      <Text size="xs" c="dimmed">
                        {selectedPeriod.start_date_recurring} — {selectedPeriod.end_date_recurring}
                      </Text>
                    </div>
                  </Group>

                  <Divider />

                  <Grid gutter="md">
                    <Grid.Col span={6}>
                      <Stack gap={4}>
                        <Text size="xs" c="dimmed">{t('seasonalPricing.price')}</Text>
                        <Text size="xl" fw={700} c={seasonConfig.color}>
                          {selectedPeriod.price_per_night.toLocaleString()} ฿
                        </Text>
                        <Text size="xs" c="dimmed">
                          {selectedPeriod.pricing_type === 'per_period' 
                            ? t('properties.pricing.forWholePeriod')
                            : t('properties.pricing.perNight')
                          }
                        </Text>
                      </Stack>
                    </Grid.Col>
                    
                    {selectedPeriod.source_price_per_night && (
                      <Grid.Col span={6}>
                        <Stack gap={4}>
                          <Text size="xs" c="dimmed">{t('seasonalPricing.sourcePrice')}</Text>
                          <Text size="lg" fw={600}>
                            {selectedPeriod.source_price_per_night.toLocaleString()} ฿
                          </Text>
                        </Stack>
                      </Grid.Col>
                    )}

                    <Grid.Col span={6}>
                      <Stack gap={4}>
                        <Text size="xs" c="dimmed">{t('seasonalPricing.minimumNights')}</Text>
                        <Text size="lg" fw={600}>
                          {selectedPeriod.minimum_nights || '—'}
                        </Text>
                      </Stack>
                    </Grid.Col>
                  </Grid>
                </Stack>
              </Paper>

              <Button
                fullWidth
                variant="light"
                onClick={() => setDetailsModalOpened(false)}
              >
                {t('common.close')}
              </Button>
            </Stack>
          );
        })()}
      </Modal>

      <style>
        {`
          .custom-datepicker-wrapper {
            width: 100%;
          }
          
          .custom-datepicker-input {
            width: 100%;
            padding: 8px 12px;
            font-size: 16px;
            border: 1px solid var(--mantine-color-dark-4);
            border-radius: 4px;
            background: var(--mantine-color-dark-7);
            color: var(--mantine-color-gray-0);
          }
          
          .custom-datepicker-input:focus {
            outline: none;
            border-color: var(--mantine-color-blue-5);
          }
          
          .custom-datepicker-input::placeholder {
            color: var(--mantine-color-dimmed);
          }

          .react-datepicker-popper {
            z-index: 9999 !important;
          }
        `}
      </style>
    </Card>
  );
};

export default SeasonalPricing;