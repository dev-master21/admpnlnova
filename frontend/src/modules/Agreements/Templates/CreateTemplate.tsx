// frontend/src/modules/Agreements/Templates/CreateTemplate.tsx
import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Card,
  Form,
  Input,
  Select,
  Button,
  Space,
  message,
  Switch,
  Tag,
  Divider,
  Collapse,
  Row,
  Col,
  Typography,
  Table,
  Popconfirm
} from 'antd';
import { ArrowLeftOutlined, SaveOutlined, InfoCircleOutlined, PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { agreementsApi } from '@/api/agreements.api';
import './CreateTemplate.css';

const { Option } = Select;
const { Text } = Typography;

// Интерфейс для стороны договора
interface DefaultParty {
  role: string;
  label?: string;
}

const CreateTemplate = () => {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [editorContent, setEditorContent] = useState('');
  const [defaultParties, setDefaultParties] = useState<DefaultParty[]>([]);

  // Доступные роли для сторон договора
  const availableRoles = [
    { value: 'tenant', label: t('createTemplate.roles.tenant', 'Арендатор (Tenant)') },
    { value: 'lessor', label: t('createTemplate.roles.lessor', 'Арендодатель (Lessor)') },
    { value: 'landlord', label: t('createTemplate.roles.landlord', 'Владелец (Landlord)') },
    { value: 'representative', label: t('createTemplate.roles.representative', 'Представитель') },
    { value: 'principal', label: t('createTemplate.roles.principal', 'Принципал') },
    { value: 'agent', label: t('createTemplate.roles.agent', 'Агент') },
    { value: 'buyer', label: t('createTemplate.roles.buyer', 'Покупатель (Buyer)') },
    { value: 'seller', label: t('createTemplate.roles.seller', 'Продавец (Seller)') },
    { value: 'witness', label: t('createTemplate.roles.witness', 'Свидетель') },
    { value: 'company', label: t('createTemplate.roles.company', 'Компания') }
  ];

  // Стандартные стороны для каждого типа договора
  const getDefaultPartiesForType = (type: string): DefaultParty[] => {
    const partiesMap: Record<string, DefaultParty[]> = {
      rent: [
        { role: 'tenant' },
        { role: 'lessor' }
      ],
      sale: [
        { role: 'seller' },
        { role: 'buyer' }
      ],
      bilateral: [
        { role: 'tenant' },
        { role: 'lessor' }
      ],
      trilateral: [
        { role: 'landlord' },
        { role: 'representative' },
        { role: 'tenant' }
      ],
      agency: [
        { role: 'principal' },
        { role: 'agent' }
      ],
      transfer_act: [
        { role: 'lessor' },
        { role: 'tenant' }
      ],
      reservation: [
        { role: 'landlord' },
        { role: 'tenant' }
      ],
      management: [
        { role: 'landlord' },
        { role: 'agent' }
      ]
    };
    return partiesMap[type] || [{ role: 'landlord' }];
  };

  useEffect(() => {
    const pathParts = location.pathname.split('/');
    const templateId = pathParts[3];
    
    if (templateId && templateId !== 'create' && !isNaN(Number(templateId))) {
      fetchTemplateData(Number(templateId));
    }
  }, [location.pathname]);

  const fetchTemplateData = async (templateId: number) => {
    try {
      setLoading(true);
      const response = await agreementsApi.getTemplateById(templateId);
      const data = response.data.data;
      
      form.setFieldsValue({
        name: data.name,
        type: data.type,
        is_active: data.is_active ?? true
      });

      setEditorContent(data.content || '');

      // Загружаем стандартные стороны из шаблона или используем по умолчанию для типа
      if (data.default_parties) {
        try {
          const parties = typeof data.default_parties === 'string' 
            ? JSON.parse(data.default_parties) 
            : data.default_parties;
          setDefaultParties(parties);
        } catch (e) {
          console.error('Error parsing default_parties:', e);
          setDefaultParties(getDefaultPartiesForType(data.type));
        }
      } else {
        setDefaultParties(getDefaultPartiesForType(data.type));
      }

      message.success(t('createTemplate.messages.dataLoaded'));
    } catch (error: any) {
      message.error(t('createTemplate.messages.loadError'));
      navigate('/agreements/templates');
    } finally {
      setLoading(false);
    }
  };

  const isEditing = () => {
    const pathParts = location.pathname.split('/');
    const templateId = pathParts[3];
    return templateId && templateId !== 'create' && !isNaN(Number(templateId));
  };

  const getTemplateId = () => {
    const pathParts = location.pathname.split('/');
    return Number(pathParts[3]);
  };

  // Обработчик изменения типа договора
  const handleTypeChange = (type: string) => {
    const parties = getDefaultPartiesForType(type);
    setDefaultParties(parties);
  };

  // Добавить новую сторону
  const addParty = () => {
    setDefaultParties([...defaultParties, { role: 'witness' }]);
  };

  // Удалить сторону
  const removeParty = (index: number) => {
    if (defaultParties.length > 1) {
      const newParties = defaultParties.filter((_, i) => i !== index);
      setDefaultParties(newParties);
    } else {
      message.warning(t('createTemplate.messages.atLeastOneParty', 'Должна быть хотя бы одна сторона'));
    }
  };

  // Изменить роль стороны
  const updatePartyRole = (index: number, role: string) => {
    const newParties = [...defaultParties];
    newParties[index] = { ...newParties[index], role };
    setDefaultParties(newParties);
  };

  // Получить название роли
  const getRoleLabel = (role: string): string => {
    const found = availableRoles.find(r => r.value === role);
    return found ? found.label : role;
  };

  /**
   * 🔄 ФУНКЦИЯ ПАРСИНГА HTML В СТРУКТУРУ
   * Преобразует HTML из ReactQuill в структуру DocumentEditor
   */
  const parseHTMLToStructure = (html: string, type: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    const structure = {
      title: getAgreementTitle(type),
      city: 'Phuket',
      date: new Date().toISOString(),
      nodes: [] as any[]
    };

    let sectionCounter = 1;
    let currentSection: any = null;

    doc.body.childNodes.forEach((element: any) => {
      if (!element.tagName) return;

      const tagName = element.tagName.toLowerCase();
      const content = element.textContent?.trim() || '';

      if (!content) return;

      if (tagName === 'h1') {
        structure.title = content;
        return;
      } else if (tagName === 'h2') {
        if (currentSection) {
          structure.nodes.push(currentSection);
        }
        currentSection = {
          id: `section-${Date.now()}-${sectionCounter}`,
          type: 'section',
          content: content,
          number: sectionCounter.toString(),
          level: 0,
          children: []
        };
        sectionCounter++;
      } else if ((tagName === 'h3' || tagName === 'p') && currentSection) {
        if (tagName === 'h3') {
          const subsectionNum = currentSection.children.filter((c: any) => c.type === 'subsection').length + 1;
          currentSection.children.push({
            id: `subsection-${Date.now()}-${Math.random()}`,
            type: 'subsection',
            content: content.replace(/^\d+(\.\d+)*\.\s*/, ''),
            number: `${currentSection.number}.${subsectionNum}`,
            level: 1
          });
        } else if (content) {
          currentSection.children.push({
            id: `paragraph-${Date.now()}-${Math.random()}`,
            type: 'paragraph',
            content: content
          });
        }
      } else if (tagName === 'ul' && currentSection) {
        const items: string[] = [];
        element.querySelectorAll('li').forEach((li: any) => {
          const itemText = li.textContent?.trim();
          if (itemText) items.push(itemText);
        });
        if (items.length > 0) {
          currentSection.children.push({
            id: `bulletlist-${Date.now()}-${Math.random()}`,
            type: 'bulletList',
            items: items
          });
        }
      } else if (tagName === 'ol' && currentSection) {
        const items: string[] = [];
        element.querySelectorAll('li').forEach((li: any) => {
          const itemText = li.textContent?.trim();
          if (itemText) items.push(itemText);
        });
        if (items.length > 0) {
          currentSection.children.push({
            id: `bulletlist-${Date.now()}-${Math.random()}`,
            type: 'bulletList',
            items: items
          });
        }
      }
    });

    if (currentSection) {
      structure.nodes.push(currentSection);
    }

    if (structure.nodes.length === 0) {
      const plainText = doc.body.textContent?.trim() || '';
      if (plainText) {
        structure.nodes.push({
          id: `section-${Date.now()}-1`,
          type: 'section',
          content: 'GENERAL PROVISIONS',
          number: '1',
          level: 0,
          children: [
            {
              id: `paragraph-${Date.now()}-1`,
              type: 'paragraph',
              content: plainText.substring(0, 1000)
            }
          ]
        });
      }
    }

    return structure;
  };

  /**
   * 📝 ОПРЕДЕЛЕНИЕ ЗАГОЛОВКА ПО ТИПУ ДОГОВОРА
   */
  const getAgreementTitle = (type: string): string => {
    const titles: { [key: string]: string } = {
      rent: 'LEASE AGREEMENT',
      sale: 'SALE AGREEMENT',
      bilateral: 'LEASE AGREEMENT',
      trilateral: 'LEASE AGREEMENT',
      agency: 'AGENCY AGREEMENT',
      transfer_act: 'TRANSFER ACT',
      reservation: 'RESERVATION AGREEMENT',
      management: 'MANAGEMENT AGREEMENT'
    };
    return titles[type] || 'AGREEMENT';
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();

      if (!editorContent || editorContent.trim() === '<p><br></p>') {
        message.error(t('createTemplate.messages.emptyContent'));
        setLoading(false);
        return;
      }

      // Проверяем что есть хотя бы одна сторона
      if (defaultParties.length === 0) {
        message.error(t('createTemplate.messages.atLeastOneParty', 'Добавьте хотя бы одну сторону договора'));
        setLoading(false);
        return;
      }

      // ✅ ГЕНЕРИРУЕМ СТРУКТУРУ ИЗ HTML
      const structure = parseHTMLToStructure(editorContent, values.type);

      const data = {
        name: values.name,
        type: values.type,
        content: editorContent,
        structure: JSON.stringify(structure),
        is_active: values.is_active ?? true,
        default_parties: JSON.stringify(defaultParties) // ✅ ДОБАВЛЯЕМ СТОРОНЫ
      };

      if (isEditing()) {
        await agreementsApi.updateTemplate(getTemplateId(), data);
        message.success(t('createTemplate.messages.updated'));
      } else {
        await agreementsApi.createTemplate(data);
        message.success(t('createTemplate.messages.created'));
      }

      navigate('/agreements/templates');
    } catch (error: any) {
      console.error('Error saving template:', error);
      message.error(error.response?.data?.message || t('createTemplate.messages.saveError'));
    } finally {
      setLoading(false);
    }
  };

  const insertVariable = (variable: string) => {
    const placeholder = `{{${variable}}}`;
    setEditorContent(prev => prev + placeholder);
    message.success(t('createTemplate.messages.variableInserted', { variable }));
  };

  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ list: 'ordered' }, { list: 'bullet' }],
      [{ align: [] }],
      ['link'],
      ['clean']
    ]
  };

  // Колонки для таблицы сторон
  const partiesColumns = [
    {
      title: '№',
      dataIndex: 'index',
      key: 'index',
      width: 50,
      render: (_: any, __: any, index: number) => index + 1
    },
    {
      title: t('createTemplate.parties.role', 'Роль'),
      dataIndex: 'role',
      key: 'role',
      render: (role: string, _: any, index: number) => (
        <Select
          value={role}
          onChange={(value) => updatePartyRole(index, value)}
          style={{ width: '100%' }}
        >
          {availableRoles.map(r => (
            <Option key={r.value} value={r.value}>{r.label}</Option>
          ))}
        </Select>
      )
    },
    {
      title: t('createTemplate.parties.actions', 'Действия'),
      key: 'actions',
      width: 80,
      render: (_: any, __: any, index: number) => (
        <Popconfirm
          title={t('createTemplate.parties.confirmDelete', 'Удалить сторону?')}
          onConfirm={() => removeParty(index)}
          okText={t('common.yes', 'Да')}
          cancelText={t('common.no', 'Нет')}
          disabled={defaultParties.length <= 1}
        >
          <Button 
            type="text" 
            danger 
            icon={<DeleteOutlined />}
            disabled={defaultParties.length <= 1}
          />
        </Popconfirm>
      )
    }
  ];

const commonVariables = [
  // Основные
  { key: 'contract_number', label: t('createTemplate.variables.contractNumber'), example: 'NOVA-123456' },
  { key: 'agreement_number', label: t('createTemplate.variables.agreementNumber'), example: 'NOVA-123456' },
  { key: 'date', label: t('createTemplate.variables.currentDate'), example: 'November 6, 2025' },
  { key: 'city', label: t('createTemplate.variables.city'), example: 'Phuket' },
  { key: 'date_from', label: t('createTemplate.variables.dateFrom'), example: 'January 1, 2025' },
  { key: 'date_to', label: t('createTemplate.variables.dateTo'), example: 'December 31, 2025' },
  
  // ✅ НОВЫЕ - Компоненты дат (date_from)
  { key: 'first_day', label: t('createTemplate.variables.firstDay'), example: '1' },
  { key: 'first_month_full_word', label: t('createTemplate.variables.firstMonthFullWord'), example: 'January' },
  { key: 'first_month_short_word', label: t('createTemplate.variables.firstMonthShortWord'), example: 'Jan' },
  { key: 'first_month_number', label: t('createTemplate.variables.firstMonthNumber'), example: '01' },
  { key: 'first_year', label: t('createTemplate.variables.firstYear'), example: '2025' },
  
  // ✅ НОВЫЕ - Компоненты дат (date_to)
  { key: 'last_day', label: t('createTemplate.variables.lastDay'), example: '31' },
  { key: 'last_month_full_word', label: t('createTemplate.variables.lastMonthFullWord'), example: 'December' },
  { key: 'last_month_short_word', label: t('createTemplate.variables.lastMonthShortWord'), example: 'Dec' },
  { key: 'last_month_number', label: t('createTemplate.variables.lastMonthNumber'), example: '12' },
  { key: 'last_year', label: t('createTemplate.variables.lastYear'), example: '2025' },
  
  // Объект недвижимости
  { key: 'property_name', label: t('createTemplate.variables.propertyName'), example: 'Villa Sunset' },
  { key: 'property_address', label: t('createTemplate.variables.propertyAddress'), example: '123 Beach Road' },
  { key: 'property_number', label: t('createTemplate.variables.propertyNumber'), example: 'PROP-001' },
  
  // Финансы (с разделителем тысяч)
  { key: 'rent_amount', label: t('createTemplate.variables.rentAmount'), example: '50,000' },
  { key: 'rent_amount_monthly', label: t('createTemplate.variables.rentAmountMonthly'), example: '50,000' },
  { key: 'rent_amount_total', label: t('createTemplate.variables.rentAmountTotal'), example: '600,000' },
  { key: 'deposit_amount', label: t('createTemplate.variables.depositAmount'), example: '100,000' },
  { key: 'utilities_included', label: t('createTemplate.variables.utilitiesIncluded'), example: 'Gardening, Wi-Fi' },
  
  // Банк
  { key: 'bank_name', label: t('createTemplate.variables.bankName'), example: 'Bangkok Bank' },
  { key: 'bank_account_name', label: t('createTemplate.variables.bankAccountName'), example: 'John Doe' },
  { key: 'bank_account_number', label: t('createTemplate.variables.bankAccountNumber'), example: '123-4-56789-0' },
  
  // Условия оплаты (с разделителем тысяч)
  { key: 'upon_signed_pay', label: t('createTemplate.variables.uponSignedPay'), example: '200,000' },
  { key: 'upon_checkin_pay', label: t('createTemplate.variables.uponCheckinPay'), example: '200,000' },
  { key: 'upon_checkout_pay', label: t('createTemplate.variables.uponCheckoutPay'), example: '200,000' },
  { key: 'upon_signed_pay_percent', label: t('createTemplate.variables.uponSignedPayPercent'), example: '33%' },
  { key: 'upon_checkin_pay_percent', label: t('createTemplate.variables.uponCheckinPayPercent'), example: '33%' },
  { key: 'upon_checkout_pay_percent', label: t('createTemplate.variables.uponCheckoutPayPercent'), example: '34%' },
  
  // Landlord (физ. лицо)
  { key: 'landlord_name', label: t('createTemplate.variables.landlordName'), example: 'John Smith' },
  { key: 'landlord_country', label: t('createTemplate.variables.landlordCountry'), example: 'Thailand' },
  { key: 'landlord_passport', label: t('createTemplate.variables.landlordPassport'), example: 'AB1234567' },
  { key: 'landlord_passport_number', label: t('createTemplate.variables.landlordPassportNumber'), example: 'AB1234567' },
  // ✅ НОВЫЕ - Landlord (компания)
  { key: 'landlord_company_name', label: t('createTemplate.variables.landlordCompanyName'), example: 'Landlord Co Ltd' },
  { key: 'landlord_company_address', label: t('createTemplate.variables.landlordCompanyAddress'), example: '123 Business St' },
  { key: 'landlord_company_tax_id', label: t('createTemplate.variables.landlordCompanyTaxId'), example: '1234567890' },
  { key: 'landlord_director_name', label: t('createTemplate.variables.landlordDirectorName'), example: 'John Smith' },
  { key: 'landlord_director_passport', label: t('createTemplate.variables.landlordDirectorPassport'), example: 'AB1234567' },
  { key: 'landlord_director_country', label: t('createTemplate.variables.landlordDirectorCountry'), example: 'Thailand' },
  
  // Tenant (физ. лицо)
  { key: 'tenant_name', label: t('createTemplate.variables.tenantName'), example: 'Jane Doe' },
  { key: 'tenant_country', label: t('createTemplate.variables.tenantCountry'), example: 'USA' },
  { key: 'tenant_passport', label: t('createTemplate.variables.tenantPassport'), example: 'CD9876543' },
  { key: 'tenant_passport_number', label: t('createTemplate.variables.tenantPassportNumber'), example: 'CD9876543' },
  // ✅ НОВЫЕ - Tenant (компания)
  { key: 'tenant_company_name', label: t('createTemplate.variables.tenantCompanyName'), example: 'Tenant Corp' },
  { key: 'tenant_company_address', label: t('createTemplate.variables.tenantCompanyAddress'), example: '456 Trade Ave' },
  { key: 'tenant_company_tax_id', label: t('createTemplate.variables.tenantCompanyTaxId'), example: '0987654321' },
  { key: 'tenant_director_name', label: t('createTemplate.variables.tenantDirectorName'), example: 'Jane Doe' },
  { key: 'tenant_director_passport', label: t('createTemplate.variables.tenantDirectorPassport'), example: 'CD9876543' },
  { key: 'tenant_director_country', label: t('createTemplate.variables.tenantDirectorCountry'), example: 'USA' },
  
  // Lessor (физ. лицо)
  { key: 'lessor_name', label: t('createTemplate.variables.lessorName'), example: 'Company Ltd' },
  { key: 'lessor_country', label: t('createTemplate.variables.lessorCountry'), example: 'Thailand' },
  { key: 'lessor_passport', label: t('createTemplate.variables.lessorPassport'), example: 'EF1234567' },
  { key: 'lessor_passport_number', label: t('createTemplate.variables.lessorPassportNumber'), example: 'EF1234567' },
  // ✅ НОВЫЕ - Lessor (компания)
  { key: 'lessor_company_name', label: t('createTemplate.variables.lessorCompanyName'), example: 'Lessor Co Ltd' },
  { key: 'lessor_company_address', label: t('createTemplate.variables.lessorCompanyAddress'), example: '789 Market Rd' },
  { key: 'lessor_company_tax_id', label: t('createTemplate.variables.lessorCompanyTaxId'), example: '1122334455' },
  { key: 'lessor_director_name', label: t('createTemplate.variables.lessorDirectorName'), example: 'Mike Johnson' },
  { key: 'lessor_director_passport', label: t('createTemplate.variables.lessorDirectorPassport'), example: 'EF1122334' },
  { key: 'lessor_director_country', label: t('createTemplate.variables.lessorDirectorCountry'), example: 'Singapore' },
  
  // Representative
  { key: 'representative_name', label: t('createTemplate.variables.representativeName'), example: 'Sarah Johnson' },
  { key: 'representative_country', label: t('createTemplate.variables.representativeCountry'), example: 'USA' },
  { key: 'representative_passport', label: t('createTemplate.variables.representativePassport'), example: 'US7654321' },
  { key: 'representative_passport_number', label: t('createTemplate.variables.representativePassportNumber'), example: 'US7654321' },
  
  // Agent (физ. лицо)
  { key: 'agent_name', label: t('createTemplate.variables.agentName'), example: 'Real Estate Co.' },
  { key: 'agent_country', label: t('createTemplate.variables.agentCountry'), example: 'Thailand' },
  { key: 'agent_passport', label: t('createTemplate.variables.agentPassport'), example: 'GH1234567' },
  { key: 'agent_passport_number', label: t('createTemplate.variables.agentPassportNumber'), example: 'GH1234567' },
  // ✅ НОВЫЕ - Agent (компания)
  { key: 'agent_company_name', label: t('createTemplate.variables.agentCompanyName'), example: 'Real Estate Agency Ltd' },
  { key: 'agent_company_address', label: t('createTemplate.variables.agentCompanyAddress'), example: '321 Agency Blvd' },
  { key: 'agent_company_tax_id', label: t('createTemplate.variables.agentCompanyTaxId'), example: '5566778899' },
  { key: 'agent_director_name', label: t('createTemplate.variables.agentDirectorName'), example: 'Agent Director' },
  { key: 'agent_director_passport', label: t('createTemplate.variables.agentDirectorPassport'), example: 'GH7654321' },
  { key: 'agent_director_country', label: t('createTemplate.variables.agentDirectorCountry'), example: 'Thailand' },
  
  // Seller (физ. лицо)
  { key: 'seller_name', label: t('createTemplate.variables.sellerName'), example: 'Seller Name' },
  { key: 'seller_country', label: t('createTemplate.variables.sellerCountry'), example: 'Thailand' },
  { key: 'seller_passport', label: t('createTemplate.variables.sellerPassport'), example: 'IJ1234567' },
  { key: 'seller_passport_number', label: t('createTemplate.variables.sellerPassportNumber'), example: 'IJ1234567' },
  // ✅ НОВЫЕ - Seller (компания)
  { key: 'seller_company_name', label: t('createTemplate.variables.sellerCompanyName'), example: 'Seller Corp' },
  { key: 'seller_company_address', label: t('createTemplate.variables.sellerCompanyAddress'), example: '999 Seller St' },
  { key: 'seller_company_tax_id', label: t('createTemplate.variables.sellerCompanyTaxId'), example: '1231231234' },
  { key: 'seller_director_name', label: t('createTemplate.variables.sellerDirectorName'), example: 'Seller Director' },
  { key: 'seller_director_passport', label: t('createTemplate.variables.sellerDirectorPassport'), example: 'IJ7654321' },
  { key: 'seller_director_country', label: t('createTemplate.variables.sellerDirectorCountry'), example: 'Thailand' },
  
  // Buyer (физ. лицо)
  { key: 'buyer_name', label: t('createTemplate.variables.buyerName'), example: 'Buyer Name' },
  { key: 'buyer_country', label: t('createTemplate.variables.buyerCountry'), example: 'USA' },
  { key: 'buyer_passport', label: t('createTemplate.variables.buyerPassport'), example: 'KL9876543' },
  { key: 'buyer_passport_number', label: t('createTemplate.variables.buyerPassportNumber'), example: 'KL9876543' },
  // ✅ НОВЫЕ - Buyer (компания)
  { key: 'buyer_company_name', label: t('createTemplate.variables.buyerCompanyName'), example: 'Buyer Inc' },
  { key: 'buyer_company_address', label: t('createTemplate.variables.buyerCompanyAddress'), example: '888 Buyer Ave' },
  { key: 'buyer_company_tax_id', label: t('createTemplate.variables.buyerCompanyTaxId'), example: '4564564567' },
  { key: 'buyer_director_name', label: t('createTemplate.variables.buyerDirectorName'), example: 'Buyer Director' },
  { key: 'buyer_director_passport', label: t('createTemplate.variables.buyerDirectorPassport'), example: 'KL1234567' },
  { key: 'buyer_director_country', label: t('createTemplate.variables.buyerDirectorCountry'), example: 'USA' },
  
  // Principal (физ. лицо)
  { key: 'principal_name', label: t('createTemplate.variables.principalName'), example: 'Principal Name' },
  { key: 'principal_country', label: t('createTemplate.variables.principalCountry'), example: 'Russia' },
  { key: 'principal_passport', label: t('createTemplate.variables.principalPassport'), example: 'MN1234567' },
  { key: 'principal_passport_number', label: t('createTemplate.variables.principalPassportNumber'), example: 'MN1234567' },
  // ✅ НОВЫЕ - Principal (компания)
  { key: 'principal_company_name', label: t('createTemplate.variables.principalCompanyName'), example: 'Principal LLC' },
  { key: 'principal_company_address', label: t('createTemplate.variables.principalCompanyAddress'), example: '777 Principal Way' },
  { key: 'principal_company_tax_id', label: t('createTemplate.variables.principalCompanyTaxId'), example: '7897897890' },
  { key: 'principal_director_name', label: t('createTemplate.variables.principalDirectorName'), example: 'Principal Director' },
  { key: 'principal_director_passport', label: t('createTemplate.variables.principalDirectorPassport'), example: 'MN7654321' },
  { key: 'principal_director_country', label: t('createTemplate.variables.principalDirectorCountry'), example: 'Russia' },
  
  // Witnesses (до 5 свидетелей)
  { key: 'witness_name', label: t('createTemplate.variables.witness1Name'), example: 'Witness Name' },
  { key: 'witness_country', label: t('createTemplate.variables.witness1Country'), example: 'Thailand' },
  { key: 'witness_passport', label: t('createTemplate.variables.witness1Passport'), example: 'OP1234567' },
  
  { key: 'witness2_name', label: t('createTemplate.variables.witness2Name'), example: 'Witness 2 Name' },
  { key: 'witness2_country', label: t('createTemplate.variables.witness2Country'), example: 'USA' },
  { key: 'witness2_passport', label: t('createTemplate.variables.witness2Passport'), example: 'QR1234567' },
  
  { key: 'witness3_name', label: t('createTemplate.variables.witness3Name'), example: 'Witness 3 Name' },
  { key: 'witness3_country', label: t('createTemplate.variables.witness3Country'), example: 'UK' },
  { key: 'witness3_passport', label: t('createTemplate.variables.witness3Passport'), example: 'ST1234567' },
  
  { key: 'witness4_name', label: t('createTemplate.variables.witness4Name'), example: 'Witness 4 Name' },
  { key: 'witness4_country', label: t('createTemplate.variables.witness4Country'), example: 'Australia' },
  { key: 'witness4_passport', label: t('createTemplate.variables.witness4Passport'), example: 'UV1234567' },
  
  { key: 'witness5_name', label: t('createTemplate.variables.witness5Name'), example: 'Witness 5 Name' },
  { key: 'witness5_country', label: t('createTemplate.variables.witness5Country'), example: 'Canada' },
  { key: 'witness5_passport', label: t('createTemplate.variables.witness5Passport'), example: 'WX1234567' },
  
  // Companies (до 3 компаний) - автозаполняются из сторон-компаний
  { key: 'company1_name', label: t('createTemplate.variables.company1Name'), example: 'Company Ltd' },
  { key: 'company1_address', label: t('createTemplate.variables.company1Address'), example: '123 Business St' },
  { key: 'company1_tax_id', label: t('createTemplate.variables.company1TaxId'), example: '1234567890' },
  { key: 'company1_director_name', label: t('createTemplate.variables.company1DirectorName'), example: 'John Smith' },
  { key: 'company1_director_passport', label: t('createTemplate.variables.company1DirectorPassport'), example: 'AB1234567' },
  { key: 'company1_director_country', label: t('createTemplate.variables.company1DirectorCountry'), example: 'Thailand' },
  
  { key: 'company2_name', label: t('createTemplate.variables.company2Name'), example: 'Second Co Ltd' },
  { key: 'company2_address', label: t('createTemplate.variables.company2Address'), example: '456 Trade Ave' },
  { key: 'company2_tax_id', label: t('createTemplate.variables.company2TaxId'), example: '0987654321' },
  { key: 'company2_director_name', label: t('createTemplate.variables.company2DirectorName'), example: 'Jane Doe' },
  { key: 'company2_director_passport', label: t('createTemplate.variables.company2DirectorPassport'), example: 'CD9876543' },
  { key: 'company2_director_country', label: t('createTemplate.variables.company2DirectorCountry'), example: 'USA' },
  
  { key: 'company3_name', label: t('createTemplate.variables.company3Name'), example: 'Third Corp' },
  { key: 'company3_address', label: t('createTemplate.variables.company3Address'), example: '789 Market Rd' },
  { key: 'company3_tax_id', label: t('createTemplate.variables.company3TaxId'), example: '1122334455' },
  { key: 'company3_director_name', label: t('createTemplate.variables.company3DirectorName'), example: 'Mike Johnson' },
  { key: 'company3_director_passport', label: t('createTemplate.variables.company3DirectorPassport'), example: 'EF1122334' },
  { key: 'company3_director_country', label: t('createTemplate.variables.company3DirectorCountry'), example: 'Singapore' }
];

  return (
    <div className="create-template-container">
      <Card>
        <Space style={{ marginBottom: 24, width: '100%', justifyContent: 'space-between' }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/agreements/templates')}
          >
            {t('createTemplate.actions.backToList')}
          </Button>
          <Button
            type="primary"
            icon={<SaveOutlined />}
            onClick={handleSubmit}
            loading={loading}
          >
            {isEditing() ? t('createTemplate.actions.saveChanges') : t('createTemplate.actions.createTemplate')}
          </Button>
        </Space>

        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col xs={24} md={16}>
              <Form.Item
                name="name"
                label={t('createTemplate.fields.templateName')}
                rules={[{ required: true, message: t('createTemplate.validation.enterTemplateName') }]}
              >
                <Input placeholder={t('createTemplate.placeholders.templateName')} size="large" />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item
                name="type"
                label={t('createTemplate.fields.agreementType')}
                rules={[{ required: true, message: t('createTemplate.validation.selectType') }]}
              >
                <Select 
                  placeholder={t('createTemplate.placeholders.selectType')} 
                  size="large"
                  onChange={handleTypeChange}
                >
                  <Option value="rent">{t('createTemplate.agreementTypes.rent')}</Option>
                  <Option value="sale">{t('createTemplate.agreementTypes.sale')}</Option>
                  <Option value="bilateral">{t('createTemplate.agreementTypes.bilateral')}</Option>
                  <Option value="trilateral">{t('createTemplate.agreementTypes.trilateral')}</Option>
                  <Option value="agency">{t('createTemplate.agreementTypes.agency')}</Option>
                  <Option value="transfer_act">{t('createTemplate.agreementTypes.transferAct')}</Option>
                  <Option value="reservation">{t('createTemplate.agreementTypes.reservation')}</Option>
                  <Option value="management">{t('createTemplate.agreementTypes.management')}</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="is_active" label={t('createTemplate.fields.status')} valuePropName="checked" initialValue={true}>
            <Switch 
              checkedChildren={t('createTemplate.status.active')} 
              unCheckedChildren={t('createTemplate.status.inactive')} 
            />
          </Form.Item>

          <Divider />

          {/* ✅ СЕКЦИЯ НАСТРОЙКИ СТАНДАРТНЫХ СТОРОН */}
          <Card 
            title={
              <Space>
                <InfoCircleOutlined />
                <span>{t('createTemplate.parties.title', 'Стандартные стороны договора')}</span>
              </Space>
            }
            size="small"
            style={{ marginBottom: 16 }}
            extra={
              <Button 
                type="dashed" 
                icon={<PlusOutlined />} 
                onClick={addParty}
                size="small"
              >
                {t('createTemplate.parties.add', 'Добавить сторону')}
              </Button>
            }
          >
            <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
              {t('createTemplate.parties.description', 'Эти стороны будут автоматически добавлены при создании договора на основе этого шаблона. Вы можете изменить их количество и роли.')}
            </Text>
            
            <Table
              dataSource={defaultParties.map((p, index) => ({ ...p, key: index }))}
              columns={partiesColumns}
              pagination={false}
              size="small"
              locale={{ emptyText: t('createTemplate.parties.noParties', 'Нет сторон') }}
            />
            
            {defaultParties.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <Text type="secondary">
                  {t('createTemplate.parties.summary', 'Стороны')}: {' '}
                  {defaultParties.map((p, i) => (
                    <Tag key={i} color="blue" style={{ marginRight: 4 }}>
                      {getRoleLabel(p.role)}
                    </Tag>
                  ))}
                </Text>
              </div>
            )}
          </Card>

          <Collapse
            defaultActiveKey={['variables']}
            style={{ marginBottom: 16 }}
            items={[
              {
                key: 'variables',
                label: (
                  <Space>
                    <InfoCircleOutlined />
                    <strong>{t('createTemplate.variablesPanel.title')}</strong>
                  </Space>
                ),
                children: (
                  <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    <Row gutter={[8, 8]}>
                      {commonVariables.map(variable => (
                        <Col key={variable.key} xs={24} sm={12} md={8} lg={6}>
                          <Tag
                            color="blue"
                            style={{ 
                              cursor: 'pointer', 
                              width: '100%',
                              textAlign: 'center',
                              padding: '4px 8px'
                            }}
                            onClick={() => insertVariable(variable.key)}
                          >
                            {variable.label}
                          </Tag>
                          <Text type="secondary" style={{ fontSize: '11px', display: 'block', marginTop: '2px' }}>
                            {`{{${variable.key}}}`}
                          </Text>
                        </Col>
                      ))}
                    </Row>
                  </div>
                )
              }
            ]}
          />

          <Form.Item
            label={t('createTemplate.fields.templateContent')}
            required
            help={t('createTemplate.hints.useVariables')}
          >
            <ReactQuill
              value={editorContent}
              onChange={setEditorContent}
              modules={modules}
              theme="snow"
              style={{ height: '500px', marginBottom: '60px' }}
              placeholder={t('createTemplate.placeholders.templateContent')}
            />
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default CreateTemplate;