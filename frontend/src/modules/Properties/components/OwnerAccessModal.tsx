// frontend/src/modules/Properties/components/OwnerAccessModal.tsx
import { useState, useEffect } from 'react';
import { Modal, Button, Space, message, Typography, Input, Alert, Spin } from 'antd';
import { CopyOutlined, CheckCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { propertyOwnersApi } from '@/api/propertyOwners.api';

const {Text} = Typography;

interface OwnerAccessModalProps {
  visible: boolean;
  onClose: () => void;
  ownerName: string;
}

const OwnerAccessModal = ({ visible, onClose, ownerName }: OwnerAccessModalProps) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [accessData, setAccessData] = useState<{
    access_url: string;
    password: string;
    is_active: boolean;
    last_login_at: string | null;
    created_at: string;
  } | null>(null);

  useEffect(() => {
    if (visible && ownerName) {
      checkExistingAccess();
    }
  }, [visible, ownerName]);

  const checkExistingAccess = async () => {
    setChecking(true);
    try {
      const { data } = await propertyOwnersApi.getOwnerInfo(ownerName);
      if (data.success) {
        setAccessData(data.data);
        setShowDisclaimer(false);
      }
    } catch (error: any) {
      if (error.response?.status !== 404) {
        console.error('Error checking access:', error);
      }
    } finally {
      setChecking(false);
    }
  };

  const handleCreateAccess = async () => {
    setLoading(true);
    try {
      const { data } = await propertyOwnersApi.createOwnerAccess({ owner_name: ownerName });
      
      if (data.success) {
        message.success(t('properties.ownerAccess.created'));
        setAccessData({
          access_url: data.data.access_url,
          password: data.data.password,
          is_active: true,
          last_login_at: null,
          created_at: new Date().toISOString()
        });
        setShowDisclaimer(false);
      }
    } catch (error: any) {
      if (error.response?.data?.message) {
        message.error(error.response.data.message);
      } else {
        message.error(t('properties.ownerAccess.createError'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text: string, type: 'url' | 'password') => {
    navigator.clipboard.writeText(text);
    message.success(
      type === 'url' 
        ? t('properties.ownerAccess.urlCopied') 
        : t('properties.ownerAccess.passwordCopied')
    );
  };

  const handleClose = () => {
    setShowDisclaimer(true);
    setAccessData(null);
    onClose();
  };

  return (
    <Modal
      title={
        <Space>
          <InfoCircleOutlined />
          {t('properties.ownerAccess.title')}
        </Space>
      }
      open={visible}
      onCancel={handleClose}
      footer={null}
      width={600}
    >
      {checking ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
        </div>
      ) : showDisclaimer ? (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Alert
            message={t('properties.ownerAccess.disclaimerTitle')}
            description={
              <Space direction="vertical" size="small">
                <Text>
                  {t('properties.ownerAccess.disclaimerText', { ownerName })}
                </Text>
                <Text strong style={{ color: '#ff4d4f' }}>
                  {t('properties.ownerAccess.disclaimerWarning')}
                </Text>
              </Space>
            }
            type="warning"
            showIcon
            icon={<InfoCircleOutlined />}
          />

          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={handleClose}>
              {t('common.cancel')}
            </Button>
            <Button 
              type="primary" 
              onClick={handleCreateAccess}
              loading={loading}
            >
              <CheckCircleOutlined /> {t('properties.ownerAccess.understand')}
            </Button>
          </Space>
        </Space>
      ) : accessData ? (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Alert
            message={t('properties.ownerAccess.successTitle')}
            description={t('properties.ownerAccess.successDescription')}
            type="success"
            showIcon
          />

          {/* Ссылка для владельца */}
          <div>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>
              {t('properties.ownerAccess.accessUrl')}:
            </Text>
            <Input.Group compact>
              <Input
                value={accessData.access_url}
                readOnly
                style={{ width: 'calc(100% - 40px)' }}
              />
              <Button
                icon={<CopyOutlined />}
                onClick={() => handleCopy(accessData.access_url, 'url')}
              />
            </Input.Group>
          </div>

          {/* Пароль */}
          <div>
            <Text strong style={{ display: 'block', marginBottom: 8 }}>
              {t('properties.ownerAccess.password')}:
            </Text>
            <Input.Group compact>
              <Input
                value={accessData.password}
                readOnly
                style={{ width: 'calc(100% - 40px)', fontSize: 18, fontWeight: 'bold' }}
              />
              <Button
                icon={<CopyOutlined />}
                onClick={() => handleCopy(accessData.password, 'password')}
              />
            </Input.Group>
            <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
              {t('properties.ownerAccess.passwordHint')}
            </Text>
          </div>

          {/* Статус */}
          {accessData.last_login_at && (
            <div>
              <Text type="secondary">
                {t('properties.ownerAccess.lastLogin')}: {new Date(accessData.last_login_at).toLocaleString()}
              </Text>
            </div>
          )}

          <Alert
            message={t('properties.ownerAccess.securityNote')}
            description={t('properties.ownerAccess.securityNoteText')}
            type="info"
            showIcon
          />

          <Button type="primary" block onClick={handleClose}>
            {t('common.close')}
          </Button>
        </Space>
      ) : null}
    </Modal>
  );
};

export default OwnerAccessModal;