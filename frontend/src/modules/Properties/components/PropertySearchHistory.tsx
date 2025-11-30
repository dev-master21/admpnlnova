// frontend/src/modules/Properties/components/PropertySearchHistory.tsx
import { useState, useEffect } from 'react';
import {
  Card,
  Stack,
  Group,
  Text,
  Button,
  Loader,
  Center,
  Grid,
  ThemeIcon,
  Timeline,
  Pagination,
  ActionIcon,
  Tooltip,
  Paper,
  Collapse,
  Box,
  RingProgress
} from '@mantine/core';
import {
  IconRobot,
  IconForms,
  IconTrash,
  IconMessage,
  IconClock,
  IconSearch,
  IconFilter,
  IconCheck,
  IconCalendar,
  IconCurrencyDollar,
  IconHome,
  IconRefresh,
  IconChevronDown,
  IconChevronUp,
  IconMapPin,
  IconAlertCircle,
  IconBed
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useMediaQuery } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import { propertySearchApi } from '@/api/propertySearch.api';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
import 'dayjs/locale/en';
import 'dayjs/locale/th';
import 'dayjs/locale/zh';
import 'dayjs/locale/he';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);

interface PropertySearchHistoryProps {
  refreshTrigger?: number;
  onLoadSearch?: (log: any, properties: any[]) => void;
  onNavigateToChat?: (conversationId: number) => void;
}

const PropertySearchHistory: React.FC<PropertySearchHistoryProps> = ({ 
  onLoadSearch
}) => {
  const { t, i18n } = useTranslation();
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  useEffect(() => {
    const localeMap: { [key: string]: string } = {
      'ru': 'ru',
      'en': 'en',
      'th': 'th',
      'zh': 'zh',
      'he': 'he'
    };
    dayjs.locale(localeMap[i18n.language] || 'en');
  }, [i18n.language]);

  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());

  useEffect(() => {
    loadHistory();
  }, [pagination.current]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const { data } = await propertySearchApi.getSearchHistory(
        pagination.current,
        pagination.pageSize
      );

      setHistory(data.data.history);
      setPagination(prev => ({
        ...prev,
        total: data.data.pagination.total
      }));
    } catch (error) {
      notifications.show({
        title: t('searchHistory.error'),
        message: t('searchHistory.errorLoading'),
        color: 'red',
        icon: <IconAlertCircle size={16} />
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    modals.openConfirmModal({
      title: (
        <Group gap="sm">
          <ThemeIcon size="lg" color="red" variant="light">
            <IconTrash size={20} />
          </ThemeIcon>
          <Text fw={600}>{t('searchHistory.deleteRecord')}</Text>
        </Group>
      ),
      children: (
        <Text size="sm">{t('searchHistory.deleteConfirmation')}</Text>
      ),
      labels: { confirm: t('common.delete'), cancel: t('common.cancel') },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        try {
          await propertySearchApi.deleteSearchHistory(id);
          notifications.show({
            title: t('searchHistory.success'),
            message: t('searchHistory.recordDeleted'),
            color: 'green',
            icon: <IconCheck size={16} />
          });
          loadHistory();
        } catch (error) {
          notifications.show({
            title: t('searchHistory.error'),
            message: t('searchHistory.errorDeleting'),
            color: 'red',
            icon: <IconAlertCircle size={16} />
          });
        }
      },
      centered: true
    });
  };

  const toggleExpand = (id: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  const handleLoadSearchResults = async (item: any) => {
    setLoading(true);
    try {
      const { data } = await propertySearchApi.getSearchResults(item.id);
      
      if (onLoadSearch) {
        onLoadSearch(data.data.log, data.data.properties);
      }
      
      notifications.show({
        title: t('searchHistory.success'),
        message: t('searchHistory.propertiesLoaded', { count: data.data.properties.length }),
        color: 'green',
        icon: <IconCheck size={16} />
      });
    } catch (error) {
      notifications.show({
        title: t('searchHistory.error'),
        message: t('searchHistory.errorLoadingResults'),
        color: 'red',
        icon: <IconAlertCircle size={16} />
      });
    } finally {
      setLoading(false);
    }
  };

  const renderSearchParams = (item: any) => {
    const params = typeof item.search_params === 'string' 
      ? JSON.parse(item.search_params) 
      : item.search_params;

    const paramsList = [];

    if (params.deal_type) {
      paramsList.push({
        icon: <IconHome size={16} />,
        label: t('searchHistory.dealType'),
        value: params.deal_type === 'rent' ? t('properties.dealTypes.rent') : 
               params.deal_type === 'sale' ? t('properties.dealTypes.sale') : 
               t('propertySearch.advancedSearch.any'),
        color: 'blue'
      });
    }

    if (params.property_type) {
      paramsList.push({
        icon: <IconHome size={16} />,
        label: t('properties.propertyType'),
        value: params.property_type,
        color: 'violet'
      });
    }

    if (params.bedrooms) {
      paramsList.push({
        icon: <IconBed size={16} />,
        label: t('propertySearch.advancedSearch.bedrooms'),
        value: params.bedrooms,
        color: 'cyan'
      });
    }

    if (params.regions && params.regions.length > 0) {
      paramsList.push({
        icon: <IconMapPin size={16} />,
        label: t('aiInterpretationModal.regions'),
        value: params.regions.join(', '),
        color: 'orange'
      });
    }

    if (params.budget?.max) {
      paramsList.push({
        icon: <IconCurrencyDollar size={16} />,
        label: t('propertySearch.advancedSearch.budget'),
        value: t('searchHistory.upTo', { 
          amount: params.budget.max.toLocaleString('ru-RU'),
          currency: params.budget.currency || 'THB'
        }),
        color: 'green'
      });
    }

    if (params.dates?.check_in && params.dates?.check_out) {
      paramsList.push({
        icon: <IconCalendar size={16} />,
        label: t('aiInterpretationModal.dates'),
        value: `${dayjs(params.dates.check_in).format('DD.MM.YYYY')} - ${dayjs(params.dates.check_out).format('DD.MM.YYYY')}`,
        color: 'teal'
      });
    }

    if (params.flexible_dates) {
      paramsList.push({
        icon: <IconCalendar size={16} />,
        label: t('searchHistory.flexibleSearch'),
        value: t('searchHistory.nightsCount', { duration: params.flexible_dates.duration }),
        color: 'pink'
      });
    }

    return paramsList;
  };

  const renderAISearch = (item: any) => {
    const interpretation = typeof item.ai_interpretation === 'string'
      ? JSON.parse(item.ai_interpretation)
      : item.ai_interpretation;

    const isExpanded = expandedItems.has(item.id);
    const params = renderSearchParams(item);
    const confidence = (interpretation?.confidence || 0) * 100;

    return (
      <Card
        shadow="md"
        padding="lg"
        radius="lg"
        withBorder
        style={{
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%)',
          borderColor: 'rgba(102, 126, 234, 0.3)',
          transition: 'all 0.3s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 8px 16px rgba(102, 126, 234, 0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '';
        }}
      >
        <Stack gap="md">
          {/* Header */}
          <Group justify="space-between" wrap="nowrap">
            <Group gap="md">
              <ThemeIcon size={50} radius="md" variant="gradient" gradient={{ from: 'violet', to: 'grape' }}>
                <IconRobot size={28} />
              </ThemeIcon>
              <div>
                <Text fw={600} size="lg">{t('searchHistory.aiSearch')}</Text>
                <Group gap="xs">
                  <ThemeIcon size="xs" radius="xl" variant="light" color="gray">
                    <IconClock size={10} />
                  </ThemeIcon>
                  <Text size="xs" c="dimmed">
                    {dayjs(item.created_at).fromNow()}
                  </Text>
                  <Text size="xs" c="dimmed">•</Text>
                  <Text size="xs" c="dimmed">
                    {dayjs(item.created_at).format('DD.MM.YYYY HH:mm')}
                  </Text>
                </Group>
              </div>
            </Group>

            <Group gap="xs">
              <Tooltip label={t('searchHistory.aiConfidence')}>
                <RingProgress
                  size={50}
                  thickness={4}
                  sections={[
                    { 
                      value: confidence, 
                      color: confidence >= 80 ? 'green' : confidence >= 60 ? 'yellow' : 'red'
                    }
                  ]}
                  label={
                    <Center>
                      <Text size="xs" fw={700}>
                        {confidence.toFixed(0)}%
                      </Text>
                    </Center>
                  }
                />
              </Tooltip>
              <Tooltip label={t('common.delete')}>
                <ActionIcon
                  variant="light"
                  color="red"
                  size="lg"
                  onClick={() => handleDelete(item.id)}
                >
                  <IconTrash size={18} />
                </ActionIcon>
              </Tooltip>
            </Group>
          </Group>

          {/* Query */}
          <Paper p="md" radius="md" withBorder style={{ background: 'var(--mantine-color-dark-6)' }}>
            <Group gap="sm" align="flex-start" wrap="nowrap">
              <ThemeIcon size="md" radius="md" variant="light" color="blue">
                <IconMessage size={16} />
              </ThemeIcon>
              <Text size="sm" style={{ flex: 1, lineHeight: 1.5 }}>
                "{item.ai_query}"
              </Text>
            </Group>
          </Paper>

          {/* Stats */}
          <Grid gutter="md">
            <Grid.Col span={{ base: 12, xs: 4 }}>
              <Paper p="md" radius="md" withBorder style={{ background: 'var(--mantine-color-dark-6)' }}>
                <Stack gap="xs" align="center">
                  <ThemeIcon 
                    size="xl" 
                    radius="md" 
                    variant="light" 
                    color={item.results_count > 0 ? 'green' : 'red'}
                  >
                    <IconCheck size={20} />
                  </ThemeIcon>
                  <Text size="xs" c="dimmed" ta="center">
                    {t('searchHistory.found')}
                  </Text>
                  <Text size="xl" fw={700} c={item.results_count > 0 ? 'green' : 'red'}>
                    {item.results_count}
                  </Text>
                </Stack>
              </Paper>
            </Grid.Col>

            <Grid.Col span={{ base: 12, xs: 4 }}>
              <Paper p="md" radius="md" withBorder style={{ background: 'var(--mantine-color-dark-6)' }}>
                <Stack gap="xs" align="center">
                  <ThemeIcon size="xl" radius="md" variant="light" color="blue">
                    <IconFilter size={20} />
                  </ThemeIcon>
                  <Text size="xs" c="dimmed" ta="center">
                    {t('searchHistory.parameters')}
                  </Text>
                  <Text size="xl" fw={700} c="blue">
                    {params.length}
                  </Text>
                </Stack>
              </Paper>
            </Grid.Col>

            <Grid.Col span={{ base: 12, xs: 4 }}>
              <Paper p="md" radius="md" withBorder style={{ background: 'var(--mantine-color-dark-6)' }}>
                <Stack gap="xs" align="center">
                  <ThemeIcon size="xl" radius="md" variant="light" color="yellow">
                    <IconClock size={20} />
                  </ThemeIcon>
                  <Text size="xs" c="dimmed" ta="center">
                    {t('searchHistory.time')}
                  </Text>
                  <Text size="xl" fw={700} c="yellow">
                    {(item.execution_time_ms / 1000).toFixed(2)}
                    <Text component="span" size="sm" c="dimmed" ml={4}>
                      {t('searchHistory.seconds')}
                    </Text>
                  </Text>
                </Stack>
              </Paper>
            </Grid.Col>
          </Grid>

          {/* Expanded Parameters */}
          <Collapse in={isExpanded}>
            {params.length > 0 && (
              <Paper p="md" radius="md" withBorder style={{ background: 'var(--mantine-color-dark-6)' }}>
                <Stack gap="md">
                  <Group gap="xs">
                    <ThemeIcon size="md" radius="md" variant="light" color="violet">
                      <IconFilter size={16} />
                    </ThemeIcon>
                    <Text fw={500} size="sm">
                      {t('searchHistory.extractedParameters')}
                    </Text>
                  </Group>

                  <Timeline
                    active={params.length}
                    bulletSize={24}
                    lineWidth={2}
                  >
                    {params.map((param, index) => (
                      <Timeline.Item
                        key={index}
                        bullet={
                          <ThemeIcon size="sm" radius="xl" variant="light" color={param.color}>
                            {param.icon}
                          </ThemeIcon>
                        }
                      >
                        <Stack gap={4}>
                          <Text size="xs" c="dimmed">
                            {param.label}
                          </Text>
                          <Text size="sm" fw={500}>
                            {param.value}
                          </Text>
                        </Stack>
                      </Timeline.Item>
                    ))}
                  </Timeline>
                </Stack>
              </Paper>
            )}
          </Collapse>

          {/* Actions */}
          <Group gap="xs" grow={isMobile}>
            <Button
              variant="gradient"
              gradient={{ from: 'violet', to: 'grape' }}
              leftSection={<IconSearch size={18} />}
              onClick={() => handleLoadSearchResults(item)}
              style={{ flex: isMobile ? 1 : 2 }}
            >
              {t('searchHistory.viewResults', { count: item.results_count })}
            </Button>
            <Button
              variant="light"
              color="violet"
              leftSection={isExpanded ? <IconChevronUp size={18} /> : <IconChevronDown size={18} />}
              onClick={() => toggleExpand(item.id)}
            >
              {isExpanded ? t('searchHistory.hide') : t('searchHistory.details')}
            </Button>
          </Group>
        </Stack>
      </Card>
    );
  };

  const renderManualSearch = (item: any) => {
    const isExpanded = expandedItems.has(item.id);
    const params = renderSearchParams(item);

    return (
      <Card
        shadow="md"
        padding="lg"
        radius="lg"
        withBorder
        style={{
          background: 'linear-gradient(135deg, rgba(34, 139, 230, 0.05) 0%, rgba(34, 195, 94, 0.05) 100%)',
          borderColor: 'rgba(34, 139, 230, 0.3)',
          transition: 'all 0.3s'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)';
          e.currentTarget.style.boxShadow = '0 8px 16px rgba(34, 139, 230, 0.2)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '';
        }}
      >
        <Stack gap="md">
          {/* Header */}
          <Group justify="space-between" wrap="nowrap">
            <Group gap="md">
              <ThemeIcon size={50} radius="md" variant="gradient" gradient={{ from: 'blue', to: 'cyan' }}>
                <IconForms size={28} />
              </ThemeIcon>
              <div>
                <Text fw={600} size="lg">{t('searchHistory.formSearch')}</Text>
                <Group gap="xs">
                  <ThemeIcon size="xs" radius="xl" variant="light" color="gray">
                    <IconClock size={10} />
                  </ThemeIcon>
                  <Text size="xs" c="dimmed">
                    {dayjs(item.created_at).fromNow()}
                  </Text>
                  <Text size="xs" c="dimmed">•</Text>
                  <Text size="xs" c="dimmed">
                    {dayjs(item.created_at).format('DD.MM.YYYY HH:mm')}
                  </Text>
                </Group>
              </div>
            </Group>

            <Tooltip label={t('common.delete')}>
              <ActionIcon
                variant="light"
                color="red"
                size="lg"
                onClick={() => handleDelete(item.id)}
              >
                <IconTrash size={18} />
              </ActionIcon>
            </Tooltip>
          </Group>

          {/* Stats */}
          <Grid gutter="md">
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Paper p="md" radius="md" withBorder style={{ background: 'var(--mantine-color-dark-6)' }}>
                <Stack gap="xs" align="center">
                  <ThemeIcon 
                    size="xl" 
                    radius="md" 
                    variant="light" 
                    color={item.results_count > 0 ? 'green' : 'red'}
                  >
                    <IconCheck size={20} />
                  </ThemeIcon>
                  <Text size="xs" c="dimmed" ta="center">
                    {t('searchHistory.found')}
                  </Text>
                  <Text size="xl" fw={700} c={item.results_count > 0 ? 'green' : 'red'}>
                    {item.results_count}
                  </Text>
                </Stack>
              </Paper>
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Paper p="md" radius="md" withBorder style={{ background: 'var(--mantine-color-dark-6)' }}>
                <Stack gap="xs" align="center">
                  <ThemeIcon size="xl" radius="md" variant="light" color="yellow">
                    <IconClock size={20} />
                  </ThemeIcon>
                  <Text size="xs" c="dimmed" ta="center">
                    {t('searchHistory.time')}
                  </Text>
                  <Text size="xl" fw={700} c="yellow">
                    {(item.execution_time_ms / 1000).toFixed(2)}
                    <Text component="span" size="sm" c="dimmed" ml={4}>
                      {t('searchHistory.seconds')}
                    </Text>
                  </Text>
                </Stack>
              </Paper>
            </Grid.Col>
          </Grid>

          {/* Expanded Parameters */}
          <Collapse in={isExpanded}>
            {params.length > 0 && (
              <Paper p="md" radius="md" withBorder style={{ background: 'var(--mantine-color-dark-6)' }}>
                <Stack gap="md">
                  <Group gap="xs">
                    <ThemeIcon size="md" radius="md" variant="light" color="blue">
                      <IconFilter size={16} />
                    </ThemeIcon>
                    <Text fw={500} size="sm">
                      {t('searchHistory.searchParameters')}
                    </Text>
                  </Group>

                  <Timeline
                    active={params.length}
                    bulletSize={24}
                    lineWidth={2}
                  >
                    {params.map((param, index) => (
                      <Timeline.Item
                        key={index}
                        bullet={
                          <ThemeIcon size="sm" radius="xl" variant="light" color={param.color}>
                            {param.icon}
                          </ThemeIcon>
                        }
                      >
                        <Stack gap={4}>
                          <Text size="xs" c="dimmed">
                            {param.label}
                          </Text>
                          <Text size="sm" fw={500}>
                            {param.value}
                          </Text>
                        </Stack>
                      </Timeline.Item>
                    ))}
                  </Timeline>
                </Stack>
              </Paper>
            )}
          </Collapse>

          {/* Actions */}
          <Group gap="xs" grow={isMobile}>
            <Button
              variant="gradient"
              gradient={{ from: 'blue', to: 'cyan' }}
              leftSection={<IconSearch size={18} />}
              onClick={() => handleLoadSearchResults(item)}
              style={{ flex: isMobile ? 1 : 2 }}
            >
              {t('searchHistory.viewResults', { count: item.results_count })}
            </Button>
            <Button
              variant="light"
              color="blue"
              leftSection={isExpanded ? <IconChevronUp size={18} /> : <IconChevronDown size={18} />}
              onClick={() => toggleExpand(item.id)}
            >
              {isExpanded ? t('searchHistory.hide') : t('searchHistory.details')}
            </Button>
          </Group>
        </Stack>
      </Card>
    );
  };

  if (loading && history.length === 0) {
    return (
      <Center p={80}>
        <Stack align="center" gap="md">
          <Loader size="lg" />
          <Text c="dimmed">{t('searchHistory.loadingHistory')}</Text>
        </Stack>
      </Center>
    );
  }

  if (!loading && history.length === 0) {
    return (
      <Center p={80}>
        <Stack align="center" gap="md">
          <ThemeIcon size={100} radius="md" variant="light" color="gray">
            <IconClock size={50} />
          </ThemeIcon>
          <Stack gap={4} align="center">
            <Text size="lg" fw={500} c="dimmed">
              {t('searchHistory.historyEmpty')}
            </Text>
            <Text size="sm" c="dimmed">
              {t('searchHistory.performFirstSearch')}
            </Text>
          </Stack>
        </Stack>
      </Center>
    );
  }

  return (
    <Stack gap="xl">
      {/* Header */}
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Group justify="space-between" wrap="nowrap">
          <Group gap="md">
            <ThemeIcon size="xl" radius="md" variant="gradient" gradient={{ from: 'blue', to: 'cyan' }}>
              <IconClock size={24} />
            </ThemeIcon>
            <div>
              <Text fw={700} size="xl">{t('searchHistory.title')}</Text>
              <Text size="sm" c="dimmed">
                {t('searchHistory.totalRecords', { total: pagination.total })}
              </Text>
            </div>
          </Group>

          <Button
            variant="light"
            leftSection={<IconRefresh size={18} />}
            onClick={loadHistory}
            loading={loading}
          >
            {!isMobile && t('searchHistory.refresh')}
          </Button>
        </Group>
      </Card>

      {/* History List */}
      <Stack gap="md">
        {history.map((item: any) => (
          <Box key={item.id}>
            {item.search_type === 'ai' ? renderAISearch(item) : renderManualSearch(item)}
          </Box>
        ))}
      </Stack>

      {/* Pagination */}
      {pagination.total > pagination.pageSize && (
        <Center>
          <Pagination
            value={pagination.current}
            onChange={(page) => setPagination(prev => ({ ...prev, current: page }))}
            total={Math.ceil(pagination.total / pagination.pageSize)}
            size={isMobile ? 'sm' : 'md'}
            withEdges={!isMobile}
          />
        </Center>
      )}

      {/* Pagination Info */}
      <Center>
        <Text size="sm" c="dimmed">
          {t('searchHistory.paginationInfo', {
            start: (pagination.current - 1) * pagination.pageSize + 1,
            end: Math.min(pagination.current * pagination.pageSize, pagination.total),
            total: pagination.total
          })}
        </Text>
      </Center>
    </Stack>
  );
};

export default PropertySearchHistory;