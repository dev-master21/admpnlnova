// frontend/src/modules/Properties/components/PropertySearchResults.tsx
import { useState } from 'react';
import {
  Card,
  Grid,
  Badge,
  Button,
  Stack,
  Group,
  Text,
  ThemeIcon,
  Modal,
  Loader,
  Center,
  Progress,
  Alert,
  Image,
  Divider,
  Tooltip,
  Paper,
  SimpleGrid,
  Box,
  Indicator
} from '@mantine/core';
import {
  IconHome,
  IconMapPin,
  IconCalendar,
  IconCurrencyDollar,
  IconEye,
  IconClock,
  IconCheck,
  IconRobot,
  IconAlertCircle,
  IconAlertTriangle,
  IconBed,
  IconBath,
  IconRuler,
  IconPhoto,
  IconBeach,
  IconStar,
  IconX,
  IconCircleCheck
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useMediaQuery } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { propertySearchApi } from '@/api/propertySearch.api';
import dayjs from 'dayjs';
import AIResponseViewer from './AIResponseViewer';

interface PropertySearchResultsProps {
  properties: any[];
  executionTime?: number;
  onViewProperty: (id: number) => void;
  requestedFeatures?: string[];
  mustHaveFeatures?: string[];
}

const PropertySearchResults: React.FC<PropertySearchResultsProps> = ({
  properties,
  executionTime = 0,
  onViewProperty,
  requestedFeatures = [],
}) => {
  const { t } = useTranslation();
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  const [periodsModalVisible, setPeriodsModalVisible] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [availablePeriods, setAvailablePeriods] = useState<any[]>([]);
  const [loadingPeriods, setLoadingPeriods] = useState(false);
  const [aiResponseVisible, setAiResponseVisible] = useState(false);

  const translateFeature = (feature: string): string => {
    const key = `features.${feature}`;
    const translated = t(key);
    return translated === key ? feature : translated;
  };

  const handleShowAvailablePeriods = async (property: any, nights: number) => {
    setSelectedProperty(property);
    setPeriodsModalVisible(true);
    setLoadingPeriods(true);

    try {
      const { data } = await propertySearchApi.findAvailablePeriods(
        property.id,
        nights
      );

      setAvailablePeriods(data.data.periods);
    } catch (error) {
      notifications.show({
        title: t('searchResults.error'),
        message: t('searchResults.errorLoadingPeriods'),
        color: 'red',
        icon: <IconX size={16} />
      });
    } finally {
      setLoadingPeriods(false);
    }
  };

  const formatPrice = (price: number): string => {
    return Math.round(price).toLocaleString('ru-RU');
  };

  const renderPriceInfo = (property: any) => {
    // Для продажи
    if (property.deal_type === 'sale' && property.sale_price) {
      return (
        <Card shadow="sm" padding="md" radius="md" withBorder style={{ background: 'var(--mantine-color-dark-6)' }}>
          <Stack gap="xs">
            <Group gap="xs">
              <ThemeIcon size="sm" radius="md" variant="light" color="green">
                <IconCurrencyDollar size={16} />
              </ThemeIcon>
              <Text size="xs" c="dimmed">{t('searchResults.salePrice')}</Text>
            </Group>
            <Text size="xl" fw={700} c="green">
              {formatPrice(property.sale_price)} THB
            </Text>
          </Stack>
        </Card>
      );
    }

    // Для аренды с рассчитанной ценой
    if (property.calculated_price) {
      const price = property.calculated_price;
      const hasYearlyWarning = price.yearly_only_warning === true;

      // Цена по запросу
      if (price.total_price === 0 && price.breakdown?.[0]?.period === 'price_on_request') {
        return (
          <Card 
            shadow="sm" 
            padding="md" 
            radius="md" 
            withBorder 
            style={{ 
              background: 'rgba(250, 173, 20, 0.1)',
              borderColor: 'rgba(250, 173, 20, 0.3)'
            }}
          >
            <Stack gap="xs">
              <Group gap="xs">
                <ThemeIcon size="sm" radius="md" variant="light" color="yellow">
                  <IconAlertCircle size={16} />
                </ThemeIcon>
                <Text size="sm" fw={600} c="yellow">
                  {t('searchResults.priceOnRequest')}
                </Text>
              </Group>
              <Text size="xs" c="dimmed">
                {t('searchResults.priceOnRequestDescription')}
              </Text>
              {price.nights && (
                <Badge size="sm" variant="light" color="yellow">
                  {price.nights} {t('searchResults.nightsCount', { count: price.nights })}
                </Badge>
              )}
            </Stack>
          </Card>
        );
      }

      if (price.total_price > 0) {
        return (
          <Stack gap="xs">
            {hasYearlyWarning && (
              <Alert
                icon={<IconAlertTriangle size={16} />}
                color="yellow"
                variant="light"
                styles={{ message: { fontSize: '12px' } }}
              >
                {t('searchResults.yearlyOnlyWarning')}
              </Alert>
            )}

            <Card
              shadow="sm"
              padding="md"
              radius="md"
              withBorder
              style={{
                background: hasYearlyWarning 
                  ? 'rgba(250, 173, 20, 0.1)' 
                  : 'var(--mantine-color-dark-6)',
                borderColor: hasYearlyWarning 
                  ? 'rgba(250, 173, 20, 0.3)' 
                  : undefined
              }}
            >
              <Stack gap="sm">
                <Group gap="xs">
                  <ThemeIcon size="sm" radius="md" variant="light" color={hasYearlyWarning ? 'yellow' : 'blue'}>
                    <IconCurrencyDollar size={16} />
                  </ThemeIcon>
                  <Text size="xs" c="dimmed">
                    {t('searchResults.totalPrice')}
                  </Text>
                </Group>

                <Text size="xl" fw={700} c={hasYearlyWarning ? 'yellow' : 'blue'}>
                  {formatPrice(price.total_price)} THB
                </Text>

                {hasYearlyWarning && (
                  <Text size="xs" c="yellow" fs="italic">
                    {t('searchResults.yearlyPriceDisclaimer')}
                  </Text>
                )}

                <Divider />

                <Group gap="md" grow>
                  <div>
                    <Text size="xs" c="dimmed">{t('searchResults.perNight')}</Text>
                    <Text size="sm" fw={500}>
                      {formatPrice(price.daily_average)} THB
                    </Text>
                  </div>
                  <div>
                    <Text size="xs" c="dimmed">{t('searchResults.perMonth')}</Text>
                    <Text size="sm" fw={500}>
                      {formatPrice(price.monthly_equivalent)} THB
                    </Text>
                  </div>
                </Group>

                {price.nights && (
                  <Badge size="lg" variant="filled" color={hasYearlyWarning ? 'yellow' : 'blue'} fullWidth>
                    {price.nights} {t('searchResults.nightsCount', { count: price.nights })}
                  </Badge>
                )}

                <Badge size="sm" variant="light" color={hasYearlyWarning ? 'yellow' : 'violet'}>
                  {price.pricing_method === 'seasonal' ? t('searchResults.pricingMethods.seasonal') :
                   price.pricing_method === 'monthly' ? t('searchResults.pricingMethods.monthly') :
                   price.pricing_method === 'yearly' ? t('searchResults.pricingMethods.yearly') : 
                   t('searchResults.pricingMethods.combined')}
                </Badge>
              </Stack>
            </Card>
          </Stack>
        );
      }
    }

    // Для аренды без рассчитанной цены
    if (property.year_price && property.year_price > 0) {
      const monthlyPrice = Math.round(property.year_price);
      return (
        <Card shadow="sm" padding="md" radius="md" withBorder style={{ background: 'var(--mantine-color-dark-6)' }}>
          <Stack gap="xs">
            <Group gap="xs">
              <ThemeIcon size="sm" radius="md" variant="light" color="cyan">
                <IconCurrencyDollar size={16} />
              </ThemeIcon>
              <Text size="xs" c="dimmed">{t('searchResults.estimatedPriceYearly')}</Text>
            </Group>
            <Text size="xl" fw={700} c="cyan">
              {formatPrice(monthlyPrice)} THB/мес
            </Text>
          </Stack>
        </Card>
      );
    }

    // Если нет цен
    return (
      <Card
        shadow="sm"
        padding="md"
        radius="md"
        withBorder
        style={{
          background: 'rgba(255, 77, 79, 0.1)',
          borderColor: 'rgba(255, 77, 79, 0.3)'
        }}
      >
        <Stack gap="xs">
          <Group gap="xs">
            <ThemeIcon size="sm" radius="md" variant="light" color="red">
              <IconAlertCircle size={16} />
            </ThemeIcon>
            <Text size="sm" fw={600} c="red">
              {t('searchResults.noPrices')}
            </Text>
          </Group>
          <Text size="xs" c="dimmed">
            {t('searchResults.noPricesDescription')}
          </Text>
        </Stack>
      </Card>
    );
  };

  const renderPropertyCard = (property: any) => {
    const hasCalculatedPrice = property.calculated_price && property.calculated_price.nights;
    const hasMissingFeatures = property.missing_features && 
                               property.missing_features.length > 0 &&
                               requestedFeatures.length > 0;
    const matchScore = property.features_match_score || 0;
    const totalFeatures = property.features_match_total || 0;
    const showMatchScore = totalFeatures > 0;
    const matchPercent = totalFeatures > 0 ? Math.round((matchScore / totalFeatures) * 100) : 0;
    
    return (
      <Card
        shadow="md"
        padding={0}
        radius="lg"
        withBorder
        style={{
          overflow: 'hidden',
          transition: 'all 0.3s',
          cursor: 'pointer',
          height: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 12px 24px rgba(0,0,0,0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '';
        }}
      >
        {/* Image Section */}
        <Box pos="relative">
          {property.cover_photo ? (
            <Image
              src={property.cover_photo}
              height={isMobile ? 180 : 220}
              alt={property.property_name || property.property_number}
              fit="cover"
            />
          ) : (
            <Center h={isMobile ? 180 : 220} bg="dark.6">
              <ThemeIcon size={60} radius="md" variant="light" color="gray">
                <IconHome size={30} />
              </ThemeIcon>
            </Center>
          )}

          {/* Calendar Warning Badge */}
          {property.calendar_warning && (
            <Tooltip
              label={
                <Stack gap={4} align="center">
                  <Text size="sm" fw={600}>{t('searchResults.noCalendar')}</Text>
                  <Text size="xs">{t('searchResults.noCalendarDescription')}</Text>
                </Stack>
              }
              position="bottom"
              withArrow
              multiline
              w={220}
              color="red"
            >
              <Badge
                size="lg"
                variant="filled"
                color="red"
                leftSection={<IconAlertCircle size={14} />}
                style={{
                  position: 'absolute',
                  top: 12,
                  left: 12,
                  cursor: 'help'
                }}
              >
                {t('searchResults.checkAvailability')}
              </Badge>
            </Tooltip>
          )}

          {/* Photos Count Badge */}
          {property.photos_count > 1 && (
            <Badge
              size="lg"
              variant="filled"
              color="dark"
              leftSection={<IconPhoto size={14} />}
              style={{
                position: 'absolute',
                bottom: 12,
                right: 12
              }}
            >
              {property.photos_count}
            </Badge>
          )}

          {/* Match Score Indicator */}
          {showMatchScore && (
            <Indicator
              inline
              label={`${matchPercent}%`}
              size={32}
              color={matchPercent === 100 ? 'green' : matchPercent >= 75 ? 'blue' : 'orange'}
              position="top-end"
              style={{
                position: 'absolute',
                top: 12,
                right: 12
              }}
            />
          )}
        </Box>

        {/* Content Section */}
        <Stack gap="md" p="md" style={{ flex: 1 }}>
          {/* Header */}
          <div>
            <Group justify="space-between" wrap="nowrap" mb="xs">
              <Text fw={700} size="lg" lineClamp={1} style={{ flex: 1 }}>
                {property.property_name || `Property #${property.property_number}`}
              </Text>
              {property.property_number && property.property_name && (
                <Badge size="sm" variant="light" color="gray">
                  #{property.property_number}
                </Badge>
              )}
            </Group>

            <Group gap="xs">
              <Badge
                size="md"
                variant="gradient"
                gradient={
                  property.deal_type === 'sale'
                    ? { from: 'teal', to: 'green' }
                    : { from: 'blue', to: 'cyan' }
                }
              >
                {property.deal_type === 'sale' 
                  ? t('properties.dealTypes.sale') 
                  : t('properties.dealTypes.rent')}
              </Badge>
              <Badge size="md" variant="light" color="violet">
                {property.property_type}
              </Badge>
            </Group>
          </div>

          {/* Location */}
          <Group gap="xs">
            <ThemeIcon size="sm" radius="md" variant="light" color="orange">
              <IconMapPin size={14} />
            </ThemeIcon>
            <Text size="sm" c="dimmed">
              {property.region}
            </Text>
            {property.distance_to_beach && (
              <>
                <Text size="sm" c="dimmed">•</Text>
                <Group gap={4}>
                  <IconBeach size={14} color="var(--mantine-color-cyan-4)" />
                  <Text size="sm" c="cyan">
                    {Math.round(property.distance_to_beach)}м
                  </Text>
                </Group>
              </>
            )}
          </Group>

          {/* Features */}
          <SimpleGrid cols={3} spacing="xs">
            <Paper p="xs" radius="md" withBorder style={{ background: 'var(--mantine-color-dark-6)' }}>
              <Stack gap={4} align="center">
                <ThemeIcon size="sm" radius="md" variant="light" color="blue">
                  <IconBed size={14} />
                </ThemeIcon>
                <Text size="xs" c="dimmed" ta="center">
                  {Math.round(property.bedrooms)}
                </Text>
              </Stack>
            </Paper>
            <Paper p="xs" radius="md" withBorder style={{ background: 'var(--mantine-color-dark-6)' }}>
              <Stack gap={4} align="center">
                <ThemeIcon size="sm" radius="md" variant="light" color="cyan">
                  <IconBath size={14} />
                </ThemeIcon>
                <Text size="xs" c="dimmed" ta="center">
                  {Math.round(property.bathrooms)}
                </Text>
              </Stack>
            </Paper>
            {property.indoor_area && (
              <Paper p="xs" radius="md" withBorder style={{ background: 'var(--mantine-color-dark-6)' }}>
                <Stack gap={4} align="center">
                  <ThemeIcon size="sm" radius="md" variant="light" color="violet">
                    <IconRuler size={14} />
                  </ThemeIcon>
                  <Text size="xs" c="dimmed" ta="center">
                    {Math.round(property.indoor_area)}м²
                  </Text>
                </Stack>
              </Paper>
            )}
          </SimpleGrid>

          {/* Price */}
          {renderPriceInfo(property)}

          {/* Match Score Progress */}
          {showMatchScore && (
            <Stack gap="xs">
              <Group justify="space-between">
                <Group gap="xs">
                  <ThemeIcon size="sm" radius="md" variant="light" color="yellow">
                    <IconStar size={14} />
                  </ThemeIcon>
                  <Text size="xs" c="dimmed">
                    {t('searchResults.featuresMatch', { matched: matchScore, total: totalFeatures })}
                  </Text>
                </Group>
                <Text size="xs" fw={600} c={matchPercent === 100 ? 'green' : 'blue'}>
                  {matchPercent}%
                </Text>
              </Group>
              <Progress
                value={matchPercent}
                size="sm"
                radius="md"
                color={matchPercent === 100 ? 'green' : matchPercent >= 75 ? 'blue' : 'orange'}
                striped
                animated
              />
            </Stack>
          )}

          {/* Missing Features Alert */}
          {hasMissingFeatures && (
            <Alert
              icon={<IconAlertTriangle size={16} />}
              color="yellow"
              variant="light"
              styles={{ message: { fontSize: '11px' } }}
            >
              <Stack gap={4}>
                <Text size="xs" fw={600}>
                  {t('searchResults.missingFeatures')}
                </Text>
                {property.missing_features.slice(0, 3).map((feature: string) => (
                  <Text key={feature} size="xs" c="dimmed">
                    • {translateFeature(feature)}
                  </Text>
                ))}
                {property.missing_features.length > 3 && (
                  <Text size="xs" c="dimmed" fs="italic">
                    {t('searchResults.andMore', { count: property.missing_features.length - 3 })}
                  </Text>
                )}
              </Stack>
            </Alert>
          )}

          {/* Action Buttons */}
          <Stack gap="xs" style={{ marginTop: 'auto' }}>
            {hasCalculatedPrice && property.deal_type === 'rent' && (
              <Button
                variant="light"
                color="violet"
                fullWidth
                leftSection={<IconCalendar size={16} />}
                onClick={() => handleShowAvailablePeriods(property, property.calculated_price.nights)}
              >
                {t('searchResults.availablePeriods', { nights: property.calculated_price.nights })}
              </Button>
            )}

            <Button
              variant="gradient"
              gradient={{ from: 'blue', to: 'cyan' }}
              fullWidth
              leftSection={<IconEye size={16} />}
              onClick={() => onViewProperty(property.id)}
            >
              {t('searchResults.viewDetails')}
            </Button>
          </Stack>
        </Stack>
      </Card>
    );
  };

  return (
    <Stack gap="xl">
      {/* Header */}
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Group justify="space-between" wrap="nowrap">
          <Group gap="md">
            <ThemeIcon size="xl" radius="md" variant="gradient" gradient={{ from: 'teal', to: 'green' }}>
              <IconCheck size={24} />
            </ThemeIcon>
            <div>
              <Text fw={700} size="xl">
                {t('searchResults.foundProperties', { count: properties.length })}
              </Text>
              {executionTime > 0 && (
                <Group gap="xs">
                  <IconClock size={14} color="var(--mantine-color-dimmed)" />
                  <Text size="sm" c="dimmed">
                    {t('searchResults.executedIn', { time: (executionTime / 1000).toFixed(2) })}
                  </Text>
                </Group>
              )}
            </div>
          </Group>

          <Button
            variant="light"
            leftSection={<IconRobot size={18} />}
            onClick={() => setAiResponseVisible(true)}
            size={isMobile ? 'sm' : 'md'}
          >
            {!isMobile && t('searchResults.viewAIResponse')}
          </Button>
        </Group>
      </Card>

      {/* AI Response Modal */}
      <AIResponseViewer 
        visible={aiResponseVisible}
        onClose={() => setAiResponseVisible(false)}
      />

      {/* Results Grid */}
      <Grid gutter="md">
        {properties.map(property => (
          <Grid.Col key={property.id} span={{ base: 12, xs: 6, sm: 4, lg: 3 }}>
            {renderPropertyCard(property)}
          </Grid.Col>
        ))}
      </Grid>

      {/* Available Periods Modal */}
      <Modal
        opened={periodsModalVisible}
        onClose={() => {
          setPeriodsModalVisible(false);
          setSelectedProperty(null);
          setAvailablePeriods([]);
        }}
        size={isMobile ? 'full' : 'lg'}
        title={
          <Group gap="sm">
            <ThemeIcon size="lg" radius="md" variant="gradient" gradient={{ from: 'violet', to: 'grape' }}>
              <IconCalendar size={20} />
            </ThemeIcon>
            <div>
              <Text fw={600} size="lg">{t('searchResults.availablePeriodsTitle')}</Text>
              {selectedProperty && (
                <Text size="xs" c="dimmed">
                  {selectedProperty.property_name || `#${selectedProperty.property_number}`}
                </Text>
              )}
            </div>
          </Group>
        }
        centered
      >
        {loadingPeriods ? (
          <Center p={80}>
            <Stack align="center" gap="md">
              <Loader size="lg" />
              <Text c="dimmed">{t('searchResults.searchingPeriods')}</Text>
            </Stack>
          </Center>
        ) : availablePeriods.length === 0 ? (
          <Center p={80}>
            <Stack align="center" gap="md">
              <ThemeIcon size={80} radius="md" variant="light" color="gray">
                <IconCalendar size={40} />
              </ThemeIcon>
              <Text c="dimmed">{t('searchResults.noPeriodsAvailable')}</Text>
            </Stack>
          </Center>
        ) : (
          <Stack gap="md">
            <Alert icon={<IconCircleCheck size={16} />} color="green" variant="light">
              {t('searchResults.foundPeriods', { count: availablePeriods.length })}
            </Alert>

            <Stack gap="xs">
              {availablePeriods.slice(0, 20).map((period, index) => (
                <Card key={index} shadow="sm" padding="md" radius="md" withBorder>
                  <Group justify="space-between" wrap="nowrap">
                    <Stack gap="xs" style={{ flex: 1 }}>
                      <Group gap="xs">
                        <ThemeIcon size="sm" radius="md" variant="light" color="blue">
                          <IconCalendar size={14} />
                        </ThemeIcon>
                        <Text size="sm" fw={500}>
                          {dayjs(period.check_in).format('DD.MM.YYYY')} - {dayjs(period.check_out).format('DD.MM.YYYY')}
                        </Text>
                        <Badge size="sm" variant="filled" color="blue">
                          {period.nights} {t('searchResults.nightsCount', { count: period.nights })}
                        </Badge>
                      </Group>
                      
                      <Group gap="md">
                        <div>
                          <Text size="xs" c="dimmed">{t('searchResults.total')}</Text>
                          <Text size="sm" fw={600}>
                            {formatPrice(period.total_price)} THB
                          </Text>
                        </div>
                        <div>
                          <Text size="xs" c="dimmed">{t('searchResults.perNight')}</Text>
                          <Text size="sm">
                            {formatPrice(period.daily_average)} THB
                          </Text>
                        </div>
                      </Group>
                    </Stack>

                    <Button
                      variant="gradient"
                      gradient={{ from: 'teal', to: 'green' }}
                      leftSection={<IconCheck size={16} />}
                      onClick={() => {
                        notifications.show({
                          title: t('searchResults.success'),
                          message: t('searchResults.periodSelected', {
                            checkIn: dayjs(period.check_in).format('DD.MM.YYYY'),
                            checkOut: dayjs(period.check_out).format('DD.MM.YYYY')
                          }),
                          color: 'green',
                          icon: <IconCheck size={16} />
                        });
                        setPeriodsModalVisible(false);
                      }}
                    >
                      {t('searchResults.select')}
                    </Button>
                  </Group>
                </Card>
              ))}
            </Stack>

            {availablePeriods.length > 20 && (
              <Alert icon={<IconAlertCircle size={16} />} color="blue" variant="light">
                <Text size="sm">
                  {t('searchResults.showingFirst20', { total: availablePeriods.length })}
                </Text>
              </Alert>
            )}
          </Stack>
        )}
      </Modal>
    </Stack>
  );
};

export default PropertySearchResults;