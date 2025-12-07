// frontend/src/modules/FinancialDocuments/index.tsx
import { useState, useEffect } from 'react';
import {
  Card,
  Tabs,
  Button,
  Badge,
  Stack,
  Group,
  Text,
  Title,
  Grid,
  Paper,
  Center,
  Loader,
  TextInput,
  Select,
  Menu,
  ActionIcon,
  Box,
  ThemeIcon,
  useMantineTheme,
  Table,
  Progress,
  Divider,
  SimpleGrid
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import { useMediaQuery } from '@mantine/hooks';
import {
  IconPlus,
  IconSearch,
  IconFileInvoice,
  IconDots,
  IconEye,
  IconDownload,
  IconTrash,
  IconFileText,
  IconReceipt,
  IconCheck,
  IconX,
  IconCalendar,
  IconChartPie,
  IconTrendingUp,
  IconClock,
  IconAlertCircle,
  IconPercentage,
  IconEdit,
  IconFilter
} from '@tabler/icons-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { financialDocumentsApi, Invoice, Receipt } from '@/api/financialDocuments.api';
import CreateInvoiceModal from './components/CreateInvoiceModal';
import CreateReceiptModal from './components/CreateReceiptModal';
import dayjs from 'dayjs';

const FinancialDocuments = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useMantineTheme();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [activeTab, setActiveTab] = useState<string | null>('invoices');
  
  // Invoices state
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [invoiceStatus, setInvoiceStatus] = useState<string>('');
  
  // Receipts state
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loadingReceipts, setLoadingReceipts] = useState(false);
  const [receiptSearch, setReceiptSearch] = useState('');
  const [receiptStatus, setReceiptStatus] = useState<string>('');
  
  // Modals
  const [createInvoiceModalVisible, setCreateInvoiceModalVisible] = useState(false);
  const [createReceiptModalVisible, setCreateReceiptModalVisible] = useState(false);

  // Statistics
  const [stats, setStats] = useState({
    totalInvoices: 0,
    paidInvoices: 0,
    totalAmount: 0,
    amountReceived: 0
  });

  useEffect(() => {
    if (activeTab === 'invoices') {
      fetchInvoices();
    } else {
      fetchReceipts();
    }
  }, [activeTab, invoiceSearch, invoiceStatus, receiptSearch, receiptStatus]);

  const fetchInvoices = async () => {
    setLoadingInvoices(true);
    try {
      const response = await financialDocumentsApi.getAllInvoices({
        status: invoiceStatus || undefined,
        search: invoiceSearch || undefined
      });
      setInvoices(response.data.data);
      
      // Calculate stats
      const total = response.data.data.reduce((sum, inv) => sum + inv.total_amount, 0);
      const received = response.data.data.reduce((sum, inv) => sum + inv.amount_paid, 0);
      const paid = response.data.data.filter(inv => inv.status === 'paid').length;
      
      setStats({
        totalInvoices: response.data.data.length,
        paidInvoices: paid,
        totalAmount: total,
        amountReceived: received
      });
    } catch (error: any) {
      notifications.show({
        title: t('errors.generic'),
        message: t('financialDocuments.messages.invoicesLoadError'),
        color: 'red',
        icon: <IconX size={18} />
      });
    } finally {
      setLoadingInvoices(false);
    }
  };

  const fetchReceipts = async () => {
    setLoadingReceipts(true);
    try {
      const response = await financialDocumentsApi.getAllReceipts({
        status: receiptStatus || undefined,
        search: receiptSearch || undefined
      });
      setReceipts(response.data.data);
    } catch (error: any) {
      notifications.show({
        title: t('errors.generic'),
        message: t('financialDocuments.messages.receiptsLoadError'),
        color: 'red',
        icon: <IconX size={18} />
      });
    } finally {
      setLoadingReceipts(false);
    }
  };

  const handleDownloadInvoicePDF = async (id: number, invoiceNumber: string) => {
    try {
      notifications.show({
        id: 'pdf-download',
        loading: true,
        title: t('financialDocuments.messages.downloadingPDF'),
        message: t('common.pleaseWait'),
        autoClose: false,
        withCloseButton: false
      });

      const response = await financialDocumentsApi.downloadInvoicePDF(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `invoice-${invoiceNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      notifications.update({
        id: 'pdf-download',
        color: 'green',
        title: t('common.success'),
        message: t('financialDocuments.messages.pdfDownloaded'),
        icon: <IconCheck size={18} />,
        loading: false,
        autoClose: 3000
      });
    } catch (error: any) {
      notifications.update({
        id: 'pdf-download',
        color: 'red',
        title: t('errors.generic'),
        message: t('financialDocuments.messages.pdfDownloadError'),
        icon: <IconX size={18} />,
        loading: false,
        autoClose: 3000
      });
    }
  };

  const handleDownloadReceiptPDF = async (id: number, receiptNumber: string) => {
    try {
      notifications.show({
        id: 'pdf-download',
        loading: true,
        title: t('financialDocuments.messages.downloadingPDF'),
        message: t('common.pleaseWait'),
        autoClose: false,
        withCloseButton: false
      });

      const response = await financialDocumentsApi.downloadReceiptPDF(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `receipt-${receiptNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      notifications.update({
        id: 'pdf-download',
        color: 'green',
        title: t('common.success'),
        message: t('financialDocuments.messages.pdfDownloaded'),
        icon: <IconCheck size={18} />,
        loading: false,
        autoClose: 3000
      });
    } catch (error: any) {
      notifications.update({
        id: 'pdf-download',
        color: 'red',
        title: t('errors.generic'),
        message: t('financialDocuments.messages.pdfDownloadError'),
        icon: <IconX size={18} />,
        loading: false,
        autoClose: 3000
      });
    }
  };

  const handleDeleteInvoice = (id: number) => {
    modals.openConfirmModal({
      title: t('financialDocuments.confirm.deleteInvoiceTitle'),
      children: (
        <Text size="sm">
          {t('financialDocuments.confirm.deleteDescription')}
        </Text>
      ),
      labels: {
        confirm: t('common.delete'),
        cancel: t('common.cancel')
      },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        try {
          await financialDocumentsApi.deleteInvoice(id);
          notifications.show({
            title: t('common.success'),
            message: t('financialDocuments.messages.invoiceDeleted'),
            color: 'green',
            icon: <IconCheck size={18} />
          });
          fetchInvoices();
        } catch (error: any) {
          notifications.show({
            title: t('errors.generic'),
            message: t('financialDocuments.messages.invoiceDeleteError'),
            color: 'red',
            icon: <IconX size={18} />
          });
        }
      }
    });
  };

  const handleDeleteReceipt = (id: number) => {
    modals.openConfirmModal({
      title: t('financialDocuments.confirm.deleteReceiptTitle'),
      children: (
        <Text size="sm">
          {t('financialDocuments.confirm.deleteDescription')}
        </Text>
      ),
      labels: {
        confirm: t('common.delete'),
        cancel: t('common.cancel')
      },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        try {
          await financialDocumentsApi.deleteReceipt(id);
          notifications.show({
            title: t('common.success'),
            message: t('financialDocuments.messages.receiptDeleted'),
            color: 'green',
            icon: <IconCheck size={18} />
          });
          fetchReceipts();
        } catch (error: any) {
          notifications.show({
            title: t('errors.generic'),
            message: t('financialDocuments.messages.receiptDeleteError'),
            color: 'red',
            icon: <IconX size={18} />
          });
        }
      }
    });
  };

  const getStatusBadge = (status: string, type: 'invoice' | 'receipt') => {
    const invoiceConfig: Record<string, { color: string; icon: React.ReactNode }> = {
      draft: { color: 'gray', icon: <IconEdit size={12} /> },
      sent: { color: 'blue', icon: <IconClock size={12} /> },
      partially_paid: { color: 'yellow', icon: <IconPercentage size={12} /> },
      paid: { color: 'green', icon: <IconCheck size={12} /> },
      overdue: { color: 'red', icon: <IconAlertCircle size={12} /> },
      cancelled: { color: 'gray', icon: <IconX size={12} /> }
    };

    const receiptConfig: Record<string, { color: string; icon: React.ReactNode }> = {
      pending: { color: 'blue', icon: <IconClock size={12} /> },
      verified: { color: 'green', icon: <IconCheck size={12} /> },
      rejected: { color: 'red', icon: <IconX size={12} /> }
    };

    const config = type === 'invoice' ? invoiceConfig[status] : receiptConfig[status];
    if (!config) return <Badge color="gray">{status}</Badge>;

    const text = t(`financialDocuments.statuses.${status}`);
    
    return (
      <Badge 
        size="sm" 
        color={config.color} 
        variant="light"
        leftSection={config.icon}
      >
        {text}
      </Badge>
    );
  };

  const getPaymentMethodText = (method: string) => {
    return t(`financialDocuments.paymentMethods.${method}`);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US').format(amount);
  };

  const StatCard = ({ 
    title, 
    value, 
    icon, 
    gradient, 
    suffix 
  }: { 
    title: string; 
    value: number | string; 
    icon: React.ReactNode;
    gradient: { from: string; to: string };
    suffix?: string;
  }) => (
    <Paper
      p="lg"
      radius="md"
      withBorder
      style={{
        background: `linear-gradient(135deg, ${theme.colors[gradient.from][9]} 0%, ${theme.colors[gradient.to][9]} 100%)`,
        transition: 'transform 0.2s ease, box-shadow 0.2s ease'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = `0 8px 24px ${theme.colors[gradient.from][9]}40`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <Stack gap="xs">
        <Group gap="xs">
          <ThemeIcon size="md" radius="md" variant="white" color={gradient.from}>
            {icon}
          </ThemeIcon>
          <Text size="sm" c="white" opacity={0.9}>
            {title}
          </Text>
        </Group>
        <Group align="baseline" gap={4}>
          <Text size="1.8rem" fw={700} c="white" style={{ lineHeight: 1 }}>
            {typeof value === 'number' ? formatCurrency(value) : value}
          </Text>
          {suffix && (
            <Text size="md" c="white" opacity={0.9}>
              {suffix}
            </Text>
          )}
        </Group>
      </Stack>
    </Paper>
  );

  const InvoiceCard = ({ invoice }: { invoice: Invoice }) => {
    const paymentProgress = (invoice.amount_paid / invoice.total_amount) * 100;

    return (
      <Card
        shadow="sm"
        padding="md"
        radius="md"
        withBorder
        style={{
          transition: 'all 0.2s ease',
          borderLeft: `4px solid ${theme.colors[getStatusColor(invoice.status)][6]}`
        }}
      >
        <Stack gap="md">
          <Group justify="space-between" align="flex-start" wrap="nowrap">
            <Box style={{ flex: 1 }}>
              <Button
                variant="subtle"
                size="xs"
                p={0}
                mb={4}
                onClick={() => navigate(`/financial-documents/invoices/${invoice.id}`)}
              >
                <Text fw={700} size="md">
                  {invoice.invoice_number}
                </Text>
              </Button>
              {invoice.agreement_number && (
                <Text size="xs" c="dimmed">
                  {t('financialDocuments.table.invoices.agreement')}: {invoice.agreement_number}
                </Text>
              )}
            </Box>
            {getStatusBadge(invoice.status, 'invoice')}
          </Group>

          <Divider />

          <SimpleGrid cols={2} spacing="xs">
            <Box>
              <Text size="xs" c="dimmed" mb={4}>
                {t('financialDocuments.table.invoices.amount')}
              </Text>
              <Text size="sm" fw={600}>
                {formatCurrency(invoice.total_amount)} {t('common.currencyTHB')}
              </Text>
            </Box>
            <Box>
              <Text size="xs" c="dimmed" mb={4}>
                {t('financialDocuments.table.invoices.paid')}
              </Text>
              <Text size="sm" fw={600} c="green">
                {formatCurrency(invoice.amount_paid)} {t('common.currencyTHB')}
              </Text>
            </Box>
          </SimpleGrid>

          <Box>
            <Group justify="space-between" mb={4}>
              <Text size="xs" c="dimmed">
                {t('financialDocuments.paymentProgress')}
              </Text>
              <Text size="xs" fw={600}>
                {Math.round(paymentProgress)}%
              </Text>
            </Group>
            <Progress value={paymentProgress} color="green" size="sm" />
          </Box>

          <Group justify="space-between" align="center">
            <Group gap={4}>
              <IconCalendar size={14} color={theme.colors.gray[6]} />
              <Text size="xs" c="dimmed">
                {dayjs(invoice.invoice_date).format('DD.MM.YYYY')}
              </Text>
            </Group>

            <Menu position="bottom-end" shadow="md">
              <Menu.Target>
                <ActionIcon variant="subtle" color="gray">
                  <IconDots size={18} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item
                  leftSection={<IconEye size={16} />}
                  onClick={() => navigate(`/financial-documents/invoices/${invoice.id}`)}
                >
                  {t('financialDocuments.actions.view')}
                </Menu.Item>
                <Menu.Item
                  leftSection={<IconDownload size={16} />}
                  onClick={() => handleDownloadInvoicePDF(invoice.id, invoice.invoice_number)}
                >
                  {t('financialDocuments.actions.downloadPDF')}
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  color="red"
                  leftSection={<IconTrash size={16} />}
                  onClick={() => handleDeleteInvoice(invoice.id)}
                >
                  {t('common.delete')}
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Stack>
      </Card>
    );
  };

  const ReceiptCard = ({ receipt }: { receipt: Receipt }) => (
    <Card
      shadow="sm"
      padding="md"
      radius="md"
      withBorder
      style={{
        transition: 'all 0.2s ease',
        borderLeft: `4px solid ${theme.colors[getReceiptStatusColor(receipt.status)][6]}`
      }}
    >
      <Stack gap="md">
        <Group justify="space-between" align="flex-start" wrap="nowrap">
          <Box style={{ flex: 1 }}>
            <Button
              variant="subtle"
              size="xs"
              p={0}
              mb={4}
              onClick={() => navigate(`/financial-documents/receipts/${receipt.id}`)}
            >
              <Text fw={700} size="md">
                {receipt.receipt_number}
              </Text>
            </Button>
            {receipt.invoice_number && (
              <Text size="xs" c="dimmed">
                {t('financialDocuments.table.receipts.invoice')}: {receipt.invoice_number}
              </Text>
            )}
          </Box>
          {getStatusBadge(receipt.status, 'receipt')}
        </Group>

        <Divider />

        <SimpleGrid cols={2} spacing="xs">
          <Box>
            <Text size="xs" c="dimmed" mb={4}>
              {t('financialDocuments.table.receipts.amount')}
            </Text>
            <Text size="md" fw={700} c="green">
              {formatCurrency(receipt.amount_paid)} {t('common.currencyTHB')}
            </Text>
          </Box>
          <Box>
            <Text size="xs" c="dimmed" mb={4}>
              {t('financialDocuments.table.receipts.paymentMethod')}
            </Text>
            <Badge size="sm" variant="light">
              {getPaymentMethodText(receipt.payment_method)}
            </Badge>
          </Box>
        </SimpleGrid>

        <Group justify="space-between" align="center">
          <Group gap={4}>
            <IconCalendar size={14} color={theme.colors.gray[6]} />
            <Text size="xs" c="dimmed">
              {dayjs(receipt.receipt_date).format('DD.MM.YYYY')}
            </Text>
          </Group>

          <Menu position="bottom-end" shadow="md">
            <Menu.Target>
              <ActionIcon variant="subtle" color="gray">
                <IconDots size={18} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                leftSection={<IconEye size={16} />}
                onClick={() => navigate(`/financial-documents/receipts/${receipt.id}`)}
              >
                {t('financialDocuments.actions.view')}
              </Menu.Item>
              <Menu.Item
                leftSection={<IconDownload size={16} />}
                onClick={() => handleDownloadReceiptPDF(receipt.id, receipt.receipt_number)}
              >
                {t('financialDocuments.actions.downloadPDF')}
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item
                color="red"
                leftSection={<IconTrash size={16} />}
                onClick={() => handleDeleteReceipt(receipt.id)}
              >
                {t('common.delete')}
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Stack>
    </Card>
  );

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      draft: 'gray',
      sent: 'blue',
      partially_paid: 'yellow',
      paid: 'green',
      overdue: 'red',
      cancelled: 'gray'
    };
    return colors[status] || 'gray';
  };

  const getReceiptStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      pending: 'blue',
      verified: 'green',
      rejected: 'red'
    };
    return colors[status] || 'gray';
  };

  return (
    <Stack gap="lg" p={isMobile ? 'sm' : 'md'}>
      {/* Статистика */}
      <Grid gutter="md">
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <StatCard
            title={t('financialDocuments.stats.totalInvoices')}
            value={stats.totalInvoices}
            icon={<IconFileInvoice size={20} />}
            gradient={{ from: 'blue', to: 'cyan' }}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <StatCard
            title={t('financialDocuments.stats.paidInvoices')}
            value={stats.paidInvoices}
            icon={<IconCheck size={20} />}
            gradient={{ from: 'green', to: 'teal' }}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <StatCard
            title={t('financialDocuments.stats.totalAmount')}
            value={stats.totalAmount}
            icon={<IconChartPie size={20} />}
            gradient={{ from: 'violet', to: 'grape' }}
            suffix={t('common.currencyTHB')}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <StatCard
            title={t('financialDocuments.stats.amountReceived')}
            value={stats.amountReceived}
            icon={<IconTrendingUp size={20} />}
            gradient={{ from: 'orange', to: 'red' }}
            suffix={t('common.currencyTHB')}
          />
        </Grid.Col>
      </Grid>

      {/* Основная карточка с табами */}
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Stack gap="lg">
          <Group justify="space-between" wrap="wrap">
            <Group gap="xs">
              <ThemeIcon size="xl" radius="md" variant="gradient" gradient={{ from: 'blue', to: 'cyan' }}>
                <IconFileText size={24} />
              </ThemeIcon>
              <Title order={4}>{t('financialDocuments.title')}</Title>
            </Group>
          </Group>

          <Tabs value={activeTab} onChange={setActiveTab}>
            <Tabs.List>
              <Tabs.Tab 
                value="invoices"
                leftSection={<IconFileInvoice size={18} />}
              >
                {t('financialDocuments.tabs.invoices')}
              </Tabs.Tab>
              <Tabs.Tab 
                value="receipts"
                leftSection={<IconReceipt size={18} />}
              >
                {t('financialDocuments.tabs.receipts')}
              </Tabs.Tab>
            </Tabs.List>

            {/* Инвойсы */}
            <Tabs.Panel value="invoices" pt="lg">
              <Stack gap="md">
                {/* Фильтры и кнопка создания */}
                <Group justify="space-between" wrap="wrap">
                  <Group gap="xs" style={{ flex: isMobile ? '1 1 100%' : 'auto' }}>
                    <TextInput
                      placeholder={t('financialDocuments.search')}
                      leftSection={<IconSearch size={18} />}
                      value={invoiceSearch}
                      onChange={(e) => setInvoiceSearch(e.target.value)}
                      style={{ flex: 1, minWidth: isMobile ? '100%' : 200 }}
                      styles={{ input: { fontSize: '16px' } }}
                    />
                    <Select
                      placeholder={t('financialDocuments.filters.status')}
                      leftSection={<IconFilter size={18} />}
                      value={invoiceStatus || null}
                      onChange={(value) => setInvoiceStatus(value || '')}
                      clearable
                      data={[
                        { value: 'draft', label: t('financialDocuments.statuses.draft') },
                        { value: 'sent', label: t('financialDocuments.statuses.sent') },
                        { value: 'partially_paid', label: t('financialDocuments.statuses.partiallyPaid') },
                        { value: 'paid', label: t('financialDocuments.statuses.paid') },
                        { value: 'overdue', label: t('financialDocuments.statuses.overdue') },
                        { value: 'cancelled', label: t('financialDocuments.statuses.cancelled') }
                      ]}
                      style={{ flex: isMobile ? '1' : 'auto', minWidth: isMobile ? '100%' : 180 }}
                      styles={{ input: { fontSize: '16px' } }}
                    />
                  </Group>

                  <Button
                    leftSection={<IconPlus size={18} />}
                    onClick={() => setCreateInvoiceModalVisible(true)}
                    fullWidth={isMobile}
                  >
                    {t('financialDocuments.buttons.createInvoice')}
                  </Button>
                </Group>

                {/* Список инвойсов */}
                {loadingInvoices ? (
                  <Center py={60}>
                    <Stack align="center" gap="md">
                      <Loader size="lg" />
                      <Text size="sm" c="dimmed">
                        {t('financialDocuments.loading')}
                      </Text>
                    </Stack>
                  </Center>
                ) : invoices.length === 0 ? (
                  <Paper p="xl" radius="md" withBorder>
                    <Center>
                      <Stack align="center" gap="md">
                        <ThemeIcon size={60} radius="xl" variant="light" color="gray">
                          <IconFileInvoice size={30} />
                        </ThemeIcon>
                        <Text size="sm" c="dimmed">
                          {t('financialDocuments.noInvoices')}
                        </Text>
                      </Stack>
                    </Center>
                  </Paper>
                ) : isMobile ? (
                  <Stack gap="md">
                    {invoices.map((invoice) => (
                      <InvoiceCard key={invoice.id} invoice={invoice} />
                    ))}
                  </Stack>
                ) : (
                  <Table.ScrollContainer minWidth={800}>
                    <Table striped highlightOnHover withTableBorder withColumnBorders>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>{t('financialDocuments.table.invoices.number')}</Table.Th>
                          <Table.Th w={120}>{t('financialDocuments.table.invoices.status')}</Table.Th>
                          <Table.Th>{t('financialDocuments.table.invoices.agreement')}</Table.Th>
                          <Table.Th ta="right" w={140}>{t('financialDocuments.table.invoices.amount')}</Table.Th>
                          <Table.Th ta="right" w={140}>{t('financialDocuments.table.invoices.paid')}</Table.Th>
                          <Table.Th w={110}>{t('financialDocuments.table.invoices.date')}</Table.Th>
                          <Table.Th w={80}>{t('financialDocuments.table.invoices.actions')}</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {invoices.map((invoice) => {
                          const paymentProgress = (invoice.amount_paid / invoice.total_amount) * 100;
                          return (
                            <Table.Tr key={invoice.id}>
                              <Table.Td>
                                <Button
                                  variant="subtle"
                                  size="xs"
                                  p={0}
                                  onClick={() => navigate(`/financial-documents/invoices/${invoice.id}`)}
                                >
                                  {invoice.invoice_number}
                                </Button>
                              </Table.Td>
                              <Table.Td>
                                {getStatusBadge(invoice.status, 'invoice')}
                              </Table.Td>
                              <Table.Td>
                                <Text size="sm">{invoice.agreement_number || '—'}</Text>
                              </Table.Td>
                              <Table.Td ta="right">
                                <Text size="sm" fw={600}>
                                  {formatCurrency(invoice.total_amount)} {t('common.currencyTHB')}
                                </Text>
                              </Table.Td>
                              <Table.Td ta="right">
                                <Stack gap={4}>
                                  <Text size="sm" fw={600} c="green">
                                    {formatCurrency(invoice.amount_paid)} {t('common.currencyTHB')}
                                  </Text>
                                  <Progress value={paymentProgress} color="green" size="xs" />
                                  <Text size="xs" c="dimmed">
                                    {Math.round(paymentProgress)}%
                                  </Text>
                                </Stack>
                              </Table.Td>
                              <Table.Td>
                                <Text size="sm">{dayjs(invoice.invoice_date).format('DD.MM.YYYY')}</Text>
                              </Table.Td>
                              <Table.Td>
                                <Menu position="bottom-end" shadow="md">
                                  <Menu.Target>
                                    <ActionIcon variant="subtle" color="gray">
                                      <IconDots size={18} />
                                    </ActionIcon>
                                  </Menu.Target>
                                  <Menu.Dropdown>
                                    <Menu.Item
                                      leftSection={<IconEye size={16} />}
                                      onClick={() => navigate(`/financial-documents/invoices/${invoice.id}`)}
                                    >
                                      {t('financialDocuments.actions.view')}
                                    </Menu.Item>
                                    <Menu.Item
                                      leftSection={<IconDownload size={16} />}
                                      onClick={() => handleDownloadInvoicePDF(invoice.id, invoice.invoice_number)}
                                    >
                                      {t('financialDocuments.actions.downloadPDF')}
                                    </Menu.Item>
                                    <Menu.Divider />
                                    <Menu.Item
                                      color="red"
                                      leftSection={<IconTrash size={16} />}
                                      onClick={() => handleDeleteInvoice(invoice.id)}
                                    >
                                      {t('common.delete')}
                                    </Menu.Item>
                                  </Menu.Dropdown>
                                </Menu>
                              </Table.Td>
                            </Table.Tr>
                          );
                        })}
                      </Table.Tbody>
                    </Table>
                  </Table.ScrollContainer>
                )}
              </Stack>
            </Tabs.Panel>

            {/* Чеки */}
            <Tabs.Panel value="receipts" pt="lg">
              <Stack gap="md">
                {/* Фильтры и кнопка создания */}
                <Group justify="space-between" wrap="wrap">
                  <Group gap="xs" style={{ flex: isMobile ? '1 1 100%' : 'auto' }}>
                    <TextInput
                      placeholder={t('financialDocuments.search')}
                      leftSection={<IconSearch size={18} />}
                      value={receiptSearch}
                      onChange={(e) => setReceiptSearch(e.target.value)}
                      style={{ flex: 1, minWidth: isMobile ? '100%' : 200 }}
                      styles={{ input: { fontSize: '16px' } }}
                    />
                    <Select
                      placeholder={t('financialDocuments.filters.status')}
                      leftSection={<IconFilter size={18} />}
                      value={receiptStatus || null}
                      onChange={(value) => setReceiptStatus(value || '')}
                      clearable
                      data={[
                        { value: 'pending', label: t('financialDocuments.statuses.pending') },
                        { value: 'verified', label: t('financialDocuments.statuses.verified') },
                        { value: 'rejected', label: t('financialDocuments.statuses.rejected') }
                      ]}
                      style={{ flex: isMobile ? '1' : 'auto', minWidth: isMobile ? '100%' : 180 }}
                      styles={{ input: { fontSize: '16px' } }}
                    />
                  </Group>

                  <Button
                    leftSection={<IconPlus size={18} />}
                    onClick={() => setCreateReceiptModalVisible(true)}
                    fullWidth={isMobile}
                  >
                    {t('financialDocuments.buttons.createReceipt')}
                  </Button>
                </Group>

                {/* Список чеков */}
                {loadingReceipts ? (
                  <Center py={60}>
                    <Stack align="center" gap="md">
                      <Loader size="lg" />
                      <Text size="sm" c="dimmed">
                        {t('financialDocuments.loading')}
                      </Text>
                    </Stack>
                  </Center>
                ) : receipts.length === 0 ? (
                  <Paper p="xl" radius="md" withBorder>
                    <Center>
                      <Stack align="center" gap="md">
                        <ThemeIcon size={60} radius="xl" variant="light" color="gray">
                          <IconReceipt size={30} />
                        </ThemeIcon>
                        <Text size="sm" c="dimmed">
                          {t('financialDocuments.noReceipts')}
                        </Text>
                      </Stack>
                    </Center>
                  </Paper>
                ) : isMobile ? (
                  <Stack gap="md">
                    {receipts.map((receipt) => (
                      <ReceiptCard key={receipt.id} receipt={receipt} />
                    ))}
                  </Stack>
                ) : (
                  <Table.ScrollContainer minWidth={800}>
                    <Table striped highlightOnHover withTableBorder withColumnBorders>
                      <Table.Thead>
                        <Table.Tr>
                          <Table.Th>{t('financialDocuments.table.receipts.number')}</Table.Th>
                          <Table.Th w={120}>{t('financialDocuments.table.receipts.status')}</Table.Th>
                          <Table.Th>{t('financialDocuments.table.receipts.invoice')}</Table.Th>
                          <Table.Th ta="right" w={150}>{t('financialDocuments.table.receipts.amount')}</Table.Th>
                          <Table.Th w={180}>{t('financialDocuments.table.receipts.paymentMethod')}</Table.Th>
                          <Table.Th w={110}>{t('financialDocuments.table.receipts.date')}</Table.Th>
                          <Table.Th w={80}>{t('financialDocuments.table.receipts.actions')}</Table.Th>
                        </Table.Tr>
                      </Table.Thead>
                      <Table.Tbody>
                        {receipts.map((receipt) => (
                          <Table.Tr key={receipt.id}>
                            <Table.Td>
                              <Button
                                variant="subtle"
                                size="xs"
                                p={0}
                                onClick={() => navigate(`/financial-documents/receipts/${receipt.id}`)}
                              >
                                {receipt.receipt_number}
                              </Button>
                            </Table.Td>
                            <Table.Td>
                              {getStatusBadge(receipt.status, 'receipt')}
                            </Table.Td>
                            <Table.Td>
                              <Text size="sm">{receipt.invoice_number || '—'}</Text>
                            </Table.Td>
                            <Table.Td ta="right">
                              <Text size="sm" fw={600} c="green">
                                {formatCurrency(receipt.amount_paid)} {t('common.currencyTHB')}
                              </Text>
                            </Table.Td>
                            <Table.Td>
                              <Badge size="sm" variant="light">
                                {getPaymentMethodText(receipt.payment_method)}
                              </Badge>
                            </Table.Td>
                            <Table.Td>
                              <Text size="sm">{dayjs(receipt.receipt_date).format('DD.MM.YYYY')}</Text>
                            </Table.Td>
                            <Table.Td>
                              <Menu position="bottom-end" shadow="md">
                                <Menu.Target>
                                  <ActionIcon variant="subtle" color="gray">
                                    <IconDots size={18} />
                                  </ActionIcon>
                                </Menu.Target>
                                <Menu.Dropdown>
                                  <Menu.Item
                                    leftSection={<IconEye size={16} />}
                                    onClick={() => navigate(`/financial-documents/receipts/${receipt.id}`)}
                                  >
                                    {t('financialDocuments.actions.view')}
                                  </Menu.Item>
                                  <Menu.Item
                                    leftSection={<IconDownload size={16} />}
                                    onClick={() => handleDownloadReceiptPDF(receipt.id, receipt.receipt_number)}
                                  >
                                    {t('financialDocuments.actions.downloadPDF')}
                                  </Menu.Item>
                                  <Menu.Divider />
                                  <Menu.Item
                                    color="red"
                                    leftSection={<IconTrash size={16} />}
                                    onClick={() => handleDeleteReceipt(receipt.id)}
                                  >
                                    {t('common.delete')}
                                  </Menu.Item>
                                </Menu.Dropdown>
                              </Menu>
                            </Table.Td>
                          </Table.Tr>
                        ))}
                      </Table.Tbody>
                    </Table>
                  </Table.ScrollContainer>
                )}
              </Stack>
            </Tabs.Panel>
          </Tabs>
        </Stack>
      </Card>

      {/* Модалы */}
      <CreateInvoiceModal
        visible={createInvoiceModalVisible}
        onCancel={() => setCreateInvoiceModalVisible(false)}
        onSuccess={() => {
          setCreateInvoiceModalVisible(false);
          fetchInvoices();
        }}
      />

      <CreateReceiptModal
        visible={createReceiptModalVisible}
        onCancel={() => setCreateReceiptModalVisible(false)}
        onSuccess={() => {
          setCreateReceiptModalVisible(false);
          fetchReceipts();
        }}
      />
    </Stack>
  );
};

export default FinancialDocuments;