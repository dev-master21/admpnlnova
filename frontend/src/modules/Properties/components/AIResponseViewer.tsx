// frontend/src/modules/Properties/components/AIResponseViewer.tsx
import { useState, useEffect } from 'react';
import {
  Modal,
  Button,
  Tabs,
  Stack,
  Group,
  Text,
  Badge,
  Card,
  Grid,
  ThemeIcon,
  Progress,
  Loader,
  Center,
  Paper,
  Divider,
  ActionIcon,
  Tooltip,
  CopyButton,
  Alert,
  Code
} from '@mantine/core';
import {
  IconRobot,
  IconCheck,
  IconAlertTriangle,
  IconX,
  IconCopy,
  IconDownload,
  IconCalendar,
  IconCurrencyDollar,
  IconHome,
  IconMapPin,
  IconStar,
  IconClock,
  IconFileText,
  IconSettings,
  IconTarget,
  IconChartBar,
  IconInfoCircle
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useMediaQuery } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { propertySearchApi } from '@/api/propertySearch.api';

interface AIResponseViewerProps {
  visible: boolean;
  onClose: () => void;
}

const AIResponseViewer: React.FC<AIResponseViewerProps> = ({ visible, onClose }) => {
  const { t } = useTranslation();
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (visible) {
      loadAIResponse();
    }
  }, [visible]);

  const loadAIResponse = async () => {
    setLoading(true);
    try {
      const { data: response } = await propertySearchApi.getLastAIInterpretation();
      setData(response.data);
    } catch (error: any) {
      notifications.show({
        title: t('aiResponseViewer.error'),
        message: t('aiResponseViewer.errorLoading'),
        color: 'red',
        icon: <IconX size={16} />
      });
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const formatJSON = (obj: any) => {
    try {
      return JSON.stringify(obj, null, 2);
    } catch (e) {
      return String(obj);
    }
  };

  const downloadJSON = () => {
    if (!data) return;
    const blob = new Blob([formatJSON(data.interpretation)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-interpretation-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    notifications.show({
      title: t('aiResponseViewer.success'),
      message: t('aiResponseViewer.jsonDownloaded'),
      color: 'green',
      icon: <IconCheck size={16} />
    });
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return 'green';
    if (confidence >= 0.6) return 'yellow';
    return 'red';
  };

  const renderQueryTypeCard = () => {
    if (!data?.interpretation) return null;
    const interp = data.interpretation;

    let queryType = t('aiResponseViewer.unknownQueryType');
    let queryIcon = <IconX size={32} />;
    let queryDescription = '';
    let gradientColors = { from: 'red', to: 'pink' };

    if (interp.duration && interp.search_window) {
      queryType = t('aiResponseViewer.flexibleSearch');
      queryIcon = <IconCalendar size={32} />;
      queryDescription = t('aiResponseViewer.flexibleSearchDesc', {
        duration: interp.duration,
        start: interp.search_window.start,
        end: interp.search_window.end
      });
      gradientColors = { from: 'orange', to: 'red' };
    } else if (interp.dates && interp.dates.check_in && interp.dates.check_out) {
      queryType = t('aiResponseViewer.fixedDates');
      queryIcon = <IconCheck size={32} />;
      queryDescription = t('aiResponseViewer.fixedDatesDesc', {
        checkIn: interp.dates.check_in,
        checkOut: interp.dates.check_out
      });
      gradientColors = { from: 'teal', to: 'green' };
    } else if (interp.deal_type || interp.property_type || interp.bedrooms) {
      queryType = t('aiResponseViewer.parameterSearch');
      queryIcon = <IconHome size={32} />;
      queryDescription = t('aiResponseViewer.searchWithoutDates');
      gradientColors = { from: 'violet', to: 'grape' };
    }

    return (
      <Card
        shadow="sm"
        padding="lg"
        radius="md"
        withBorder
        style={{
          background: `linear-gradient(135deg, var(--mantine-color-${gradientColors.from}-9) 0%, var(--mantine-color-${gradientColors.to}-9) 100%)`
        }}
      >
        <Group gap="md" wrap="nowrap">
          <ThemeIcon size={60} radius="md" variant="white" color="white">
            {queryIcon}
          </ThemeIcon>
          <Stack gap={4} style={{ flex: 1 }}>
            <Text fw={700} size="lg" c="white">
              {queryType}
            </Text>
            <Text size="sm" c="white" opacity={0.9}>
              {queryDescription}
            </Text>
          </Stack>
        </Group>
      </Card>
    );
  };

  const renderMainParameters = () => {
    if (!data?.interpretation) return null;
    const interp = data.interpretation;

    const params = [];

    if (interp.deal_type) {
      params.push({
        icon: <IconHome size={18} />,
        label: t('aiInterpretationModal.dealType'),
        value: interp.deal_type === 'rent' ? t('properties.dealTypes.rent') : 
               interp.deal_type === 'sale' ? t('properties.dealTypes.sale') : 
               t('propertySearch.advancedSearch.any'),
        color: 'blue'
      });
    }

    if (interp.property_type) {
      params.push({
        icon: <IconHome size={18} />,
        label: t('properties.propertyType'),
        value: interp.property_type === 'villa' ? t('properties.propertyTypes.villa') : 
               interp.property_type === 'condo' ? t('properties.propertyTypes.condo') :
               interp.property_type === 'apartment' ? t('properties.propertyTypes.apartment') :
               interp.property_type,
        color: 'green'
      });
    }

    if (interp.bedrooms !== undefined && interp.bedrooms !== null) {
      params.push({
        icon: <IconHome size={18} />,
        label: t('propertySearch.advancedSearch.bedrooms'),
        value: t('aiResponseViewer.bedroomsCount', { count: interp.bedrooms }),
        color: 'violet'
      });
    }

    if (interp.regions && interp.regions.length > 0) {
      params.push({
        icon: <IconMapPin size={18} />,
        label: t('aiInterpretationModal.regions'),
        value: interp.regions.join(', '),
        color: 'orange'
      });
    }

    if (interp.budget) {
      const budgetType = interp.budget.budget_type === 'per_night' ? t('aiResponseViewer.perNight') :
                         interp.budget.budget_type === 'per_month' ? t('aiResponseViewer.perMonth') :
                         interp.budget.budget_type === 'per_year' ? t('aiResponseViewer.perYear') : '';
      params.push({
        icon: <IconCurrencyDollar size={18} />,
        label: t('propertySearch.advancedSearch.budget'),
        value: `${interp.budget.amount?.toLocaleString('ru-RU')} ${interp.budget.currency}${budgetType}`,
        color: 'cyan'
      });
    }

    if (params.length === 0) {
      return (
        <Center p="xl">
          <Stack align="center" gap="sm">
            <ThemeIcon size={60} radius="md" variant="light" color="gray">
              <IconInfoCircle size={30} />
            </ThemeIcon>
            <Text c="dimmed">{t('aiResponseViewer.parametersNotSpecified')}</Text>
          </Stack>
        </Center>
      );
    }

    return (
      <Grid gutter="md">
        {params.map((param, index) => (
          <Grid.Col key={index} span={{ base: 12, xs: 6, sm: 4 }}>
            <Card
              shadow="sm"
              padding="md"
              radius="md"
              withBorder
              style={{
                background: 'var(--mantine-color-dark-6)',
                borderColor: `var(--mantine-color-${param.color}-5)`,
                height: '100%',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = `0 4px 12px var(--mantine-color-${param.color}-5)`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '';
              }}
            >
              <Stack gap="xs">
                <Group gap="xs">
                  <ThemeIcon size="sm" radius="md" variant="light" color={param.color}>
                    {param.icon}
                  </ThemeIcon>
                  <Text size="xs" c="dimmed">
                    {param.label}
                  </Text>
                </Group>
                <Text fw={600} size="sm">
                  {param.value}
                </Text>
              </Stack>
            </Card>
          </Grid.Col>
        ))}
      </Grid>
    );
  };

  const renderFeatures = () => {
    if (!data?.interpretation) return null;
    const interp = data.interpretation;

    const features = [];

    if (interp.features && interp.features.length > 0) {
      features.push(...interp.features);
    }

    if (interp.furniture) {
      features.push(t('aiResponseViewer.furnitureLabel', { type: interp.furniture }));
    }

    if (interp.parking) {
      features.push(t('aiInterpretationModal.parking'));
    }

    if (interp.pets) {
      features.push(t('aiResponseViewer.withPets'));
    }

    if (features.length === 0) return null;

    return (
      <Card shadow="sm" padding="md" radius="md" withBorder style={{ marginTop: 20 }}>
        <Stack gap="md">
          <Group gap="xs">
            <ThemeIcon size="md" radius="md" variant="light" color="yellow">
              <IconStar size={18} />
            </ThemeIcon>
            <Text fw={500} size="sm">{t('aiResponseViewer.requiredFeatures')}</Text>
          </Group>

          <Group gap="xs">
            {features.map((feature, index) => (
              <Badge
                key={index}
                size="lg"
                variant="filled"
                color="blue"
                radius="md"
              >
                {feature}
              </Badge>
            ))}
          </Group>
        </Stack>
      </Card>
    );
  };

  const renderInterpretationTab = () => {
    if (!data) return null;

    const interp = data.interpretation;
    const confidence = interp.confidence || 0;
    const confidencePercent = Math.round(confidence * 100);
    const confidenceColor = getConfidenceColor(confidence);

    return (
      <Stack gap="lg">
        {/* Your Query Card */}
        <Card shadow="sm" padding="md" radius="md" withBorder>
          <Stack gap="md">
            <Group justify="space-between">
              <Group gap="xs">
                <ThemeIcon size="md" radius="md" variant="light" color="blue">
                  <IconFileText size={18} />
                </ThemeIcon>
                <Text fw={500} size="sm">{t('aiResponseViewer.yourQuery')}</Text>
              </Group>
              <CopyButton value={data.query}>
                {({ copied, copy }) => (
                  <Tooltip label={copied ? t('aiResponseViewer.copied') : t('aiResponseViewer.copy')}>
                    <ActionIcon variant="light" color={copied ? 'green' : 'blue'} onClick={copy}>
                      <IconCopy size={16} />
                    </ActionIcon>
                  </Tooltip>
                )}
              </CopyButton>
            </Group>

            <Paper p="md" radius="md" withBorder style={{ background: 'var(--mantine-color-dark-6)' }}>
              <Text size="sm" style={{ lineHeight: 1.6 }}>
                "{data.query}"
              </Text>
            </Paper>
          </Stack>
        </Card>

        {/* Confidence Card */}
        <Card
          shadow="sm"
          padding="lg"
          radius="md"
          withBorder
          style={{
            borderColor: `var(--mantine-color-${confidenceColor}-5)`,
            borderWidth: 2
          }}
        >
          <Group gap="lg" wrap="nowrap">
            <ThemeIcon size={60} radius="md" variant="light" color={confidenceColor}>
              <IconRobot size={30} />
            </ThemeIcon>
            <Stack gap="sm" style={{ flex: 1 }}>
              <Group justify="space-between">
                <Text size="sm" c="dimmed">
                  {t('aiInterpretationModal.aiConfidence')}
                </Text>
                <Badge size="xl" variant="filled" color={confidenceColor}>
                  {confidencePercent}%
                </Badge>
              </Group>
              <Progress
                value={confidencePercent}
                size="lg"
                radius="md"
                color={confidenceColor}
                striped
                animated
              />
              {interp.reasoning && (
                <Text size="sm" c="dimmed" style={{ lineHeight: 1.6 }}>
                  <Text component="span" fw={600} c={`${confidenceColor}.4`}>
                    {t('aiResponseViewer.explanation')}:
                  </Text>{' '}
                  {interp.reasoning}
                </Text>
              )}
            </Stack>
          </Group>
        </Card>

        {/* Query Type Card */}
        {renderQueryTypeCard()}

        {/* Results Count Card */}
        <Card
          shadow="sm"
          padding="lg"
          radius="md"
          withBorder
          style={{
            background: data.results_count > 0 
              ? 'rgba(82, 196, 26, 0.1)' 
              : 'rgba(255, 77, 79, 0.1)',
            borderColor: data.results_count > 0 ? 'var(--mantine-color-green-5)' : 'var(--mantine-color-red-5)'
          }}
        >
          <Group gap="lg" wrap="nowrap">
            <ThemeIcon 
              size={60} 
              radius="md" 
              variant="light" 
              color={data.results_count > 0 ? 'green' : 'red'}
            >
              {data.results_count > 0 ? <IconCheck size={30} /> : <IconX size={30} />}
            </ThemeIcon>
            <div style={{ flex: 1 }}>
              <Text size="sm" c="dimmed" mb={4}>
                {t('aiResponseViewer.propertiesFound')}
              </Text>
              <Text
                style={{ fontSize: '36px' }}
                fw={700}
                c={data.results_count > 0 ? 'green' : 'red'}
              >
                {data.results_count}
              </Text>
            </div>
          </Group>
        </Card>

        <Divider
          label={
            <Group gap="xs">
              <IconTarget size={16} />
              <Text size="sm" c="dimmed">{t('aiInterpretationModal.extractedParameters')}</Text>
            </Group>
          }
          labelPosition="center"
        />

        {renderMainParameters()}
        {renderFeatures()}

        {/* Low Confidence Warning */}
        {confidence < 0.6 && (
          <Alert
            icon={<IconAlertTriangle size={20} />}
            title={<Text fw={600}>{t('aiResponseViewer.lowConfidenceWarning')}</Text>}
            color="yellow"
            variant="light"
          >
            <Text size="sm">
              {t('aiResponseViewer.lowConfidenceDescription')}
            </Text>
          </Alert>
        )}
      </Stack>
    );
  };

  const renderJSONTab = () => {
    if (!data) return null;

    const jsonContent = data.raw_response || formatJSON(data.interpretation);

    return (
      <Stack gap="md">
        <Group justify="flex-end">
          <CopyButton value={jsonContent}>
            {({ copied, copy }) => (
              <Tooltip label={copied ? t('aiResponseViewer.copied') : t('aiResponseViewer.copyJSON')}>
                <Button
                  variant="light"
                  leftSection={<IconCopy size={16} />}
                  color={copied ? 'green' : 'blue'}
                  onClick={copy}
                >
                  {t('aiResponseViewer.copy')}
                </Button>
              </Tooltip>
            )}
          </CopyButton>
          <Tooltip label={t('aiResponseViewer.downloadJSON')}>
            <Button
              variant="light"
              leftSection={<IconDownload size={16} />}
              onClick={downloadJSON}
            >
              {t('aiResponseViewer.download')}
            </Button>
          </Tooltip>
        </Group>

        <Paper
          p="md"
          radius="md"
          withBorder
          style={{
            background: '#1e1e1e',
            maxHeight: '60vh',
            overflow: 'auto'
          }}
        >
          <Code block style={{ background: 'transparent', color: '#d4d4d4' }}>
            {jsonContent}
          </Code>
        </Paper>
      </Stack>
    );
  };

  const renderFiltersTab = () => {
    if (!data) return null;

    const filtersJSON = formatJSON(data.converted_filters);

    return (
      <Stack gap="md">
        <Group justify="flex-end">
          <CopyButton value={filtersJSON}>
            {({ copied, copy }) => (
              <Tooltip label={copied ? t('aiResponseViewer.copied') : t('aiResponseViewer.copyFilters')}>
                <Button
                  variant="light"
                  leftSection={<IconCopy size={16} />}
                  color={copied ? 'green' : 'blue'}
                  onClick={copy}
                >
                  {t('aiResponseViewer.copy')}
                </Button>
              </Tooltip>
            )}
          </CopyButton>
        </Group>

        <Paper
          p="md"
          radius="md"
          withBorder
          style={{
            background: '#1e1e1e',
            maxHeight: '60vh',
            overflow: 'auto'
          }}
        >
          <Code block style={{ background: 'transparent', color: '#d4d4d4' }}>
            {filtersJSON}
          </Code>
        </Paper>
      </Stack>
    );
  };

  return (
    <Modal
      opened={visible}
      onClose={onClose}
      size={isMobile ? 'full' : 'xl'}
      title={
        <Group gap="md">
          <ThemeIcon size="xl" radius="md" variant="gradient" gradient={{ from: 'blue', to: 'cyan' }}>
            <IconRobot size={24} />
          </ThemeIcon>
          <div style={{ flex: 1 }}>
            <Text fw={600} size="lg">{t('aiResponseViewer.title')}</Text>
            <Text size="xs" c="dimmed">{t('aiResponseViewer.subtitle')}</Text>
          </div>
          {data && (
            <Badge size="lg" variant="filled" color="blue" leftSection={<IconClock size={14} />}>
              ID: {data.id}
            </Badge>
          )}
        </Group>
      }
      centered
      styles={{
        body: { padding: isMobile ? 12 : 24 }
      }}
    >
      {loading ? (
        <Center p={80}>
          <Stack align="center" gap="md">
            <Loader size="lg" />
            <Text c="dimmed">{t('aiResponseViewer.loadingData')}</Text>
          </Stack>
        </Center>
      ) : data ? (
        <Tabs defaultValue="interpretation" variant="pills">
          <Tabs.List grow={isMobile}>
            <Tabs.Tab
              value="interpretation"
              leftSection={<IconTarget size={16} />}
            >
              {!isMobile && t('aiResponseViewer.interpretationTab')}
            </Tabs.Tab>
            <Tabs.Tab
              value="raw"
              leftSection={<IconFileText size={16} />}
            >
              {!isMobile && t('aiResponseViewer.rawJSONTab')}
            </Tabs.Tab>
            <Tabs.Tab
              value="filters"
              leftSection={<IconSettings size={16} />}
            >
              {!isMobile && t('aiResponseViewer.filtersTab')}
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="interpretation" pt="lg">
            <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
              {renderInterpretationTab()}
            </div>
          </Tabs.Panel>

          <Tabs.Panel value="raw" pt="lg">
            {renderJSONTab()}
          </Tabs.Panel>

          <Tabs.Panel value="filters" pt="lg">
            {renderFiltersTab()}
          </Tabs.Panel>
        </Tabs>
      ) : (
        <Center p={80}>
          <Stack align="center" gap="md">
            <ThemeIcon size={80} radius="md" variant="light" color="gray">
              <IconChartBar size={40} />
            </ThemeIcon>
            <Text c="dimmed" size="sm">{t('aiResponseViewer.noData')}</Text>
          </Stack>
        </Center>
      )}
    </Modal>
  );
};

export default AIResponseViewer;