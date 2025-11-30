// frontend/src/modules/Properties/components/PricingModal.tsx
import { useState, useEffect } from 'react';
import {
  Modal,
  Stack,
  Group,
  Text,
  ThemeIcon,
  Paper,
  Badge,
  Center,
  Loader,
  Card,
  Timeline
} from '@mantine/core';
import {
  IconCurrencyBaht,
  IconCalendar,
  IconHome,
  IconInfoCircle,
  IconSnowflake,
  IconSun,
  IconFlame,
  IconSparkles,
  IconGift,
  IconBeach,
  IconCalendarEvent,
  IconClock
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useMediaQuery } from '@mantine/hooks';
import { propertiesApi } from '@/api/properties.api';

interface PricingModalProps {
  propertyId: number;
  visible: boolean;
  onClose: () => void;
}

interface SeasonalPrice {
  season_type: string | null;
  start_date_recurring: string;
  end_date_recurring: string;
  price_per_night: number;
  source_price_per_night: number | null;
  minimum_nights: number | null;
  pricing_type?: 'per_night' | 'per_period';
}

const PricingModal = ({ propertyId, visible, onClose }: PricingModalProps) => {
  const { t, i18n } = useTranslation();
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  const seasonTypes = [
    { 
      value: 'low', 
      label: t('properties.pricing.seasonTypes.low'),
      color: 'teal',
      icon: IconBeach
    },
    { 
      value: 'mid', 
      label: t('properties.pricing.seasonTypes.mid'),
      color: 'blue',
      icon: IconSun
    },
    { 
      value: 'high', 
      label: t('properties.pricing.seasonTypes.high'),
      color: 'orange',
      icon: IconFlame
    },
    { 
      value: 'peak', 
      label: t('properties.pricing.seasonTypes.peak'),
      color: 'red',
      icon: IconSparkles
    },
    { 
      value: 'prime', 
      label: t('seasonalPricing.seasonTypes.prime'),
      color: 'violet',
      icon: IconSnowflake
    },
    { 
      value: 'holiday', 
      label: t('seasonalPricing.seasonTypes.holiday'),
      color: 'pink',
      icon: IconGift
    },
    { 
      value: null, 
      label: t('properties.pricing.seasonTypes.custom'),
      color: 'gray',
      icon: IconCalendar
    }
  ];

  const getSeasonConfig = (type: string | null) => {
    return seasonTypes.find(s => s.value === type) || seasonTypes[seasonTypes.length - 1];
  };

  useEffect(() => {
    if (visible) {
      loadPricing();
    }
  }, [visible, propertyId]);

  const loadPricing = async () => {
    setLoading(true);
    try {
      const { data: response } = await propertiesApi.getPricingDetails(propertyId);
      setData(response.data);
    } catch (error) {
      console.error('Error loading pricing:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const [day, month] = dateStr.split('-');
    const monthNum = parseInt(month, 10);
    const dayNum = parseInt(day, 10);
  
    const months = i18n.language === 'ru' 
      ? ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек']
      : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
    return `${dayNum} ${months[monthNum - 1]}`;
  };

  const sortByDate = (a: SeasonalPrice, b: SeasonalPrice) => {
    const [aDay, aMonth] = a.start_date_recurring.split('-').map(Number);
    const [bDay, bMonth] = b.start_date_recurring.split('-').map(Number);
  
    if (aMonth !== bMonth) {
      return aMonth - bMonth;
    }
    return aDay - bDay;
  };

  const sortedPricing = data?.seasonal_pricing 
    ? [...data.seasonal_pricing].sort(sortByDate)
    : [];

  const hasRentPricing = (data?.deal_type === 'rent' || data?.deal_type === 'both');
  const hasSalePricing = (data?.deal_type === 'sale' || data?.deal_type === 'both') && data?.sale_price;
  const hasYearPrice = data?.year_price && data?.year_price > 0;
  const hasSeasonalPricing = sortedPricing.length > 0;

  return (
    <Modal
      opened={visible}
      onClose={onClose}
      title={
        <Group gap="sm">
          <ThemeIcon size="lg" radius="md" variant="gradient" gradient={{ from: 'teal', to: 'cyan' }}>
            <IconCurrencyBaht size={20} />
          </ThemeIcon>
          <Text fw={600} size="lg">{t('properties.pricing.title')}</Text>
        </Group>
      }
      size={isMobile ? 'full' : 'xl'}
      centered
    >
      {loading ? (
        <Center p={80}>
          <Stack align="center" gap="md">
            <Loader size="lg" />
            <Text c="dimmed">{t('common.loading')}</Text>
          </Stack>
        </Center>
      ) : data ? (
        <Stack gap="lg">
          {/* Цена продажи */}
          {hasSalePricing && (
            <Card
              shadow="md"
              padding="lg"
              radius="lg"
              withBorder
              style={{
                background: 'linear-gradient(135deg, rgba(34, 195, 94, 0.05) 0%, rgba(16, 185, 129, 0.05) 100%)',
                borderColor: 'var(--mantine-color-green-5)'
              }}
            >
              <Stack gap="md">
                <Group gap="md">
                  <ThemeIcon
                    size="xl"
                    radius="md"
                    variant="gradient"
                    gradient={{ from: 'green', to: 'teal' }}
                  >
                    <IconHome size={28} />
                  </ThemeIcon>
                  <div>
                    <Text fw={700} size="lg">{t('properties.dealTypes.sale')}</Text>
                    <Text size="xs" c="dimmed">{t('pricingModal.salePrice')}</Text>
                  </div>
                </Group>

                <Paper p="md" radius="md" withBorder style={{ background: 'var(--mantine-color-dark-6)' }}>
                  <Group justify="center">
                    <ThemeIcon size="md" radius="md" variant="light" color="green">
                      <IconCurrencyBaht size={18} />
                    </ThemeIcon>
                    <Text size="32px" fw={700} c="green" style={{ lineHeight: 1 }}>
                      {Math.floor(data.sale_price).toLocaleString()}
                    </Text>
                    <Text size="xl" c="dimmed">฿</Text>
                  </Group>
                </Paper>
              </Stack>
            </Card>
          )}

          {/* Цены аренды */}
          {hasRentPricing && (
            <Stack gap="md">
              {/* Постоянная годовая цена */}
              {hasYearPrice && (
                <Card
                  shadow="md"
                  padding="lg"
                  radius="lg"
                  withBorder
                  style={{
                    background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(37, 99, 235, 0.05) 100%)',
                    borderColor: 'var(--mantine-color-blue-5)'
                  }}
                >
                  <Stack gap="md">
                    <Group gap="md">
                      <ThemeIcon
                        size="xl"
                        radius="md"
                        variant="gradient"
                        gradient={{ from: 'blue', to: 'cyan' }}
                      >
                        <IconCalendarEvent size={28} />
                      </ThemeIcon>
                      <div>
                        <Text fw={700} size="lg">{t('properties.pricingOptions.constantPrice')}</Text>
                        <Text size="xs" c="dimmed">{t('pricingModal.yearlyRent')}</Text>
                      </div>
                    </Group>

                    <Paper p="md" radius="md" withBorder style={{ background: 'var(--mantine-color-dark-6)' }}>
                      <Group justify="center">
                        <ThemeIcon size="md" radius="md" variant="light" color="blue">
                          <IconCurrencyBaht size={18} />
                        </ThemeIcon>
                        <Text size="32px" fw={700} c="blue" style={{ lineHeight: 1 }}>
                          {Math.floor(data.year_price).toLocaleString()}
                        </Text>
                        <Text size="xl" c="dimmed">฿</Text>
                        <Text size="sm" c="dimmed">/ {t('pricingModal.year')}</Text>
                      </Group>
                    </Paper>
                  </Stack>
                </Card>
              )}

              {/* Сезонные цены */}
              {hasSeasonalPricing && (
                <Card
                  shadow="md"
                  padding="lg"
                  radius="lg"
                  withBorder
                  style={{
                    background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)',
                    borderColor: 'var(--mantine-color-violet-5)'
                  }}
                >
                  <Stack gap="lg">
                    <Group gap="md">
                      <ThemeIcon
                        size="xl"
                        radius="md"
                        variant="gradient"
                        gradient={{ from: 'violet', to: 'grape' }}
                      >
                        <IconCalendar size={28} />
                      </ThemeIcon>
                      <div>
                        <Text fw={700} size="lg">{t('properties.pricing.seasonalPricing')}</Text>
                        <Text size="xs" c="dimmed">
                          {t('pricingModal.totalPeriods', { count: sortedPricing.length })}
                        </Text>
                      </div>
                    </Group>

                    {/* Timeline представление для мобильных */}
                    {isMobile ? (
                      <Timeline
                        active={sortedPricing.length}
                        bulletSize={32}
                        lineWidth={2}
                      >
                        {sortedPricing.map((price, index) => {
                          const seasonConfig = getSeasonConfig(price.season_type);
                          const SeasonIcon = seasonConfig.icon;

                          return (
                            <Timeline.Item
                              key={index}
                              bullet={
                                <ThemeIcon size="lg" radius="xl" variant="light" color={seasonConfig.color}>
                                  <SeasonIcon size={18} />
                                </ThemeIcon>
                              }
                              title={
                                <Group gap="xs">
                                  <Badge size="sm" variant="filled" color={seasonConfig.color}>
                                    {Math.floor(price.price_per_night).toLocaleString()} ฿
                                  </Badge>
                                  {price.minimum_nights && (
                                    <Badge size="xs" variant="light" color="gray">
                                      {price.minimum_nights} {t('pricingModal.nights')}
                                    </Badge>
                                  )}
                                </Group>
                              }
                            >
                              <Stack gap={4}>
                                <Group gap="xs">
                                  <IconCalendar size={14} color="var(--mantine-color-dimmed)" />
                                  <Text size="sm" c="dimmed">
                                    {formatDate(price.start_date_recurring)} — {formatDate(price.end_date_recurring)}
                                  </Text>
                                </Group>
                                <Text size="xs" c="dimmed">
                                  {price.pricing_type === 'per_period' 
                                    ? t('properties.pricing.forWholePeriod')
                                    : t('properties.pricing.perNight')
                                  }
                                </Text>
                              </Stack>
                            </Timeline.Item>
                          );
                        })}
                      </Timeline>
                    ) : (
                      /* Grid представление для desktop */
                      <Stack gap="xs">
                        {sortedPricing.map((price, index) => {
                          const seasonConfig = getSeasonConfig(price.season_type);
                          const SeasonIcon = seasonConfig.icon;

                          return (
                            <Paper
                              key={index}
                              p="md"
                              radius="md"
                              withBorder
                              style={{
                                background: 'var(--mantine-color-dark-7)',
                                borderColor: `var(--mantine-color-${seasonConfig.color}-5)`,
                                transition: 'all 0.2s'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.transform = 'translateY(-2px)';
                                e.currentTarget.style.boxShadow = `0 4px 12px var(--mantine-color-${seasonConfig.color}-3)`;
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '';
                              }}
                            >
                              <Group justify="space-between" wrap="wrap">
                                <Group gap="md">
                                  <ThemeIcon
                                    size="lg"
                                    radius="md"
                                    variant="light"
                                    color={seasonConfig.color}
                                  >
                                    <SeasonIcon size={20} />
                                  </ThemeIcon>

                                  <Stack gap={4}>
                                    <Group gap="xs">
                                      <IconCalendar size={16} color="var(--mantine-color-dimmed)" />
                                      <Text size="sm" fw={500}>
                                        {formatDate(price.start_date_recurring)} — {formatDate(price.end_date_recurring)}
                                      </Text>
                                    </Group>
                                    <Text size="xs" c="dimmed">
                                      {seasonConfig.label}
                                    </Text>
                                  </Stack>
                                </Group>

                                <Group gap="md">
                                  <Paper p="sm" radius="md" withBorder style={{ background: 'var(--mantine-color-dark-6)' }}>
                                    <Stack gap={4} align="center">
                                      <Text size="xs" c="dimmed">{t('pricingModal.price')}</Text>
                                      <Group gap="xs">
                                        <ThemeIcon size="sm" radius="md" variant="light" color={seasonConfig.color}>
                                          <IconCurrencyBaht size={14} />
                                        </ThemeIcon>
                                        <Text size="xl" fw={700} c={seasonConfig.color} style={{ lineHeight: 1 }}>
                                          {Math.floor(price.price_per_night).toLocaleString()}
                                        </Text>
                                      </Group>
                                      <Text size="xs" c="dimmed">
                                        {price.pricing_type === 'per_period' 
                                          ? t('properties.pricing.forWholePeriod')
                                          : t('properties.pricing.perNight')
                                        }
                                      </Text>
                                    </Stack>
                                  </Paper>

                                  {price.minimum_nights && (
                                    <Paper p="sm" radius="md" withBorder style={{ background: 'var(--mantine-color-dark-6)' }}>
                                      <Stack gap={4} align="center">
                                        <Text size="xs" c="dimmed">{t('pricingModal.minNights')}</Text>
                                        <Group gap="xs">
                                          <ThemeIcon size="sm" radius="md" variant="light" color="blue">
                                            <IconClock size={14} />
                                          </ThemeIcon>
                                          <Text size="xl" fw={700} style={{ lineHeight: 1 }}>
                                            {price.minimum_nights}
                                          </Text>
                                        </Group>
                                      </Stack>
                                    </Paper>
                                  )}
                                </Group>
                              </Group>
                            </Paper>
                          );
                        })}
                      </Stack>
                    )}
                  </Stack>
                </Card>
              )}

              {/* Нет данных о ценах аренды */}
              {!hasYearPrice && !hasSeasonalPricing && (
                <Paper p="xl" radius="md" withBorder>
                  <Center>
                    <Stack align="center" gap="md">
                      <ThemeIcon size={80} radius="md" variant="light" color="gray">
                        <IconInfoCircle size={40} />
                      </ThemeIcon>
                      <Stack gap={4} align="center">
                        <Text size="lg" fw={500} c="dimmed">
                          {t('properties.pricing.noPricing')}
                        </Text>
                        <Text size="sm" c="dimmed">
                          {t('pricingModal.noPricingDesc')}
                        </Text>
                      </Stack>
                    </Stack>
                  </Center>
                </Paper>
              )}
            </Stack>
          )}

          {/* Нет данных вообще */}
          {!hasSalePricing && !hasRentPricing && (
            <Paper p="xl" radius="md" withBorder>
              <Center>
                <Stack align="center" gap="md">
                  <ThemeIcon size={80} radius="md" variant="light" color="gray">
                    <IconInfoCircle size={40} />
                  </ThemeIcon>
                  <Stack gap={4} align="center">
                    <Text size="lg" fw={500} c="dimmed">
                      {t('common.noData')}
                    </Text>
                    <Text size="sm" c="dimmed">
                      {t('pricingModal.noDataDesc')}
                    </Text>
                  </Stack>
                </Stack>
              </Center>
            </Paper>
          )}
        </Stack>
      ) : (
        <Paper p="xl" radius="md" withBorder>
          <Center>
            <Stack align="center" gap="md">
              <ThemeIcon size={80} radius="md" variant="light" color="gray">
                <IconInfoCircle size={40} />
              </ThemeIcon>
              <Stack gap={4} align="center">
                <Text size="lg" fw={500} c="dimmed">
                  {t('common.noData')}
                </Text>
                <Text size="sm" c="dimmed">
                  {t('pricingModal.noDataDesc')}
                </Text>
              </Stack>
            </Stack>
          </Center>
        </Paper>
      )}
    </Modal>
  );
};

export default PricingModal;