// frontend/src/modules/Properties/components/AIPropertyCreationModal.tsx
import { useState } from 'react';
import {
  Modal,
  Textarea,
  Button,
  Stack,
  Group,
  Text,
  Card,
  Grid,
  ThemeIcon,
  Badge,
  Alert,
  Progress,
  Paper
} from '@mantine/core';
import {
  IconRobot,
  IconBolt,
  IconInfoCircle,
  IconCheck,
  IconFileText,
  IconCurrencyDollar,
  IconCalendar,
  IconPhoto,
  IconUser,
  IconHome,
  IconX,
  IconAlertTriangle
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useMediaQuery } from '@mantine/hooks';
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import { propertiesApi } from '@/api/properties.api';

interface AIPropertyCreationModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: (propertyData: any) => void;
}

const AIPropertyCreationModal: React.FC<AIPropertyCreationModalProps> = ({
  visible,
  onCancel,
  onSuccess
}) => {
  const { t } = useTranslation();
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');

  const handleCreate = async () => {
    if (!text.trim()) {
      notifications.show({
        title: t('aiPropertyCreation.enterDescription'),
        message: t('aiPropertyCreation.pleaseEnterText'),
        color: 'orange',
        icon: <IconInfoCircle size={16} />
      });
      return;
    }

    setLoading(true);
    setProgress(0);
    setCurrentStep(t('aiPropertyCreation.sendingRequest'));

    try {
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev;
          return prev + 10;
        });
      }, 1000);

      setCurrentStep(t('aiPropertyCreation.analyzingText'));
      
      setTimeout(() => {
        setCurrentStep(t('aiPropertyCreation.extractingData'));
      }, 2000);

      setTimeout(() => {
        setCurrentStep(t('aiPropertyCreation.structuringInfo'));
      }, 4000);

      const { data } = await propertiesApi.createWithAI(text);

      clearInterval(progressInterval);
      setProgress(100);
      setCurrentStep(t('aiPropertyCreation.done'));

      if (data.success) {
        notifications.show({
          title: t('aiPropertyCreation.success'),
          message: t('aiPropertyCreation.dataExtracted'),
          color: 'green',
          icon: <IconCheck size={16} />
        });
        
        if (data.data.warnings && data.data.warnings.length > 0) {
          modals.open({
            title: (
              <Group gap="sm">
                <ThemeIcon size="lg" color="yellow" variant="light">
                  <IconAlertTriangle size={20} />
                </ThemeIcon>
                <Text fw={600}>{t('aiPropertyCreation.warnings')}</Text>
              </Group>
            ),
            children: (
              <Stack gap="xs">
                {data.data.warnings.map((warning: string, idx: number) => (
                  <Alert key={idx} icon={<IconAlertTriangle size={16} />} color="yellow" variant="light">
                    <Text size="sm">{warning}</Text>
                  </Alert>
                ))}
              </Stack>
            ),
            centered: true
          });
        }
        
        if (data.data.downloadedPhotosCount > 0) {
          modals.open({
            title: (
              <Group gap="sm">
                <ThemeIcon size="lg" color="green" variant="light">
                  <IconPhoto size={20} />
                </ThemeIcon>
                <Text fw={600}>{t('aiPropertyCreation.photosDownloaded')}</Text>
              </Group>
            ),
            size: 'lg',
            children: (
              <Stack gap="md">
                <Alert icon={<IconCheck size={16} />} color="green" variant="light">
                  <Text size="sm">
                    {t('aiPropertyCreation.downloadedCount', { count: data.data.downloadedPhotosCount })}
                  </Text>
                </Alert>
                {data.data.photosInfo && (
                  <Paper 
                    p="md" 
                    withBorder 
                    style={{ 
                      maxHeight: 300, 
                      overflowY: 'auto',
                      background: 'var(--mantine-color-dark-6)'
                    }}
                  >
                    <Stack gap="xs">
                      {data.data.photosInfo.map((photo: any, index: number) => (
                        <Group key={index} gap="xs">
                          <Badge size="lg" variant="light" color="blue">
                            {index + 1}
                          </Badge>
                          <Text size="sm" style={{ flex: 1 }}>
                            {photo.filename}
                          </Text>
                          <Badge size="sm" variant="filled" color="violet">
                            {photo.category}
                          </Badge>
                        </Group>
                      ))}
                    </Stack>
                  </Paper>
                )}
              </Stack>
            ),
            centered: true
          });
        }

        onSuccess(data.data.propertyData || data.data);
        setText('');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || t('aiPropertyCreation.errorCreating');
      
      if (errorMessage.includes('Google Drive') || errorMessage.includes('доступ') || errorMessage.includes('permission')) {
        modals.open({
          title: (
            <Group gap="sm">
              <ThemeIcon size="lg" color="red" variant="light">
                <IconAlertTriangle size={20} />
              </ThemeIcon>
              <Text fw={600}>{t('aiPropertyCreation.driveAccessError')}</Text>
            </Group>
          ),
          size: 'lg',
          children: (
            <Stack gap="md">
              <Alert icon={<IconAlertTriangle size={16} />} color="red" variant="light">
                <Text size="sm">{errorMessage}</Text>
              </Alert>

              <Card shadow="sm" padding="md" radius="md" withBorder>
                <Stack gap="sm">
                  <Text fw={600} size="sm">{t('aiPropertyCreation.howToFix')}</Text>
                  <Stack gap="xs" style={{ paddingLeft: 20 }}>
                    <Text size="sm">1. {t('aiPropertyCreation.fixStep1')}</Text>
                    <Text size="sm">2. {t('aiPropertyCreation.fixStep2')}</Text>
                    <Text size="sm">3. {t('aiPropertyCreation.fixStep3')}</Text>
                    <Text size="sm">4. {t('aiPropertyCreation.fixStep4')}</Text>
                  </Stack>
                </Stack>
              </Card>

              <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
                <Text size="xs" c="dimmed">
                  {t('aiPropertyCreation.alternativeOption')}
                </Text>
              </Alert>
            </Stack>
          ),
          centered: true
        });
      } else {
        notifications.show({
          title: t('aiPropertyCreation.error'),
          message: errorMessage,
          color: 'red',
          icon: <IconX size={16} />
        });
      }
    } finally {
      setLoading(false);
      setProgress(0);
      setCurrentStep('');
    }
  };

  const features = [
    { icon: <IconHome size={18} />, text: t('aiPropertyCreation.basicInfo'), color: 'blue' },
    { icon: <IconCurrencyDollar size={18} />, text: t('aiPropertyCreation.pricesCommissions'), color: 'green' },
    { icon: <IconCalendar size={18} />, text: t('aiPropertyCreation.calendarOccupancy'), color: 'orange' },
    { icon: <IconUser size={18} />, text: t('aiPropertyCreation.ownerData'), color: 'cyan' },
    { icon: <IconCheck size={18} />, text: t('aiPropertyCreation.propertyFeatures'), color: 'teal' },
    { icon: <IconPhoto size={18} />, text: t('aiPropertyCreation.photosFromDrive'), color: 'violet' }
  ];

  return (
    <Modal
      opened={visible}
      onClose={onCancel}
      size={isMobile ? 'full' : 'xl'}
      title={
        <Group gap="sm">
          <ThemeIcon size="xl" radius="md" variant="gradient" gradient={{ from: 'violet', to: 'grape' }}>
            <IconRobot size={24} />
          </ThemeIcon>
          <div>
            <Text fw={700} size="xl">{t('aiPropertyCreation.title')}</Text>
            <Text size="xs" c="dimmed">{t('aiPropertyCreation.subtitle')}</Text>
          </div>
        </Group>
      }
      centered
      styles={{
        body: { 
          padding: isMobile ? 12 : 24,
          maxHeight: 'calc(100vh - 200px)',
          overflowY: 'auto'
        }
      }}
    >
      <Stack gap="lg">
        {/* How It Works Card */}
        <Card
          shadow="sm"
          padding="lg"
          radius="md"
          withBorder
          style={{
            background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%)',
            borderColor: 'rgba(102, 126, 234, 0.3)'
          }}
        >
          <Stack gap="md">
            <Group gap="sm">
              <ThemeIcon size="lg" radius="md" variant="light" color="violet">
                <IconInfoCircle size={20} />
              </ThemeIcon>
              <Text fw={600} size="lg">{t('aiPropertyCreation.howItWorks')}</Text>
            </Group>
            
            <Text size="sm" style={{ lineHeight: 1.6 }}>
              {t('aiPropertyCreation.howItWorksDescription')}
            </Text>

            <Grid gutter="xs">
              {features.map((item, idx) => (
                <Grid.Col key={idx} span={{ base: 12, xs: 6, sm: 4 }}>
                  <Paper
                    p="sm"
                    radius="md"
                    withBorder
                    style={{
                      background: 'rgba(255,255,255,0.03)',
                      borderColor: 'rgba(255,255,255,0.1)',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.borderColor = `var(--mantine-color-${item.color}-5)`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                    }}
                  >
                    <Group gap="xs">
                      <ThemeIcon size="md" radius="md" variant="light" color={item.color}>
                        {item.icon}
                      </ThemeIcon>
                      <Text size="xs" style={{ flex: 1 }}>
                        {item.text}
                      </Text>
                    </Group>
                  </Paper>
                </Grid.Col>
              ))}
            </Grid>
          </Stack>
        </Card>

        {/* Textarea Card */}
        <Card shadow="sm" padding="md" radius="md" withBorder>
          <Stack gap="md">
            <Group gap="xs">
              <ThemeIcon size="md" radius="md" variant="light" color="blue">
                <IconFileText size={18} />
              </ThemeIcon>
              <Text fw={500} size="sm">{t('aiPropertyCreation.pasteDescription')}</Text>
            </Group>
            
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t('aiPropertyCreation.placeholder')}
              minRows={isMobile ? 10 : 14}
              maxRows={20}
              maxLength={10000}
              disabled={loading}
              autosize
              styles={{
                input: { 
                  fontSize: '16px',
                  lineHeight: 1.6
                }
              }}
            />

            <Group justify="space-between">
              <Text size="xs" c="dimmed">
                {t('aiPropertyCreation.maxCharacters')}
              </Text>
              <Badge 
                size="lg" 
                variant={text.length > 9000 ? 'filled' : 'light'} 
                color={text.length > 9000 ? 'red' : 'blue'}
              >
                {text.length} / 10000
              </Badge>
            </Group>
          </Stack>
        </Card>

        {/* Progress Card */}
        {loading && (
          <Card
            shadow="sm"
            padding="md"
            radius="md"
            withBorder
            style={{
              background: 'rgba(102, 126, 234, 0.05)',
              borderColor: 'rgba(102, 126, 234, 0.2)'
            }}
          >
            <Stack gap="md">
              <Progress 
                value={progress}
                size="lg"
                radius="md"
                animated
                color="violet"
                striped
              />
              <Group gap="sm">
                <ThemeIcon size="lg" radius="md" variant="light" color="violet">
                  <IconRobot size={20} />
                </ThemeIcon>
                <Text size="sm" fw={500}>
                  {currentStep}
                </Text>
              </Group>
            </Stack>
          </Card>
        )}

        {/* Warning Alert */}
        <Alert
          icon={<IconAlertTriangle size={20} />}
          title={<Text fw={600}>{t('aiPropertyCreation.importantWarning')}</Text>}
          color="yellow"
          variant="light"
        >
          <Text size="sm">
            {t('aiPropertyCreation.importantDescription')}
          </Text>
        </Alert>

        {/* Action Buttons */}
        <Grid gutter="md">
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <Button
              variant="light"
              color="gray"
              size="lg"
              fullWidth
              leftSection={<IconX size={18} />}
              onClick={onCancel}
              disabled={loading}
            >
              {t('aiPropertyCreation.cancel')}
            </Button>
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <Button
              variant="gradient"
              gradient={{ from: 'violet', to: 'grape' }}
              size="lg"
              fullWidth
              leftSection={<IconBolt size={18} />}
              onClick={handleCreate}
              loading={loading}
              disabled={!text.trim()}
            >
              {loading ? t('aiPropertyCreation.processing') : t('aiPropertyCreation.createButton')}
            </Button>
          </Grid.Col>
        </Grid>
      </Stack>
    </Modal>
  );
};

export default AIPropertyCreationModal;