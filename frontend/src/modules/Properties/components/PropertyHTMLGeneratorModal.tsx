import { useState } from 'react';
import { Modal, Checkbox, Button, Select, Space, message, Divider, Alert } from 'antd';
import { DownloadOutlined, FileTextOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { propertiesApi } from '@/api/properties.api';

interface PropertyHTMLGeneratorModalProps {
  visible: boolean;
  onClose: () => void;
  propertyId: number;
  propertyNumber?: string;
}

const PropertyHTMLGeneratorModal: React.FC<PropertyHTMLGeneratorModalProps> = ({
  visible,
  onClose,
  propertyId,
  propertyNumber
}) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  
  const [language, setLanguage] = useState('ru');
  const [showRentalPrices, setShowRentalPrices] = useState(true);
  const [showSalePrices, setShowSalePrices] = useState(false);
  const [includeSeasonalPrices, setIncludeSeasonalPrices] = useState(true);
  const [includeMonthlyPrices, setIncludeMonthlyPrices] = useState(true);
  const [includeYearlyPrice, setIncludeYearlyPrice] = useState(true);
  const [forAgent, setForAgent] = useState(false);

  const handleGenerate = async () => {
    try {
      setLoading(true);

      const response = await propertiesApi.generateHTML(propertyId, {
        language,
        showRentalPrices,
        showSalePrices,
        includeSeasonalPrices,
        includeMonthlyPrices,
        includeYearlyPrice,
        forAgent,
      });

      // Создаём blob из HTML
      const blob = new Blob([response.data], { type: 'text/html;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      
      // Создаём ссылку для скачивания
      const link = document.createElement('a');
      link.href = url;
      link.download = `property_${propertyNumber || propertyId}_${language}.html`;
      document.body.appendChild(link);
      link.click();
      
      // Очищаем
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      message.success(t('htmlGenerator.success'));
      onClose();
    } catch (error: any) {
      console.error('Generate HTML error:', error);
      message.error(error.response?.data?.message || t('htmlGenerator.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={
        <Space>
          <FileTextOutlined />
          {t('htmlGenerator.title')}
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          {t('common.cancel')}
        </Button>,
        <Button
          key="generate"
          type="primary"
          icon={<DownloadOutlined />}
          loading={loading}
          onClick={handleGenerate}
        >
          {loading ? t('htmlGenerator.generating') : t('htmlGenerator.generate')}
        </Button>
      ]}
      width={500}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="middle">
        <div>
          <div style={{ marginBottom: 8, fontWeight: 500 }}>
            {t('htmlGenerator.language')}
          </div>
          <Select
            style={{ width: '100%' }}
            value={language}
            onChange={setLanguage}
            options={[
              { value: 'ru', label: 'Русский' },
              { value: 'en', label: 'English' },
              { value: 'th', label: 'ไทย' },
              { value: 'zh', label: '中文' },
              { value: 'he', label: 'עברית' }
            ]}
          />
        </div>

        <Divider style={{ margin: '12px 0' }} />

        <div>
          <div style={{ marginBottom: 12, fontWeight: 500 }}>
            {t('htmlGenerator.priceOptions')}
          </div>
          
          <Space direction="vertical" style={{ width: '100%' }}>
            <Checkbox
              checked={showRentalPrices}
              onChange={(e) => setShowRentalPrices(e.target.checked)}
            >
              {t('htmlGenerator.showRentalPrices')}
            </Checkbox>

            {showRentalPrices && (
              <div style={{ marginLeft: 24 }}>
                
                <Space direction="vertical">
                  <Checkbox
                    checked={includeSeasonalPrices}
                    onChange={(e) => setIncludeSeasonalPrices(e.target.checked)}
                  >
                    {t('htmlGenerator.seasonalPrices')}
                  </Checkbox>
                  <Checkbox
                    checked={includeMonthlyPrices}
                    onChange={(e) => setIncludeMonthlyPrices(e.target.checked)}
                  >
                    {t('htmlGenerator.monthlyPrices')}
                  </Checkbox>
                  <Checkbox
                    checked={includeYearlyPrice}
                    onChange={(e) => setIncludeYearlyPrice(e.target.checked)}
                  >
                    {t('htmlGenerator.yearlyPrice')}
                  </Checkbox>
                </Space>
              </div>
            )}

            <Checkbox
              checked={showSalePrices}
              onChange={(e) => setShowSalePrices(e.target.checked)}
            >
              {t('htmlGenerator.showSalePrices')}
            </Checkbox>
            <Checkbox
              checked={forAgent}
              onChange={(e) => setForAgent(e.target.checked)}
            >
              {t('htmlGenerator.forAgent')}
            </Checkbox>
          </Space>
        </div>

        <Alert
          message="HTML файл будет содержать все фотографии в формате base64 и будет полностью автономным."
          type="info"
          showIcon
        />
      </Space>
    </Modal>
  );
};

export default PropertyHTMLGeneratorModal;