// frontend/src/modules/FinancialDocuments/components/EditReceiptModal.tsx
import { useState, useEffect } from 'react';
import {
  Modal,
  Button,
  Stack,
  Group,
  Text,
  Textarea,
  NumberInput,
  Select,
  Card,
  Paper,
  ThemeIcon,
  Alert,
  Checkbox,
  Badge,
  useMantineTheme,
  Grid
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { useMediaQuery } from '@mantine/hooks';
import {
  IconCheck,
  IconX,
  IconReceipt,
  IconCalendar,
  IconCurrencyBaht,
  IconInfoCircle,
  IconCheckbox,
  IconDeviceFloppy,
  IconAlertCircle
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { financialDocumentsApi, CreateReceiptDTO, Receipt } from '@/api/financialDocuments.api';
import dayjs from 'dayjs';

interface EditReceiptModalProps {
  visible: boolean;
  receipt: Receipt | null;
  onCancel: () => void;
  onSuccess: () => void;
}

const EditReceiptModal = ({ visible, receipt, onCancel, onSuccess }: EditReceiptModalProps) => {
  const { t } = useTranslation();
  const theme = useMantineTheme();
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  const [loading, setLoading] = useState(false);
  const [invoiceItems, setInvoiceItems] = useState<any[]>([]);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);

  // Form state
  const [invoiceId, setInvoiceId] = useState<number | null>(null);
  const [agreementId, setAgreementId] = useState<number | null>(null);
  const [receiptDate, setReceiptDate] = useState<Date | null>(new Date());
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'cash' | 'crypto' | 'barter'>('bank_transfer');
  const [notes, setNotes] = useState('');

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (visible && receipt) {
      loadReceiptData();
    }
  }, [visible, receipt]);

  const loadReceiptData = async () => {
    if (!receipt) return;

    // Загружаем данные квитанции
    setInvoiceId(receipt.invoice_id);
    setAgreementId(receipt.agreement_id || null);
    setReceiptDate(receipt.receipt_date ? new Date(receipt.receipt_date) : null);
    setAmountPaid(receipt.amount_paid);
    setPaymentMethod(receipt.payment_method);
    setNotes(receipt.notes || '');

    // Загружаем позиции инвойса
    if (receipt.invoice_id) {
      await fetchInvoiceItems(receipt.invoice_id);
    }

    // Устанавливаем выбранные позиции
    if (receipt.items && receipt.items.length > 0) {
      const itemIds = receipt.items.map(item => item.invoice_item_id);
      setSelectedItems(itemIds);
    }
  };

  const fetchInvoiceItems = async (invoiceIdParam: number) => {
    try {
      const response = await financialDocumentsApi.getInvoiceById(invoiceIdParam);
      const invoice = response.data.data;
      setInvoiceItems(invoice.items || []);
    } catch (error: any) {
      notifications.show({
        title: t('errors.generic'),
        message: t('editReceiptModal.messages.invoiceItemsLoadError'),
        color: 'red',
        icon: <IconX size={18} />
      });
    }
  };

  const toggleItemSelection = (itemId: number) => {
    if (selectedItems.includes(itemId)) {
      setSelectedItems(selectedItems.filter(id => id !== itemId));
    } else {
      setSelectedItems([...selectedItems, itemId]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedItems.length === invoiceItems.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(invoiceItems.map(item => item.id));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!invoiceId) {
      newErrors.invoiceId = t('createReceiptModal.validation.selectInvoice');
    }
    if (!receiptDate) {
      newErrors.receiptDate = t('createReceiptModal.validation.specifyDate');
    }
    if (!amountPaid || amountPaid <= 0) {
      newErrors.amountPaid = t('createReceiptModal.validation.specifyAmount');
    }
    if (!paymentMethod) {
      newErrors.paymentMethod = t('createReceiptModal.validation.selectPaymentMethod');
    }
    if (selectedItems.length === 0) {
      notifications.show({
        title: t('errors.validation'),
        message: t('createReceiptModal.validation.selectAtLeastOneItem'),
        color: 'red',
        icon: <IconX size={18} />
      });
      return false;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!receipt || !validateForm()) return;

    try {
      setLoading(true);

      const receiptData: Partial<CreateReceiptDTO> = {
        invoice_id: invoiceId!,
        agreement_id: agreementId || undefined,
        receipt_date: receiptDate ? dayjs(receiptDate).format('YYYY-MM-DD') : undefined,
        amount_paid: amountPaid,
        payment_method: paymentMethod,
        notes: notes,
        selected_items: selectedItems
      };

      await financialDocumentsApi.updateReceipt(receipt.id, receiptData);
      
      notifications.show({
        title: t('common.success'),
        message: t('editReceiptModal.messages.updated'),
        color: 'green',
        icon: <IconCheck size={18} />
      });
      
      onSuccess();
    } catch (error: any) {
      console.error('Error updating receipt:', error);
      notifications.show({
        title: t('errors.generic'),
        message: error.response?.data?.message || t('editReceiptModal.messages.updateError'),
        color: 'red',
        icon: <IconX size={18} />
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US').format(amount);
  };

  const getPaymentMethodText = (method: string) => {
    const methods: Record<string, string> = {
      bank_transfer: t('createReceiptModal.paymentMethods.bankTransfer'),
      cash: t('createReceiptModal.paymentMethods.cash'),
      crypto: t('createReceiptModal.paymentMethods.crypto'),
      barter: t('createReceiptModal.paymentMethods.barter')
    };
    return methods[method] || method;
  };

  return (
    <Modal
      opened={visible}
      onClose={onCancel}
      title={
        <Group gap="sm">
          <ThemeIcon size="lg" radius="md" variant="gradient" gradient={{ from: 'orange', to: 'yellow' }}>
            <IconReceipt size={20} />
          </ThemeIcon>
          <Text size="lg" fw={700}>
            {t('editReceiptModal.title')}
          </Text>
        </Group>
      }
      size={isMobile ? 'full' : 'lg'}
      centered={!isMobile}
      padding="lg"
    >
      <Stack gap="lg">
        <Alert
          icon={<IconInfoCircle size={18} />}
          title={t('editReceiptModal.alerts.editInfoTitle')}
          color="orange"
          variant="light"
        >
          {t('editReceiptModal.alerts.editInfoDesc')}
        </Alert>

        <Stack gap="md">
          {/* Invoice ID (disabled) */}
          <Alert
            icon={<IconAlertCircle size={18} />}
            color="blue"
            variant="light"
          >
            <Stack gap="xs">
              <Text size="sm" fw={600}>
                {t('editReceiptModal.fields.invoiceNumber')}
              </Text>
              <Text size="sm" c="dimmed">
                {receipt?.invoice_number || `Invoice #${invoiceId}`}
              </Text>
            </Stack>
          </Alert>

          <Grid gutter="md">
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <DateInput
                label={t('createReceiptModal.fields.paymentDate')}
                placeholder={t('createReceiptModal.placeholders.selectDate')}
                leftSection={<IconCalendar size={18} />}
                value={receiptDate}
                onChange={setReceiptDate}
                valueFormat="DD.MM.YYYY"
                clearable={false}
                error={errors.receiptDate}
                styles={{ input: { fontSize: '16px' } }}
                required
              />
            </Grid.Col>

            <Grid.Col span={{ base: 12, sm: 6 }}>
              <NumberInput
                label={t('createReceiptModal.fields.paymentAmount')}
                placeholder="0"
                leftSection={<IconCurrencyBaht size={18} />}
                value={amountPaid}
                onChange={(value) => setAmountPaid(typeof value === 'number' ? value : 0)}
                min={0.01}
                step={100}
                thousandSeparator=" "
                suffix=" THB"
                error={errors.amountPaid}
                styles={{ input: { fontSize: '16px' } }}
                required
              />
            </Grid.Col>
          </Grid>

          <Select
            label={t('createReceiptModal.fields.paymentMethod')}
            placeholder={t('createReceiptModal.placeholders.selectMethod')}
            data={[
              { value: 'bank_transfer', label: t('createReceiptModal.paymentMethods.bankTransfer') },
              { value: 'cash', label: t('createReceiptModal.paymentMethods.cash') },
              { value: 'crypto', label: t('createReceiptModal.paymentMethods.crypto') },
              { value: 'barter', label: t('createReceiptModal.paymentMethods.barter') }
            ]}
            value={paymentMethod}
            onChange={(value) => setPaymentMethod(value as 'bank_transfer' | 'cash' | 'crypto' | 'barter')}
            error={errors.paymentMethod}
            styles={{ input: { fontSize: '16px' } }}
            required
          />

          {/* Выбор оплаченных позиций */}
          {invoiceItems.length > 0 && (
            <Card shadow="sm" padding="md" radius="md" withBorder>
              <Stack gap="md">
                <Group justify="space-between">
                  <Group gap="xs">
                    <ThemeIcon size="md" radius="md" variant="light" color="orange">
                      <IconCheckbox size={18} />
                    </ThemeIcon>
                    <Text size="sm" fw={600}>
                      {t('editReceiptModal.sections.paidItems')}
                    </Text>
                  </Group>
                  <Badge color="orange" variant="light">
                    {selectedItems.length} / {invoiceItems.length}
                  </Badge>
                </Group>

                <Checkbox
                  label={t('createReceiptModal.selectAll')}
                  checked={selectedItems.length === invoiceItems.length}
                  indeterminate={
                    selectedItems.length > 0 && 
                    selectedItems.length < invoiceItems.length
                  }
                  onChange={toggleSelectAll}
                  fw={600}
                />

                <Stack gap="xs">
                  {invoiceItems.map((item) => (
                    <Card
                      key={item.id}
                      padding="sm"
                      radius="md"
                      withBorder
                      style={{
                        borderColor: selectedItems.includes(item.id) 
                          ? theme.colors.orange[6] 
                          : undefined,
                        borderWidth: selectedItems.includes(item.id) ? 2 : 1,
                        cursor: 'pointer'
                      }}
                      onClick={() => toggleItemSelection(item.id)}
                    >
                      <Checkbox
                        checked={selectedItems.includes(item.id)}
                        onChange={() => toggleItemSelection(item.id)}
                        label={
                          <Stack gap={4}>
                            <Text size="sm" fw={600}>
                              {item.description}
                            </Text>
                            <Text size="xs" c="dimmed">
                              {item.quantity} x {formatCurrency(item.unit_price)} THB = {formatCurrency(item.total_price)} THB
                            </Text>
                          </Stack>
                        }
                      />
                    </Card>
                  ))}
                </Stack>
              </Stack>
            </Card>
          )}

          <Textarea
            label={t('createReceiptModal.fields.notes')}
            placeholder={t('editReceiptModal.placeholders.receiptNotes')}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            minRows={3}
            styles={{ input: { fontSize: '16px' } }}
          />

          {/* Итоговая информация */}
          <Paper
            p="lg"
            radius="md"
            withBorder
            style={{
              background: `linear-gradient(135deg, ${theme.colors.orange[9]} 0%, ${theme.colors.yellow[9]} 100%)`
            }}
          >
            <Stack gap="md">
              <Group gap="xs">
                <ThemeIcon size="md" radius="md" variant="white" color="orange">
                  <IconCheck size={18} />
                </ThemeIcon>
                <Text size="md" fw={600} c="white">
                  {t('editReceiptModal.sections.summary')}
                </Text>
              </Group>

              <Group justify="space-between">
                <Text size="sm" c="white" opacity={0.9}>
                  {t('createReceiptModal.summary.paymentAmount')}:
                </Text>
                <Text size="lg" fw={700} c="white">
                  {formatCurrency(amountPaid)} THB
                </Text>
              </Group>

              <Group justify="space-between">
                <Text size="sm" c="white" opacity={0.9}>
                  {t('createReceiptModal.summary.paymentMethod')}:
                </Text>
                <Text size="sm" fw={600} c="white">
                  {getPaymentMethodText(paymentMethod)}
                </Text>
              </Group>

              <Group justify="space-between">
                <Text size="sm" c="white" opacity={0.9}>
                  {t('createReceiptModal.summary.itemsPaid')}:
                </Text>
                <Text size="sm" fw={600} c="white">
                  {selectedItems.length}
                </Text>
              </Group>
            </Stack>
          </Paper>
        </Stack>

        {/* Кнопки */}
        <Group justify="space-between">
          <Button
            variant="subtle"
            onClick={onCancel}
          >
            {t('common.cancel')}
          </Button>

          <Button
            leftSection={<IconDeviceFloppy size={18} />}
            onClick={handleSubmit}
            loading={loading}
            gradient={{ from: 'orange', to: 'yellow' }}
            variant="gradient"
          >
            {t('editReceiptModal.buttons.save')}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
};

export default EditReceiptModal;