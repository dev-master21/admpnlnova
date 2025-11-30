// frontend/src/modules/Properties/components/AIDescriptionGenerator.tsx
import React, { useState, useEffect } from 'react';
import {
  Card,
  Stack,
  Group,
  Button,
  Text,
  Progress,
  RingProgress,
  Alert,
  Modal,
  Textarea,
  Badge,
  ThemeIcon,
  Grid,
  Paper,
  Loader,
  Center,
  Divider,
  Tooltip,
  Collapse,
  ActionIcon,
  Box,
  List,
  SimpleGrid,
  Title
} from '@mantine/core';
import {
  IconRobot,
  IconCheck,
  IconX,
  IconSettings,
  IconBolt,
  IconPhoto,
  IconTags,
  IconMapPin,
  IconBed,
  IconAlertCircle,
  IconInfoCircle,
  IconChevronDown,
  IconChevronUp,
  IconSparkles,
  IconCircleCheck,
  IconFileText,
  IconLanguage,
  IconClipboardCheck
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { useTranslation } from 'react-i18next';
import { propertiesApi } from '@/api/properties.api';

interface AIDescriptionGeneratorProps {
  propertyId: number;
  onGenerated: (descriptions: any, features: string[]) => void;
  disabled?: boolean;
}

interface ReadinessCheck {
  ready: boolean;
  checks: {
    features: { ready: boolean; count: number };
    photos: { ready: boolean; count: number };
    location: { ready: boolean };
    bedrooms: { ready: boolean };
  };
  rateLimit: {
    allowed: boolean;
    remainingSeconds: number;
  };
}

interface GenerationResult {
  descriptions: any;
  featuresFound: string[];
  languagesGenerated: string[];
}

const AIDescriptionGenerator: React.FC<AIDescriptionGeneratorProps> = ({
  propertyId,
  onGenerated,
  disabled = false
}) => {
  const { t } = useTranslation();
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  const [readiness, setReadiness] = useState<ReadinessCheck | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [settingsOpened, { open: openSettings, close: closeSettings }] = useDisclosure(false);
  const [resultOpened, { open: openResult, close: closeResult }] = useDisclosure(false);
  const [detailsOpened, setDetailsOpened] = useState(false);
  const [additionalPrompt, setAdditionalPrompt] = useState('');
  const [generationProgress, setGenerationProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null);

  useEffect(() => {
    if (propertyId) {
      checkReadiness();
    }
  }, [propertyId]);

  const checkReadiness = async () => {
    setChecking(true);
    try {
      const { data } = await propertiesApi.checkAIGenerationReadiness(propertyId);
      setReadiness(data.data);
    } catch (error: any) {
      notifications.show({
        title: t('errors.generic'),
        message: t('aiDescriptionGenerator.errorCheckingReadiness'),
        color: 'red',
        icon: <IconX size={18} />
      });
    } finally {
      setChecking(false);
    }
  };

  const handleGenerate = async () => {
    if (!readiness?.ready) {
      notifications.show({
        title: t('aiDescriptionGenerator.conditionsNotMet'),
        message: t('aiDescriptionGenerator.completeRequirements'),
        color: 'orange',
        icon: <IconAlertCircle size={18} />
      });
      return;
    }

    if (!readiness?.rateLimit.allowed) {
      const minutes = Math.ceil(readiness.rateLimit.remainingSeconds / 60);
      notifications.show({
        title: t('aiDescriptionGenerator.rateLimitTitle'),
        message: t('aiDescriptionGenerator.pleaseWait', { minutes }),
        color: 'orange',
        icon: <IconAlertCircle size={18} />
      });
      return;
    }

    setLoading(true);
    setGenerationProgress(0);
    setCurrentStep(t('aiDescriptionGenerator.preparing'));

    try {
      const progressInterval = setInterval(() => {
        setGenerationProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + 10;
        });
      }, 2000);

      setCurrentStep(t('aiDescriptionGenerator.analyzingPhotos'));
      
      setTimeout(() => {
        setCurrentStep(t('aiDescriptionGenerator.detectingFeatures'));
      }, 3000);

      setTimeout(() => {
        setCurrentStep(t('aiDescriptionGenerator.generatingDescriptions'));
      }, 6000);

      const { data } = await propertiesApi.generateAIDescription(
        propertyId,
        additionalPrompt || undefined
      );

      clearInterval(progressInterval);
      setGenerationProgress(100);
      setCurrentStep(t('aiDescriptionGenerator.done'));

      if (data.success) {
        // Определяем какие языки были сгенерированы
        const languagesGenerated: string[] = [];
        const descriptions = data.data.descriptions;
        
        if (descriptions.ru?.description) languagesGenerated.push('ru');
        if (descriptions.en?.description) languagesGenerated.push('en');
        if (descriptions.th?.description) languagesGenerated.push('th');
        if (descriptions.zh?.description) languagesGenerated.push('zh');
        if (descriptions.he?.description) languagesGenerated.push('he');

        // Сохраняем результат и открываем модальное окно
        setGenerationResult({
          descriptions: data.data.descriptions,
          featuresFound: data.data.featuresFound || [],
          languagesGenerated
        });

        openResult();

        // Передаём данные в родительский компонент
        onGenerated(data.data.descriptions, data.data.featuresFound);
        checkReadiness();
      }
    } catch (error: any) {
      notifications.show({
        title: t('errors.generic'),
        message: error.response?.data?.message || t('aiDescriptionGenerator.errorGenerating'),
        color: 'red',
        icon: <IconX size={18} />
      });
    } finally {
      setLoading(false);
      setGenerationProgress(0);
      setCurrentStep('');
    }
  };

  const getLanguageName = (code: string): string => {
    const names: Record<string, string> = {
      ru: t('translationsEditor.languages.russian') || 'Русский',
      en: t('translationsEditor.languages.english') || 'English',
      th: t('translationsEditor.languages.thai') || 'ไทย',
      zh: t('translationsEditor.languages.chinese') || '中文',
      he: t('translationsEditor.languages.hebrew') || 'עברית'
    };
    return names[code] || code;
  };

  if (checking) {
    return (
      <Card shadow="sm" padding="xl" radius="md" withBorder>
        <Center style={{ minHeight: 200 }}>
          <Stack align="center" gap="md">
            <Loader size="xl" variant="dots" />
            <Text c="dimmed">{t('aiDescriptionGenerator.checkingReadiness')}</Text>
          </Stack>
        </Center>
      </Card>
    );
  }

  if (!readiness) {
    return null;
  }

  const allReady = readiness.ready && readiness.rateLimit.allowed;
  const totalProgress = Math.round(
    ((readiness.checks.features.ready ? 25 : 0) +
    (readiness.checks.photos.ready ? 25 : 0) +
    (readiness.checks.location.ready ? 25 : 0) +
    (readiness.checks.bedrooms.ready ? 25 : 0))
  );

  const requirements = [
    {
      key: 'features',
      icon: IconTags,
      color: 'blue',
      label: t('aiDescriptionGenerator.specifyFeatures'),
      ready: readiness.checks.features.ready,
      count: readiness.checks.features.count,
      max: 15,
      showProgress: true
    },
    {
      key: 'photos',
      icon: IconPhoto,
      color: 'violet',
      label: t('aiDescriptionGenerator.uploadPhotos'),
      ready: readiness.checks.photos.ready,
      count: readiness.checks.photos.count,
      max: 12,
      showProgress: true
    },
    {
      key: 'location',
      icon: IconMapPin,
      color: 'green',
      label: t('aiDescriptionGenerator.specifyAddress'),
      ready: readiness.checks.location.ready,
      showProgress: false
    },
    {
      key: 'bedrooms',
      icon: IconBed,
      color: 'orange',
      label: t('aiDescriptionGenerator.specifyBedrooms'),
      ready: readiness.checks.bedrooms.ready,
      showProgress: false
    }
  ];

  return (
    <>
      <Card 
        shadow="sm" 
        padding="lg" 
        radius="md" 
        withBorder
        style={{
          background: 'linear-gradient(135deg, rgba(109, 40, 217, 0.05) 0%, rgba(236, 72, 153, 0.05) 100%)'
        }}
      >
        <Stack gap="lg">
          {/* Header */}
          <Group justify="space-between" wrap="nowrap">
            <Group gap="sm">
              <ThemeIcon size="xl" radius="md" variant="gradient" gradient={{ from: 'violet', to: 'grape', deg: 135 }}>
                <IconRobot size={24} />
              </ThemeIcon>
              <div>
                <Text fw={600} size="lg">
                  {t('aiDescriptionGenerator.title')}
                </Text>
                <Text size="sm" c="dimmed">
                  {t('aiDescriptionGenerator.subtitle') || 'Автоматическая генерация описаний'}
                </Text>
              </div>
            </Group>
            
            <Tooltip label={t('aiDescriptionGenerator.generationSettings')}>
              <ActionIcon
                variant="light"
                size="lg"
                onClick={openSettings}
                color="violet"
              >
                <IconSettings size={20} />
              </ActionIcon>
            </Tooltip>
          </Group>

          <Divider />

          {/* Overall Progress */}
          <Paper p="md" radius="md" withBorder>
            <Stack gap="xs">
              <Group justify="space-between">
                <Text size="sm" fw={500}>
                  {t('aiDescriptionGenerator.overallReadiness') || 'Общая готовность'}
                </Text>
                <Badge 
                  size="lg" 
                  variant="filled" 
                  color={allReady ? 'green' : 'orange'}
                  leftSection={allReady ? <IconCheck size={14} /> : null}
                >
                  {totalProgress}%
                </Badge>
              </Group>
              <Progress 
                value={totalProgress} 
                size="lg" 
                radius="xl"
                color={allReady ? 'green' : 'orange'}
                striped={!allReady}
                animated={!allReady}
              />
            </Stack>
          </Paper>

          {/* Requirements - Compact View */}
          <Paper p="md" radius="md" withBorder>
            <Stack gap="md">
              <Group justify="space-between">
                <Text size="sm" fw={500}>
                  {t('aiDescriptionGenerator.readinessCheck')}
                </Text>
                <ActionIcon
                  variant="subtle"
                  size="sm"
                  onClick={() => setDetailsOpened(!detailsOpened)}
                >
                  {detailsOpened ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
                </ActionIcon>
              </Group>

              <Grid gutter="xs">
                {requirements.map((req) => {
                  const Icon = req.icon;
                  const percentage = req.showProgress && req.max 
                    ? Math.round((req.count! / req.max) * 100) 
                    : 100;
                  
                  return (
                    <Grid.Col key={req.key} span={{ base: 12, xs: 6 }}>
                      <Paper p="xs" radius="md" withBorder>
                        <Group gap="xs" wrap="nowrap" justify="space-between">
                          <Group gap="xs" wrap="nowrap" style={{ flex: 1 }}>
                            <ThemeIcon
                              size="md"
                              radius="md"
                              variant="light"
                              color={req.ready ? 'green' : req.color}
                            >
                              <Icon size={16} />
                            </ThemeIcon>
                            <Box style={{ flex: 1, minWidth: 0 }}>
                              <Text size="xs" lineClamp={1}>
                                {req.label}
                              </Text>
                              {req.showProgress && (
                                <Group gap={4} wrap="nowrap">
                                  <Progress
                                    value={percentage}
                                    size="xs"
                                    color={req.ready ? 'green' : 'orange'}
                                    style={{ flex: 1 }}
                                  />
                                  <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
                                    {req.count}/{req.max}
                                  </Text>
                                </Group>
                              )}
                            </Box>
                          </Group>
                          
                          <ThemeIcon
                            size="sm"
                            radius="md"
                            variant={req.ready ? 'filled' : 'light'}
                            color={req.ready ? 'green' : 'red'}
                          >
                            {req.ready ? <IconCheck size={14} /> : <IconX size={14} />}
                          </ThemeIcon>
                        </Group>
                      </Paper>
                    </Grid.Col>
                  );
                })}
              </Grid>

              {/* Detailed View */}
              <Collapse in={detailsOpened}>
                <Divider my="sm" />
                <Stack gap="md">
                  {requirements.map((req) => {
                    const Icon = req.icon;
                    const percentage = req.showProgress && req.max 
                      ? Math.round((req.count! / req.max) * 100) 
                      : 100;
                    
                    return (
                      <Group key={req.key} justify="space-between" wrap="nowrap">
                        <Group gap="sm" style={{ flex: 1 }}>
                          <ThemeIcon
                            size="lg"
                            radius="md"
                            variant="light"
                            color={req.color}
                          >
                            <Icon size={20} />
                          </ThemeIcon>
                          <Text size="sm" style={{ flex: 1 }}>
                            {req.label}
                          </Text>
                        </Group>
                        
                        {req.showProgress ? (
                          <RingProgress
                            size={50}
                            thickness={4}
                            sections={[
                              { 
                                value: percentage, 
                                color: req.ready ? 'green' : 'orange' 
                              }
                            ]}
                            label={
                              <Text size="xs" ta="center" fw={500}>
                                {req.count}/{req.max}
                              </Text>
                            }
                          />
                        ) : (
                          <ThemeIcon
                            size="lg"
                            radius="md"
                            variant="light"
                            color={req.ready ? 'green' : 'red'}
                          >
                            {req.ready ? <IconCheck size={20} /> : <IconX size={20} />}
                          </ThemeIcon>
                        )}
                      </Group>
                    );
                  })}
                </Stack>
              </Collapse>
            </Stack>
          </Paper>

          {/* Tips */}
          <Alert 
            icon={<IconInfoCircle size={18} />} 
            title={t('aiDescriptionGenerator.tipTitle')}
            color="blue"
            variant="light"
          >
            {t('aiDescriptionGenerator.tipDescription')}
          </Alert>

          {/* Rate Limit Warning */}
          {!readiness.rateLimit.allowed && (
            <Alert 
              icon={<IconAlertCircle size={18} />} 
              title={t('aiDescriptionGenerator.rateLimitTitle')}
              color="orange"
              variant="filled"
            >
              {t('aiDescriptionGenerator.waitMinutes', { 
                minutes: Math.ceil(readiness.rateLimit.remainingSeconds / 60) 
              })}
            </Alert>
          )}

          {/* Generation Progress */}
          {loading && (
            <Paper p="md" radius="md" withBorder>
              <Stack gap="sm">
                <Progress 
                  value={generationProgress} 
                  size="lg" 
                  radius="xl"
                  striped
                  animated
                  color="violet"
                />
                <Group gap="xs">
                  <Loader size="xs" color="violet" />
                  <Text size="sm" c="dimmed">
                    {currentStep}
                  </Text>
                </Group>
              </Stack>
            </Paper>
          )}

          {/* Generate Button */}
          <Button
            size={isMobile ? 'md' : 'lg'}
            variant="gradient"
            gradient={{ from: 'violet', to: 'grape', deg: 135 }}
            leftSection={<IconBolt size={20} />}
            onClick={handleGenerate}
            disabled={!allReady || disabled}
            loading={loading}
            fullWidth
            style={{ height: isMobile ? 48 : 56 }}
          >
            {loading 
              ? t('aiDescriptionGenerator.generating') 
              : t('aiDescriptionGenerator.generateButton')
            }
          </Button>
        </Stack>
      </Card>

      {/* Settings Modal */}
      <Modal
        opened={settingsOpened}
        onClose={closeSettings}
        title={
          <Group gap="sm">
            <ThemeIcon size="lg" radius="md" variant="light" color="violet">
              <IconSettings size={20} />
            </ThemeIcon>
            <Text fw={600}>{t('aiDescriptionGenerator.generationSettings')}</Text>
          </Group>
        }
        size="lg"
        centered
      >
        <Stack gap="lg">
          <Alert 
            icon={<IconInfoCircle size={18} />}
            title={t('aiDescriptionGenerator.additionalRequirementsTitle')}
            color="blue"
            variant="light"
          >
            {t('aiDescriptionGenerator.additionalRequirementsDescription')}
          </Alert>

          <Textarea
            label={t('aiDescriptionGenerator.additionalPrompt')}
            placeholder={t('aiDescriptionGenerator.additionalPromptPlaceholder')}
            value={additionalPrompt}
            onChange={(e) => setAdditionalPrompt(e.currentTarget.value)}
            minRows={6}
            maxRows={10}
            autosize
            maxLength={500}
            styles={{
              input: { fontSize: '16px' }
            }}
          />

          <Text size="sm" c="dimmed">
            {additionalPrompt.length}/500 {t('translationsEditor.characters') || 'символов'}
          </Text>

          <Text size="sm" c="dimmed">
            {t('aiDescriptionGenerator.requirementsNote')}
          </Text>

          <Group justify="flex-end">
            <Button variant="subtle" onClick={closeSettings}>
              {t('common.cancel') || 'Отмена'}
            </Button>
            <Button 
              variant="gradient"
              gradient={{ from: 'violet', to: 'grape', deg: 135 }}
              onClick={closeSettings}
            >
              {t('common.apply') || 'Применить'}
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Result Modal */}
      <Modal
        opened={resultOpened}
        onClose={closeResult}
        size="xl"
        centered
        padding={isMobile ? 'md' : 'xl'}
        title={null}
        styles={{
          body: { padding: 0 }
        }}
      >
        <Stack gap={0}>
          {/* Success Header */}
          <Box
            p={isMobile ? 'md' : 'xl'}
            style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: '8px 8px 0 0'
            }}
          >
            <Stack align="center" gap="md">
              <ThemeIcon 
                size={80} 
                radius="xl" 
                variant="white"
                color="violet"
              >
                <IconCircleCheck size={50} />
              </ThemeIcon>
              <Title order={2} c="white" ta="center">
                {t('aiDescriptionGenerator.generationSuccess') || 'Описания успешно сгенерированы!'}
              </Title>
              <Text c="white" ta="center" size="sm" opacity={0.9}>
                {t('aiDescriptionGenerator.generationSuccessSubtitle') || 'AI проанализировал фотографии и создал уникальные описания'}
              </Text>
            </Stack>
          </Box>

          {/* Content */}
          <Box p={isMobile ? 'md' : 'xl'}>
            <Stack gap="xl">
              {/* Statistics */}
              <SimpleGrid cols={{ base: 1, xs: 2, sm: 3 }} spacing="md">
                <Paper p="md" radius="md" withBorder style={{ textAlign: 'center' }}>
                  <ThemeIcon size="xl" radius="md" variant="light" color="blue" mx="auto" mb="sm">
                    <IconLanguage size={24} />
                  </ThemeIcon>
                  <Text size="xl" fw={700} c="blue">
                    {generationResult?.languagesGenerated.length || 0}
                  </Text>
                  <Text size="sm" c="dimmed">
                    {t('aiDescriptionGenerator.languagesGenerated') || 'Языков'}
                  </Text>
                </Paper>

                <Paper p="md" radius="md" withBorder style={{ textAlign: 'center' }}>
                  <ThemeIcon size="xl" radius="md" variant="light" color="violet" mx="auto" mb="sm">
                    <IconTags size={24} />
                  </ThemeIcon>
                  <Text size="xl" fw={700} c="violet">
                    {generationResult?.featuresFound.length || 0}
                  </Text>
                  <Text size="sm" c="dimmed">
                    {t('aiDescriptionGenerator.featuresDetected') || 'Особенностей'}
                  </Text>
                </Paper>

                <Paper p="md" radius="md" withBorder style={{ textAlign: 'center' }}>
                  <ThemeIcon size="xl" radius="md" variant="light" color="green" mx="auto" mb="sm">
                    <IconFileText size={24} />
                  </ThemeIcon>
                  <Text size="xl" fw={700} c="green">
                    {String(
                      Object.values(generationResult?.descriptions || {})
                        .reduce((total, desc: any) => total + (desc?.description?.length || 0), 0)
                    ).toLocaleString()}
                  </Text>
                  <Text size="sm" c="dimmed">
                    {t('aiDescriptionGenerator.totalCharacters') || 'Символов'}
                  </Text>
                </Paper>
              </SimpleGrid>

              {/* Languages Generated */}
              {generationResult && generationResult.languagesGenerated.length > 0 && (
                <Paper p="md" radius="md" withBorder>
                  <Stack gap="sm">
                    <Group gap="xs">
                      <ThemeIcon size="md" radius="md" variant="light" color="blue">
                        <IconLanguage size={18} />
                      </ThemeIcon>
                      <Text fw={600}>
                        {t('aiDescriptionGenerator.generatedLanguages') || 'Сгенерированные языки'}
                      </Text>
                    </Group>
                    <Group gap="xs">
                      {generationResult.languagesGenerated.map((lang) => (
                        <Badge 
                          key={lang} 
                          size="lg" 
                          variant="light" 
                          color="blue"
                          leftSection={<IconCheck size={14} />}
                        >
                          {getLanguageName(lang)}
                        </Badge>
                      ))}
                    </Group>
                  </Stack>
                </Paper>
              )}

              {/* Features Found */}
              {generationResult && generationResult.featuresFound.length > 0 && (
                <Paper p="md" radius="md" withBorder>
                  <Stack gap="sm">
                    <Group gap="xs">
                      <ThemeIcon size="md" radius="md" variant="light" color="violet">
                        <IconSparkles size={18} />
                      </ThemeIcon>
                      <Text fw={600}>
                        {t('aiDescriptionGenerator.detectedFeatures') || 'Обнаруженные особенности'}
                      </Text>
                      <Badge size="sm" variant="filled" color="violet">
                        {generationResult.featuresFound.length}
                      </Badge>
                    </Group>
                    <Box style={{ maxHeight: isMobile ? 200 : 300, overflowY: 'auto' }}>
                      <Group gap="xs">
                        {generationResult.featuresFound.map((feature, index) => (
                          <Badge 
                            key={index} 
                            size="md" 
                            variant="dot" 
                            color="violet"
                          >
                            {feature}
                          </Badge>
                        ))}
                      </Group>
                    </Box>
                  </Stack>
                </Paper>
              )}

              {/* What to do next */}
              <Alert 
                icon={<IconClipboardCheck size={18} />}
                title={t('aiDescriptionGenerator.nextStepsTitle') || 'Что делать дальше?'}
                color="blue"
                variant="light"
              >
                <List size="sm" spacing="xs">
                  <List.Item>
                    {t('aiDescriptionGenerator.nextStep1') || 'Проверьте сгенерированные описания на вкладке "Описание"'}
                  </List.Item>
                  <List.Item>
                    {t('aiDescriptionGenerator.nextStep2') || 'При необходимости отредактируйте тексты'}
                  </List.Item>
                  <List.Item>
                    {t('aiDescriptionGenerator.nextStep3') || 'Проверьте добавленные особенности на вкладке "Особенности"'}
                  </List.Item>
                  <List.Item>
                    {t('aiDescriptionGenerator.nextStep4') || 'Сохраните изменения'}
                  </List.Item>
                </List>
              </Alert>

              {/* Close Button */}
              <Button
                size="lg"
                variant="gradient"
                gradient={{ from: 'violet', to: 'grape', deg: 135 }}
                onClick={closeResult}
                fullWidth
              >
                {t('common.continue') || 'Продолжить редактирование'}
              </Button>
            </Stack>
          </Box>
        </Stack>
      </Modal>
    </>
  );
};

export default AIDescriptionGenerator;