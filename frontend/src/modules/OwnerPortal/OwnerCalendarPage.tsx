// frontend/src/modules/OwnerPortal/OwnerCalendarPage.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Layout,
  Card,
  Button,
  Space,
  message,
  Spin,
  Typography,
  Breadcrumb
} from 'antd';
import {
  ArrowLeftOutlined,
  HomeOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { propertiesApi } from '@/api/properties.api';
import CalendarManager from '@/modules/Properties/components/CalendarManager';
import './OwnerDashboard.css';

const { Content } = Layout;
const { Title } = Typography;

const OwnerCalendarPage = () => {
  const { t } = useTranslation();
  const { propertyId } = useParams<{ propertyId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [property, setProperty] = useState<any>(null);

  useEffect(() => {
    loadProperty();
  }, [propertyId]);

  const loadProperty = async () => {
    setLoading(true);
    try {
      const { data } = await propertiesApi.getById(Number(propertyId));
      setProperty(data.data);
    } catch (error: any) {
      message.error(t('ownerPortal.errorLoadingProperty'));
      navigate('/owner/dashboard');
    } finally {
      setLoading(false);
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
              <Breadcrumb.Item>{t('ownerPortal.calendar')}</Breadcrumb.Item>
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
                    {t('ownerPortal.manageCalendar')}: {property?.property_name || property?.property_number}
                  </Title>
                </div>
              </Space>
            </Card>

            <CalendarManager propertyId={Number(propertyId)} viewMode={false} />
          </Space>
        </div>
      </Content>
    </Layout>
  );
};

export default OwnerCalendarPage;