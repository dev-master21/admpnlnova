// frontend/src/modules/OwnerPortal/OwnerLogin.tsx
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, Space, message, Spin, Typography, Alert } from 'antd';
import { LockOutlined, HomeOutlined, EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { propertyOwnersApi } from '@/api/propertyOwners.api';
import { useOwnerStore } from '@/store/ownerStore';
import './OwnerLogin.css';

const { Title, Text } = Typography;

const OwnerLogin = () => {
  const { t } = useTranslation();
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { setAuth } = useOwnerStore();
  
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [ownerData, setOwnerData] = useState<any>(null);

  useEffect(() => {
    if (token) {
      verifyToken();
    }
  }, [token]);

  const verifyToken = async () => {
    setVerifying(true);
    try {
      const { data } = await propertyOwnersApi.verifyToken(token!);
      if (data.success) {
        setTokenValid(true);
        setOwnerData(data.data);
      }
    } catch (error: any) {
      message.error(t('ownerPortal.invalidToken'));
      setTokenValid(false);
    } finally {
      setVerifying(false);
    }
  };

  const handleLogin = async (values: { password: string }) => {
    setLoading(true);
    try {
      const { data } = await propertyOwnersApi.login({
        access_token: token!,
        password: values.password
      });

      if (data.success) {
        setAuth(data.data.owner, data.data.accessToken, data.data.refreshToken);
        message.success(t('ownerPortal.loginSuccess'));
        navigate('/owner/dashboard');
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        message.error(error.response.data.message);
      } else {
        message.error(t('ownerPortal.loginError'));
      }
    } finally {
      setLoading(false);
    }
  };

  if (verifying) {
    return (
      <div className="owner-login-container">
        <Card className="owner-login-card">
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" />
            <div style={{ marginTop: 16 }}>
              <Text>{t('ownerPortal.verifying')}</Text>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="owner-login-container">
        <Card className="owner-login-card">
          <Space direction="vertical" size="large" style={{ width: '100%', textAlign: 'center' }}>
            <HomeOutlined style={{ fontSize: 64, color: '#ff4d4f' }} />
            <Title level={3}>{t('ownerPortal.accessDenied')}</Title>
            <Alert
              message={t('ownerPortal.invalidTokenMessage')}
              type="error"
              showIcon
            />
          </Space>
        </Card>
      </div>
    );
  }

  return (
    <div className="owner-login-container">
      <Card className="owner-login-card">
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* Заголовок */}
          <div style={{ textAlign: 'center' }}>
            <HomeOutlined style={{ fontSize: 48, color: '#1890ff', marginBottom: 16 }} />
            <Title level={2} style={{ marginBottom: 8 }}>
              {t('ownerPortal.welcome')}
            </Title>
            <Text type="secondary">
              {ownerData?.owner_name}
            </Text>
          </div>

          {/* Информация */}
          <Alert
            message={t('ownerPortal.loginInfo')}
            description={
              <Space direction="vertical" size="small">
                <Text>{t('ownerPortal.propertiesCount')}: {ownerData?.properties_count || 0}</Text>
                {ownerData?.last_login_at && (
                  <Text type="secondary">
                    {t('ownerPortal.lastLogin')}: {new Date(ownerData.last_login_at).toLocaleString()}
                  </Text>
                )}
              </Space>
            }
            type="info"
            showIcon
          />

          {/* Форма */}
          <Form
            form={form}
            onFinish={handleLogin}
            layout="vertical"
            size="large"
          >
            <Form.Item
              name="password"
              label={t('ownerPortal.password')}
              rules={[
                { required: true, message: t('ownerPortal.passwordRequired') }
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder={t('ownerPortal.enterPassword')}
                iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                block
                size="large"
              >
                {t('ownerPortal.login')}
              </Button>
            </Form.Item>
          </Form>

          {/* Подсказка */}
          <Alert
            message={t('ownerPortal.hint')}
            description={t('ownerPortal.hintText')}
            type="warning"
            showIcon
          />
        </Space>
      </Card>
    </div>
  );
};

export default OwnerLogin;