// frontend/src/modules/Properties/components/AdvancedSearch.tsx
import { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Stack,
  Group,
  Text,
  TextInput,
  Select,
  NumberInput,
  Checkbox,
  Accordion,
  SegmentedControl,
  Badge,
  MultiSelect,
  Grid,
  ThemeIcon,
  Tooltip,
  ActionIcon,
  Alert,
  Box
} from '@mantine/core';
import DatePicker from 'react-datepicker'; // ✅ React DatePicker
import 'react-datepicker/dist/react-datepicker.css'; // ✅ Стили
import {
  IconSearch,
  IconRefresh,
  IconMapPin,
  IconFilter,
  IconTrash,
  IconBed,
  IconBath,
  IconCurrencyBaht,
  IconCalendar,
  IconSparkles,
  IconRuler,
  IconStairs,
  IconHammer,
  IconShield,
  IconChevronDown,
  IconChevronUp,
  IconInfoCircle,
  IconX
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useMediaQuery } from '@mantine/hooks';
import { PROPERTY_FEATURES } from '../constants/features';
import dayjs from 'dayjs';

interface AdvancedSearchProps {
  onSearch: (filters: any) => void;
  onReset: () => void;
  onMapSearch: () => void;
  loading?: boolean;
  initialFilters?: any;
  mapSearchActive?: boolean;
}

const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  onSearch,
  onReset,
  onMapSearch,
  loading = false,
  initialFilters = {},
}) => {
  const { t } = useTranslation();
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Feature expansion states
  const [showAllProperty, setShowAllProperty] = useState(false);
  const [showAllOutdoor, setShowAllOutdoor] = useState(false);
  const [showAllViews, setShowAllViews] = useState(false);
  const [showAllLocation, setShowAllLocation] = useState(false);
  const [showAllRental, setShowAllRental] = useState(false);

  const FEATURES_PER_PAGE = 10;

  // Date states for react-datepicker
  const [fixedDateRange, setFixedDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [flexibleDateRange, setFlexibleDateRange] = useState<[Date | null, Date | null]>([null, null]);

  const [filters, setFilters] = useState<any>({
    deal_type: initialFilters.deal_type,
    property_type: initialFilters.property_type,
    bedrooms: initialFilters.bedrooms,
    bedrooms_min: initialFilters.bedrooms_min,
    bedrooms_max: initialFilters.bedrooms_max,
    bathrooms: initialFilters.bathrooms,
    bathrooms_min: initialFilters.bathrooms_min,
    bathrooms_max: initialFilters.bathrooms_max,
    budget: initialFilters.budget || {
      currency: 'THB',
      search_below_max: true
    },
    dates: initialFilters.dates,
    flexible_dates: initialFilters.flexible_dates,
    regions: initialFilters.regions || [],
    features: initialFilters.features || [],
    must_have_features: initialFilters.must_have_features || [],
    building_ownership: initialFilters.building_ownership,
    land_ownership: initialFilters.land_ownership,
    ownership_type: initialFilters.ownership_type,
    indoor_area_min: initialFilters.indoor_area_min,
    indoor_area_max: initialFilters.indoor_area_max,
    outdoor_area_min: initialFilters.outdoor_area_min,
    outdoor_area_max: initialFilters.outdoor_area_max,
    plot_size_min: initialFilters.plot_size_min,
    plot_size_max: initialFilters.plot_size_max,
    complex_name: initialFilters.complex_name,
    furniture: initialFilters.furniture,
    parking: initialFilters.parking,
    pets: initialFilters.pets,
    distance_to_beach: initialFilters.distance_to_beach,
    floor: initialFilters.floor,
    floors: initialFilters.floors,
    construction_year_min: initialFilters.construction_year_min,
    construction_year_max: initialFilters.construction_year_max,
    map_search: initialFilters.map_search
  });

  const [bedroomsMode, setBedroomsMode] = useState<'exact' | 'range'>(
    initialFilters.bedrooms !== undefined ? 'exact' : 'range'
  );
  const [bathroomsMode, setBathroomsMode] = useState<'exact' | 'range'>(
    initialFilters.bathrooms !== undefined ? 'exact' : 'range'
  );
  const [dateMode, setDateMode] = useState<'fixed' | 'flexible'>('fixed');
  const [featureSearch, setFeatureSearch] = useState('');

  // Initialize date ranges from initialFilters
  useEffect(() => {
    if (initialFilters.dates?.check_in && initialFilters.dates?.check_out) {
      setFixedDateRange([
        new Date(initialFilters.dates.check_in),
        new Date(initialFilters.dates.check_out)
      ]);
    }
    if (initialFilters.flexible_dates?.search_window_start && initialFilters.flexible_dates?.search_window_end) {
      setFlexibleDateRange([
        new Date(initialFilters.flexible_dates.search_window_start),
        new Date(initialFilters.flexible_dates.search_window_end)
      ]);
    }
  }, [initialFilters]);

  useEffect(() => {
    if (initialFilters.map_search) {
      setFilters((prev: any) => ({
        ...prev,
        map_search: initialFilters.map_search
      }));
    }
  }, [initialFilters.map_search]);

  const updateFilter = (key: string, value: any) => {
    setFilters((prev: any) => ({
      ...prev,
      [key]: value
    }));
  };

  const updateNestedFilter = (parent: string, key: string, value: any) => {
    setFilters((prev: any) => ({
      ...prev,
      [parent]: {
        ...(prev[parent] || {}),
        [key]: value
      }
    }));
  };

  const handleReset = () => {
    setFilters({
      budget: {
        currency: 'THB',
        search_below_max: true
      },
      regions: [],
      features: [],
      must_have_features: []
    });
    setBedroomsMode('exact');
    setBathroomsMode('exact');
    setDateMode('fixed');
    setFeatureSearch('');
    setFixedDateRange([null, null]);
    setFlexibleDateRange([null, null]);
    onReset();
  };

  const handleSearch = () => {
    console.log('🔍 Filters before cleaning:', filters);
    
    const cleanFilters = Object.entries(filters).reduce((acc: any, [key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (typeof value === 'object' && !Array.isArray(value)) {
          const cleanNested = Object.entries(value).reduce((nestedAcc: any, [nestedKey, nestedValue]) => {
            if (nestedValue !== undefined && nestedValue !== null && nestedValue !== '') {
              nestedAcc[nestedKey] = nestedValue;
            }
            return nestedAcc;
          }, {});
          if (Object.keys(cleanNested).length > 0) {
            acc[key] = cleanNested;
          }
        } else if (Array.isArray(value)) {
          if (value.length > 0) {
            acc[key] = value;
          }
        } else {
          acc[key] = value;
        }
      }
      return acc;
    }, {});

    if (cleanFilters.dates && Object.keys(cleanFilters.dates).length === 0) {
      delete cleanFilters.dates;
    }
    
    if (cleanFilters.flexible_dates && Object.keys(cleanFilters.flexible_dates).length === 0) {
      delete cleanFilters.flexible_dates;
    }

    if (cleanFilters.dates) {
      if (!cleanFilters.dates.check_in || !cleanFilters.dates.check_out) {
        delete cleanFilters.dates;
      }
    }

    if (cleanFilters.flexible_dates) {
      if (!cleanFilters.flexible_dates.duration || 
          !cleanFilters.flexible_dates.search_window_start || 
          !cleanFilters.flexible_dates.search_window_end) {
        delete cleanFilters.flexible_dates;
      }
    }

    console.log('🔍 Sending search filters:', cleanFilters);
    console.log('📍 Map search data:', cleanFilters.map_search);
    
    onSearch(cleanFilters);
  };

  const filterFeaturesBySearch = (features: string[]) => {
    if (!featureSearch.trim()) return features;
    
    const searchLower = featureSearch.toLowerCase();
    return features.filter(feature => {
      const translation = t(`properties.features.${feature}`, { defaultValue: feature });
      return translation.toLowerCase().includes(searchLower) ||
             feature.toLowerCase().includes(searchLower);
    });
  };

  const toggleFeature = (feature: string, isMustHave: boolean = false) => {
    const arrayKey = isMustHave ? 'must_have_features' : 'features';
    const currentFeatures = filters[arrayKey] || [];
    
    if (currentFeatures.includes(feature)) {
      updateFilter(arrayKey, currentFeatures.filter((f: string) => f !== feature));
    } else {
      updateFilter(arrayKey, [...currentFeatures, feature]);
      
      if (isMustHave && filters.features?.includes(feature)) {
        updateFilter('features', filters.features.filter((f: string) => f !== feature));
      }
      if (!isMustHave && filters.must_have_features?.includes(feature)) {
        updateFilter('must_have_features', filters.must_have_features.filter((f: string) => f !== feature));
      }
    }
  };

  const renderFeatureCategory = (
    categoryKey: string,
    features: string[],
    showAll: boolean,
    setShowAll: (value: boolean) => void
  ) => {
    const filteredFeatures = filterFeaturesBySearch(features);
    const displayedFeatures = showAll ? filteredFeatures : filteredFeatures.slice(0, FEATURES_PER_PAGE);
    const hasMore = filteredFeatures.length > FEATURES_PER_PAGE;

    const selectedCount = features.filter(f => 
      filters.features?.includes(f) || filters.must_have_features?.includes(f)
    ).length;

    return (
      <Card shadow="sm" padding="md" radius="md" withBorder>
        <Stack gap="md">
          <Group justify="space-between">
            <Text fw={600} size="sm">{t(`propertySearch.advancedSearch.${categoryKey}`)}</Text>
            {selectedCount > 0 && (
              <Badge size="sm" variant="filled" color="violet">
                {selectedCount}
              </Badge>
            )}
          </Group>

          <Group gap="xs">
            {displayedFeatures.map(feature => {
              const isMustHave = filters.must_have_features?.includes(feature);
              const isDesired = filters.features?.includes(feature);
              
              return (
                <Badge
                  key={feature}
                  size="lg"
                  variant={isMustHave ? 'filled' : isDesired ? 'light' : 'outline'}
                  color={isMustHave ? 'red' : isDesired ? 'blue' : 'gray'}
                  style={{
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    userSelect: 'none'
                  }}
                  onClick={() => {
                    if (isMustHave) {
                      toggleFeature(feature, true);
                    } else if (isDesired) {
                      toggleFeature(feature, false);
                      toggleFeature(feature, true);
                    } else {
                      toggleFeature(feature, false);
                    }
                  }}
                >
                  {t(`properties.features.${feature}`, { defaultValue: feature })}
                </Badge>
              );
            })}
          </Group>

          {hasMore && (
            <Button
              variant="subtle"
              size="xs"
              onClick={() => setShowAll(!showAll)}
              rightSection={showAll ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />}
            >
              {showAll 
                ? t('propertySearch.advancedSearch.showLess')
                : t('propertySearch.advancedSearch.showMore', { count: filteredFeatures.length - FEATURES_PER_PAGE })
              }
            </Button>
          )}
        </Stack>
      </Card>
    );
  };

  return (
    <Stack gap="lg">
      <Accordion 
        multiple 
        defaultValue={['main', 'budget', 'dates']}
        variant="separated"
        radius="md"
      >
        {/* Main Parameters */}
        <Accordion.Item value="main">
          <Accordion.Control
            icon={
              <ThemeIcon size="lg" radius="md" variant="light" color="blue">
                <IconFilter size={20} />
              </ThemeIcon>
            }
          >
            <Text fw={600}>{t('propertySearch.advancedSearch.mainParameters')}</Text>
          </Accordion.Control>
          <Accordion.Panel>
            <Stack gap="md">
              <Grid gutter="md">
                <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                  <Select
                    label={t('propertySearch.advancedSearch.dealType')}
                    placeholder={t('propertySearch.advancedSearch.selectType')}
                    value={filters.deal_type}
                    onChange={(value) => updateFilter('deal_type', value)}
                    clearable
                    data={[
                      { value: 'sale', label: t('properties.dealTypes.sale') },
                      { value: 'rent', label: t('properties.dealTypes.rent') },
                      { value: 'both', label: t('propertySearch.advancedSearch.any') }
                    ]}
                    styles={{ input: { fontSize: '16px' } }}
                  />
                </Grid.Col>

                <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                  <Select
                    label={t('properties.propertyType')}
                    placeholder={t('propertySearch.advancedSearch.selectType')}
                    value={filters.property_type}
                    onChange={(value) => updateFilter('property_type', value)}
                    clearable
                    data={[
                      { value: 'villa', label: t('properties.propertyTypes.villa') },
                      { value: 'condo', label: t('properties.propertyTypes.condo') },
                      { value: 'apartment', label: t('properties.propertyTypes.apartment') },
                      { value: 'house', label: t('properties.propertyTypes.house') },
                      { value: 'penthouse', label: t('properties.propertyTypes.penthouse') }
                    ]}
                    styles={{ input: { fontSize: '16px' } }}
                  />
                </Grid.Col>

                <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                  <TextInput
                    label={t('properties.complexName')}
                    placeholder={t('propertySearch.advancedSearch.complexPlaceholder')}
                    value={filters.complex_name}
                    onChange={(e) => updateFilter('complex_name', e.target.value)}
                    styles={{ input: { fontSize: '16px' } }}
                  />
                </Grid.Col>

                <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
                  <Select
                    label={t('propertySearch.advancedSearch.furniture')}
                    placeholder={t('propertySearch.advancedSearch.any')}
                    value={filters.furniture}
                    onChange={(value) => updateFilter('furniture', value)}
                    clearable
                    data={[
                      { value: 'fullyFurnished', label: t('propertySearch.advancedSearch.fullyFurnished') },
                      { value: 'partiallyFurnished', label: t('propertySearch.advancedSearch.partiallyFurnished') },
                      { value: 'unfurnished', label: t('propertySearch.advancedSearch.unfurnished') }
                    ]}
                    styles={{ input: { fontSize: '16px' } }}
                  />
                </Grid.Col>
              </Grid>

              <MultiSelect
                label={t('propertySearch.advancedSearch.regionsMultiple')}
                placeholder={t('propertySearch.advancedSearch.selectRegions')}
                value={filters.regions}
                onChange={(value) => updateFilter('regions', value)}
                clearable
                searchable
                data={[
                  { value: 'bangtao', label: t('properties.regions.bangtao') },
                  { value: 'kamala', label: t('properties.regions.kamala') },
                  { value: 'surin', label: t('properties.regions.surin') },
                  { value: 'layan', label: t('properties.regions.layan') },
                  { value: 'kata', label: t('properties.regions.kata') },
                  { value: 'karon', label: t('properties.regions.karon') },
                  { value: 'patong', label: t('properties.regions.patong') },
                  { value: 'rawai', label: t('properties.regions.rawai') },
                  { value: 'naiharn', label: t('properties.regions.naiharn') },
                  { value: 'maikhao', label: t('properties.regions.maikhao') },
                  { value: 'yamu', label: t('properties.regions.yamu') }
                ]}
                styles={{ input: { fontSize: '16px' } }}
              />

              <Grid gutter="md">
                <Grid.Col span={{ base: 6, sm: 4 }}>
                  <Checkbox
                    label={t('propertySearch.advancedSearch.withParking')}
                    checked={filters.parking}
                    onChange={(e) => updateFilter('parking', e.currentTarget.checked ? true : undefined)}
                  />
                </Grid.Col>

                <Grid.Col span={{ base: 6, sm: 4 }}>
                  <Checkbox
                    label={t('propertySearch.advancedSearch.withPets')}
                    checked={filters.pets}
                    onChange={(e) => updateFilter('pets', e.currentTarget.checked ? true : undefined)}
                  />
                </Grid.Col>

                <Grid.Col span={{ base: 12, sm: 4 }}>
                  <Button
                    variant={filters.map_search ? 'filled' : 'light'}
                    color={filters.map_search ? 'blue' : 'gray'}
                    leftSection={<IconMapPin size={18} />}
                    onClick={onMapSearch}
                    fullWidth
                    rightSection={
                      filters.map_search && (
                        <ActionIcon
                          size="xs"
                          variant="transparent"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateFilter('map_search', undefined);
                          }}
                        >
                          <IconX size={14} />
                        </ActionIcon>
                      )
                    }
                  >
                    {filters.map_search
                      ? t('propertySearch.advancedSearch.radiusKm', { radius: filters.map_search.radius_km })
                      : t('propertySearch.advancedSearch.searchOnMap')}
                  </Button>
                </Grid.Col>
              </Grid>
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>

        {/* Bedrooms & Bathrooms */}
        <Accordion.Item value="rooms">
          <Accordion.Control
            icon={
              <ThemeIcon size="lg" radius="md" variant="light" color="teal">
                <IconBed size={20} />
              </ThemeIcon>
            }
          >
            <Text fw={600}>{t('propertySearch.advancedSearch.bedroomsAndBathrooms')}</Text>
          </Accordion.Control>
          <Accordion.Panel>
            <Stack gap="lg">
              {/* Bedrooms */}
              <Card shadow="sm" padding="md" radius="md" withBorder>
                <Stack gap="md">
                  <Group justify="space-between">
                    <Text fw={500} size="sm">{t('propertySearch.advancedSearch.bedrooms')}</Text>
                    <SegmentedControl
                      value={bedroomsMode}
                      onChange={(value: string) => {
                        setBedroomsMode(value as 'exact' | 'range');
                        if (value === 'exact') {
                          updateFilter('bedrooms_min', undefined);
                          updateFilter('bedrooms_max', undefined);
                        } else {
                          updateFilter('bedrooms', undefined);
                        }
                      }}
                      data={[
                        { value: 'exact', label: t('propertySearch.advancedSearch.exactNumber') },
                        { value: 'range', label: t('propertySearch.advancedSearch.range') }
                      ]}
                      size="xs"
                    />
                  </Group>

                  {bedroomsMode === 'exact' ? (
                    <NumberInput
                      placeholder={t('propertySearch.advancedSearch.bedroomsCount')}
                      min={0}
                      max={20}
                      value={filters.bedrooms}
                      onChange={(value) => updateFilter('bedrooms', value)}
                      leftSection={<IconBed size={16} />}
                      styles={{ input: { fontSize: '16px' } }}
                    />
                  ) : (
                    <Grid gutter="xs">
                      <Grid.Col span={6}>
                        <NumberInput
                          placeholder={t('propertySearch.advancedSearch.from')}
                          min={0}
                          max={20}
                          value={filters.bedrooms_min}
                          onChange={(value) => updateFilter('bedrooms_min', value)}
                          styles={{ input: { fontSize: '16px' } }}
                        />
                      </Grid.Col>
                      <Grid.Col span={6}>
                        <NumberInput
                          placeholder={t('propertySearch.advancedSearch.to')}
                          min={0}
                          max={20}
                          value={filters.bedrooms_max}
                          onChange={(value) => updateFilter('bedrooms_max', value)}
                          styles={{ input: { fontSize: '16px' } }}
                        />
                      </Grid.Col>
                    </Grid>
                  )}
                </Stack>
              </Card>

              {/* Bathrooms */}
              <Card shadow="sm" padding="md" radius="md" withBorder>
                <Stack gap="md">
                  <Group justify="space-between">
                    <Text fw={500} size="sm">{t('propertySearch.advancedSearch.bathrooms')}</Text>
                    <SegmentedControl
                      value={bathroomsMode}
                      onChange={(value: string) => {
                        setBathroomsMode(value as 'exact' | 'range');
                        if (value === 'exact') {
                          updateFilter('bathrooms_min', undefined);
                          updateFilter('bathrooms_max', undefined);
                        } else {
                          updateFilter('bathrooms', undefined);
                        }
                      }}
                      data={[
                        { value: 'exact', label: t('propertySearch.advancedSearch.exactNumber') },
                        { value: 'range', label: t('propertySearch.advancedSearch.range') }
                      ]}
                      size="xs"
                    />
                  </Group>

                  {bathroomsMode === 'exact' ? (
                    <NumberInput
                      placeholder={t('propertySearch.advancedSearch.bathroomsCount')}
                      min={0}
                      max={20}
                      value={filters.bathrooms}
                      onChange={(value) => updateFilter('bathrooms', value)}
                      leftSection={<IconBath size={16} />}
                      styles={{ input: { fontSize: '16px' } }}
                    />
                  ) : (
                    <Grid gutter="xs">
                      <Grid.Col span={6}>
                        <NumberInput
                          placeholder={t('propertySearch.advancedSearch.from')}
                          min={0}
                          max={20}
                          value={filters.bathrooms_min}
                          onChange={(value) => updateFilter('bathrooms_min', value)}
                          styles={{ input: { fontSize: '16px' } }}
                        />
                      </Grid.Col>
                      <Grid.Col span={6}>
                        <NumberInput
                          placeholder={t('propertySearch.advancedSearch.to')}
                          min={0}
                          max={20}
                          value={filters.bathrooms_max}
                          onChange={(value) => updateFilter('bathrooms_max', value)}
                          styles={{ input: { fontSize: '16px' } }}
                        />
                      </Grid.Col>
                    </Grid>
                  )}
                </Stack>
              </Card>
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>

        {/* Budget */}
        <Accordion.Item value="budget">
          <Accordion.Control
            icon={
              <ThemeIcon size="lg" radius="md" variant="light" color="green">
                <IconCurrencyBaht size={20} />
              </ThemeIcon>
            }
          >
            <Group justify="space-between" style={{ flex: 1, marginRight: 16 }}>
              <Text fw={600}>{t('propertySearch.advancedSearch.budget')}</Text>
              {filters.budget?.max && (
                <Badge size="sm" variant="filled" color="green">
                  {Number(filters.budget.max).toLocaleString()} {filters.budget.currency}
                </Badge>
              )}
            </Group>
          </Accordion.Control>
          <Accordion.Panel>
            <Stack gap="md">
              <Grid gutter="md">
                <Grid.Col span={{ base: 12, sm: 4 }}>
                  <Select
                    label={t('propertySearch.advancedSearch.currency')}
                    value={filters.budget?.currency || 'THB'}
                    onChange={(value) => updateNestedFilter('budget', 'currency', value)}
                    data={[
                      { value: 'THB', label: t('propertySearch.advancedSearch.currencyTHB') },
                      { value: 'USD', label: t('propertySearch.advancedSearch.currencyUSD') },
                      { value: 'RUB', label: t('propertySearch.advancedSearch.currencyRUB') },
                      { value: 'EUR', label: t('propertySearch.advancedSearch.currencyEUR') }
                    ]}
                    styles={{ input: { fontSize: '16px' } }}
                  />
                </Grid.Col>

                <Grid.Col span={{ base: 12, sm: 4 }}>
                  <NumberInput
                    label={t('propertySearch.advancedSearch.minBudget')}
                    placeholder={t('propertySearch.advancedSearch.minimum')}
                    min={0}
                    value={filters.budget?.min}
                    onChange={(value) => updateNestedFilter('budget', 'min', value)}
                    thousandSeparator=","
                    styles={{ input: { fontSize: '16px' } }}
                  />
                </Grid.Col>

                <Grid.Col span={{ base: 12, sm: 4 }}>
                  <NumberInput
                    label={t('propertySearch.advancedSearch.maxBudget')}
                    placeholder={t('propertySearch.advancedSearch.maximum')}
                    min={0}
                    value={filters.budget?.max}
                    onChange={(value) => updateNestedFilter('budget', 'max', value)}
                    thousandSeparator=","
                    styles={{ input: { fontSize: '16px' } }}
                  />
                </Grid.Col>
              </Grid>

              <Grid gutter="md">
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <NumberInput
                    label={t('propertySearch.advancedSearch.tolerance')}
                    placeholder="0"
                    min={0}
                    max={100}
                    value={filters.budget?.tolerance}
                    onChange={(value) => updateNestedFilter('budget', 'tolerance', value)}
                    suffix="%"
                    styles={{ input: { fontSize: '16px' } }}
                  />
                </Grid.Col>

                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <Box mt={isMobile ? 0 : 28}>
                    <Checkbox
                      label={t('propertySearch.advancedSearch.searchBelowMax')}
                      checked={filters.budget?.search_below_max !== false}
                      onChange={(e) => updateNestedFilter('budget', 'search_below_max', e.currentTarget.checked)}
                    />
                  </Box>
                </Grid.Col>
              </Grid>
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>

        {/* Dates - ✅ REACT-DATEPICKER */}
        <Accordion.Item value="dates">
          <Accordion.Control
            icon={
              <ThemeIcon size="lg" radius="md" variant="light" color="orange">
                <IconCalendar size={20} />
              </ThemeIcon>
            }
          >
            <Text fw={600}>{t('propertySearch.advancedSearch.datesAndAvailability')}</Text>
          </Accordion.Control>
          <Accordion.Panel>
            <Stack gap="md">
              <SegmentedControl
                value={dateMode}
                onChange={(value: string) => {
                  setDateMode(value as 'fixed' | 'flexible');
                  if (value === 'fixed') {
                    updateFilter('flexible_dates', undefined);
                    setFlexibleDateRange([null, null]);
                  } else {
                    updateFilter('dates', undefined);
                    setFixedDateRange([null, null]);
                  }
                }}
                data={[
                  { value: 'fixed', label: t('propertySearch.advancedSearch.specificDates') },
                  { value: 'flexible', label: t('propertySearch.advancedSearch.flexibleDates') }
                ]}
                fullWidth
              />

              {dateMode === 'fixed' ? (
                <Stack gap="md">
                  <Grid gutter="md">
                    <Grid.Col span={{ base: 12, sm: 8 }}>
                      <div>
                        <Text size="sm" fw={500} mb={4}>{t('propertySearch.advancedSearch.rentalPeriod')}</Text>
                        <DatePicker
                          selectsRange
                          startDate={fixedDateRange[0]}
                          endDate={fixedDateRange[1]}
                          onChange={(update: [Date | null, Date | null]) => {
                            setFixedDateRange(update);
                            const [start, end] = update;
                            if (start && end) {
                              updateFilter('dates', {
                                check_in: dayjs(start).format('YYYY-MM-DD'),
                                check_out: dayjs(end).format('YYYY-MM-DD'),
                                tolerance_days: filters.dates?.tolerance_days || undefined
                              });
                            } else {
                              updateFilter('dates', undefined);
                            }
                          }}
                          dateFormat="dd.MM.yyyy"
                          placeholderText={t('propertySearch.advancedSearch.selectDates')}
                          isClearable
                          className="mantine-datepicker-input"
                          wrapperClassName="mantine-datepicker-wrapper"
                        />
                      </div>
                    </Grid.Col>

                    <Grid.Col span={{ base: 12, sm: 4 }}>
                      <Tooltip label={t('propertySearch.advancedSearch.toleranceTooltip')}>
                        <NumberInput
                          label={t('propertySearch.advancedSearch.toleranceDays')}
                          placeholder="0"
                          min={0}
                          max={30}
                          value={filters.dates?.tolerance_days}
                          onChange={(value) => {
                            if (filters.dates?.check_in && filters.dates?.check_out) {
                              updateFilter('dates', {
                                ...filters.dates,
                                tolerance_days: value || undefined
                              });
                            }
                          }}
                          disabled={!filters.dates?.check_in}
                          styles={{ input: { fontSize: '16px' } }}
                        />
                      </Tooltip>
                    </Grid.Col>
                  </Grid>

                  {filters.dates?.tolerance_days && filters.dates.tolerance_days > 0 && (
                    <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
                      <Text size="sm">
                        {t('propertySearch.advancedSearch.searchWithinDays', { days: filters.dates.tolerance_days })}
                      </Text>
                    </Alert>
                  )}
                </Stack>
              ) : (
                <Stack gap="md">
                  <Grid gutter="md">
                    <Grid.Col span={{ base: 12, sm: 4 }}>
                      <Tooltip label={t('propertySearch.advancedSearch.nightsTooltip')}>
                        <NumberInput
                          label={t('propertySearch.advancedSearch.nightsCount')}
                          placeholder={t('propertySearch.advancedSearch.nightsPlaceholder')}
                          min={1}
                          max={365}
                          value={filters.flexible_dates?.duration}
                          onChange={(value) => {
                            if (value) {
                              updateFilter('flexible_dates', {
                                ...filters.flexible_dates,
                                duration: value
                              });
                            }
                          }}
                          styles={{ input: { fontSize: '16px' } }}
                        />
                      </Tooltip>
                    </Grid.Col>

                    <Grid.Col span={{ base: 12, sm: 8 }}>
                      <div>
                        <Tooltip label={t('propertySearch.advancedSearch.searchWindowTooltip')}>
                          <Text size="sm" fw={500} mb={4}>{t('propertySearch.advancedSearch.searchWindow')}</Text>
                        </Tooltip>
                        <DatePicker
                          selectsRange
                          startDate={flexibleDateRange[0]}
                          endDate={flexibleDateRange[1]}
                          onChange={(update: [Date | null, Date | null]) => {
                            setFlexibleDateRange(update);
                            const [start, end] = update;
                            if (start && end) {
                              updateFilter('flexible_dates', {
                                duration: filters.flexible_dates?.duration || undefined,
                                search_window_start: dayjs(start).format('YYYY-MM-DD'),
                                search_window_end: dayjs(end).format('YYYY-MM-DD')
                              });
                            } else {
                              if (filters.flexible_dates?.duration) {
                                updateFilter('flexible_dates', {
                                  duration: filters.flexible_dates.duration
                                });
                              } else {
                                updateFilter('flexible_dates', undefined);
                              }
                            }
                          }}
                          dateFormat="dd.MM.yyyy"
                          placeholderText={t('propertySearch.advancedSearch.selectPeriod')}
                          isClearable
                          className="mantine-datepicker-input"
                          wrapperClassName="mantine-datepicker-wrapper"
                        />
                      </div>
                    </Grid.Col>
                  </Grid>

                  {filters.flexible_dates?.duration && 
                   filters.flexible_dates?.search_window_start && 
                   filters.flexible_dates?.search_window_end && (
                    <Alert icon={<IconInfoCircle size={16} />} color="green" variant="light">
                      <Text size="sm">
                        {t('propertySearch.advancedSearch.searchingNights', { duration: filters.flexible_dates.duration })}
                      </Text>
                    </Alert>
                  )}
                </Stack>
              )}
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>
{/* Features */}
        <Accordion.Item value="features">
          <Accordion.Control
            icon={
              <ThemeIcon size="lg" radius="md" variant="light" color="violet">
                <IconSparkles size={20} />
              </ThemeIcon>
            }
          >
            <Group justify="space-between" style={{ flex: 1, marginRight: 16 }}>
              <Text fw={600}>{t('propertySearch.advancedSearch.features')}</Text>
              <Badge 
                size="sm" 
                variant="filled" 
                color="violet"
                style={{ display: (filters.features?.length || 0) + (filters.must_have_features?.length || 0) > 0 ? 'block' : 'none' }}
              >
                {(filters.features?.length || 0) + (filters.must_have_features?.length || 0)}
              </Badge>
            </Group>
          </Accordion.Control>
          <Accordion.Panel>
            <Stack gap="lg">
              {/* Search Input */}
              <TextInput
                placeholder={t('propertySearch.advancedSearch.searchFeatures')}
                value={featureSearch}
                onChange={(e) => setFeatureSearch(e.target.value)}
                leftSection={<IconSearch size={16} />}
                styles={{ input: { fontSize: '16px' } }}
              />

              {/* Legend */}
              <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
                <Group gap="xs">
                  <Text size="xs" fw={500}>{t('propertySearch.advancedSearch.mustHave')}:</Text>
                  <Badge size="sm" color="red" variant="filled">{t('propertySearch.advancedSearch.clickOnce')}</Badge>
                  <Text size="xs" c="dimmed">→</Text>
                  <Text size="xs" fw={500}>{t('propertySearch.advancedSearch.desired')}:</Text>
                  <Badge size="sm" color="blue" variant="light">{t('propertySearch.advancedSearch.clickTwice')}</Badge>
                </Group>
              </Alert>

              {/* Indoor Features */}
              {renderFeatureCategory('indoorFeatures', PROPERTY_FEATURES.property, showAllProperty, setShowAllProperty)}

              {/* Outdoor Features */}
              {renderFeatureCategory('outdoorFeatures', PROPERTY_FEATURES.outdoor, showAllOutdoor, setShowAllOutdoor)}

              {/* Views */}
              {renderFeatureCategory('views', PROPERTY_FEATURES.views, showAllViews, setShowAllViews)}

              {/* Location Features */}
              {renderFeatureCategory('locationFeatures', PROPERTY_FEATURES.location, showAllLocation, setShowAllLocation)}

              {/* Rental Services */}
              {renderFeatureCategory('rentalServices', PROPERTY_FEATURES.rental, showAllRental, setShowAllRental)}

              {/* Selected Features */}
              {((filters.features?.length || 0) + (filters.must_have_features?.length || 0)) > 0 && (
                <Card shadow="sm" padding="md" radius="md" withBorder style={{ background: 'var(--mantine-color-dark-6)' }}>
                  <Stack gap="md">
                    <Group justify="space-between">
                      <Text fw={600} size="sm">{t('propertySearch.advancedSearch.selectedFeatures')}</Text>
                      <Button
                        variant="subtle"
                        color="red"
                        size="xs"
                        leftSection={<IconTrash size={14} />}
                        onClick={() => {
                          updateFilter('features', []);
                          updateFilter('must_have_features', []);
                        }}
                      >
                        {t('propertySearch.advancedSearch.clearAll')}
                      </Button>
                    </Group>

                    <Group gap="xs">
                      {filters.must_have_features?.map((feature: string) => (
                        <Badge
                          key={feature}
                          size="lg"
                          variant="filled"
                          color="red"
                          style={{ cursor: 'pointer' }}
                          rightSection={
                            <ActionIcon
                              size="xs"
                              variant="transparent"
                              onClick={() => toggleFeature(feature, true)}
                            >
                              <IconX size={12} />
                            </ActionIcon>
                          }
                        >
                          {t(`properties.features.${feature}`, { defaultValue: feature })}
                        </Badge>
                      ))}
                      {filters.features?.map((feature: string) => (
                        <Badge
                          key={feature}
                          size="lg"
                          variant="light"
                          color="blue"
                          style={{ cursor: 'pointer' }}
                          rightSection={
                            <ActionIcon
                              size="xs"
                              variant="transparent"
                              onClick={() => toggleFeature(feature, false)}
                            >
                              <IconX size={12} />
                            </ActionIcon>
                          }
                        >
                          {t(`properties.features.${feature}`, { defaultValue: feature })}
                        </Badge>
                      ))}
                    </Group>
                  </Stack>
                </Card>
              )}
            </Stack>
          </Accordion.Panel>
        </Accordion.Item>

        {/* Areas */}
        <Accordion.Item value="areas">
          <Accordion.Control
            icon={
              <ThemeIcon size="lg" radius="md" variant="light" color="cyan">
                <IconRuler size={20} />
              </ThemeIcon>
            }
          >
            <Text fw={600}>{t('propertySearch.advancedSearch.areas')}</Text>
          </Accordion.Control>
          <Accordion.Panel>
            <Grid gutter="md">
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Text size="sm" fw={500} mb="xs">{t('propertySearch.advancedSearch.indoorArea')}</Text>
                <Grid gutter="xs">
                  <Grid.Col span={6}>
                    <NumberInput
                      placeholder={t('propertySearch.advancedSearch.from')}
                      min={0}
                      value={filters.indoor_area_min}
                      onChange={(value) => updateFilter('indoor_area_min', value)}
                      suffix=" m²"
                      styles={{ input: { fontSize: '16px' } }}
                    />
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <NumberInput
                      placeholder={t('propertySearch.advancedSearch.to')}
                      min={0}
                      value={filters.indoor_area_max}
                      onChange={(value) => updateFilter('indoor_area_max', value)}
                      suffix=" m²"
                      styles={{ input: { fontSize: '16px' } }}
                    />
                  </Grid.Col>
                </Grid>
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Text size="sm" fw={500} mb="xs">{t('propertySearch.advancedSearch.outdoorArea')}</Text>
                <Grid gutter="xs">
                  <Grid.Col span={6}>
                    <NumberInput
                      placeholder={t('propertySearch.advancedSearch.from')}
                      min={0}
                      value={filters.outdoor_area_min}
                      onChange={(value) => updateFilter('outdoor_area_min', value)}
                      suffix=" m²"
                      styles={{ input: { fontSize: '16px' } }}
                    />
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <NumberInput
                      placeholder={t('propertySearch.advancedSearch.to')}
                      min={0}
                      value={filters.outdoor_area_max}
                      onChange={(value) => updateFilter('outdoor_area_max', value)}
                      suffix=" m²"
                      styles={{ input: { fontSize: '16px' } }}
                    />
                  </Grid.Col>
                </Grid>
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Text size="sm" fw={500} mb="xs">{t('propertySearch.advancedSearch.plotSize')}</Text>
                <Grid gutter="xs">
                  <Grid.Col span={6}>
                    <NumberInput
                      placeholder={t('propertySearch.advancedSearch.from')}
                      min={0}
                      value={filters.plot_size_min}
                      onChange={(value) => updateFilter('plot_size_min', value)}
                      suffix=" m²"
                      styles={{ input: { fontSize: '16px' } }}
                    />
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <NumberInput
                      placeholder={t('propertySearch.advancedSearch.to')}
                      min={0}
                      value={filters.plot_size_max}
                      onChange={(value) => updateFilter('plot_size_max', value)}
                      suffix=" m²"
                      styles={{ input: { fontSize: '16px' } }}
                    />
                  </Grid.Col>
                </Grid>
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Select
                  label={t('propertySearch.advancedSearch.distanceToBeach')}
                  placeholder={t('propertySearch.advancedSearch.anyDistance')}
                  value={filters.distance_to_beach?.max?.toString()}
                  onChange={(value) => updateNestedFilter('distance_to_beach', 'max', value ? parseInt(value) : undefined)}
                  clearable
                  data={[
                    { value: '100', label: t('propertySearch.advancedSearch.beach100') },
                    { value: '200', label: t('propertySearch.advancedSearch.beach200') },
                    { value: '500', label: t('propertySearch.advancedSearch.beach500') },
                    { value: '1000', label: t('propertySearch.advancedSearch.beach1000') },
                    { value: '2000', label: t('propertySearch.advancedSearch.beach2000') },
                    { value: '5000', label: t('propertySearch.advancedSearch.beach5000') }
                  ]}
                  styles={{ input: { fontSize: '16px' } }}
                />
              </Grid.Col>
            </Grid>
          </Accordion.Panel>
        </Accordion.Item>

        {/* Floors */}
        <Accordion.Item value="floors">
          <Accordion.Control
            icon={
              <ThemeIcon size="lg" radius="md" variant="light" color="pink">
                <IconStairs size={20} />
              </ThemeIcon>
            }
          >
            <Text fw={600}>{t('propertySearch.advancedSearch.floors')}</Text>
          </Accordion.Control>
          <Accordion.Panel>
            <Grid gutter="md">
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Text size="sm" fw={500} mb="xs">{t('propertySearch.advancedSearch.floorNumber')}</Text>
                <Grid gutter="xs">
                  <Grid.Col span={6}>
                    <NumberInput
                      placeholder={t('propertySearch.advancedSearch.from')}
                      min={0}
                      max={100}
                      value={filters.floor?.min}
                      onChange={(value) => updateNestedFilter('floor', 'min', value)}
                      styles={{ input: { fontSize: '16px' } }}
                    />
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <NumberInput
                      placeholder={t('propertySearch.advancedSearch.to')}
                      min={0}
                      max={100}
                      value={filters.floor?.max}
                      onChange={(value) => updateNestedFilter('floor', 'max', value)}
                      styles={{ input: { fontSize: '16px' } }}
                    />
                  </Grid.Col>
                </Grid>
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Text size="sm" fw={500} mb="xs">{t('propertySearch.advancedSearch.buildingFloors')}</Text>
                <Grid gutter="xs">
                  <Grid.Col span={6}>
                    <NumberInput
                      placeholder={t('propertySearch.advancedSearch.from')}
                      min={1}
                      max={100}
                      value={filters.floors?.min}
                      onChange={(value) => updateNestedFilter('floors', 'min', value)}
                      styles={{ input: { fontSize: '16px' } }}
                    />
                  </Grid.Col>
                  <Grid.Col span={6}>
                    <NumberInput
                      placeholder={t('propertySearch.advancedSearch.to')}
                      min={1}
                      max={100}
                      value={filters.floors?.max}
                      onChange={(value) => updateNestedFilter('floors', 'max', value)}
                      styles={{ input: { fontSize: '16px' } }}
                    />
                  </Grid.Col>
                </Grid>
              </Grid.Col>
            </Grid>
          </Accordion.Panel>
        </Accordion.Item>

        {/* Construction Year */}
        <Accordion.Item value="construction">
          <Accordion.Control
            icon={
              <ThemeIcon size="lg" radius="md" variant="light" color="yellow">
                <IconHammer size={20} />
              </ThemeIcon>
            }
          >
            <Text fw={600}>{t('propertySearch.advancedSearch.constructionYear')}</Text>
          </Accordion.Control>
          <Accordion.Panel>
            <Grid gutter="md">
              <Grid.Col span={6}>
                <NumberInput
                  label={t('propertySearch.advancedSearch.fromYear')}
                  placeholder="2015"
                  min={1950}
                  max={new Date().getFullYear() + 5}
                  value={filters.construction_year_min}
                  onChange={(value) => updateFilter('construction_year_min', value)}
                  styles={{ input: { fontSize: '16px' } }}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <NumberInput
                  label={t('propertySearch.advancedSearch.toYear')}
                  placeholder={new Date().getFullYear().toString()}
                  min={1950}
                  max={new Date().getFullYear() + 5}
                  value={filters.construction_year_max}
                  onChange={(value) => updateFilter('construction_year_max', value)}
                  styles={{ input: { fontSize: '16px' } }}
                />
              </Grid.Col>
            </Grid>
          </Accordion.Panel>
        </Accordion.Item>

        {/* Ownership - только для продажи */}
        {filters.deal_type === 'sale' && (
          <Accordion.Item value="ownership">
            <Accordion.Control
              icon={
                <ThemeIcon size="lg" radius="md" variant="light" color="grape">
                  <IconShield size={20} />
                </ThemeIcon>
              }
            >
              <Text fw={600}>{t('propertySearch.advancedSearch.ownershipTypes')}</Text>
            </Accordion.Control>
            <Accordion.Panel>
              <Stack gap="md">
                <Grid gutter="md">
                  <Grid.Col span={{ base: 12, sm: 4 }}>
                    <Select
                      label={t('properties.buildingOwnership')}
                      placeholder={t('propertySearch.advancedSearch.any')}
                      value={filters.building_ownership}
                      onChange={(value) => updateFilter('building_ownership', value)}
                      clearable
                      data={[
                        { value: 'freehold', label: t('properties.ownershipTypes.freehold') },
                        { value: 'leasehold', label: t('properties.ownershipTypes.leasehold') },
                        { value: 'company', label: t('properties.ownershipTypes.company') }
                      ]}
                      styles={{ input: { fontSize: '16px' } }}
                    />
                  </Grid.Col>

                  <Grid.Col span={{ base: 12, sm: 4 }}>
                    <Select
                      label={t('properties.landOwnership')}
                      placeholder={t('propertySearch.advancedSearch.any')}
                      value={filters.land_ownership}
                      onChange={(value) => updateFilter('land_ownership', value)}
                      clearable
                      data={[
                        { value: 'freehold', label: t('properties.ownershipTypes.freehold') },
                        { value: 'leasehold', label: t('properties.ownershipTypes.leasehold') },
                        { value: 'company', label: t('properties.ownershipTypes.company') }
                      ]}
                      styles={{ input: { fontSize: '16px' } }}
                    />
                  </Grid.Col>

                  <Grid.Col span={{ base: 12, sm: 4 }}>
                    <Select
                      label={t('properties.ownership')}
                      placeholder={t('propertySearch.advancedSearch.any')}
                      value={filters.ownership_type}
                      onChange={(value) => updateFilter('ownership_type', value)}
                      clearable
                      data={[
                        { value: 'freehold', label: t('properties.ownershipTypes.freehold') },
                        { value: 'leasehold', label: t('properties.ownershipTypes.leasehold') },
                        { value: 'company', label: t('properties.ownershipTypes.company') }
                      ]}
                      styles={{ input: { fontSize: '16px' } }}
                    />
                  </Grid.Col>
                </Grid>

                <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
                  <Text size="xs">
                    {t('propertySearch.advancedSearch.ownershipInfo')}
                  </Text>
                </Alert>
              </Stack>
            </Accordion.Panel>
          </Accordion.Item>
        )}
      </Accordion>

      {/* Search Buttons */}
      <Grid gutter="md">
        <Grid.Col span={{ base: 12, sm: 6 }}>
          <Button
            variant="gradient"
            gradient={{ from: 'violet', to: 'grape' }}
            size="lg"
            fullWidth
            leftSection={<IconSearch size={20} />}
            onClick={handleSearch}
            loading={loading}
          >
            {t('propertySearch.advancedSearch.searchButton')}
          </Button>
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6 }}>
          <Button
            variant="light"
            color="gray"
            size="lg"
            fullWidth
            leftSection={<IconRefresh size={20} />}
            onClick={handleReset}
            disabled={loading}
          >
            {t('propertySearch.advancedSearch.resetButton')}
          </Button>
        </Grid.Col>
      </Grid>

      {/* CSS для стилизации react-datepicker */}
      <style>{`
        .mantine-datepicker-wrapper {
          width: 100%;
        }
        
        .mantine-datepicker-input {
          width: 100%;
          padding: 8px 12px;
          font-size: 16px;
          border: 1px solid #373A40;
          border-radius: 4px;
          background-color: #25262B;
          color: #C1C2C5;
          transition: border-color 0.2s;
        }
        
        .mantine-datepicker-input:hover {
          border-color: #5C5F66;
        }
        
        .mantine-datepicker-input:focus {
          outline: none;
          border-color: #5F3DC4;
        }
        
        .react-datepicker-wrapper {
          width: 100%;
        }
        
        .react-datepicker__input-container {
          width: 100%;
        }
        
        .react-datepicker {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          background-color: #25262B;
          border: 1px solid #373A40;
          border-radius: 8px;
        }
        
        .react-datepicker__header {
          background-color: #2C2E33;
          border-bottom: 1px solid #373A40;
        }
        
        .react-datepicker__current-month,
        .react-datepicker__day-name {
          color: #C1C2C5;
        }
        
        .react-datepicker__day {
          color: #C1C2C5;
        }
        
        .react-datepicker__day:hover {
          background-color: #373A40;
        }
        
        .react-datepicker__day--selected,
        .react-datepicker__day--in-range,
        .react-datepicker__day--in-selecting-range {
          background-color: #5F3DC4;
          color: white;
        }
        
        .react-datepicker__day--keyboard-selected {
          background-color: #5F3DC4;
          color: white;
        }
        
        .react-datepicker__day--disabled {
          color: #5C5F66;
        }
        
        .react-datepicker__navigation-icon::before {
          border-color: #C1C2C5;
        }
        
        .react-datepicker__navigation:hover *::before {
          border-color: white;
        }
      `}</style>
    </Stack>
  );
};

export default AdvancedSearch;