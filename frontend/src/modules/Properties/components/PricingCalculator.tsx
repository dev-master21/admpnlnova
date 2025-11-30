import { useState, useEffect } from 'react';
import {
  Stack,
  Group,
  Text,
  NumberInput,
  SegmentedControl,
  Select,
  Paper,
  Badge,
  Divider
} from '@mantine/core';
import {
  IconCurrencyBaht,
  IconPercentage,
  IconCalculator,
  IconTrendingUp
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

interface PricingData {
  mode: 'net' | 'gross';
  price: number | null;
  commissionType: 'percentage' | 'fixed' | null;
  commissionValue: number | null;
}

interface CalculationResult {
  finalPrice: number;
  sourcePrice: number;
  marginAmount: number;
  marginPercentage: number;
}

interface PricingCalculatorProps {
  value: PricingData;
  onChange: (data: PricingData) => void;
  disabled?: boolean;
  size?: 'xs' | 'sm' | 'md';
}

const PricingCalculator = ({
  value,
  onChange,
  disabled = false,
  size = 'sm'
}: PricingCalculatorProps) => {
  const { t } = useTranslation();

  const [calculation, setCalculation] = useState<CalculationResult | null>(null);

  // Функция расчета
  const calculatePricing = (data: PricingData): CalculationResult | null => {
    if (!data.price || data.price <= 0) return null;
    if (!data.commissionType || !data.commissionValue || data.commissionValue <= 0) {
      // Если нет комиссии - возвращаем цену как есть
      return {
        finalPrice: data.price,
        sourcePrice: data.price,
        marginAmount: 0,
        marginPercentage: 0
      };
    }

    if (data.mode === 'net') {
      // NET режим: исходная цена + комиссия = цена для клиента
      const sourcePrice = data.price;
      let marginAmount = 0;
      
      if (data.commissionType === 'percentage') {
        marginAmount = sourcePrice * (data.commissionValue / 100);
      } else {
        marginAmount = data.commissionValue;
      }
      
      const finalPrice = sourcePrice + marginAmount;
      const marginPercentage = (marginAmount / sourcePrice) * 100;

      return {
        finalPrice: Math.round(finalPrice),
        sourcePrice: Math.round(sourcePrice),
        marginAmount: Math.round(marginAmount),
        marginPercentage: Math.round(marginPercentage * 100) / 100
      };
    } else {
      // GROSS режим: цена для клиента уже указана, считаем маржу от неё
      const finalPrice = data.price;
      let marginAmount = 0;
      
      if (data.commissionType === 'percentage') {
        marginAmount = finalPrice * (data.commissionValue / 100);
      } else {
        marginAmount = data.commissionValue;
      }
      
      const sourcePrice = finalPrice - marginAmount;
      const marginPercentage = (marginAmount / finalPrice) * 100;

      return {
        finalPrice: Math.round(finalPrice),
        sourcePrice: Math.round(sourcePrice),
        marginAmount: Math.round(marginAmount),
        marginPercentage: Math.round(marginPercentage * 100) / 100
      };
    }
  };

  // Пересчитываем при изменении данных
  useEffect(() => {
    const result = calculatePricing(value);
    setCalculation(result);
  }, [value]);

  return (
    <Stack gap="md">
      {/* Переключатель режима NET/GROSS */}
      <Stack gap="xs">
        <Text size="xs" fw={500} c="dimmed">
          {t('pricing.calculator.mode')}
        </Text>
        <SegmentedControl
          value={value.mode}
          onChange={(val) => onChange({ ...value, mode: val as 'net' | 'gross' })}
          data={[
            {
              value: 'net',
              label: (
                <Group gap="xs" justify="center">
                  <Text size={size}>{t('pricing.calculator.net')}</Text>
                  <Badge size="xs" variant="light" color="blue">
                    {t('pricing.calculator.netHint')}
                  </Badge>
                </Group>
              )
            },
            {
              value: 'gross',
              label: (
                <Group gap="xs" justify="center">
                  <Text size={size}>{t('pricing.calculator.gross')}</Text>
                  <Badge size="xs" variant="light" color="green">
                    {t('pricing.calculator.grossHint')}
                  </Badge>
                </Group>
              )
            }
          ]}
          disabled={disabled}
          fullWidth
          size={size}
        />
      </Stack>

      {/* Поле ввода цены */}
      <NumberInput
        label={
          value.mode === 'net'
            ? t('pricing.calculator.sourcePriceLabel')
            : t('pricing.calculator.clientPriceLabel')
        }
        placeholder="0"
        value={value.price ?? undefined}
        onChange={(val) => onChange({ ...value, price: Number(val) || null })}
        min={0}
        step={1000}
        thousandSeparator=" "
        disabled={disabled}
        leftSection={<IconCurrencyBaht size={16} />}
        rightSection={
          <Text size="xs" c="dimmed" mr={8}>
            ฿
          </Text>
        }
        size={size}
        styles={{
          input: {
            fontSize: size === 'xs' ? '14px' : '16px',
            fontWeight: 600
          }
        }}
      />

      {/* Тип комиссии */}
      <Select
        label={t('pricing.calculator.commissionType')}
        placeholder={t('common.select')}
        value={value.commissionType}
        onChange={(val) =>
          onChange({
            ...value,
            commissionType: val as 'percentage' | 'fixed' | null,
            commissionValue: null
          })
        }
        data={[
          {
            value: 'percentage',
            label: t('pricing.calculator.percentage')
          },
          {
            value: 'fixed',
            label: t('pricing.calculator.fixed')
          }
        ]}
        disabled={disabled}
        leftSection={<IconPercentage size={16} />}
        clearable
        size={size}
      />

      {/* Значение комиссии */}
      {value.commissionType && (
        <NumberInput
          label={t('pricing.calculator.commissionValue')}
          placeholder={
            value.commissionType === 'percentage'
              ? t('pricing.calculator.percentagePlaceholder')
              : t('pricing.calculator.fixedPlaceholder')
          }
          value={value.commissionValue ?? undefined}
          onChange={(val) =>
            onChange({ ...value, commissionValue: Number(val) || null })
          }
          min={0}
          max={value.commissionType === 'percentage' ? 100 : undefined}
          step={value.commissionType === 'percentage' ? 0.1 : 1000}
          decimalScale={value.commissionType === 'percentage' ? 2 : 0}
          thousandSeparator={value.commissionType === 'fixed' ? ' ' : undefined}
          disabled={disabled}
          leftSection={
            value.commissionType === 'percentage' ? (
              <IconPercentage size={16} />
            ) : (
              <IconCurrencyBaht size={16} />
            )
          }
          rightSection={
            <Text size="xs" c="dimmed" mr={8}>
              {value.commissionType === 'percentage' ? '%' : '฿'}
            </Text>
          }
          size={size}
          styles={{
            input: {
              fontSize: size === 'xs' ? '14px' : '16px'
            }
          }}
        />
      )}

      {/* Калькуляция */}
      {calculation && calculation.marginAmount > 0 && (
        <Paper
          p="md"
          radius="md"
          withBorder
          style={{
            background:
              'linear-gradient(135deg, rgba(34, 139, 230, 0.05) 0%, rgba(34, 195, 94, 0.05) 100%)',
            borderColor: 'rgba(34, 139, 230, 0.3)'
          }}
        >
          <Stack gap="sm">
            <Group gap="xs">
              <IconCalculator size={18} color="var(--mantine-color-blue-5)" />
              <Text size="sm" fw={600} c="blue">
                {t('pricing.calculator.calculation')}
              </Text>
            </Group>

            <Divider />

            {/* NET режим */}
            {value.mode === 'net' && (
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text size="xs" c="dimmed">
                    {t('pricing.calculator.sourcePrice')}
                  </Text>
                  <Text size="sm" fw={600}>
                    {calculation.sourcePrice.toLocaleString()} ฿
                  </Text>
                </Group>

                <Group justify="space-between">
                  <Group gap={4}>
                    <IconTrendingUp size={14} color="var(--mantine-color-green-5)" />
                    <Text size="xs" c="green">
                      {t('pricing.calculator.commission')}
                    </Text>
                  </Group>
                  <Text size="sm" fw={600} c="green">
                    +{calculation.marginAmount.toLocaleString()} ฿
                  </Text>
                </Group>

                <Divider />

                <Group justify="space-between">
                  <Text size="sm" fw={700}>
                    {t('pricing.calculator.clientPrice')}
                  </Text>
                  <Badge size="lg" variant="gradient" gradient={{ from: 'blue', to: 'green' }}>
                    {calculation.finalPrice.toLocaleString()} ฿
                  </Badge>
                </Group>
              </Stack>
            )}

            {/* GROSS режим */}
            {value.mode === 'gross' && (
              <Stack gap="xs">
                <Group justify="space-between">
                  <Text size="sm" fw={700}>
                    {t('pricing.calculator.clientPrice')}
                  </Text>
                  <Badge size="lg" variant="gradient" gradient={{ from: 'blue', to: 'green' }}>
                    {calculation.finalPrice.toLocaleString()} ฿
                  </Badge>
                </Group>

                <Divider />

                <Group justify="space-between">
                  <Text size="xs" c="dimmed">
                    {t('pricing.calculator.ownerReceives')}
                  </Text>
                  <Text size="sm" fw={600}>
                    {calculation.sourcePrice.toLocaleString()} ฿
                  </Text>
                </Group>

                <Group justify="space-between">
                  <Group gap={4}>
                    <IconTrendingUp size={14} color="var(--mantine-color-green-5)" />
                    <Text size="xs" c="green">
                      {t('pricing.calculator.ourMargin')}
                    </Text>
                  </Group>
                  <Group gap={4}>
                    <Text size="sm" fw={600} c="green">
                      {calculation.marginAmount.toLocaleString()} ฿
                    </Text>
                    <Text size="xs" c="dimmed">
                      ({calculation.marginPercentage.toFixed(2)}%)
                    </Text>
                  </Group>
                </Group>
              </Stack>
            )}
          </Stack>
        </Paper>
      )}
    </Stack>
  );
};

export default PricingCalculator;