// frontend/src/modules/FinancialDocuments/components/CreateReceiptModal.tsx
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
  Grid,
  Paper,
  ThemeIcon,
  Stepper,
  Alert,
  Checkbox,
  FileButton,
  Image,
  ActionIcon,
  Badge,
  useMantineTheme,
  SimpleGrid
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { useMediaQuery } from '@mantine/hooks';
import {
  IconFileText,
  IconUpload,
  IconTrash,
  IconCheck,
  IconX,
  IconReceipt,
  IconCalendar,
  IconCurrencyBaht,
  IconFileInvoice,
  IconInfoCircle,
  IconChevronRight,
  IconChevronLeft,
  IconCheckbox,
  IconPhoto,
  IconAlertCircle
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { financialDocumentsApi, CreateReceiptDTO, Invoice, InvoiceItem } from '@/api/financialDocuments.api';
import { agreementsApi, Agreement } from '@/api/agreements.api';
import dayjs from 'dayjs';

interface CreateReceiptModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  invoiceId?: number;
}

interface UploadedFile {
  file: File;
  preview: string;
}

const CreateReceiptModal = ({ visible, onCancel, onSuccess, invoiceId }: CreateReceiptModalProps) => {
  const { t } = useTranslation();
  const theme = useMantineTheme();
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [selectedItems, setSelectedItems] = useState<number[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);

  // Form state
  const [agreementId, setAgreementId] = useState<string | null>(null);
  const [invoiceIdState, setInvoiceIdState] = useState<string | null>(null);
  const [receiptDate, setReceiptDate] = useState<Date>(new Date());
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'bank_transfer' | 'cash' | 'crypto' | 'barter'>('bank_transfer');
  const [notes, setNotes] = useState('');

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (visible) {
      fetchAgreements();
      resetForm();
      
      if (invoiceId) {
        loadInvoiceData(invoiceId);
      }
    }
  }, [visible, invoiceId]);

  const fetchAgreements = async () => {
    try {
      const response = await agreementsApi.getAll({ limit: 100 });
      setAgreements(response.data.data);
    } catch (error: any) {
      notifications.show({
        title: t('errors.generic'),
        message: t('createReceiptModal.messages.agreementsLoadError'),
        color: 'red',
        icon: <IconX size={18} />
      });
    }
  };

  const loadInvoiceData = async (id: number) => {
    try {
      const response = await financialDocumentsApi.getInvoiceById(id);
      const invoice = response.data.data;
      setSelectedInvoice(invoice);
      setInvoiceIdState(String(invoice.id));
      setAgreementId(String(invoice.agreement_id));
      
      // Автоматически выбираем все позиции
      if (invoice.items) {
        setSelectedItems(invoice.items.map(item => item.id!));
      }

      // Предзаполняем сумму оплаты (остаток)
      const remaining = invoice.total_amount - invoice.amount_paid;
      setAmountPaid(remaining);
    } catch (error: any) {
      notifications.show({
        title: t('errors.generic'),
        message: t('createReceiptModal.messages.invoiceLoadError'),
        color: 'red',
        icon: <IconX size={18} />
      });
    }
  };

  const handleAgreementChange = async (value: string | null) => {
    if (!value) {
      setAgreementId(null);
      setInvoices([]);
      setSelectedInvoice(null);
      setSelectedItems([]);
      setInvoiceIdState(null);
      return;
    }

    setAgreementId(value);

    try {
      const response = await financialDocumentsApi.getInvoicesByAgreement(Number(value));
      setInvoices(response.data.data);
      setSelectedInvoice(null);
      setSelectedItems([]);
      setInvoiceIdState(null);
    } catch (error: any) {
      notifications.show({
        title: t('errors.generic'),
        message: t('createReceiptModal.messages.invoicesLoadError'),
        color: 'red',
        icon: <IconX size={18} />
      });
    }
  };

  const handleInvoiceChange = async (value: string | null) => {
    if (!value) {
      setInvoiceIdState(null);
      setSelectedInvoice(null);
      setSelectedItems([]);
      return;
    }

    setInvoiceIdState(value);

    try {
      const response = await financialDocumentsApi.getInvoiceById(Number(value));
      const invoice = response.data.data;
      setSelectedInvoice(invoice);
      
      // Автоматически выбираем все позиции
      if (invoice.items) {
        setSelectedItems(invoice.items.map(item => item.id!));
      }
      
      // Предзаполняем сумму оплаты (остаток к оплате)
      const remaining = invoice.total_amount - invoice.amount_paid;
      setAmountPaid(remaining);
    } catch (error: any) {
      notifications.show({
        title: t('errors.generic'),
        message: t('createReceiptModal.messages.invoiceLoadError'),
        color: 'red',
        icon: <IconX size={18} />
      });
    }
  };

  const handleFilesUpload = (files: File[]) => {
    const newFiles: UploadedFile[] = [];
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        newFiles.push({
          file: file,
          preview: e.target?.result as string
        });
        
        if (newFiles.length === files.length) {
          setUploadedFiles([...uploadedFiles, ...newFiles]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeFile = (index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index);
    setUploadedFiles(newFiles);
  };

  const resetForm = () => {
    setCurrentStep(0);
    setSelectedInvoice(null);
    setInvoices([]);
    setSelectedItems([]);
    setUploadedFiles([]);
    setAgreementId(null);
    setInvoiceIdState(null);
    setReceiptDate(new Date());
    setAmountPaid(0);
    setPaymentMethod('bank_transfer');
    setNotes('');
    setErrors({});
  };

  const toggleItemSelection = (itemId: number) => {
    if (selectedItems.includes(itemId)) {
      setSelectedItems(selectedItems.filter(id => id !== itemId));
    } else {
      setSelectedItems([...selectedItems, itemId]);
    }
  };

  const toggleSelectAll = () => {
    if (!selectedInvoice || !selectedInvoice.items) return;
    
    if (selectedItems.length === selectedInvoice.items.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(selectedInvoice.items.map(item => item.id!));
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 0) {
      if (!agreementId) {
        newErrors.agreementId = t('createReceiptModal.validation.selectAgreement');
      }
      if (!invoiceIdState) {
        newErrors.invoiceId = t('createReceiptModal.validation.selectInvoice');
      }
      if (!receiptDate) {
        newErrors.receiptDate = t('createReceiptModal.validation.specifyDate');
      }
      if (!amountPaid || amountPaid <= 0) {
        newErrors.amountPaid = t('createReceiptModal.validation.specifyAmount');
      }
      if (selectedInvoice && amountPaid > (selectedInvoice.total_amount - selectedInvoice.amount_paid)) {
        newErrors.amountPaid = t('createReceiptModal.validation.amountExceedsRemaining');
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
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    setCurrentStep(currentStep - 1);
    setErrors({});
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    try {
      setLoading(true);

      if (selectedItems.length === 0) {
        notifications.show({
          title: t('errors.validation'),
          message: t('createReceiptModal.validation.selectAtLeastOneItem'),
          color: 'red',
          icon: <IconX size={18} />
        });
        setLoading(false);
        return;
      }

      const receiptData: CreateReceiptDTO = {
        invoice_id: Number(invoiceIdState),
        agreement_id: agreementId ? Number(agreementId) : undefined,
        receipt_date: dayjs(receiptDate).format('YYYY-MM-DD'),
        amount_paid: amountPaid,
        payment_method: paymentMethod,
        notes: notes,
        selected_items: selectedItems
      };

      const response = await financialDocumentsApi.createReceipt(receiptData);
      const receiptId = response.data.data.id;

      // Загружаем файлы если есть
      if (uploadedFiles.length > 0) {
        const formData = new FormData();
        uploadedFiles.forEach((fileObj, index) => {
          formData.append(`file_${index}`, fileObj.file);
        });

        try {
          await financialDocumentsApi.uploadReceiptFiles(receiptId, formData);
        } catch (uploadError) {
          console.error('File upload error:', uploadError);
          notifications.show({
            title: t('common.success'),
            message: t('createReceiptModal.messages.createdButFilesNotUploaded'),
            color: 'orange',
            icon: <IconAlertCircle size={18} />
          });
        }
      }

      notifications.show({
        title: t('common.success'),
        message: t('createReceiptModal.messages.created'),
        color: 'green',
        icon: <IconCheck size={18} />
      });
      
      onSuccess();
      resetForm();
    } catch (error: any) {
      console.error('Error creating receipt:', error);
      notifications.show({
        title: t('errors.generic'),
        message: error.response?.data?.message || t('createReceiptModal.messages.createError'),
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

  const remainingAmount = selectedInvoice 
    ? selectedInvoice.total_amount - selectedInvoice.amount_paid 
    : 0;

  return (
    <Modal
      opened={visible}
      onClose={onCancel}
      title={
        <Group gap="sm">
          <ThemeIcon size="lg" radius="md" variant="gradient" gradient={{ from: 'blue', to: 'cyan' }}>
            <IconReceipt size={20} />
          </ThemeIcon>
          <Text size="lg" fw={700}>
            {t('createReceiptModal.title')}
          </Text>
        </Group>
      }
      size={isMobile ? 'full' : 'xl'}
      centered={!isMobile}
      padding="lg"
    >
      <Stack gap="lg">
        {/* Stepper */}
        <Stepper 
          active={currentStep} 
          onStepClick={setCurrentStep}
          size={isMobile ? 'xs' : 'sm'}
          iconSize={isMobile ? 32 : 42}
        >
          <Stepper.Step
            label={!isMobile ? t('createReceiptModal.steps.basic') : undefined}
            description={!isMobile ? t('createReceiptModal.steps.basicDesc') : undefined}
            icon={<IconFileText size={18} />}
          />
          <Stepper.Step
            label={!isMobile ? t('createReceiptModal.steps.files') : undefined}
            description={!isMobile ? t('createReceiptModal.steps.filesDesc') : undefined}
            icon={<IconUpload size={18} />}
          />
        </Stepper>

        {/* Шаг 1: Основная информация */}
        {currentStep === 0 && (
          <Stack gap="md">
            <Grid gutter="md">
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Select
                  label={t('createReceiptModal.fields.agreement')}
                  placeholder={t('createReceiptModal.placeholders.selectAgreement')}
                  leftSection={<IconFileInvoice size={18} />}
                  data={agreements.map(agreement => ({
                    value: String(agreement.id),
                    label: agreement.agreement_number + (agreement.property_name ? ` - ${agreement.property_name}` : '')
                  }))}
                  value={agreementId}
                  onChange={handleAgreementChange}
                  searchable
                  clearable
                  disabled={!!invoiceId}
                  error={errors.agreementId}
                  styles={{ input: { fontSize: '16px' } }}
                  required
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 6 }}>
                <Select
                  label={t('createReceiptModal.fields.invoice')}
                  placeholder={t('createReceiptModal.placeholders.selectInvoice')}
                  leftSection={<IconReceipt size={18} />}
                  data={invoices.map(invoice => ({
                    value: String(invoice.id),
                    label: `${invoice.invoice_number} - ${formatCurrency(invoice.total_amount - invoice.amount_paid)} THB ${t('createReceiptModal.remaining')}`
                  }))}
                  value={invoiceIdState}
                  onChange={handleInvoiceChange}
                  searchable
                  clearable
                  disabled={invoices.length === 0 || !!invoiceId}
                  error={errors.invoiceId}
                  styles={{ input: { fontSize: '16px' } }}
                  required
                />
              </Grid.Col>
            </Grid>

            {/* Информация о выбранном инвойсе */}
            {selectedInvoice && (
              <Alert
                icon={<IconInfoCircle size={18} />}
                title={t('createReceiptModal.invoiceInfo.title')}
                color="blue"
                variant="light"
              >
                <Stack gap="xs">
                  <Group justify="space-between">
                    <Text size="sm">
                      <strong>{t('createReceiptModal.invoiceInfo.totalAmount')}:</strong>
                    </Text>
                    <Text size="sm" fw={600}>
                      {formatCurrency(selectedInvoice.total_amount)} THB
                    </Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="sm">
                      <strong>{t('createReceiptModal.invoiceInfo.alreadyPaid')}:</strong>
                    </Text>
                    <Text size="sm" fw={600}>
                      {formatCurrency(selectedInvoice.amount_paid)} THB
                    </Text>
                  </Group>
                  <Group justify="space-between">
                    <Text size="sm">
                      <strong>{t('createReceiptModal.invoiceInfo.remainingToPay')}:</strong>
                    </Text>
                    <Text size="sm" fw={600} c="yellow">
                      {formatCurrency(remainingAmount)} THB
                    </Text>
                  </Group>
                </Stack>
              </Alert>
            )}

            <Grid gutter="md">
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <DateInput
                  label={t('createReceiptModal.fields.paymentDate')}
                  placeholder={t('createReceiptModal.placeholders.selectDate')}
                  leftSection={<IconCalendar size={18} />}
                  value={receiptDate}
                  onChange={(date) => setReceiptDate(date || new Date())}
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
                  max={remainingAmount || undefined}
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

            {/* Выбор позиций для оплаты */}
            {selectedInvoice && selectedInvoice.items && selectedInvoice.items.length > 0 && (
              <Card shadow="sm" padding="md" radius="md" withBorder>
                <Stack gap="md">
                  <Group justify="space-between">
                    <Group gap="xs">
                      <ThemeIcon size="md" radius="md" variant="light" color="blue">
                        <IconCheckbox size={18} />
                      </ThemeIcon>
                      <Text size="sm" fw={600}>
                        {t('createReceiptModal.sections.selectItems')}
                      </Text>
                    </Group>
                    <Badge color="blue" variant="light">
                      {selectedItems.length} / {selectedInvoice.items.length}
                    </Badge>
                  </Group>

                  <Checkbox
                    label={t('createReceiptModal.selectAll')}
                    checked={selectedItems.length === selectedInvoice.items.length}
                    indeterminate={
                      selectedItems.length > 0 && 
                      selectedItems.length < selectedInvoice.items.length
                    }
                    onChange={toggleSelectAll}
                    fw={600}
                  />

                  <Stack gap="xs">
                    {selectedInvoice.items.map((item: InvoiceItem) => (
                      <Card
                        key={item.id}
                        padding="sm"
                        radius="md"
                        withBorder
                        style={{
                          borderColor: selectedItems.includes(item.id!) 
                            ? theme.colors.blue[6] 
                            : undefined,
                          borderWidth: selectedItems.includes(item.id!) ? 2 : 1,
                          cursor: 'pointer'
                        }}
                        onClick={() => toggleItemSelection(item.id!)}
                      >
                        <Checkbox
                          checked={selectedItems.includes(item.id!)}
                          onChange={() => toggleItemSelection(item.id!)}
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
              placeholder={t('createReceiptModal.placeholders.notes')}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              minRows={3}
              styles={{ input: { fontSize: '16px' } }}
            />
          </Stack>
        )}

        {/* Шаг 2: Загрузка файлов */}
        {currentStep === 1 && (
          <Stack gap="md">
            <Alert
              icon={<IconInfoCircle size={18} />}
              title={t('createReceiptModal.fileUpload.title')}
              color="blue"
              variant="light"
            >
              {t('createReceiptModal.fileUpload.description')}
            </Alert>

            {/* Предпросмотр загруженных файлов */}
            {uploadedFiles.length > 0 && (
              <SimpleGrid cols={{ base: 2, xs: 3, sm: 4 }} spacing="xs">
                {uploadedFiles.map((fileObj, index) => (
                  <Card
                    key={index}
                    padding="xs"
                    radius="md"
                    withBorder
                    style={{ position: 'relative' }}
                  >
                    <Image
                      src={fileObj.preview}
                      alt={`File ${index + 1}`}
                      height={120}
                      fit="cover"
                      radius="sm"
                    />
                    <ActionIcon
                      color="red"
                      variant="filled"
                      size="sm"
                      radius="xl"
                      onClick={() => removeFile(index)}
                      style={{
                        position: 'absolute',
                        top: 4,
                        right: 4
                      }}
                    >
                      <IconTrash size={14} />
                    </ActionIcon>
                  </Card>
                ))}
              </SimpleGrid>
            )}

            <FileButton
              onChange={handleFilesUpload}
              accept="image/*"
              multiple
            >
              {(props) => (
                <Button
                  {...props}
                  leftSection={<IconUpload size={18} />}
                  variant={uploadedFiles.length > 0 ? 'light' : 'filled'}
                  fullWidth
                  size="lg"
                >
                  {uploadedFiles.length > 0 
                    ? t('createReceiptModal.fileUpload.uploadMore', { count: uploadedFiles.length })
                    : t('createReceiptModal.fileUpload.uploadButton')}
                </Button>
              )}
            </FileButton>

            {/* Итоговая информация */}
            <Paper
              p="lg"
              radius="md"
              withBorder
              style={{
                background: `linear-gradient(135deg, ${theme.colors.green[9]} 0%, ${theme.colors.teal[9]} 100%)`
              }}
            >
              <Stack gap="md">
                <Group gap="xs">
                  <ThemeIcon size="md" radius="md" variant="white" color="green">
                    <IconCheck size={18} />
                  </ThemeIcon>
                  <Text size="md" fw={600} c="white">
                    {t('createReceiptModal.sections.summary')}
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

                <Group justify="space-between">
                  <Text size="sm" c="white" opacity={0.9}>
                    {t('createReceiptModal.summary.filesAttached')}:
                  </Text>
                  <Badge color="white" variant="light">
                    <Group gap={4}>
                      <IconPhoto size={14} />
                      {uploadedFiles.length}
                    </Group>
                  </Badge>
                </Group>
              </Stack>
            </Paper>
          </Stack>
        )}

        {/* Кнопки навигации */}
        <Group justify="space-between">
          <Button
            variant="subtle"
            onClick={onCancel}
          >
            {t('common.cancel')}
          </Button>

          <Group gap="xs">
            {currentStep > 0 && (
              <Button
                variant="light"
                leftSection={<IconChevronLeft size={18} />}
                onClick={handlePrev}
              >
                {t('createReceiptModal.buttons.back')}
              </Button>
            )}
            {currentStep < 1 ? (
              <Button
                rightSection={<IconChevronRight size={18} />}
                onClick={handleNext}
              >
                {t('createReceiptModal.buttons.next')}
              </Button>
            ) : (
              <Button
                leftSection={<IconCheck size={18} />}
                onClick={handleSubmit}
                loading={loading}
                gradient={{ from: 'green', to: 'teal' }}
                variant="gradient"
              >
                {t('createReceiptModal.buttons.create')}
              </Button>
            )}
          </Group>
        </Group>
      </Stack>
    </Modal>
  );
};

export default CreateReceiptModal;