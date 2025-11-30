// frontend/src/modules/Properties/components/AIInterpretationModal.tsx
import React from 'react';
import {
  Modal,
  Stack,
  Group,
  Text,
  Badge,
  Alert,
  Progress,
  Card,
  Grid,
  ThemeIcon,
  Paper
} from '@mantine/core';
import {
  IconCheck,
  IconAlertTriangle,
  IconX,
  IconRobot,
  IconInfoCircle
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { useMediaQuery } from '@mantine/hooks';
import dayjs from 'dayjs';

interface AIInterpretationModalProps {
  visible: boolean;
  onClose: () => void;
  interpretation: any;
}

const AIInterpretationModal: React.FC<AIInterpretationModalProps> = ({
  visible,
  onClose,
  interpretation
}) => {
  const { t } = useTranslation();
  const isMobile = useMediaQuery('(max-width: 768px)');

  if (!interpretation) return null;

  const confidence = interpretation.confidence || 0;
  const confidencePercent = Math.round(confidence * 100);

  const getConfidenceLevel = () => {
    if (confidence >= 0.8) {
      return {
        status: 'success',
        label: t('aiInterpretationModal.highConfidence'),
        color: 'green',
        icon: <IconCheck size={18} />
      };
    } else if (confidence >= 0.6) {
      return {
        status: 'warning',
        label: t('aiInterpretationModal.mediumConfidence'),
        color: 'yellow',
        icon: <IconAlertTriangle size={18} />
      };
    } else {
      return {
        status: 'error',
        label: t('aiInterpretationModal.lowConfidence'),
        color: 'red',
        icon: <IconX size={18} />
      };
    }
  };

  const confidenceLevel = getConfidenceLevel();

  const renderDescriptionItem = (label: string, content: React.ReactNode, span: number = 1) => {
    return (
      <Grid.Col span={{ base: 12, sm: span === 2 ? 12 : 6 }}>
        <Paper p="sm" radius="md" withBorder style={{ background: 'var(--mantine-color-dark-6)' }}>
          <Stack gap={4}>
            <Text size="xs" c="dimmed" fw={500}>
              {label}
            </Text>
            <div>
              {content}
            </div>
          </Stack>
        </Paper>
      </Grid.Col>
    );
  };

  const hasParameters = !!(
    interpretation.deal_type || 
    interpretation.property_type || 
    interpretation.bedrooms || 
    interpretation.budget
  );

  return (
    <Modal
      opened={visible}
      onClose={onClose}
      size={isMobile ? 'full' : 'xl'}
      title={
        <Group gap="sm">
          <ThemeIcon size="lg" radius="md" variant="gradient" gradient={{ from: 'blue', to: 'cyan' }}>
            <IconRobot size={20} />
          </ThemeIcon>
          <div>
            <Text fw={600} size="lg">{t('aiInterpretationModal.title')}</Text>
            <Text size="xs" c="dimmed">{t('aiInterpretationModal.subtitle')}</Text>
          </div>
        </Group>
      }
      centered
      styles={{
        body: { padding: isMobile ? 12 : 24 }
      }}
    >
      <Stack gap="lg">
        {/* Confidence Section */}
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Stack gap="md">
            <Group gap="xs">
              <ThemeIcon size="md" radius="md" variant="light" color={confidenceLevel.color}>
                {confidenceLevel.icon}
              </ThemeIcon>
              <Text fw={500} size="sm">{t('aiInterpretationModal.aiConfidence')}</Text>
            </Group>

            <Stack gap="xs">
              <Progress
                value={confidencePercent}
                size="lg"
                radius="md"
                color={confidenceLevel.color}
                striped
                animated
              />
              <Group gap="xs">
                <ThemeIcon size="sm" radius="md" variant="light" color={confidenceLevel.color}>
                  {confidenceLevel.icon}
                </ThemeIcon>
                <Text size="sm" c={`${confidenceLevel.color}.4`}>
                  {t('aiInterpretationModal.accuracyPercent', { 
                    level: confidenceLevel.label, 
                    percent: confidencePercent 
                  })}
                </Text>
              </Group>
            </Stack>

            {confidence < 0.7 && (
              <Alert icon={<IconAlertTriangle size={16} />} color="yellow" variant="light">
                <Stack gap={4}>
                  <Text size="sm" fw={500}>
                    {t('aiInterpretationModal.mediumAccuracyWarning')}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {t('aiInterpretationModal.mediumAccuracyDescription')}
                  </Text>
                </Stack>
              </Alert>
            )}
          </Stack>
        </Card>

        {/* Reasoning Section */}
        <Card shadow="sm" padding="md" radius="md" withBorder>
          <Stack gap="sm">
            <Group gap="xs">
              <ThemeIcon size="md" radius="md" variant="light" color="blue">
                <IconInfoCircle size={18} />
              </ThemeIcon>
              <Text fw={500} size="sm">{t('aiInterpretationModal.queryUnderstanding')}</Text>
            </Group>

            <Paper
              p="md"
              radius="md"
              style={{
                background: 'rgba(34, 139, 230, 0.1)',
                border: '1px solid rgba(34, 139, 230, 0.3)'
              }}
            >
              <Text size="sm" style={{ lineHeight: 1.6 }}>
                {interpretation.reasoning || t('aiInterpretationModal.noDescription')}
              </Text>
            </Paper>
          </Stack>
        </Card>

        {/* Parameters Section */}
        <Card shadow="sm" padding="md" radius="md" withBorder>
          <Stack gap="md">
            <Group gap="xs">
              <ThemeIcon size="md" radius="md" variant="light" color="violet">
                <IconCheck size={18} />
              </ThemeIcon>
              <Text fw={500} size="sm">{t('aiInterpretationModal.extractedParameters')}</Text>
            </Group>

            {hasParameters ? (
              <Grid gutter="xs">
                {interpretation.deal_type && renderDescriptionItem(
                  t('aiInterpretationModal.dealType'),
                  <Badge size="lg" variant="filled" color="blue">
                    {interpretation.deal_type === 'rent' ? t('properties.dealTypes.rent') : 
                     interpretation.deal_type === 'sale' ? t('properties.dealTypes.sale') : 
                     t('propertySearch.advancedSearch.any')}
                  </Badge>,
                  2
                )}

                {interpretation.property_type && renderDescriptionItem(
                  t('properties.propertyType'),
                  <Badge size="lg" variant="filled" color="cyan">
                    {interpretation.property_type}
                  </Badge>,
                  2
                )}

                {interpretation.bedrooms && renderDescriptionItem(
                  t('propertySearch.advancedSearch.bedrooms'),
                  <Text fw={500}>{interpretation.bedrooms}</Text>
                )}

                {interpretation.bathrooms && renderDescriptionItem(
                  t('propertySearch.advancedSearch.bathrooms'),
                  <Text fw={500}>{interpretation.bathrooms}</Text>
                )}

                {interpretation.budget && renderDescriptionItem(
                  t('propertySearch.advancedSearch.budget'),
                  <Group gap="xs" wrap="wrap">
                    {interpretation.budget.min && (
                      <Text size="sm">
                        {t('propertySearch.advancedSearch.from')} {interpretation.budget.min.toLocaleString()}
                      </Text>
                    )}
                    {interpretation.budget.amount && (
                      <Text size="sm">
                        {t('propertySearch.advancedSearch.to')} {interpretation.budget.amount.toLocaleString()}
                      </Text>
                    )}
                    <Badge size="sm" variant="filled" color="green">
                      {interpretation.budget.currency || 'THB'}
                    </Badge>
                    {interpretation.budget.tolerance > 0 && (
                      <Badge size="sm" variant="filled" color="orange">
                        ±{interpretation.budget.tolerance}%
                      </Badge>
                    )}
                  </Group>,
                  2
                )}

                {interpretation.dates && renderDescriptionItem(
                  t('aiInterpretationModal.dates'),
                  <Group gap="xs" wrap="wrap">
                    {interpretation.dates.check_in && (
                      <Text size="sm">
                        {t('aiInterpretationModal.dateFrom')} {dayjs(interpretation.dates.check_in).format('DD.MM.YYYY')}
                      </Text>
                    )}
                    {interpretation.dates.check_out && (
                      <Text size="sm">
                        {t('aiInterpretationModal.dateTo')} {dayjs(interpretation.dates.check_out).format('DD.MM.YYYY')}
                      </Text>
                    )}
                    {interpretation.dates.tolerance_days > 0 && (
                      <Badge size="sm" variant="filled" color="orange">
                        ±{interpretation.dates.tolerance_days} {t('aiInterpretationModal.days')}
                      </Badge>
                    )}
                  </Group>,
                  2
                )}

                {interpretation.regions && interpretation.regions.length > 0 && renderDescriptionItem(
                  t('aiInterpretationModal.regions'),
                  <Group gap="xs" wrap="wrap">
                    {interpretation.regions.map((region: string) => (
                      <Badge key={region} size="sm" variant="filled" color="green">
                        {region}
                      </Badge>
                    ))}
                  </Group>,
                  2
                )}

                {interpretation.features && interpretation.features.length > 0 && renderDescriptionItem(
                  t('aiInterpretationModal.features'),
                  <Group gap="xs" wrap="wrap">
                    {interpretation.features.map((feature: string) => (
                      <Badge key={feature} size="sm" variant="filled" color="violet">
                        {feature}
                      </Badge>
                    ))}
                  </Group>,
                  2
                )}

                {interpretation.furniture && renderDescriptionItem(
                  t('propertySearch.advancedSearch.furniture'),
                  <Badge size="lg" variant="filled" color="yellow">
                    {interpretation.furniture === 'fullyFurnished' ? t('propertySearch.advancedSearch.fullyFurnished') :
                     interpretation.furniture === 'partiallyFurnished' ? t('propertySearch.advancedSearch.partiallyFurnished') : 
                     t('propertySearch.advancedSearch.unfurnished')}
                  </Badge>,
                  2
                )}

                {interpretation.parking !== undefined && renderDescriptionItem(
                  t('aiInterpretationModal.parking'),
                  <Badge size="lg" variant="filled" color={interpretation.parking ? 'teal' : 'gray'}>
                    {interpretation.parking ? t('aiInterpretationModal.required') : t('aiInterpretationModal.notRequired')}
                  </Badge>
                )}

                {interpretation.pets !== undefined && renderDescriptionItem(
                  t('aiInterpretationModal.pets'),
                  <Badge size="lg" variant="filled" color={interpretation.pets ? 'teal' : 'gray'}>
                    {interpretation.pets ? t('aiInterpretationModal.allowed') : t('aiInterpretationModal.notAllowed')}
                  </Badge>
                )}

                {interpretation.distance_to_beach && renderDescriptionItem(
                  t('propertySearch.advancedSearch.distanceToBeach'),
                  <Badge size="lg" variant="filled" color="blue">
                    {t('aiInterpretationModal.upTo')} {interpretation.distance_to_beach.max} {t('aiInterpretationModal.meters')}
                  </Badge>,
                  2
                )}

                {interpretation.complex_name && renderDescriptionItem(
                  t('aiInterpretationModal.complex'),
                  <Text fw={500}>{interpretation.complex_name}</Text>,
                  2
                )}

                {interpretation.floor && renderDescriptionItem(
                  t('aiInterpretationModal.floor'),
                  <Text fw={500}>
                    {interpretation.floor.min && `${t('propertySearch.advancedSearch.from')} ${interpretation.floor.min}`}
                    {interpretation.floor.max && ` ${t('propertySearch.advancedSearch.to')} ${interpretation.floor.max}`}
                  </Text>,
                  2
                )}

                {interpretation.owner_name && renderDescriptionItem(
                  t('aiInterpretationModal.owner'),
                  <Text fw={500}>{interpretation.owner_name}</Text>,
                  2
                )}
              </Grid>
            ) : (
              <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
                <Stack gap={4}>
                  <Text size="sm" fw={500}>
                    {t('aiInterpretationModal.noParametersExtracted')}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {t('aiInterpretationModal.noParametersDescription')}
                  </Text>
                </Stack>
              </Alert>
            )}
          </Stack>
        </Card>
      </Stack>
    </Modal>
  );
};

export default AIInterpretationModal;