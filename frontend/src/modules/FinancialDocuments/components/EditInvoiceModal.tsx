// frontend/src/modules/FinancialDocuments/components/EditInvoiceModal.tsx
import { useState, useEffect } from 'react';
import {
  Modal,
  Button,
  Stack,
  Group,
  Text,
  TextInput,
  Textarea,
  NumberInput,
  Select,
  Card,
  Grid,
  Divider,
  Paper,
  ActionIcon,
  ThemeIcon,
  Radio,
  Stepper,
  Alert,
  useMantineTheme
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { useMediaQuery } from '@mantine/hooks';
import {
  IconPlus,
  IconTrash,
  IconUser,
  IconFileText,
  IconCurrencyBaht,
  IconCheck,
  IconX,
  IconFileInvoice,
  IconBuilding,
  IconBuildingBank,
  IconChevronRight,
  IconChevronLeft,
  IconCalendar,
  IconInfoCircle,
  IconPackage,
  IconDeviceFloppy
} from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';
import { financialDocumentsApi, CreateInvoiceDTO, InvoiceItem, Invoice } from '@/api/financialDocuments.api';
import { agreementsApi, Agreement } from '@/api/agreements.api';
import dayjs from 'dayjs';

interface EditInvoiceModalProps {
  visible: boolean;
  invoice: Invoice | null;
  onCancel: () => void;
  onSuccess: () => void;
}

const EditInvoiceModal = ({ visible, invoice, onCancel, onSuccess }: EditInvoiceModalProps) => {
  const { t } = useTranslation();
  const theme = useMantineTheme();
  const isMobile = useMediaQuery('(max-width: 768px)');
  
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [agreements, setAgreements] = useState<Agreement[]>([]);
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: '', quantity: 1, unit_price: 0, total_price: 0 }
  ]);

  // Form state
  const [agreementIdState, setAgreementIdState] = useState<number | null>(null);
  const [invoiceDate, setInvoiceDate] = useState<Date | null>(new Date());
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [notes, setNotes] = useState('');

  // From/To party types
  const [fromType, setFromType] = useState<'company' | 'individual'>('company');
  const [toType, setToType] = useState<'company' | 'individual'>('individual');

  // From fields
  const [fromCompanyName, setFromCompanyName] = useState('');
  const [fromCompanyTaxId, setFromCompanyTaxId] = useState('');
  const [fromCompanyAddress, setFromCompanyAddress] = useState('');
  const [fromDirectorName, setFromDirectorName] = useState('');
  const [fromDirectorCountry, setFromDirectorCountry] = useState('');
  const [fromDirectorPassport, setFromDirectorPassport] = useState('');
  const [fromIndividualName, setFromIndividualName] = useState('');
  const [fromIndividualCountry, setFromIndividualCountry] = useState('');
  const [fromIndividualPassport, setFromIndividualPassport] = useState('');

  // To fields
  const [toCompanyName, setToCompanyName] = useState('');
  const [toCompanyTaxId, setToCompanyTaxId] = useState('');
  const [toCompanyAddress, setToCompanyAddress] = useState('');
  const [toDirectorName, setToDirectorName] = useState('');
  const [toDirectorCountry, setToDirectorCountry] = useState('');
  const [toDirectorPassport, setToDirectorPassport] = useState('');
  const [toIndividualName, setToIndividualName] = useState('');
  const [toIndividualCountry, setToIndividualCountry] = useState('');
  const [toIndividualPassport, setToIndividualPassport] = useState('');

  // Bank fields
  const [bankName, setBankName] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [taxAmount, setTaxAmount] = useState<number>(0);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (visible && invoice) {
      fetchAgreements();
      loadInvoiceData();
    }
  }, [visible, invoice]);

  const fetchAgreements = async () => {
    try {
      const response = await agreementsApi.getAll({ limit: 100 });
      setAgreements(response.data.data);
    } catch (error: any) {
      notifications.show({
        title: t('errors.generic'),
        message: t('createInvoiceModal.messages.agreementsLoadError'),
        color: 'red',
        icon: <IconX size={18} />
      });
    }
  };

  const loadInvoiceData = () => {
    if (!invoice) return;

    setFromType(invoice.from_type);
    setToType(invoice.to_type);
    setAgreementIdState(invoice.agreement_id || null);
    setInvoiceDate(invoice.invoice_date ? new Date(invoice.invoice_date) : null);
    setDueDate(invoice.due_date ? new Date(invoice.due_date) : null);
    setNotes(invoice.notes || '');
    setTaxAmount(parseFloat(String(invoice.tax_amount)) || 0);

    // Загружаем позиции
    if (invoice.items && invoice.items.length > 0) {
      const parsedItems = invoice.items.map(item => ({
        description: item.description || '',
        quantity: parseFloat(String(item.quantity)) || 1,
        unit_price: parseFloat(String(item.unit_price)) || 0,
        total_price: parseFloat(String(item.total_price)) || 0
      }));
      setItems(parsedItems);
    }

    // From fields
    setFromCompanyName(invoice.from_company_name || '');
    setFromCompanyTaxId(invoice.from_company_tax_id || '');
    setFromCompanyAddress(invoice.from_company_address || '');
    setFromDirectorName(invoice.from_director_name || '');
    setFromDirectorCountry(invoice.from_director_country || '');
    setFromDirectorPassport(invoice.from_director_passport || '');
    setFromIndividualName(invoice.from_individual_name || '');
    setFromIndividualCountry(invoice.from_individual_country || '');
    setFromIndividualPassport(invoice.from_individual_passport || '');

    // To fields
    setToCompanyName(invoice.to_company_name || '');
    setToCompanyTaxId(invoice.to_company_tax_id || '');
    setToCompanyAddress(invoice.to_company_address || '');
    setToDirectorName(invoice.to_director_name || '');
    setToDirectorCountry(invoice.to_director_country || '');
    setToDirectorPassport(invoice.to_director_passport || '');
    setToIndividualName(invoice.to_individual_name || '');
    setToIndividualCountry(invoice.to_individual_country || '');
    setToIndividualPassport(invoice.to_individual_passport || '');

    // Bank fields
    setBankName(invoice.bank_name || '');
    setBankAccountName(invoice.bank_account_name || '');
    setBankAccountNumber(invoice.bank_account_number || '');
  };

  const handleAgreementChange = async (value: string | null) => {
    if (!value) {
      setAgreementIdState(null);
      return;
    }

    setAgreementIdState(Number(value));

    try {
      const response = await agreementsApi.getAgreementWithParties(Number(value));
      const agreementData = response.data.data;

      // Автозаполнение FROM (lessor)
      if (agreementData.lessor) {
        const lessor = agreementData.lessor;
        setFromType(lessor.type);
        
        if (lessor.type === 'company') {
          setFromCompanyName(lessor.company_name || '');
          setFromCompanyTaxId(lessor.company_tax_id || '');
          setFromCompanyAddress(lessor.company_address || '');
          setFromDirectorName(lessor.director_name || '');
          setFromDirectorCountry(lessor.director_country || '');
          setFromDirectorPassport(lessor.director_passport || '');
        } else {
          setFromIndividualName(lessor.individual_name || '');
          setFromIndividualCountry(lessor.individual_country || '');
          setFromIndividualPassport(lessor.individual_passport || '');
        }
      }

      // Автозаполнение TO (tenant)
      if (agreementData.tenant) {
        const tenant = agreementData.tenant;
        setToType(tenant.type);
        
        if (tenant.type === 'company') {
          setToCompanyName(tenant.company_name || '');
          setToCompanyTaxId(tenant.company_tax_id || '');
          setToCompanyAddress(tenant.company_address || '');
          setToDirectorName(tenant.director_name || '');
          setToDirectorCountry(tenant.director_country || '');
          setToDirectorPassport(tenant.director_passport || '');
        } else {
          setToIndividualName(tenant.individual_name || '');
          setToIndividualCountry(tenant.individual_country || '');
          setToIndividualPassport(tenant.individual_passport || '');
        }
      }

      notifications.show({
        title: t('common.success'),
        message: t('editInvoiceModal.messages.agreementDataLoaded'),
        color: 'green',
        icon: <IconCheck size={18} />
      });
    } catch (error: any) {
      notifications.show({
        title: t('errors.generic'),
        message: t('createInvoiceModal.messages.agreementDataLoadError'),
        color: 'red',
        icon: <IconX size={18} />
      });
    }
  };

  const addItem = () => {
    setItems([...items, { description: '', quantity: 1, unit_price: 0, total_price: 0 }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);
    }
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Автоматический пересчет total_price
    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].total_price = newItems[index].quantity * newItems[index].unit_price;
    }
    
    setItems(newItems);
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + item.total_price, 0);
    const total = subtotal + taxAmount;
    
    return { subtotal, taxAmount, total };
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (step === 0) {
      if (!invoiceDate) {
        newErrors.invoiceDate = t('createInvoiceModal.validation.specifyDate');
      }
    } else if (step === 1) {
      if (fromType === 'company') {
        if (!fromCompanyName) newErrors.fromCompanyName = t('createInvoiceModal.validation.specifyName');
        if (!fromCompanyTaxId) newErrors.fromCompanyTaxId = t('createInvoiceModal.validation.specifyTaxId');
        if (!fromDirectorName) newErrors.fromDirectorName = t('createInvoiceModal.validation.specifyName');
      } else {
        if (!fromIndividualName) newErrors.fromIndividualName = t('createInvoiceModal.validation.specifyFullName');
        if (!fromIndividualCountry) newErrors.fromIndividualCountry = t('createInvoiceModal.validation.specifyCountry');
        if (!fromIndividualPassport) newErrors.fromIndividualPassport = t('createInvoiceModal.validation.specifyPassport');
      }

      if (toType === 'company') {
        if (!toCompanyName) newErrors.toCompanyName = t('createInvoiceModal.validation.specifyName');
        if (!toCompanyTaxId) newErrors.toCompanyTaxId = t('createInvoiceModal.validation.specifyTaxId');
        if (!toDirectorName) newErrors.toDirectorName = t('createInvoiceModal.validation.specifyName');
      } else {
        if (!toIndividualName) newErrors.toIndividualName = t('createInvoiceModal.validation.specifyFullName');
        if (!toIndividualCountry) newErrors.toIndividualCountry = t('createInvoiceModal.validation.specifyCountry');
        if (!toIndividualPassport) newErrors.toIndividualPassport = t('createInvoiceModal.validation.specifyPassport');
      }
    } else if (step === 2) {
      const hasValidItem = items.some(item => 
        item.description && item.quantity > 0 && item.unit_price > 0
      );
      
      if (!hasValidItem) {
        notifications.show({
          title: t('errors.validation'),
          message: t('createInvoiceModal.validation.addAtLeastOneItem'),
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
    if (!invoice || !validateStep(currentStep)) return;

    try {
      setLoading(true);

      // Фильтруем только заполненные позиции
      const validItems = items.filter(item => 
        item.description && item.quantity > 0 && item.unit_price > 0
      );

      if (validItems.length === 0) {
        notifications.show({
          title: t('errors.validation'),
          message: t('createInvoiceModal.validation.addAtLeastOneItem'),
          color: 'red',
          icon: <IconX size={18} />
        });
        setLoading(false);
        return;
      }

      const invoiceData: Partial<CreateInvoiceDTO> = {
        agreement_id: agreementIdState || undefined,
        invoice_date: dayjs(invoiceDate).format('YYYY-MM-DD'),
        due_date: dueDate ? dayjs(dueDate).format('YYYY-MM-DD') : undefined,
        
        from_type: fromType,
        from_company_name: fromType === 'company' ? fromCompanyName : undefined,
        from_company_tax_id: fromType === 'company' ? fromCompanyTaxId : undefined,
        from_company_address: fromType === 'company' ? fromCompanyAddress : undefined,
        from_director_name: fromType === 'company' ? fromDirectorName : undefined,
        from_director_country: fromType === 'company' ? fromDirectorCountry : undefined,
        from_director_passport: fromType === 'company' ? fromDirectorPassport : undefined,
        from_individual_name: fromType === 'individual' ? fromIndividualName : undefined,
        from_individual_country: fromType === 'individual' ? fromIndividualCountry : undefined,
        from_individual_passport: fromType === 'individual' ? fromIndividualPassport : undefined,
        
        to_type: toType,
        to_company_name: toType === 'company' ? toCompanyName : undefined,
        to_company_tax_id: toType === 'company' ? toCompanyTaxId : undefined,
        to_company_address: toType === 'company' ? toCompanyAddress : undefined,
        to_director_name: toType === 'company' ? toDirectorName : undefined,
        to_director_country: toType === 'company' ? toDirectorCountry : undefined,
        to_director_passport: toType === 'company' ? toDirectorPassport : undefined,
        to_individual_name: toType === 'individual' ? toIndividualName : undefined,
        to_individual_country: toType === 'individual' ? toIndividualCountry : undefined,
        to_individual_passport: toType === 'individual' ? toIndividualPassport : undefined,
        
        items: validItems,
        
        bank_name: bankName,
        bank_account_name: bankAccountName,
        bank_account_number: bankAccountNumber,
        
        notes: notes,
        tax_amount: taxAmount
      };

      await financialDocumentsApi.updateInvoice(invoice.id, invoiceData);
      
      notifications.show({
        title: t('common.success'),
        message: t('editInvoiceModal.messages.updated'),
        color: 'green',
        icon: <IconCheck size={18} />
      });
      
      onSuccess();
    } catch (error: any) {
      console.error('Error updating invoice:', error);
      notifications.show({
        title: t('errors.generic'),
        message: error.response?.data?.message || t('editInvoiceModal.messages.updateError'),
        color: 'red',
        icon: <IconX size={18} />
      });
    } finally {
      setLoading(false);
    }
  };

  const totals = calculateTotals();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US').format(amount);
  };

  return (
    <Modal
      opened={visible}
      onClose={onCancel}
      title={
        <Group gap="sm">
          <ThemeIcon size="lg" radius="md" variant="gradient" gradient={{ from: 'violet', to: 'grape' }}>
            <IconFileInvoice size={20} />
          </ThemeIcon>
          <Text size="lg" fw={700}>
            {t('editInvoiceModal.title')}
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
            label={!isMobile ? t('createInvoiceModal.steps.basic') : undefined}
            description={!isMobile ? t('createInvoiceModal.steps.basicDesc') : undefined}
            icon={<IconFileText size={18} />}
          />
          <Stepper.Step
            label={!isMobile ? t('createInvoiceModal.steps.parties') : undefined}
            description={!isMobile ? t('createInvoiceModal.steps.partiesDesc') : undefined}
            icon={<IconUser size={18} />}
          />
          <Stepper.Step
            label={!isMobile ? t('createInvoiceModal.steps.items') : undefined}
            description={!isMobile ? t('createInvoiceModal.steps.itemsDesc') : undefined}
            icon={<IconPackage size={18} />}
          />
          <Stepper.Step
            label={!isMobile ? t('createInvoiceModal.steps.bank') : undefined}
            description={!isMobile ? t('createInvoiceModal.steps.bankDesc') : undefined}
            icon={<IconBuildingBank size={18} />}
          />
        </Stepper>

        {/* Шаг 1: Основная информация */}
        {currentStep === 0 && (
          <Stack gap="md">
            <Alert
              icon={<IconInfoCircle size={18} />}
              title={t('editInvoiceModal.alerts.editInfoTitle')}
              color="violet"
              variant="light"
            >
              {t('editInvoiceModal.alerts.editInfoDesc')}
            </Alert>

            <Select
              label={t('createInvoiceModal.fields.agreement')}
              placeholder={t('createInvoiceModal.placeholders.selectAgreement')}
              leftSection={<IconFileText size={18} />}
              data={agreements.map(agreement => ({
                value: String(agreement.id),
                label: agreement.agreement_number + (agreement.property_name ? ` - ${agreement.property_name}` : '')
              }))}
              value={agreementIdState ? String(agreementIdState) : null}
              onChange={handleAgreementChange}
              searchable
              clearable
              styles={{ input: { fontSize: '16px' } }}
            />

            <Grid gutter="md">
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <DateInput
                  label={t('createInvoiceModal.fields.invoiceDate')}
                  placeholder={t('createInvoiceModal.placeholders.selectDate')}
                  leftSection={<IconCalendar size={18} />}
                  value={invoiceDate}
                  onChange={setInvoiceDate}
                  valueFormat="DD.MM.YYYY"
                  clearable={false}
                  error={errors.invoiceDate}
                  styles={{ input: { fontSize: '16px' } }}
                  required
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <DateInput
                  label={t('createInvoiceModal.fields.dueDate')}
                  placeholder={t('createInvoiceModal.placeholders.selectDate')}
                  leftSection={<IconCalendar size={18} />}
                  value={dueDate}
                  onChange={setDueDate}
                  valueFormat="DD.MM.YYYY"
                  clearable
                  styles={{ input: { fontSize: '16px' } }}
                />
              </Grid.Col>
            </Grid>

            <Textarea
              label={t('createInvoiceModal.fields.notes')}
              placeholder={t('createInvoiceModal.placeholders.notes')}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              minRows={3}
              styles={{ input: { fontSize: '16px' } }}
            />
          </Stack>
        )}

        {/* Шаг 2: Стороны - ИДЕНТИЧНЫЙ CreateInvoiceModal */}
        {currentStep === 1 && (
          <Stack gap="md">
            {/* От кого (From) */}
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Stack gap="md">
                <Group gap="sm">
                  <ThemeIcon size="lg" radius="md" variant="light" color="blue">
                    <IconUser size={20} />
                  </ThemeIcon>
                  <Text size="md" fw={600}>
                    {t('createInvoiceModal.sections.from')}
                  </Text>
                </Group>

                <Radio.Group
                  value={fromType}
                  onChange={(value) => setFromType(value as 'company' | 'individual')}
                  label={t('createInvoiceModal.fields.type')}
                >
                  <Group mt="xs">
                    <Radio value="company" label={t('createInvoiceModal.partyTypes.company')} />
                    <Radio value="individual" label={t('createInvoiceModal.partyTypes.individual')} />
                  </Group>
                </Radio.Group>

                {fromType === 'company' ? (
                  <>
                    <Grid gutter="md">
                      <Grid.Col span={{ base: 12, sm: 6 }}>
                        <TextInput
                          label={t('createInvoiceModal.fields.companyName')}
                          placeholder="Company Ltd"
                          leftSection={<IconBuilding size={18} />}
                          value={fromCompanyName}
                          onChange={(e) => setFromCompanyName(e.target.value)}
                          error={errors.fromCompanyName}
                          styles={{ input: { fontSize: '16px' } }}
                          required
                        />
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, sm: 6 }}>
                        <TextInput
                          label={t('createInvoiceModal.fields.taxId')}
                          placeholder="1234567890"
                          value={fromCompanyTaxId}
                          onChange={(e) => setFromCompanyTaxId(e.target.value)}
                          error={errors.fromCompanyTaxId}
                          styles={{ input: { fontSize: '16px' } }}
                          required
                        />
                      </Grid.Col>
                    </Grid>

                    <Textarea
                      label={t('createInvoiceModal.fields.companyAddress')}
                      placeholder="123 Business Street"
                      value={fromCompanyAddress}
                      onChange={(e) => setFromCompanyAddress(e.target.value)}
                      minRows={2}
                      styles={{ input: { fontSize: '16px' } }}
                    />

                    <Divider 
                      label={t('createInvoiceModal.sections.director')} 
                      labelPosition="center"
                    />

                    <Grid gutter="md">
                      <Grid.Col span={{ base: 12, sm: 4 }}>
                        <TextInput
                          label={t('createInvoiceModal.fields.directorName')}
                          placeholder="John Smith"
                          leftSection={<IconUser size={18} />}
                          value={fromDirectorName}
                          onChange={(e) => setFromDirectorName(e.target.value)}
                          error={errors.fromDirectorName}
                          styles={{ input: { fontSize: '16px' } }}
                          required
                        />
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, sm: 4 }}>
                        <TextInput
                          label={t('createInvoiceModal.fields.passportCountry')}
                          placeholder="Thailand"
                          value={fromDirectorCountry}
                          onChange={(e) => setFromDirectorCountry(e.target.value)}
                          styles={{ input: { fontSize: '16px' } }}
                        />
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, sm: 4 }}>
                        <TextInput
                          label={t('createInvoiceModal.fields.directorPassport')}
                          placeholder="AB1234567"
                          value={fromDirectorPassport}
                          onChange={(e) => setFromDirectorPassport(e.target.value)}
                          styles={{ input: { fontSize: '16px' } }}
                        />
                      </Grid.Col>
                    </Grid>
                  </>
                ) : (
                  <Grid gutter="md">
                    <Grid.Col span={{ base: 12, sm: 4 }}>
                      <TextInput
                        label={t('createInvoiceModal.fields.fullName')}
                        placeholder="John Doe"
                        leftSection={<IconUser size={18} />}
                        value={fromIndividualName}
                        onChange={(e) => setFromIndividualName(e.target.value)}
                        error={errors.fromIndividualName}
                        styles={{ input: { fontSize: '16px' } }}
                        required
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 4 }}>
                      <TextInput
                        label={t('createInvoiceModal.fields.country')}
                        placeholder="Russia"
                        value={fromIndividualCountry}
                        onChange={(e) => setFromIndividualCountry(e.target.value)}
                        error={errors.fromIndividualCountry}
                        styles={{ input: { fontSize: '16px' } }}
                        required
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 4 }}>
                      <TextInput
                        label={t('createInvoiceModal.fields.passportNumber')}
                        placeholder="AB1234567"
                        value={fromIndividualPassport}
                        onChange={(e) => setFromIndividualPassport(e.target.value)}
                        error={errors.fromIndividualPassport}
                        styles={{ input: { fontSize: '16px' } }}
                        required
                      />
                    </Grid.Col>
                  </Grid>
                )}
              </Stack>
            </Card>

            {/* Кому (To) */}
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Stack gap="md">
                <Group gap="sm">
                  <ThemeIcon size="lg" radius="md" variant="light" color="violet">
                    <IconUser size={20} />
                  </ThemeIcon>
                  <Text size="md" fw={600}>
                    {t('createInvoiceModal.sections.to')}
                  </Text>
                </Group>

                <Radio.Group
                  value={toType}
                  onChange={(value) => setToType(value as 'company' | 'individual')}
                  label={t('createInvoiceModal.fields.type')}
                >
                  <Group mt="xs">
                    <Radio value="company" label={t('createInvoiceModal.partyTypes.company')} />
                    <Radio value="individual" label={t('createInvoiceModal.partyTypes.individual')} />
                  </Group>
                </Radio.Group>

                {toType === 'company' ? (
                  <>
                    <Grid gutter="md">
                      <Grid.Col span={{ base: 12, sm: 6 }}>
                        <TextInput
                          label={t('createInvoiceModal.fields.companyName')}
                          placeholder="Company Ltd"
                          leftSection={<IconBuilding size={18} />}
                          value={toCompanyName}
                          onChange={(e) => setToCompanyName(e.target.value)}
                          error={errors.toCompanyName}
                          styles={{ input: { fontSize: '16px' } }}
                          required
                        />
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, sm: 6 }}>
                        <TextInput
                          label={t('createInvoiceModal.fields.taxId')}
                          placeholder="1234567890"
                          value={toCompanyTaxId}
                          onChange={(e) => setToCompanyTaxId(e.target.value)}
                          error={errors.toCompanyTaxId}
                          styles={{ input: { fontSize: '16px' } }}
                          required
                        />
                      </Grid.Col>
                    </Grid>

                    <Textarea
                      label={t('createInvoiceModal.fields.companyAddress')}
                      placeholder="123 Business Street"
                      value={toCompanyAddress}
                      onChange={(e) => setToCompanyAddress(e.target.value)}
                      minRows={2}
                      styles={{ input: { fontSize: '16px' } }}
                    />

                    <Divider 
                      label={t('createInvoiceModal.sections.director')} 
                      labelPosition="center"
                    />

                    <Grid gutter="md">
                      <Grid.Col span={{ base: 12, sm: 4 }}>
                        <TextInput
                          label={t('createInvoiceModal.fields.directorName')}
                          placeholder="John Smith"
                          leftSection={<IconUser size={18} />}
                          value={toDirectorName}
                          onChange={(e) => setToDirectorName(e.target.value)}
                          error={errors.toDirectorName}
                          styles={{ input: { fontSize: '16px' } }}
                          required
                        />
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, sm: 4 }}>
                        <TextInput
                          label={t('createInvoiceModal.fields.passportCountry')}
                          placeholder="Thailand"
                          value={toDirectorCountry}
                          onChange={(e) => setToDirectorCountry(e.target.value)}
                          styles={{ input: { fontSize: '16px' } }}
                        />
                      </Grid.Col>
                      <Grid.Col span={{ base: 12, sm: 4 }}>
                        <TextInput
                          label={t('createInvoiceModal.fields.directorPassport')}
                          placeholder="AB1234567"
                          value={toDirectorPassport}
                          onChange={(e) => setToDirectorPassport(e.target.value)}
                          styles={{ input: { fontSize: '16px' } }}
                        />
                      </Grid.Col>
                    </Grid>
                  </>
                ) : (
                  <Grid gutter="md">
                    <Grid.Col span={{ base: 12, sm: 4 }}>
                      <TextInput
                        label={t('createInvoiceModal.fields.fullName')}
                        placeholder="John Doe"
                        leftSection={<IconUser size={18} />}
                        value={toIndividualName}
                        onChange={(e) => setToIndividualName(e.target.value)}
                        error={errors.toIndividualName}
                        styles={{ input: { fontSize: '16px' } }}
                        required
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 4 }}>
                      <TextInput
                        label={t('createInvoiceModal.fields.country')}
                        placeholder="Russia"
                        value={toIndividualCountry}
                        onChange={(e) => setToIndividualCountry(e.target.value)}
                        error={errors.toIndividualCountry}
                        styles={{ input: { fontSize: '16px' } }}
                        required
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, sm: 4 }}>
                      <TextInput
                        label={t('createInvoiceModal.fields.passportNumber')}
                        placeholder="AB1234567"
                        value={toIndividualPassport}
                        onChange={(e) => setToIndividualPassport(e.target.value)}
                        error={errors.toIndividualPassport}
                        styles={{ input: { fontSize: '16px' } }}
                        required
                      />
                    </Grid.Col>
                  </Grid>
                )}
              </Stack>
            </Card>
          </Stack>
        )}

        {/* Шаг 3: Позиции инвойса - ИДЕНТИЧНЫЙ CreateInvoiceModal */}
        {currentStep === 2 && (
          <Stack gap="md">
            <Alert
              icon={<IconInfoCircle size={18} />}
              title={t('createInvoiceModal.alerts.itemsTitle')}
              color="blue"
              variant="light"
            >
              {t('createInvoiceModal.alerts.itemsDesc')}
            </Alert>

            {items.map((item, index) => (
              <Card
                key={index}
                shadow="sm"
                padding="md"
                radius="md"
                withBorder
                style={{
                  borderLeft: `4px solid ${theme.colors.blue[6]}`
                }}
              >
                <Stack gap="md">
                  <Group justify="space-between">
                    <Group gap="xs">
                      <ThemeIcon size="md" radius="md" variant="light" color="blue">
                        <IconPackage size={18} />
                      </ThemeIcon>
                      <Text size="sm" fw={600}>
                        {t('createInvoiceModal.items.position', { number: index + 1 })}
                      </Text>
                    </Group>
                    {items.length > 1 && (
                      <ActionIcon
                        color="red"
                        variant="subtle"
                        onClick={() => removeItem(index)}
                      >
                        <IconTrash size={18} />
                      </ActionIcon>
                    )}
                  </Group>

                  <TextInput
                    placeholder={t('createInvoiceModal.placeholders.itemDescription')}
                    value={item.description}
                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                    styles={{ input: { fontSize: '16px' } }}
                  />

                  <Grid gutter="xs">
                    <Grid.Col span={{ base: 12, xs: 4 }}>
                      <NumberInput
                        label={t('createInvoiceModal.items.quantity')}
                        value={item.quantity}
                        onChange={(value) => updateItem(index, 'quantity', typeof value === 'number' ? value : 1)}
                        min={0.01}
                        step={1}
                        decimalScale={2}
                        styles={{ input: { fontSize: '16px' } }}
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, xs: 4 }}>
                      <NumberInput
                        label={t('createInvoiceModal.items.price')}
                        value={item.unit_price}
                        onChange={(value) => updateItem(index, 'unit_price', typeof value === 'number' ? value : 0)}
                        min={0}
                        step={100}
                        thousandSeparator=" "
                        leftSection={<IconCurrencyBaht size={18} />}
                        styles={{ input: { fontSize: '16px' } }}
                      />
                    </Grid.Col>
                    <Grid.Col span={{ base: 12, xs: 4 }}>
                      <NumberInput
                        label={t('createInvoiceModal.items.total')}
                        value={item.total_price}
                        disabled
                        thousandSeparator=" "
                        leftSection={<IconCurrencyBaht size={18} />}
                        styles={{ 
                          input: { 
                            fontSize: '16px',
                            fontWeight: 600,
                            color: theme.colors.green[6]
                          } 
                        }}
                      />
                    </Grid.Col>
                  </Grid>
                </Stack>
              </Card>
            ))}

            <Button
              variant="light"
              leftSection={<IconPlus size={18} />}
              onClick={addItem}
              fullWidth
            >
              {t('createInvoiceModal.buttons.addItem')}
            </Button>

            {/* Итоговые суммы */}
            <Paper
              p="lg"
              radius="md"
              withBorder
              style={{
                background: `linear-gradient(135deg, ${theme.colors.teal[9]} 0%, ${theme.colors.green[9]} 100%)`
              }}
            >
              <Stack gap="md">
                <Group justify="space-between">
                  <Text size="sm" c="white" opacity={0.9}>
                    {t('createInvoiceModal.totals.subtotal')}:
                  </Text>
                  <Text size="md" fw={600} c="white">
                    {formatCurrency(totals.subtotal)} {t('common.currencyTHB')}
                  </Text>
                </Group>

                <NumberInput
                  label={
                    <Text size="sm" c="white" opacity={0.9}>
                      {t('createInvoiceModal.fields.tax')}
                    </Text>
                  }
                  value={taxAmount}
                  onChange={(value) => setTaxAmount(typeof value === 'number' ? value : 0)}
                  min={0}
                  step={100}
                  thousandSeparator=" "
                  leftSection={<IconCurrencyBaht size={18} />}
                  styles={{ 
                    input: { 
                      fontSize: '16px',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                      color: 'white'
                    },
                    label: { color: 'white' }
                  }}
                />

                <Divider color="rgba(255, 255, 255, 0.2)" />

                <Group justify="space-between">
                  <Text size="lg" fw={700} c="white">
                    {t('createInvoiceModal.totals.total')}:
                  </Text>
                  <Text size="xl" fw={700} c="white">
                    {formatCurrency(totals.total)} {t('common.currencyTHB')}
                  </Text>
                </Group>
              </Stack>
            </Paper>
          </Stack>
        )}

        {/* Шаг 4: Банковские реквизиты - ИДЕНТИЧНЫЙ CreateInvoiceModal */}
        {currentStep === 3 && (
          <Stack gap="md">
            <Card shadow="sm" padding="lg" radius="md" withBorder>
              <Stack gap="md">
                <Group gap="sm">
                  <ThemeIcon size="lg" radius="md" variant="light" color="indigo">
                    <IconBuildingBank size={20} />
                  </ThemeIcon>
                  <Text size="md" fw={600}>
                    {t('createInvoiceModal.sections.bankDetails')}
                  </Text>
                </Group>

                <TextInput
                  label={t('createInvoiceModal.fields.bankName')}
                  placeholder="Bangkok Bank"
                  leftSection={<IconBuildingBank size={18} />}
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  styles={{ input: { fontSize: '16px' } }}
                />

                <TextInput
                  label={t('createInvoiceModal.fields.accountHolder')}
                  placeholder="John Doe"
                  leftSection={<IconUser size={18} />}
                  value={bankAccountName}
                  onChange={(e) => setBankAccountName(e.target.value)}
                  styles={{ input: { fontSize: '16px' } }}
                />

                <TextInput
                  label={t('createInvoiceModal.fields.accountNumber')}
                  placeholder="123-4-56789-0"
                  value={bankAccountNumber}
                  onChange={(e) => setBankAccountNumber(e.target.value)}
                  styles={{ input: { fontSize: '16px' } }}
                />
              </Stack>
            </Card>

            {/* Предпросмотр итогов */}
            <Paper
              p="lg"
              radius="md"
              withBorder
              style={{
                background: `linear-gradient(135deg, ${theme.colors.violet[9]} 0%, ${theme.colors.grape[9]} 100%)`
              }}
            >
              <Stack gap="md">
                <Group gap="xs">
                  <ThemeIcon size="md" radius="md" variant="white" color="violet">
                    <IconCheck size={18} />
                  </ThemeIcon>
                  <Text size="md" fw={600} c="white">
                    {t('createInvoiceModal.sections.summary')}
                  </Text>
                </Group>

                <Group justify="space-between">
                  <Text size="sm" c="white" opacity={0.9}>
                    {t('createInvoiceModal.summary.itemsCount')}:
                  </Text>
                  <Text size="md" fw={600} c="white">
                    {items.filter(i => i.description).length}
                  </Text>
                </Group>

                <Group justify="space-between">
                  <Text size="lg" fw={700} c="white">
                    {t('createInvoiceModal.summary.totalAmount')}:
                  </Text>
                  <Text size="xl" fw={700} c="white">
                    {formatCurrency(totals.total)} {t('common.currencyTHB')}
                  </Text>
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
                {t('createInvoiceModal.buttons.back')}
              </Button>
            )}
            {currentStep < 3 ? (
              <Button
                rightSection={<IconChevronRight size={18} />}
                onClick={handleNext}
              >
                {t('createInvoiceModal.buttons.next')}
              </Button>
            ) : (
              <Button
                leftSection={<IconDeviceFloppy size={18} />}
                onClick={handleSubmit}
                loading={loading}
                gradient={{ from: 'violet', to: 'grape' }}
                variant="gradient"
              >
                {t('editInvoiceModal.buttons.save')}
              </Button>
            )}
          </Group>
        </Group>
      </Stack>
    </Modal>
  );
};

export default EditInvoiceModal;