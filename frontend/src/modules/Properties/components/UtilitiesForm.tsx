// frontend/src/modules/Properties/components/UtilitiesForm.tsx
import { Card, Grid, Stack, Group, Text, ThemeIcon, NumberInput } from '@mantine/core';
import { IconBolt, IconDroplet, IconCurrencyBaht } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

interface UtilitiesFormProps {
  viewMode?: boolean;
}

const UtilitiesForm = ({ viewMode }: UtilitiesFormProps) => {
  const { t } = useTranslation();

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack gap="lg">
        {/* Header */}
        <Group gap="sm">
          <ThemeIcon size="lg" radius="md" variant="gradient" gradient={{ from: 'yellow', to: 'orange' }}>
            <IconBolt size={20} />
          </ThemeIcon>
          <div>
            <Text fw={600} size="lg">{t('utilitiesForm.title')}</Text>
            <Text size="xs" c="dimmed">{t('utilitiesForm.subtitle')}</Text>
          </div>
        </Group>

        {/* Form Fields */}
        <Grid gutter="md">
          {/* Electricity Rate */}
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <Card shadow="sm" padding="md" radius="md" withBorder style={{ background: 'var(--mantine-color-dark-6)' }}>
              <Stack gap="md">
                <Group gap="xs">
                  <ThemeIcon size="md" radius="md" variant="light" color="yellow">
                    <IconBolt size={18} />
                  </ThemeIcon>
                  <div style={{ flex: 1 }}>
                    <Text fw={500} size="sm">{t('utilitiesForm.electricity')}</Text>
                    <Text size="xs" c="dimmed">{t('utilitiesForm.thbPerUnit')}</Text>
                  </div>
                </Group>

                <NumberInput
                  placeholder={t('utilitiesForm.electricityPlaceholder')}
                  min={0}
                  step={0.01}
                  decimalScale={2}
                  fixedDecimalScale
                  disabled={viewMode}
                  leftSection={<IconCurrencyBaht size={16} />}
                  rightSection={
                    <Text size="xs" c="dimmed" style={{ marginRight: 8 }}>
                      {t('utilitiesForm.perUnit')}
                    </Text>
                  }
                  styles={{
                    input: {
                      fontSize: '16px',
                      background: viewMode ? 'var(--mantine-color-dark-7)' : undefined
                    }
                  }}
                />
              </Stack>
            </Card>
          </Grid.Col>

          {/* Water Rate */}
          <Grid.Col span={{ base: 12, sm: 6 }}>
            <Card shadow="sm" padding="md" radius="md" withBorder style={{ background: 'var(--mantine-color-dark-6)' }}>
              <Stack gap="md">
                <Group gap="xs">
                  <ThemeIcon size="md" radius="md" variant="light" color="cyan">
                    <IconDroplet size={18} />
                  </ThemeIcon>
                  <div style={{ flex: 1 }}>
                    <Text fw={500} size="sm">{t('utilitiesForm.water')}</Text>
                    <Text size="xs" c="dimmed">{t('utilitiesForm.thbPerUnit')}</Text>
                  </div>
                </Group>

                <NumberInput
                  placeholder={t('utilitiesForm.waterPlaceholder')}
                  min={0}
                  step={0.01}
                  decimalScale={2}
                  fixedDecimalScale
                  disabled={viewMode}
                  leftSection={<IconCurrencyBaht size={16} />}
                  rightSection={
                    <Text size="xs" c="dimmed" style={{ marginRight: 8 }}>
                      {t('utilitiesForm.perUnit')}
                    </Text>
                  }
                  styles={{
                    input: {
                      fontSize: '16px',
                      background: viewMode ? 'var(--mantine-color-dark-7)' : undefined
                    }
                  }}
                />
              </Stack>
            </Card>
          </Grid.Col>
        </Grid>
      </Stack>
    </Card>
  );
};

export default UtilitiesForm;