// frontend/src/modules/Properties/PropertySearch.tsx
import { useState, useEffect, useRef } from 'react';
import {
  Card,
  Button,
  Stack,
  Group,
  Text,
  Textarea,
  Tabs,
  Badge,
  Avatar,
  Tooltip,
  Select,
  ThemeIcon,
  Paper,
  Divider,
  ActionIcon,
  Center,
  Loader,
  SegmentedControl,
  ScrollArea,
  Alert,
  Container
} from '@mantine/core';
import {
  IconSearch,
  IconRobot,
  IconFilter,
  IconHistory,
  IconRefresh,
  IconUser,
  IconHeadset,
  IconTrash,
  IconEye,
  IconSend,
  IconAlertTriangle,
  IconBrain,
  IconMessage,
  IconChevronRight,
  IconMessageCircle,
  IconClock,
  IconArrowLeft,
  IconMessagePlus,
  IconCheck,
  IconInfoCircle
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import { useMediaQuery } from '@mantine/hooks';
import { propertySearchApi, SearchFilters, PropertySearchResult, AIConversation } from '@/api/propertySearch.api';
import { useAuthStore } from '@/store/authStore';
import PropertySearchResults from './components/PropertySearchResults';
import PropertySearchHistory from './components/PropertySearchHistory';
import MapSearchModal from './components/MapSearchModal';
import AIInterpretationModal from './components/AIInterpretationModal';
import AdvancedSearch from './components/AdvancedSearch';
import dayjs from 'dayjs';

const PropertySearch = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { hasPermission } = useAuthStore();
  const chatEndRef = useRef<HTMLDivElement>(null);
  const isMobile = useMediaQuery('(max-width: 768px)');

  // Проверка прав доступа
  useEffect(() => {
    if (!hasPermission('properties.read')) {
      notifications.show({
        title: t('errors.generic'),
        message: t('propertySearch.noAccess'),
        color: 'red',
        icon: <IconAlertTriangle size={18} />
      });
      navigate('/');
    }
  }, [hasPermission, navigate, t]);

  // States
  const [activeTab, setActiveTab] = useState<string>('search');
  const [searchMode, setSearchMode] = useState<'ai' | 'manual'>('ai');
  const [aiMode, setAiMode] = useState<'property_search' | 'client_agent'>('property_search');
  const [loading, setLoading] = useState(false);

  const [aiQuery, setAiQuery] = useState('');
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(null);
  const [conversationMessages, setConversationMessages] = useState<any[]>([]);
  const [aiInterpretation, setAiInterpretation] = useState<any>(null);
  const [showInterpretation, setShowInterpretation] = useState(false);
  const [requestedFeatures, setRequestedFeatures] = useState<string[]>([]);
  const [mustHaveFeatures, setMustHaveFeatures] = useState<string[]>([]);

  const [filters, setFilters] = useState<SearchFilters>({
    budget: {
      search_below_max: true
    }
  });

  const [searchResults, setSearchResults] = useState<PropertySearchResult[]>([]);
  const [executionTime, setExecutionTime] = useState<number>(0);

  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [conversationsLoading, setConversationsLoading] = useState(false);

  const [mapModalVisible, setMapModalVisible] = useState(false);
  const [historyRefresh, setHistoryRefresh] = useState(0);

  // Effects
  useEffect(() => {
    if (activeTab === 'conversations') {
      loadConversations();
    }
  }, [activeTab, aiMode]);

  useEffect(() => {
    scrollToBottom();
  }, [conversationMessages]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // API Handlers
  const loadConversations = async () => {
    setConversationsLoading(true);
    try {
      const { data } = await propertySearchApi.getConversations({ 
        limit: 50,
        mode: aiMode 
      });
      setConversations(data.data.conversations);
    } catch (error: any) {
      notifications.show({
        title: t('errors.generic'),
        message: t('propertySearch.errorLoadingConversations'),
        color: 'red',
        icon: <IconAlertTriangle size={18} />
      });
    } finally {
      setConversationsLoading(false);
    }
  };

  const loadConversation = async (conversationId: number) => {
    setLoading(true);
    try {
      const { data } = await propertySearchApi.getConversationById(conversationId);
      
      setCurrentConversationId(conversationId);
      setConversationMessages(data.data.messages);
      setActiveTab('search');
      
      notifications.show({
        title: t('common.success'),
        message: t('propertySearch.conversationLoaded'),
        color: 'green',
        icon: <IconCheck size={18} />
      });
    } catch (error: any) {
      notifications.show({
        title: t('errors.generic'),
        message: t('propertySearch.errorLoadingConversation'),
        color: 'red',
        icon: <IconAlertTriangle size={18} />
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteConversation = async (conversationId: number) => {
    try {
      await propertySearchApi.deleteConversation(conversationId);
      notifications.show({
        title: t('common.success'),
        message: t('propertySearch.conversationDeleted'),
        color: 'green',
        icon: <IconCheck size={18} />
      });
      loadConversations();
      
      if (currentConversationId === conversationId) {
        handleNewConversation();
      }
    } catch (error: any) {
      notifications.show({
        title: t('errors.generic'),
        message: t('propertySearch.errorDeletingConversation'),
        color: 'red',
        icon: <IconAlertTriangle size={18} />
      });
    }
  };

  const handleNewConversation = () => {
    setCurrentConversationId(null);
    setConversationMessages([]);
    setSearchResults([]);
    setAiQuery('');
    setAiInterpretation(null);
    setRequestedFeatures([]);
    setMustHaveFeatures([]);
  };

  const handleAISearch = async () => {
    if (!aiQuery.trim()) {
      notifications.show({
        title: t('common.warning'),
        message: t('propertySearch.enterQueryText'),
        color: 'yellow',
        icon: <IconAlertTriangle size={18} />
      });
      return;
    }

    setLoading(true);
    try {
      const { data } = await propertySearchApi.searchWithAI(aiQuery, currentConversationId || undefined);
      
      setRequestedFeatures(data.data.requested_features || []);
      setMustHaveFeatures(data.data.must_have_features || []);
      setCurrentConversationId(data.data.conversationId);
      setConversationMessages(prev => [
        ...prev,
        { role: 'user', content: aiQuery, created_at: new Date().toISOString() },
        { role: 'assistant', content: data.data.aiResponse, created_at: new Date().toISOString() }
      ]);
      
      setAiInterpretation(data.data.interpretation);
      setSearchResults(data.data.properties);
      setExecutionTime(data.data.execution_time_ms);
      setHistoryRefresh(prev => prev + 1);
      setAiQuery('');

      notifications.show({
        title: t('common.success'),
        message: t('propertySearch.foundProperties', { 
          count: data.data.total, 
          time: (data.data.execution_time_ms / 1000).toFixed(2) 
        }),
        color: 'green',
        icon: <IconCheck size={18} />
      });

      // Low confidence warning
      if (data.data.interpretation.confidence < 0.7) {
        modals.openConfirmModal({
          title: (
            <Group gap="sm">
              <ThemeIcon size="lg" color="yellow" variant="light">
                <IconAlertTriangle size={20} />
              </ThemeIcon>
              <Text fw={600}>{t('propertySearch.lowConfidence')}</Text>
            </Group>
          ),
          children: (
            <Stack gap="md">
              <Text size="sm">{t('propertySearch.lowConfidenceDescription')}</Text>
              
              <Alert icon={<IconInfoCircle size={16} />} color="yellow" variant="light">
                <Text size="sm" fw={500}>{t('propertySearch.reason')}:</Text>
                <Text size="sm">{data.data.interpretation.reasoning}</Text>
              </Alert>

              <Text size="sm">{t('propertySearch.lowConfidenceRecommendation')}</Text>
            </Stack>
          ),
          labels: { 
            confirm: t('propertySearch.understood'), 
            cancel: t('common.cancel')
          },
          confirmProps: { 
            variant: 'gradient', 
            gradient: { from: 'yellow', to: 'orange' } 
          },
          cancelProps: {
            style: { display: 'none' } // Скрываем кнопку отмены
          },
          centered: true
        });
      }
    } catch (error: any) {
      notifications.show({
        title: t('errors.generic'),
        message: error.response?.data?.message || t('propertySearch.errorAISearch'),
        color: 'red',
        icon: <IconAlertTriangle size={18} />
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClientAgentChat = async () => {
    if (!aiQuery.trim()) {
      notifications.show({
        title: t('common.warning'),
        message: t('propertySearch.enterMessageText'),
        color: 'yellow',
        icon: <IconAlertTriangle size={18} />
      });
      return;
    }

    setLoading(true);
    try {
      const { data } = await propertySearchApi.chatWithClient(aiQuery, currentConversationId || undefined);

      setCurrentConversationId(data.data.conversationId);
      setConversationMessages(prev => [
        ...prev,
        { role: 'user', content: aiQuery, created_at: new Date().toISOString() },
        { role: 'assistant', content: data.data.response, created_at: new Date().toISOString() }
      ]);
      
      if (data.data.shouldShowProperties && data.data.properties.length > 0) {
        setSearchResults(data.data.properties);
        setExecutionTime(data.data.execution_time_ms);
        setRequestedFeatures(data.data.requested_features || []);
        setMustHaveFeatures(data.data.must_have_features || []);
      }
      
      setAiQuery('');
      
      notifications.show({
        title: t('common.success'),
        message: t('propertySearch.responseReceived'),
        color: 'green',
        icon: <IconCheck size={18} />
      });
    } catch (error: any) {
      notifications.show({
        title: t('errors.generic'),
        message: error.response?.data?.message || t('propertySearch.errorAIChat'),
        color: 'red',
        icon: <IconAlertTriangle size={18} />
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManualSearch = async (searchFilters: any) => {
    setLoading(true);
    try {
      const { data } = await propertySearchApi.searchManual(searchFilters);

      setSearchResults(data.data.properties);
      setExecutionTime(data.data.execution_time_ms);
      setAiInterpretation(null);
      setHistoryRefresh(prev => prev + 1);
      setRequestedFeatures(data.data.requested_features || []);
      setMustHaveFeatures(data.data.must_have_features || []);

      notifications.show({
        title: t('common.success'),
        message: t('propertySearch.foundProperties', { 
          count: data.data.total, 
          time: (data.data.execution_time_ms / 1000).toFixed(2) 
        }),
        color: 'green',
        icon: <IconCheck size={18} />
      });
    } catch (error: any) {
      notifications.show({
        title: t('errors.generic'),
        message: error.response?.data?.message || t('propertySearch.errorSearch'),
        color: 'red',
        icon: <IconAlertTriangle size={18} />
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setFilters({
      budget: {
        search_below_max: true
      }
    });
    setSearchResults([]);
    setAiInterpretation(null);
    setAiQuery('');
    setRequestedFeatures([]);
    setMustHaveFeatures([]);
  };

  const handleMapSearchApply = (mapData: { lat: number; lng: number; radius_km: number }) => {
    setFilters(prev => ({
      ...prev,
      map_search: mapData
    }));
    setMapModalVisible(false);
    notifications.show({
      title: t('common.success'),
      message: t('propertySearch.mapZoneSet'),
      color: 'green',
      icon: <IconCheck size={18} />
    });
  };

  // Render Functions
  const renderChatHistory = () => {
    if (conversationMessages.length === 0) {
      return (
        <Center p="xl">
          <Stack align="center" gap="md">
            <ThemeIcon size={80} radius="xl" variant="light" color={aiMode === 'property_search' ? 'blue' : 'teal'}>
              {aiMode === 'property_search' ? <IconRobot size={40} /> : <IconHeadset size={40} />}
            </ThemeIcon>
            <Text c="dimmed" size="sm" ta="center">
              {aiMode === 'property_search' 
                ? t('propertySearch.startDialogWithAI')
                : t('propertySearch.startCommunicationWithClient')}
            </Text>
          </Stack>
        </Center>
      );
    }

    return (
      <ScrollArea h={isMobile ? 400 : 500} offsetScrollbars>
        <Stack gap="md" p="md">
          {conversationMessages.map((msg, index) => (
            <Group
              key={index}
              align="flex-start"
              gap="sm"
              style={{
                flexDirection: msg.role === 'user' ? 'row-reverse' : 'row'
              }}
            >
              <Avatar
                size="md"
                radius="xl"
                variant="gradient"
                gradient={msg.role === 'user' 
                  ? { from: 'blue', to: 'cyan', deg: 135 }
                  : { from: 'teal', to: 'green', deg: 135 }
                }
              >
                {msg.role === 'user' ? <IconUser size={20} /> : <IconRobot size={20} />}
              </Avatar>

              <Paper
                p="md"
                radius="md"
                shadow="sm"
                style={{
                  maxWidth: isMobile ? '75%' : '70%',
                  background: msg.role === 'user'
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : 'var(--mantine-color-dark-6)',
                  color: msg.role === 'user' ? 'white' : 'inherit'
                }}
              >
                <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
                  {msg.content}
                </Text>
                <Text 
                  size="xs" 
                  c={msg.role === 'user' ? 'rgba(255,255,255,0.7)' : 'dimmed'} 
                  mt="xs"
                >
                  {dayjs(msg.created_at).format('HH:mm')}
                </Text>
              </Paper>
            </Group>
          ))}
          <div ref={chatEndRef} />
        </Stack>
      </ScrollArea>
    );
  };

  const renderAISearch = () => (
    <Stack gap="lg">
      {/* AI Mode Selector */}
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Stack gap="md">
          <Group justify="space-between" wrap="nowrap">
            <Group gap="sm">
              <ThemeIcon 
                size="xl" 
                radius="md" 
                variant="gradient" 
                gradient={aiMode === 'property_search' 
                  ? { from: 'blue', to: 'cyan' }
                  : { from: 'teal', to: 'green' }
                }
              >
                {aiMode === 'property_search' ? <IconSearch size={24} /> : <IconHeadset size={24} />}
              </ThemeIcon>
              <div>
                <Text fw={600} size="lg">
                  {aiMode === 'property_search' 
                    ? t('propertySearch.aiPropertySearch')
                    : t('propertySearch.clientAgentMode')}
                </Text>
                <Text size="xs" c="dimmed">
                  {aiMode === 'property_search'
                    ? t('propertySearch.aiSearchDescription')
                    : t('propertySearch.clientAgentDescription')}
                </Text>
              </div>
            </Group>

            {currentConversationId && (
              <Tooltip label={t('propertySearch.newConversation')}>
                <ActionIcon
                  variant="light"
                  color="red"
                  size="lg"
                  onClick={handleNewConversation}
                >
                  <IconMessagePlus size={20} />
                </ActionIcon>
              </Tooltip>
            )}
          </Group>

          <SegmentedControl
            value={aiMode}
            onChange={(value: string) => {
              setAiMode(value as 'property_search' | 'client_agent');
              handleNewConversation();
            }}
            data={[
              {
                value: 'property_search',
                label: (
                  <Group gap="xs" justify="center">
                    <IconSearch size={16} />
                    <span>{t('propertySearch.propertySearch')}</span>
                  </Group>
                )
              },
              {
                value: 'client_agent',
                label: (
                  <Group gap="xs" justify="center">
                    <IconHeadset size={16} />
                    <span>{t('propertySearch.clientAgent')}</span>
                  </Group>
                )
              }
            ]}
            fullWidth={isMobile}
            color={aiMode === 'property_search' ? 'blue' : 'teal'}
          />

          {currentConversationId && (
            <Alert icon={<IconMessageCircle size={16} />} color="blue" variant="light">
              <Text size="sm">
                {t('propertySearch.conversationNumber', { id: currentConversationId })}
              </Text>
            </Alert>
          )}
        </Stack>
      </Card>

      {/* Chat History */}
      <Card shadow="sm" padding={0} radius="md" withBorder>
        {renderChatHistory()}
      </Card>

      {/* Chat Input */}
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Stack gap="md">
          <Textarea
            placeholder={
              aiMode === 'property_search'
                ? t('propertySearch.searchPlaceholder')
                : t('propertySearch.clientMessagePlaceholder')
            }
            value={aiQuery}
            onChange={(e) => setAiQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                aiMode === 'property_search' ? handleAISearch() : handleClientAgentChat();
              }
            }}
            disabled={loading}
            minRows={isMobile ? 3 : 2}
            maxRows={6}
            autosize
            styles={{
              input: {
                fontSize: '16px'
              }
            }}
          />

          <Button
            variant="gradient"
            gradient={aiMode === 'property_search' 
              ? { from: 'blue', to: 'cyan' }
              : { from: 'teal', to: 'green' }
            }
            size="lg"
            fullWidth
            leftSection={<IconSend size={20} />}
            onClick={aiMode === 'property_search' ? handleAISearch : handleClientAgentChat}
            loading={loading}
          >
            {t('propertySearch.send')}
          </Button>
        </Stack>
      </Card>

      {/* AI Interpretation */}
      {aiInterpretation && aiMode === 'property_search' && (
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Stack gap="md">
            <Group justify="space-between">
              <Group gap="sm">
                <ThemeIcon size="lg" radius="md" variant="light" color="violet">
                  <IconBrain size={20} />
                </ThemeIcon>
                <div>
                  <Text fw={600}>{t('propertySearch.aiInterpretation')}</Text>
                  <Badge
                    size="sm"
                    variant="gradient"
                    gradient={
                      aiInterpretation.confidence > 0.8
                        ? { from: 'teal', to: 'green' }
                        : { from: 'yellow', to: 'orange' }
                    }
                  >
                    {Math.round(aiInterpretation.confidence * 100)}% {t('propertySearch.confidence')}
                  </Badge>
                </div>
              </Group>

              <Button
                variant="subtle"
                size="xs"
                onClick={() => setShowInterpretation(true)}
                rightSection={<IconChevronRight size={14} />}
              >
                {t('propertySearch.details')}
              </Button>
            </Group>

            <Text size="sm" c="dimmed">
              <strong>{t('propertySearch.queryUnderstanding')}:</strong> {aiInterpretation.reasoning}
            </Text>
          </Stack>
        </Card>
      )}
    </Stack>
  );

  const renderConversations = () => (
    <Stack gap="lg">
      {/* Header with Mode Selector */}
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Group justify="space-between">
          <Group gap="sm">
            <ThemeIcon size="lg" radius="md" variant="gradient" gradient={{ from: 'violet', to: 'grape' }}>
              <IconHistory size={20} />
            </ThemeIcon>
            <div>
              <Text fw={600}>
                {aiMode === 'property_search' ? t('propertySearch.searchDialogs') : t('propertySearch.clientDialogs')}
              </Text>
              <Text size="xs" c="dimmed">
                {conversations.length} {t('propertySearch.total')}
              </Text>
            </div>
          </Group>

          <Group gap="xs">
            <Select
              value={aiMode}
              onChange={(value: string | null) => {
                if (value) {
                  setAiMode(value as 'property_search' | 'client_agent');
                  loadConversations();
                }
              }}
              data={[
                { value: 'property_search', label: t('propertySearch.propertySearch') },
                { value: 'client_agent', label: t('propertySearch.clientAgent') }
              ]}
              leftSection={<IconFilter size={16} />}
              styles={{ input: { width: isMobile ? '140px' : '180px' } }}
            />

            <Tooltip label={t('propertySearch.refresh')}>
              <ActionIcon
                variant="light"
                color="blue"
                size="lg"
                onClick={loadConversations}
                loading={conversationsLoading}
              >
                <IconRefresh size={18} />
              </ActionIcon>
            </Tooltip>
          </Group>
        </Group>
      </Card>

      {/* Conversations List */}
      {conversationsLoading ? (
        <Center p="xl">
          <Loader size="xl" variant="dots" />
        </Center>
      ) : conversations.length === 0 ? (
        <Center p="xl">
          <Stack align="center" gap="md">
            <ThemeIcon size={80} radius="xl" variant="light" color="gray">
              <IconHistory size={40} />
            </ThemeIcon>
            <Text c="dimmed" size="sm">{t('propertySearch.noConversations')}</Text>
          </Stack>
        </Center>
      ) : (
        <Stack gap="md">
          {conversations.map((conv) => (
            <Card
              key={conv.id}
              shadow="sm"
              padding="lg"
              radius="md"
              withBorder
              style={{
                transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(121, 80, 242, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '';
              }}
            >
              <Group justify="space-between" wrap="nowrap" align="flex-start">
                <Group gap="md" align="flex-start" style={{ flex: 1, minWidth: 0 }}>
                  <Avatar
                    size="lg"
                    radius="md"
                    variant="gradient"
                    gradient={conv.mode === 'property_search' 
                      ? { from: 'blue', to: 'cyan' }
                      : { from: 'teal', to: 'green' }
                    }
                  >
                    {conv.mode === 'property_search' ? <IconSearch size={24} /> : <IconHeadset size={24} />}
                  </Avatar>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Group gap="xs" mb={4}>
                      <Text fw={600} size="sm" lineClamp={1}>
                        {conv.title || t('propertySearch.conversationId', { id: conv.id })}
                      </Text>
                      <Badge size="sm" variant="light" color="blue">
                        {conv.messages_count} {t('propertySearch.messages')}
                      </Badge>
                    </Group>

                    <Text size="xs" c="dimmed" lineClamp={2} mb={8}>
                      <strong>{t('propertySearch.firstMessage')}:</strong> {conv.first_message}
                    </Text>

                    <Group gap="xs">
                      <IconClock size={12} />
                      <Text size="xs" c="dimmed">
                        {t('propertySearch.updated')}: {dayjs(conv.updated_at).format('DD.MM.YYYY HH:mm')}
                      </Text>
                    </Group>
                  </div>
                </Group>

                <Group gap="xs" wrap="nowrap">
                  <Tooltip label={t('propertySearch.continueDialog')}>
                    <ActionIcon
                      variant="light"
                      color="blue"
                      size="lg"
                      onClick={() => loadConversation(conv.id)}
                    >
                      <IconEye size={18} />
                    </ActionIcon>
                  </Tooltip>

                  <Tooltip label={t('propertySearch.deleteDialog')}>
                    <ActionIcon
                      variant="light"
                      color="red"
                      size="lg"
                      onClick={() => {
                        modals.openConfirmModal({
                          title: t('propertySearch.deleteDialogConfirm'),
                          children: <Text size="sm">{t('propertySearch.cannotUndo')}</Text>,
                          labels: { confirm: t('propertySearch.delete'), cancel: t('propertySearch.cancel') },
                          confirmProps: { color: 'red' },
                          onConfirm: () => deleteConversation(conv.id)
                        });
                      }}
                    >
                      <IconTrash size={18} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              </Group>
            </Card>
          ))}
        </Stack>
      )}
    </Stack>
  );

  return (
    <Container size="xl" p={isMobile ? 'sm' : 'md'}>
      <Stack gap="lg">
        {/* Header */}
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Group justify="space-between" wrap="nowrap">
            <Group gap="sm">
              <ThemeIcon size="xl" radius="md" variant="gradient" gradient={{ from: 'violet', to: 'grape' }}>
                <IconSearch size={28} />
              </ThemeIcon>
              <div>
                <Text fw={600} size="xl">{t('propertySearch.title')}</Text>
                <Text size="xs" c="dimmed">{t('propertySearch.subtitle')}</Text>
              </div>
            </Group>

            <Button
              variant="light"
              leftSection={<IconArrowLeft size={18} />}
              onClick={() => navigate('/properties')}
            >
              {isMobile ? null : t('propertySearch.backToList')}
            </Button>
          </Group>
        </Card>

        {/* Main Content */}
        <Tabs value={activeTab} onChange={(value) => setActiveTab(value || 'search')} keepMounted={false}>
          <Tabs.List grow={isMobile}>
            <Tabs.Tab value="search" leftSection={<IconSearch size={16} />}>
              {t('propertySearch.search')}
            </Tabs.Tab>
            <Tabs.Tab value="conversations" leftSection={<IconMessage size={16} />}>
              {t('propertySearch.dialogs')}
            </Tabs.Tab>
            <Tabs.Tab value="history" leftSection={<IconHistory size={16} />}>
              {t('propertySearch.searchHistory')}
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="search" pt="lg">
            <Stack gap="lg">
              {/* Search Mode Toggle */}
              <SegmentedControl
                value={searchMode}
                onChange={(value: string) => setSearchMode(value as 'ai' | 'manual')}
                data={[
                  {
                    value: 'ai',
                    label: (
                      <Group gap="xs" justify="center">
                        <IconRobot size={16} />
                        <span>{t('propertySearch.aiSearch')}</span>
                      </Group>
                    )
                  },
                  {
                    value: 'manual',
                    label: (
                      <Group gap="xs" justify="center">
                        <IconFilter size={16} />
                        <span>{t('propertySearch.advanced')}</span>
                      </Group>
                    )
                  }
                ]}
                fullWidth
                color="violet"
                size="md"
              />

              {/* Content based on search mode */}
              {searchMode === 'ai' ? (
                renderAISearch()
              ) : (
                <AdvancedSearch
                  onSearch={handleManualSearch}
                  onReset={handleResetFilters}
                  onMapSearch={() => setMapModalVisible(true)}
                  loading={loading}
                  initialFilters={filters}
                  mapSearchActive={!!filters.map_search}
                />
              )}

              {/* Search Results */}
              {searchResults.length > 0 && (
                <>
                  <Divider />
                  <PropertySearchResults
                    properties={searchResults}
                    executionTime={executionTime}
                    onViewProperty={(id) => navigate(`/properties/view/${id}`)}
                    requestedFeatures={requestedFeatures}
                    mustHaveFeatures={mustHaveFeatures}
                  />
                </>
              )}

              {searchResults.length === 0 && !loading && searchMode === 'manual' && (
                <Center p="xl">
                  <Stack align="center" gap="md">
                    <ThemeIcon size={80} radius="xl" variant="light" color="gray">
                      <IconSearch size={40} />
                    </ThemeIcon>
                    <Text c="dimmed" size="sm">{t('propertySearch.startSearchToSeeResults')}</Text>
                  </Stack>
                </Center>
              )}
            </Stack>
          </Tabs.Panel>

          <Tabs.Panel value="conversations" pt="lg">
            {renderConversations()}
          </Tabs.Panel>

          <Tabs.Panel value="history" pt="lg">
            <PropertySearchHistory
              refreshTrigger={historyRefresh}
              onLoadSearch={(log: any, properties: any[]) => {
                setSearchResults(properties);
                setExecutionTime(log.execution_time_ms);
              
                if (log.search_type === 'ai') {
                  setSearchMode('ai');
                  if (log.ai_query) {
                    setConversationMessages([
                      { 
                        role: 'user', 
                        content: log.ai_query, 
                        created_at: log.created_at 
                      },
                      {
                        role: 'assistant',
                        content: t('propertySearch.foundPropertiesCount', { count: properties.length }),
                        created_at: log.created_at
                      }
                    ]);
                  }
                  if (log.conversation_id) {
                    setCurrentConversationId(log.conversation_id);
                  }
                } else {
                  setSearchMode('manual');
                  if (log.search_params) {
                    setFilters(log.search_params);
                  }
                }
                
                setActiveTab('search');
                
                notifications.show({
                  title: t('common.success'),
                  message: t('propertySearch.loadedFromHistory', { count: properties.length }),
                  color: 'green',
                  icon: <IconCheck size={18} />
                });
              }}
              onNavigateToChat={(conversationId: number) => {
                loadConversation(conversationId);
                setActiveTab('search');
                notifications.show({
                  title: t('common.success'),
                  message: t('propertySearch.conversationLoaded'),
                  color: 'green',
                  icon: <IconCheck size={18} />
                });
              }}
            />
          </Tabs.Panel>
        </Tabs>
      </Stack>

      {/* Modals */}
      <MapSearchModal
        visible={mapModalVisible}
        onClose={() => setMapModalVisible(false)}
        onApply={handleMapSearchApply}
        initialData={filters.map_search}
      />

      <AIInterpretationModal
        visible={showInterpretation}
        onClose={() => setShowInterpretation(false)}
        interpretation={aiInterpretation}
      />
    </Container>
  );
};

export default PropertySearch;