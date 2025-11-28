// frontend/src/modules/OwnerPortal/OwnerPricingPage.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Layout,
  Card,
  Form,
  Button,
  Space,
  message,
  Spin,
  Typography,
  Breadcrumb,
  InputNumber,
  Row,
  Col
} from 'antd';
import {
  ArrowLeftOutlined,
  SaveOutlined,
  HomeOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { propertiesApi } from '@/api/properties.api';
import SeasonalPricing from '@/modules/Properties/components/SeasonalPricing';
import MonthlyPricing from '@/modules/Properties/components/MonthlyPricing';
import CommissionForm from '@/modules/Properties/components/CommissionForm';
import DepositForm from '@/modules/Properties/components/DepositForm';
import UtilitiesForm from '@/modules/Properties/components/UtilitiesForm';
import './OwnerDashboard.css';

const { Content } = Layout;
const { Title } = Typography;

const OwnerPricingPage = () => {
  const { t } = useTranslation();
  const { propertyId } = useParams<{ propertyId: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [property, setProperty] = useState<any>(null);
  const [monthlyPricing, setMonthlyPricing] = useState<any[]>([]);

  useEffect(() => {
    loadProperty();
  }, [propertyId]);

  const loadProperty = async () => {
    setLoading(true);
    try {
      const { data } = await propertiesApi.getById(Number(propertyId));
      const prop = data.data;
      setProperty(prop);

      form.setFieldsValue({
        deal_type: prop.deal_type,
        sale_price: prop.sale_price,
        year_price: prop.year_price,
        sale_commission_type: prop.sale_commission_type,
        sale_commission_value: prop.sale_commission_value,
        rent_commission_type: prop.rent_commission_type,
        rent_commission_value: prop.rent_commission_value,
        deposit_type: prop.deposit_type,
        deposit_amount: prop.deposit_amount,
        electricity_rate: prop.electricity_rate,
        water_rate: prop.water_rate,
        seasonalPricing: prop.pricing || []
      });

      setMonthlyPricing(prop.monthly_pricing || []);
    } catch (error: any) {
      message.error(t('ownerPortal.errorLoadingProperty'));
      navigate('/owner/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const values = form.getFieldsValue();

      await propertiesApi.updatePricingDetails(Number(propertyId), {
        sale_price: values.sale_price,
        year_price: values.year_price,
        sale_commission_type: values.sale_commission_type,
        sale_commission_value: values.sale_commission_value,
        rent_commission_type: values.rent_commission_type,
        rent_commission_value: values.rent_commission_value,
        deposit_type: values.deposit_type,
        deposit_amount: values.deposit_amount,
        electricity_rate: values.electricity_rate,
        water_rate: values.water_rate,
        seasonalPricing: values.seasonalPricing || []
      });

      if (monthlyPricing.length > 0) {
        await propertiesApi.updateMonthlyPricing(Number(propertyId), monthlyPricing);
      }

      message.success(t('ownerPortal.pricesSaved'));
      navigate('/owner/dashboard');
    } catch (error: any) {
      message.error(error.response?.data?.message || t('ownerPortal.errorSavingPrices'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout style={{ minHeight: '100vh', background: '#0a0a0a' }}>
        <Content style={{ padding: '50px', textAlign: 'center' }}>
          <Spin size="large" />
        </Content>
      </Layout>
    );
  }

  const dealType = form.getFieldValue('deal_type') || 'sale';

  return (
    <Layout style={{ minHeight: '100vh', background: '#0a0a0a' }}>
      <Content style={{ padding: '24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <Breadcrumb>
              <Breadcrumb.Item>
                <a href="/owner/dashboard">
                  <HomeOutlined /> {t('ownerPortal.dashboard')}
                </a>
              </Breadcrumb.Item>
              <Breadcrumb.Item>
                {property?.property_name || property?.property_number}
              </Breadcrumb.Item>
              <Breadcrumb.Item>{t('ownerPortal.pricing')}</Breadcrumb.Item>
            </Breadcrumb>

            <Card>
              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <div>
                  <Button
                    icon={<ArrowLeftOutlined />}
                    onClick={() => navigate('/owner/dashboard')}
                    style={{ marginBottom: 16 }}
                  >
                    {t('common.back')}
                  </Button>
                  <Title level={3} style={{ margin: 0 }}>
                    {t('ownerPortal.managePricing')}: {property?.property_name || property?.property_number}
                  </Title>
                </div>
                <Button
                  type="primary"
                  size="large"
                  icon={<SaveOutlined />}
                  onClick={handleSave}
                  loading={saving}
                >
                  {t('common.save')}
                </Button>
              </Space>
            </Card>

            <Form form={form} layout="vertical">
              <Space direction="vertical" style={{ width: '100%' }} size="large">
                {(dealType === 'sale' || dealType === 'both') && (
                  <Card title={t('properties.salePrice.title')}>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item
                          name="sale_price"
                          label={t('properties.salePrice')}
                        >
                          <InputNumber
                            min={0}
                            style={{ width: '100%' }}
                            addonAfter="฿"
                            formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                          />
                        </Form.Item>
                      </Col>
                    </Row>
                  </Card>
                )}

                {(dealType === 'rent' || dealType === 'both') && (
                  <>
                    <Card title={t('properties.constantRentPrice.title')}>
                      <Row gutter={16}>
                        <Col span={12}>
                          <Form.Item
                            name="year_price"
                            label={t('properties.constantRentPrice.yearPriceLabel')}
                          >
                            <InputNumber
                              min={0}
                              style={{ width: '100%' }}
                              addonAfter="฿"
                              formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                            />
                          </Form.Item>
                        </Col>
                      </Row>
                    </Card>

                    <Form.Item name="seasonalPricing" noStyle>
                      <SeasonalPricing viewMode={false} />
                    </Form.Item>

                    <MonthlyPricing
                      propertyId={Number(propertyId)}
                      initialPricing={monthlyPricing}
                      viewMode={false}
                      onChange={(pricing) => setMonthlyPricing(pricing)}
                    />
                  </>
                )}

                <CommissionForm dealType={dealType} viewMode={false} />

                <DepositForm dealType={dealType} viewMode={false} />

                <UtilitiesForm viewMode={false} />

                <Card>
                  <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
                    <Button size="large" onClick={() => navigate('/owner/dashboard')}>
                      {t('common.cancel')}
                    </Button>
                    <Button
                      type="primary"
                      size="large"
                      icon={<SaveOutlined />}
                      onClick={handleSave}
                      loading={saving}
                    >
                      {t('common.save')}
                    </Button>
                  </Space>
                </Card>
              </Space>
            </Form>
          </Space>
        </div>
      </Content>
    </Layout>
  );
};

export default OwnerPricingPage;