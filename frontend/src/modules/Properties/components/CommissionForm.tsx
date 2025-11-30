// frontend/src/modules/Properties/components/CommissionForm.tsx
import { Card, Stack, Group, Text, ThemeIcon, Select, NumberInput, Grid } from '@mantine/core';
import { IconPercentage, IconCurrencyDollar, IconBriefcase, IconHome } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

interface CommissionFormProps {
  dealType: 'sale' | 'rent' | 'both';
  viewMode?: boolean;
  
  // Sale Commission
  saleCommissionType?: 'percentage' | 'fixed' | null; // ✅ Добавлен null
  saleCommissionValue?: number | null; // ✅ Добавлен null
  onSaleCommissionTypeChange?: (value: 'percentage' | 'fixed' | null) => void;
  onSaleCommissionValueChange?: (value: number) => void;
  
  // Rent Commission
  rentCommissionType?: 'percentage' | 'monthly_rent' | 'fixed' | null; // ✅ Добавлен null
  rentCommissionValue?: number | null; // ✅ Добавлен null
  onRentCommissionTypeChange?: (value: 'percentage' | 'monthly_rent' | 'fixed' | null) => void;
  onRentCommissionValueChange?: (value: number) => void;
}

const CommissionForm = ({ 
  dealType,
  viewMode,
  saleCommissionType,
  saleCommissionValue,
  onSaleCommissionTypeChange,
  onSaleCommissionValueChange,
  rentCommissionType,
  rentCommissionValue,
  onRentCommissionTypeChange,
  onRentCommissionValueChange
}: CommissionFormProps) => {
  const { t } = useTranslation();

  const showSaleCommission = dealType === 'sale' || dealType === 'both';
  const showRentCommission = dealType === 'rent' || dealType === 'both';

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack gap="xl">
        {/* Header */}
        <Group gap="sm">
          <ThemeIcon size="xl" radius="md" variant="gradient" gradient={{ from: 'orange', to: 'red' }}>
            <IconBriefcase size={24} />
          </ThemeIcon>
          <div>
            <Text fw={700} size="xl">{t('properties.commission.title')}</Text>
            <Text size="xs" c="dimmed">{t('properties.commission.subtitle')}</Text>
          </div>
        </Group>

        {/* Sale Commission Section */}
        {showSaleCommission && (
          <Card
            shadow="sm"
            padding="lg"
            radius="md"
            withBorder
            style={{
              background: 'linear-gradient(135deg, rgba(34, 139, 230, 0.05) 0%, rgba(34, 195, 94, 0.05) 100%)',
              borderColor: 'rgba(34, 139, 230, 0.3)'
            }}
          >
            <Stack gap="md">
              {/* Section Header */}
              <Group gap="sm">
                <ThemeIcon size="lg" radius="md" variant="light" color="green">
                  <IconHome size={20} />
                </ThemeIcon>
                <div>
                  <Text fw={600} size="lg">{t('properties.commission.saleCommission')}</Text>
                  <Text size="xs" c="dimmed">{t('properties.commission.saleCommissionDescription')}</Text>
                </div>
              </Group>

              <Grid gutter="md">
                {/* Commission Type */}
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <Stack gap="xs">
                    <Text size="sm" fw={500}>{t('properties.commission.types.title')}</Text>
                    <Select
                      value={saleCommissionType || null} // ✅ Обработка null/undefined
                      onChange={(value) => onSaleCommissionTypeChange?.(value as 'percentage' | 'fixed' | null)}
                      placeholder={t('common.select')}
                      data={[
                        { 
                          value: 'percentage', 
                          label: t('properties.commission.types.percentage')
                        },
                        { 
                          value: 'fixed', 
                          label: t('properties.commission.types.fixed')
                        }
                      ]}
                      disabled={viewMode}
                      leftSection={<IconPercentage size={16} />}
                      styles={{
                        input: {
                          fontSize: '16px',
                          background: viewMode ? 'var(--mantine-color-dark-7)' : undefined
                        }
                      }}
                      clearable
                    />
                  </Stack>
                </Grid.Col>

                {/* Commission Value */}
                {saleCommissionType && (
                  <Grid.Col 
                    span={{ base: 12, sm: 6 }}
                    style={{
                      animation: 'fadeIn 0.3s ease-in'
                    }}
                  >
                    <Stack gap="xs">
                      <Text size="sm" fw={500}>{t('properties.commission.value')}</Text>
                      <NumberInput
                        value={saleCommissionValue || undefined} // ✅ Обработка null
                        onChange={(value) => onSaleCommissionValueChange?.(Number(value) || 0)}
                        placeholder={
                          saleCommissionType === 'percentage'
                            ? t('properties.commission.percentagePlaceholder')
                            : t('properties.commission.fixedPlaceholder')
                        }
                        min={0}
                        max={saleCommissionType === 'percentage' ? 100 : undefined}
                        step={saleCommissionType === 'percentage' ? 0.1 : 1000}
                        decimalScale={saleCommissionType === 'percentage' ? 1 : 0}
                        thousandSeparator={saleCommissionType === 'fixed' ? ' ' : undefined}
                        disabled={viewMode}
                        leftSection={
                          saleCommissionType === 'percentage' 
                            ? <IconPercentage size={16} /> 
                            : <IconCurrencyDollar size={16} />
                        }
                        rightSection={
                          <Text size="xs" c="dimmed" style={{ marginRight: 8 }}>
                            {saleCommissionType === 'percentage' ? '%' : 'THB'}
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
                  </Grid.Col>
                )}
              </Grid>
            </Stack>
          </Card>
        )}

        {/* Rent Commission Section */}
        {showRentCommission && (
          <Card
            shadow="sm"
            padding="lg"
            radius="md"
            withBorder
            style={{
              background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.05) 0%, rgba(236, 72, 153, 0.05) 100%)',
              borderColor: 'rgba(124, 58, 237, 0.3)'
            }}
          >
            <Stack gap="md">
              {/* Section Header */}
              <Group gap="sm">
                <ThemeIcon size="lg" radius="md" variant="light" color="violet">
                  <IconBriefcase size={20} />
                </ThemeIcon>
                <div>
                  <Text fw={600} size="lg">{t('properties.commission.rentCommission')}</Text>
                  <Text size="xs" c="dimmed">{t('properties.commission.rentCommissionDescription')}</Text>
                </div>
              </Group>

              <Grid gutter="md">
                {/* Commission Type */}
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <Stack gap="xs">
                    <Text size="sm" fw={500}>{t('properties.commission.types.title')}</Text>
                    <Select
                      value={rentCommissionType || null} // ✅ Обработка null/undefined
                      onChange={(value) => onRentCommissionTypeChange?.(value as 'percentage' | 'monthly_rent' | 'fixed' | null)}
                      placeholder={t('common.select')}
                      data={[
                        { 
                          value: 'percentage', 
                          label: t('properties.commission.types.percentage')
                        },
                        { 
                          value: 'monthly_rent', 
                          label: t('properties.commission.types.monthlyRent')
                        },
                        { 
                          value: 'fixed', 
                          label: t('properties.commission.types.fixed')
                        }
                      ]}
                      disabled={viewMode}
                      leftSection={<IconPercentage size={16} />}
                      styles={{
                        input: {
                          fontSize: '16px',
                          background: viewMode ? 'var(--mantine-color-dark-7)' : undefined
                        }
                      }}
                      clearable
                    />
                  </Stack>
                </Grid.Col>

                {/* Commission Value */}
                {rentCommissionType && rentCommissionType !== 'monthly_rent' && (
                  <Grid.Col 
                    span={{ base: 12, sm: 6 }}
                    style={{
                      animation: 'fadeIn 0.3s ease-in'
                    }}
                  >
                    <Stack gap="xs">
                      <Text size="sm" fw={500}>{t('properties.commission.value')}</Text>
                      <NumberInput
                        value={rentCommissionValue || undefined} // ✅ Обработка null
                        onChange={(value) => onRentCommissionValueChange?.(Number(value) || 0)}
                        placeholder={
                          rentCommissionType === 'percentage'
                            ? t('properties.commission.percentagePlaceholder')
                            : t('properties.commission.fixedPlaceholder')
                        }
                        min={0}
                        max={rentCommissionType === 'percentage' ? 100 : undefined}
                        step={rentCommissionType === 'percentage' ? 0.1 : 1000}
                        decimalScale={rentCommissionType === 'percentage' ? 1 : 0}
                        thousandSeparator={rentCommissionType === 'fixed' ? ' ' : undefined}
                        disabled={viewMode}
                        leftSection={
                          rentCommissionType === 'percentage' 
                            ? <IconPercentage size={16} /> 
                            : <IconCurrencyDollar size={16} />
                        }
                        rightSection={
                          <Text size="xs" c="dimmed" style={{ marginRight: 8 }}>
                            {rentCommissionType === 'percentage' ? '%' : 'THB'}
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
                  </Grid.Col>
                )}
              </Grid>
            </Stack>
          </Card>
        )}
      </Stack>

      <style>
        {`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </Card>
  );
};

export default CommissionForm;