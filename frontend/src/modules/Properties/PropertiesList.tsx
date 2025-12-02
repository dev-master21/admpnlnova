// frontend/src/modules/Properties/PropertiesList.tsx
import { useState, useEffect } from 'react';
import {
  Card,
  Button,
  TextInput,
  Select,
  Table,
  Badge,
  Group,
  Stack,
  Grid,
  Tooltip,
  Image,
  ActionIcon,
  Modal,
  Text,
  Paper,
  Box,
  Center,
  Skeleton,
  Pagination,
  SegmentedControl,
  Divider,
  Transition,
  useMantineTheme
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMediaQuery, useDisclosure } from '@mantine/hooks';
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconSearch,
  IconHome,
  IconEye,
  IconEyeOff,
  IconRefresh,
  IconCurrencyDollar,
  IconCalendar,
  IconUser,
  IconFileText,
  IconFilter,
  IconLayoutGrid,
  IconLayoutList,
  IconX
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { propertiesApi } from '@/api/properties.api';
import { useAuthStore } from '@/store/authStore';
import PricingModal from './components/PricingModal';
import CalendarModal from './components/CalendarModal';
import OwnerInfoModal from './components/OwnerInfoModal';
import PropertyHTMLGeneratorModal from './components/PropertyHTMLGeneratorModal';
import type { Property } from './types';

const PropertiesList = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useMantineTheme();
  
  const { 
    hasPermission, 
    canEditProperty, 
    canViewPropertyOwner, 
    canDeleteProperty 
  } = useAuthStore();

  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [uniqueOwners, setUniqueOwners] = useState<string[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    status: undefined as string | undefined,
    deal_type: undefined as string | undefined,
    property_type: undefined as string | undefined,
    owner_name: undefined as string | undefined
  });

  // Медиа запросы для адаптивности
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  // Режим просмотра (список/сетка)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

// Модальные окна
  const [pricingModalVisible, setPricingModalVisible] = useState(false);
  const [calendarModalVisible, setCalendarModalVisible] = useState(false);
  const [ownerInfoModalVisible, setOwnerInfoModalVisible] = useState(false);
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
  const [selectedOwnerData, setSelectedOwnerData] = useState<any>(null);
  const [htmlGeneratorVisible, setHtmlGeneratorVisible] = useState(false);
  const [selectedPropertyForHTML, setSelectedPropertyForHTML] = useState<{id: number, number: string} | null>(null);

  // Модальное окно подтверждения удаления
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);
  const [propertyToDelete, setPropertyToDelete] = useState<number | null>(null);

  // Модальное окно выбора режима просмотра
  const [viewModeModalOpened, { open: openViewModeModal, close: closeViewModeModal }] = useDisclosure(false);
  const [selectedPropertyForView, setSelectedPropertyForView] = useState<number | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // Показ фильтров на мобильных
  const [filtersOpened, { toggle: toggleFilters }] = useDisclosure(false);

  useEffect(() => {
    loadProperties();
    if (canViewPropertyOwner(undefined)) {
      loadUniqueOwners();
    }
  }, [pagination.current, pagination.pageSize]);

  const loadProperties = async () => {
    setLoading(true);
    try {
      const { data } = await propertiesApi.getAll({
        page: pagination.current,
        limit: pagination.pageSize,
        ...filters
      });

      setProperties(data.data.properties);
      setPagination(prev => ({
        ...prev,
        total: data.data.pagination.total
      }));
    } catch (error: any) {
      notifications.show({
        title: t('errors.generic'),
        message: error.response?.data?.message || t('errors.generic'),
        color: 'red',
        icon: <IconX size={18} />
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUniqueOwners = async () => {
    try {
      const { data } = await propertiesApi.getUniqueOwners();
      setUniqueOwners(data.data);
    } catch (error: any) {
      console.error('Failed to load unique owners:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await propertiesApi.delete(id);
      notifications.show({
        title: t('common.success'),
        message: t('properties.deleteSuccess'),
        color: 'green',
        icon: <IconTrash size={18} />
      });
      closeDeleteModal();
      setPropertyToDelete(null);
      loadProperties();
    } catch (error: any) {
      notifications.show({
        title: t('errors.generic'),
        message: error.response?.data?.message || t('errors.generic'),
        color: 'red',
        icon: <IconX size={18} />
      });
    }
  };

  const confirmDelete = (id: number) => {
    setPropertyToDelete(id);
    openDeleteModal();
  };

  const handleTableChange = (page: number) => {
    setPagination(prev => ({
      ...prev,
      current: page
    }));
  };

  const handlePageSizeChange = (size: string) => {
    setPagination(prev => ({
      ...prev,
      pageSize: parseInt(size),
      current: 1
    }));
    setTimeout(loadProperties, 100);
  };

  const handleSearch = () => {
    setPagination(prev => ({ ...prev, current: 1 }));
    loadProperties();
  };

  const handleReset = () => {
    setFilters({
      search: '',
      status: undefined,
      deal_type: undefined,
      property_type: undefined,
      owner_name: undefined
    });
    setPagination(prev => ({ ...prev, current: 1 }));
    setTimeout(loadProperties, 100);
  };

  const openPricingModal = (id: number) => {
    setSelectedPropertyId(id);
    setPricingModalVisible(true);
  };

  const openCalendarModal = (id: number) => {
    setSelectedPropertyId(id);
    setCalendarModalVisible(true);
  };

  const openOwnerInfoModal = (property: any) => {
    setSelectedOwnerData({
      owner_name: property.owner_name,
      owner_phone: property.owner_phone,
      owner_email: property.owner_email,
      owner_telegram: property.owner_telegram,
      owner_instagram: property.owner_instagram,
      owner_notes: property.owner_notes
    });
    setOwnerInfoModalVisible(true);
  };

const openHTMLGenerator = (id: number, propertyNumber: string) => {
    setSelectedPropertyForHTML({ id, number: propertyNumber });
    setHtmlGeneratorVisible(true);
  };

  // Новые функции для просмотра
  const openViewModeSelector = (id: number) => {
    setSelectedPropertyForView(id);
    openViewModeModal();
  };

const handleViewOnSite = async () => {
  if (!selectedPropertyForView) return;
  
  // ✅ КРИТИЧНО: Открываем окно СИНХРОННО, до async запроса
  const newWindow = window.open('about:blank', '_blank');
  
  setIsLoadingPreview(true);
  try {
    const response = await propertiesApi.getPreviewUrl(selectedPropertyForView);
    
    if (response.data?.success && response.data.data?.previewUrl) {
      // ✅ Обновляем URL уже открытого окна
      if (newWindow) {
        newWindow.location.href = response.data.data.previewUrl;
      }
      closeViewModeModal();
    } else {
      // ✅ Закрываем окно при ошибке
      if (newWindow) {
        newWindow.close();
      }
      notifications.show({
        title: t('errors.generic'),
        message: t('properties.messages.previewUrlError') || 'Ошибка получения ссылки для просмотра',
        color: 'red',
        icon: <IconX size={18} />
      });
    }
  } catch (error) {
    console.error('Error generating preview URL:', error);
    // ✅ Закрываем окно при ошибке
    if (newWindow) {
      newWindow.close();
    }
    notifications.show({
      title: t('errors.generic'),
      message: t('properties.messages.previewUrlError') || 'Ошибка получения ссылки для просмотра',
      color: 'red',
      icon: <IconX size={18} />
    });
  } finally {
    setIsLoadingPreview(false);
  }
};

  const handleViewInAdmin = () => {
    if (!selectedPropertyForView) return;
    
    navigate(`/properties/view/${selectedPropertyForView}`);
    closeViewModeModal();
  };

  const getDealTypeColor = (type: string) => {
    switch(type) {
      case 'sale': return 'green';
      case 'rent': return 'blue';
      case 'both': return 'grape';
      default: return 'gray';
    }
  };

  const getDealTypeLabel = (type: string) => {
    switch(type) {
      case 'sale': return t('properties.dealTypes.sale');
      case 'rent': return t('properties.dealTypes.rent');
      case 'both': return t('properties.dealTypes.both');
      default: return type;
    }
  };

  // Компонент карточки для мобильной версии и сетки
  const PropertyCard = ({ property }: { property: any }) => (
    <Card
      shadow="sm"
      padding="md"
      radius="md"
      withBorder
      style={{
        height: '100%',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        cursor: 'pointer'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = theme.shadows.md;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = theme.shadows.sm;
      }}
    >
      <Card.Section>
        {property.cover_photo ? (
          <Image
            src={property.cover_photo}
            alt={property.property_name || property.property_number}
            height={180}
            fit="cover"
          />
        ) : (
          <Center
            h={180}
            style={{
              background: theme.colors.dark[6],
            }}
          >
            <IconHome size={48} color={theme.colors.dark[3]} />
          </Center>
        )}
      </Card.Section>

      <Stack gap="xs" mt="md">
        <Group justify="space-between" align="flex-start">
          <Text fw={600} size="lg" lineClamp={1} style={{ flex: 1 }}>
            {property.property_name || property.property_number}
          </Text>
          {property.status === 'published' ? (
            <Badge color="green" variant="light" leftSection={<IconEye size={14} />}>
              {t('properties.published')}
            </Badge>
          ) : (
            <Badge color="gray" variant="light" leftSection={<IconEyeOff size={14} />}>
              {t('properties.draft')}
            </Badge>
          )}
        </Group>

        <Group gap="xs">
          <Badge color="gray" variant="dot" size="sm">
            #{property.property_number}
          </Badge>
          <Badge color={getDealTypeColor(property.deal_type)} variant="light" size="sm">
            {getDealTypeLabel(property.deal_type)}
          </Badge>
        </Group>

        {property.owner_name && canViewPropertyOwner(property.created_by) && (
          <Button
            variant="subtle"
            size="xs"
            leftSection={<IconUser size={14} />}
            onClick={(e) => {
              e.stopPropagation();
              openOwnerInfoModal(property);
            }}
            styles={{ root: { padding: '4px 8px' } }}
          >
            {property.owner_name}
          </Button>
        )}

        <Text size="xs" c="dimmed">
          {t('properties.addedBy')}: {property.creator_name}
        </Text>

        <Divider my="xs" />

        <Group gap="xs" wrap="wrap">
<Tooltip label={t('common.view')}>
            <ActionIcon
              variant="light"
              color="blue"
              size="lg"
              onClick={(e) => {
                e.stopPropagation();
                openViewModeSelector(property.id);
              }}
            >
              <IconEye size={18} />
            </ActionIcon>
          </Tooltip>

          <Tooltip label={t('htmlGenerator.downloadButton')}>
            <ActionIcon
              variant="light"
              color="violet"
              size="lg"
              onClick={(e) => {
                e.stopPropagation();
                openHTMLGenerator(property.id, property.property_number);
              }}
            >
              <IconFileText size={18} />
            </ActionIcon>
          </Tooltip>

          <Tooltip label={t('properties.prices')}>
            <ActionIcon
              variant="light"
              color="green"
              size="lg"
              onClick={(e) => {
                e.stopPropagation();
                openPricingModal(property.id);
              }}
            >
              <IconCurrencyDollar size={18} />
            </ActionIcon>
          </Tooltip>

          <Tooltip label={t('properties.calendar.button')}>
            <ActionIcon
              variant="light"
              color="cyan"
              size="lg"
              onClick={(e) => {
                e.stopPropagation();
                openCalendarModal(property.id);
              }}
            >
              <IconCalendar size={18} />
            </ActionIcon>
          </Tooltip>

          {canEditProperty(property.created_by) && (
            <Tooltip label={t('common.edit')}>
              <ActionIcon
                variant="light"
                color="orange"
                size="lg"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/properties/edit/${property.id}`);
                }}
              >
                <IconEdit size={18} />
              </ActionIcon>
            </Tooltip>
          )}

          {canDeleteProperty() && (
            <Tooltip label={t('common.delete')}>
              <ActionIcon
                variant="light"
                color="red"
                size="lg"
                onClick={(e) => {
                  e.stopPropagation();
                  confirmDelete(property.id);
                }}
              >
                <IconTrash size={18} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>
      </Stack>
    </Card>
  );

  // Компонент строки таблицы
  const TableRow = ({ property }: { property: any }) => (
    <Table.Tr
      style={{
        transition: 'background-color 0.2s ease',
        cursor: 'pointer'
      }}
    >
      <Table.Td>
        {property.cover_photo ? (
          <Image
            src={property.cover_photo}
            alt={property.property_number}
            width={60}
            height={60}
            radius="sm"
            fit="cover"
          />
        ) : (
          <Center
            w={60}
            h={60}
            style={{
              background: theme.colors.dark[6],
              borderRadius: theme.radius.sm
            }}
          >
            <IconHome size={24} color={theme.colors.dark[3]} />
          </Center>
        )}
      </Table.Td>
      <Table.Td>
        <Text fw={600}>{property.property_name || '—'}</Text>
      </Table.Td>
      <Table.Td>
        <Text c="dimmed" size="sm">#{property.property_number}</Text>
      </Table.Td>
      {canViewPropertyOwner(undefined) && (
        <Table.Td>
          {property.owner_name && canViewPropertyOwner(property.created_by) ? (
            <Button
              variant="subtle"
              size="xs"
              leftSection={<IconUser size={14} />}
              onClick={() => openOwnerInfoModal(property)}
            >
              {property.owner_name}
            </Button>
          ) : (
            <Text>—</Text>
          )}
        </Table.Td>
      )}
      <Table.Td>
        <Tooltip label={property.creator_name}>
          <Text size="sm" lineClamp={1}>{property.creator_name}</Text>
        </Tooltip>
      </Table.Td>
      <Table.Td>
        <Badge color={getDealTypeColor(property.deal_type)} variant="light">
          {getDealTypeLabel(property.deal_type)}
        </Badge>
      </Table.Td>
      <Table.Td>
        {property.status === 'published' ? (
          <Badge color="green" variant="light" leftSection={<IconEye size={14} />}>
            {t('properties.published')}
          </Badge>
        ) : (
          <Badge color="gray" variant="light" leftSection={<IconEyeOff size={14} />}>
            {t('properties.draft')}
          </Badge>
        )}
      </Table.Td>
      <Table.Td>
        <Group gap="xs" wrap="nowrap">
<Tooltip label={t('common.view')}>
            <ActionIcon
              variant="light"
              color="blue"
              size="sm"
              onClick={() => openViewModeSelector(property.id)}
            >
              <IconEye size={16} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label={t('htmlGenerator.downloadButton')}>
            <ActionIcon
              variant="light"
              color="violet"
              size="sm"
              onClick={() => openHTMLGenerator(property.id, property.property_number)}
            >
              <IconFileText size={16} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label={t('properties.prices')}>
            <ActionIcon
              variant="light"
              color="green"
              size="sm"
              onClick={() => openPricingModal(property.id)}
            >
              <IconCurrencyDollar size={16} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label={t('properties.calendar.button')}>
            <ActionIcon
              variant="light"
              color="cyan"
              size="sm"
              onClick={() => openCalendarModal(property.id)}
            >
              <IconCalendar size={16} />
            </ActionIcon>
          </Tooltip>
          {canEditProperty(property.created_by) && (
            <Tooltip label={t('common.edit')}>
              <ActionIcon
                variant="light"
                color="orange"
                size="sm"
                onClick={() => navigate(`/properties/edit/${property.id}`)}
              >
                <IconEdit size={16} />
              </ActionIcon>
            </Tooltip>
          )}
          {canDeleteProperty() && (
            <Tooltip label={t('common.delete')}>
              <ActionIcon
                variant="light"
                color="red"
                size="sm"
                onClick={() => confirmDelete(property.id)}
              >
                <IconTrash size={16} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>
      </Table.Td>
    </Table.Tr>
  );

  // Skeleton для загрузки
  const LoadingSkeleton = () => (
    <Stack gap="md">
      {[1, 2, 3, 4, 5].map((i) => (
        <Paper key={i} shadow="sm" p="md" radius="md" withBorder>
          <Group>
            <Skeleton height={60} width={60} radius="sm" />
            <Stack gap="xs" style={{ flex: 1 }}>
              <Skeleton height={20} width="60%" />
              <Skeleton height={16} width="40%" />
            </Stack>
          </Group>
        </Paper>
      ))}
    </Stack>
  );

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack gap="lg">
        {/* Заголовок и действия */}
        <Group justify="space-between" wrap="wrap">
          <Text size="xl" fw={700}>{t('properties.list')}</Text>
          <Group gap="xs">
            {hasPermission('properties.read') && (
              <Button
                variant="light"
                leftSection={<IconSearch size={18} />}
                onClick={() => navigate('/properties/search')}
                size={isMobile ? 'sm' : 'md'}
              >
                {!isMobile && t('properties.searchButton')}
              </Button>
            )}
            {hasPermission('properties.create') && (
              <Button
                leftSection={<IconPlus size={18} />}
                onClick={() => navigate('/properties/create')}
                size={isMobile ? 'sm' : 'md'}
              >
                {!isMobile && t('properties.add')}
              </Button>
            )}
          </Group>
        </Group>

        {/* Фильтры */}
        {isMobile ? (
          <>
            <Button
              variant="light"
              leftSection={<IconFilter size={18} />}
              onClick={toggleFilters}
              fullWidth
            >
              {filtersOpened ? t('common.hideFilters') : t('common.showFilters')}
            </Button>
            
            <Transition mounted={filtersOpened} transition="slide-down" duration={200}>
              {(styles) => (
                <div style={styles}>
                  <Stack gap="sm">
                    <TextInput
                      placeholder={t('properties.search')}
                      leftSection={<IconSearch size={18} />}
                      value={filters.search}
                      onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <Select
                      placeholder={t('properties.status')}
                      value={filters.status}
                      onChange={(value) => setFilters({ ...filters, status: value || undefined })}
                      clearable
                      data={[
                        { value: 'draft', label: t('properties.draft') },
                        { value: 'published', label: t('properties.published') }
                      ]}
                    />
                    <Select
                      placeholder={t('properties.dealType')}
                      value={filters.deal_type}
                      onChange={(value) => setFilters({ ...filters, deal_type: value || undefined })}
                      clearable
                      data={[
                        { value: 'sale', label: t('properties.dealTypes.sale') },
                        { value: 'rent', label: t('properties.dealTypes.rent') },
                        { value: 'both', label: t('properties.dealTypes.both') }
                      ]}
                    />
                    {canViewPropertyOwner(undefined) && (
                      <Select
                        placeholder={t('properties.source')}
                        value={filters.owner_name}
                        onChange={(value) => setFilters({ ...filters, owner_name: value || undefined })}
                        clearable
                        searchable
                        data={uniqueOwners.map(owner => ({
                          value: owner,
                          label: owner
                        }))}
                      />
                    )}
                    <Group grow>
                      <Button
                        leftSection={<IconSearch size={18} />}
                        onClick={handleSearch}
                      >
                        {t('common.search')}
                      </Button>
                      <Button
                        variant="light"
                        leftSection={<IconRefresh size={18} />}
                        onClick={handleReset}
                      >
                        {t('common.reset')}
                      </Button>
                    </Group>
                  </Stack>
                </div>
              )}
            </Transition>
          </>
        ) : (
          <Grid gutter="sm">
            <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
              <TextInput
                placeholder={t('properties.search')}
                leftSection={<IconSearch size={18} />}
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 6, sm: 3, md: 2 }}>
              <Select
                placeholder={t('properties.status')}
                value={filters.status}
                onChange={(value) => setFilters({ ...filters, status: value || undefined })}
                clearable
                data={[
                  { value: 'draft', label: t('properties.draft') },
                  { value: 'published', label: t('properties.published') }
                ]}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 6, sm: 3, md: 2 }}>
              <Select
                placeholder={t('properties.dealType')}
                value={filters.deal_type}
                onChange={(value) => setFilters({ ...filters, deal_type: value || undefined })}
                clearable
                data={[
                  { value: 'sale', label: t('properties.dealTypes.sale') },
                  { value: 'rent', label: t('properties.dealTypes.rent') },
                  { value: 'both', label: t('properties.dealTypes.both') }
                ]}
              />
            </Grid.Col>
            {canViewPropertyOwner(undefined) && (
              <Grid.Col span={{ base: 12, sm: 6, md: 2 }}>
                <Select
                  placeholder={t('properties.source')}
                  value={filters.owner_name}
                  onChange={(value) => setFilters({ ...filters, owner_name: value || undefined })}
                  clearable
                  searchable
                  data={uniqueOwners.map(owner => ({
                    value: owner,
                    label: owner
                  }))}
                />
              </Grid.Col>
            )}
            <Grid.Col span={{ base: 12, sm: 6, md: canViewPropertyOwner(undefined) ? 3 : 5 }}>
              <Group gap="xs">
                <Button
                  leftSection={<IconSearch size={18} />}
                  onClick={handleSearch}
                >
                  {t('common.search')}
                </Button>
                <Button
                  variant="light"
                  leftSection={<IconRefresh size={18} />}
                  onClick={handleReset}
                >
                  {t('common.reset')}
                </Button>
              </Group>
            </Grid.Col>
          </Grid>
        )}

        {/* Переключатель режима просмотра (только на десктопе) */}
        {!isMobile && (
          <Group justify="space-between">
            <SegmentedControl
              value={viewMode}
              onChange={(value) => setViewMode(value as 'grid' | 'list')}
              data={[
                {
                  value: 'list',
                  label: (
                    <Center>
                      <IconLayoutList size={16} />
                      <Box ml={10}>{t('common.list')}</Box>
                    </Center>
                  ),
                },
                {
                  value: 'grid',
                  label: (
                    <Center>
                      <IconLayoutGrid size={16} />
                      <Box ml={10}>{t('common.grid')}</Box>
                    </Center>
                  ),
                },
              ]}
            />
            <Select
              value={pagination.pageSize.toString()}
              onChange={(value) => handlePageSizeChange(value!)}
              data={['10', '20', '50', '100']}
              w={100}
            />
          </Group>
        )}

        {/* Контент */}
        {loading ? (
          <LoadingSkeleton />
        ) : properties.length === 0 ? (
          <Paper shadow="sm" p="xl" radius="md" withBorder>
            <Center>
              <Stack align="center" gap="md">
                <IconHome size={48} color={theme.colors.gray[5]} />
                <Text size="lg" c="dimmed">{t('properties.noProperties')}</Text>
                {hasPermission('properties.create') && (
                  <Button
                    leftSection={<IconPlus size={18} />}
                    onClick={() => navigate('/properties/create')}
                  >
                    {t('properties.add')}
                  </Button>
                )}
              </Stack>
            </Center>
          </Paper>
        ) : (
          <>
            {isMobile || viewMode === 'grid' ? (
              <Grid gutter="md">
                {properties.map((property) => (
                  <Grid.Col key={property.id} span={{ base: 12, sm: 6, md: 4, lg: 3 }}>
                    <PropertyCard property={property} />
                  </Grid.Col>
                ))}
              </Grid>
            ) : (
              <Box style={{ overflowX: 'auto' }}>
                <Table
                  striped
                  highlightOnHover
                  withTableBorder
                  withColumnBorders
                  stickyHeader
                  stickyHeaderOffset={0}
                >
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>{t('properties.photo')}</Table.Th>
                      <Table.Th>{t('properties.name')}</Table.Th>
                      <Table.Th>#</Table.Th>
                      {canViewPropertyOwner(undefined) && (
                        <Table.Th>{t('properties.source')}</Table.Th>
                      )}
                      <Table.Th>{t('properties.addedBy')}</Table.Th>
                      <Table.Th>{t('properties.dealType')}</Table.Th>
                      <Table.Th>{t('properties.status')}</Table.Th>
                      <Table.Th>{t('common.actions')}</Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>
                    {properties.map((property) => (
                      <TableRow key={property.id} property={property} />
                    ))}
                  </Table.Tbody>
                </Table>
              </Box>
            )}

            {/* Пагинация */}
            <Group justify="space-between" mt="lg" wrap="wrap">
              <Text size="sm" c="dimmed">
                {t('common.total', { total: pagination.total })}
              </Text>
              <Pagination
                total={Math.ceil(pagination.total / pagination.pageSize)}
                value={pagination.current}
                onChange={handleTableChange}
                size={isMobile ? 'sm' : 'md'}
              />
            </Group>
          </>
        )}
      </Stack>

      {/* Модальные окна */}
      {selectedPropertyId && (
        <>
          <PricingModal
            propertyId={selectedPropertyId}
            visible={pricingModalVisible}
            onClose={() => {
              setPricingModalVisible(false);
              setSelectedPropertyId(null);
            }}
          />
          <CalendarModal
            propertyId={selectedPropertyId}
            visible={calendarModalVisible}
            onClose={() => {
              setCalendarModalVisible(false);
              setSelectedPropertyId(null);
            }}
          />
        </>
      )}

      <OwnerInfoModal
        visible={ownerInfoModalVisible}
        onClose={() => {
          setOwnerInfoModalVisible(false);
          setSelectedOwnerData(null);
        }}
        ownerData={selectedOwnerData}
      />

      {selectedPropertyForHTML && (
        <PropertyHTMLGeneratorModal
          visible={htmlGeneratorVisible}
          onClose={() => {
            setHtmlGeneratorVisible(false);
            setSelectedPropertyForHTML(null);
          }}
          propertyId={selectedPropertyForHTML.id}
          propertyNumber={selectedPropertyForHTML.number}
        />
      )}

{/* Модальное окно подтверждения удаления */}
      <Modal
        opened={deleteModalOpened}
        onClose={closeDeleteModal}
        title={t('properties.confirmDelete')}
        centered
      >
        <Stack gap="md">
          <Text>{t('common.confirmDeleteMessage')}</Text>
          <Group justify="flex-end" gap="xs">
            <Button variant="light" onClick={closeDeleteModal}>
              {t('common.no')}
            </Button>
            <Button
              color="red"
              onClick={() => propertyToDelete && handleDelete(propertyToDelete)}
            >
              {t('common.yes')}
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Модальное окно выбора режима просмотра */}
      <Modal
        opened={viewModeModalOpened}
        onClose={closeViewModeModal}
        title={t('properties.selectViewMode') || 'Выберите режим просмотра'}
        centered
        size="md"
      >
        <Stack gap="lg">
          <Text size="sm" c="dimmed">
            {t('properties.selectViewModeDescription') || 'Выберите, где вы хотите просмотреть объект недвижимости'}
          </Text>

          <Stack gap="md">
            <Button
              size="lg"
              variant="light"
              color="blue"
              leftSection={<IconHome size={20} />}
              onClick={handleViewOnSite}
              loading={isLoadingPreview}
              disabled={isLoadingPreview}
              fullWidth
            >
              {t('properties.viewOnSite') || 'Просмотр на сайте'}
            </Button>

            <Button
              size="lg"
              variant="light"
              color="green"
              leftSection={<IconEye size={20} />}
              onClick={handleViewInAdmin}
              disabled={isLoadingPreview}
              fullWidth
            >
              {t('properties.viewInAdmin') || 'Просмотр в админ-панели'}
            </Button>
          </Stack>

          <Divider />

          <Button
            variant="subtle"
            color="gray"
            onClick={closeViewModeModal}
            disabled={isLoadingPreview}
            fullWidth
          >
            {t('common.cancel') || 'Отмена'}
          </Button>
        </Stack>
      </Modal>
    </Card>
  );
};

export default PropertiesList;