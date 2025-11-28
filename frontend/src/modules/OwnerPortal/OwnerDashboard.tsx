// frontend/src/modules/OwnerPortal/OwnerDashboard.tsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layout,
  Card,
  Row,
  Col,
  Button,
  Space,
  Typography,
  Select,
  Spin,
  message,
  Modal,
  Form,
  Input,
  Progress,
  Tag,
  Carousel,
  Divider
} from 'antd';
import {
  HomeOutlined,
  LogoutOutlined,
  SettingOutlined,
  DollarOutlined,
  CalendarOutlined,
  GlobalOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  UserOutlined,
  InfoCircleOutlined,
  LeftOutlined,
  RightOutlined,
  WarningOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useOwnerStore } from '@/store/ownerStore';
import { propertyOwnersApi, OwnerProperty } from '@/api/propertyOwners.api';
import dayjs from 'dayjs';
import './OwnerDashboard.css';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

const OwnerDashboard = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { isAuthenticated, clearAuth } = useOwnerStore();

  const [properties, setProperties] = useState<OwnerProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [changePasswordModalVisible, setChangePasswordModalVisible] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [completenessModalVisible, setCompletenessModalVisible] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<OwnerProperty | null>(null);

  const [passwordForm] = Form.useForm();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/owner/login');
      return;
    }
    loadProperties();
  }, [isAuthenticated]);

  const loadProperties = async () => {
    setLoading(true);
    try {
      const { data } = await propertyOwnersApi.getProperties();
      if (data.success) {
        setProperties(data.data);
      }
    } catch (error) {
      message.error(t('ownerPortal.loadPropertiesError'));
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearAuth();
    message.success(t('ownerPortal.logoutSuccess'));
    navigate('/owner/login');
  };

  const handleChangeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  const handleManageProperty = (propertyId: number, type: 'pricing' | 'calendar') => {
    if (type === 'pricing') {
      navigate(`/owner/property/${propertyId}/pricing`);
    } else {
      navigate(`/owner/property/${propertyId}/calendar`);
    }
  };

  const handleChangePassword = async (values: any) => {
    setChangingPassword(true);
    try {
      await propertyOwnersApi.changePassword({
        current_password: values.current_password,
        new_password: values.new_password
      });
      message.success(t('ownerPortal.passwordChanged'));
      setChangePasswordModalVisible(false);
      passwordForm.resetFields();
    } catch (error: any) {
      if (error.response?.data?.message) {
        message.error(error.response.data.message);
      } else {
        message.error(t('ownerPortal.passwordChangeError'));
      }
    } finally {
      setChangingPassword(false);
    }
  };

  const getDealTypeLabel = (dealType: string) => {
    switch (dealType) {
      case 'sale':
        return t('properties.dealTypes.sale');
      case 'rent':
        return t('properties.dealTypes.rent');
      case 'both':
        return t('properties.dealTypes.both');
      default:
        return dealType;
    }
  };

  const getDealTypeColor = (dealType: string) => {
    switch (dealType) {
      case 'sale':
        return 'green';
      case 'rent':
        return 'blue';
      case 'both':
        return 'purple';
      default:
        return 'default';
    }
  };

  const getCompletenessColor = (completeness: number) => {
    if (completeness >= 80) return '#52c41a';
    if (completeness >= 50) return '#faad14';
    return '#ff4d4f';
  };

  // ✅ ИДЕАЛЬНАЯ функция форматирования комнат
    // ✅ ИСПРАВЛЕНО: строгая проверка на валидное число
    const formatRoomCount = (count: number | null | undefined): string => {
      // Строго проверяем на существование и положительное значение
      if (count === null || count === undefined || count === 0 || count < 0) {
        return '';
      }

      const num = typeof count === 'number' ? count : parseFloat(String(count));

      if (isNaN(num) || num <= 0) {
        return '';
      }

      return Number.isInteger(num) ? num.toString() : num.toFixed(1);
    };

    // ✅ ИСПРАВЛЕНО: проверка что значение реально существует и больше 0
    const hasValidRoomCount = (count: number | null | undefined): boolean => {
      if (count === null || count === undefined || count === 0) {
        return false;
      }
      const num = typeof count === 'number' ? count : parseFloat(String(count));
      return !isNaN(num) && num > 0;
    };

  // ✅ ИДЕАЛЬНАЯ функция склонения слов
  const getRoomLabel = (count: number, type: 'bedroom' | 'bathroom'): string => {
    const num = Math.floor(count);
    const key = type === 'bedroom' ? 'ownerPortal.bedrooms' : 'ownerPortal.bathrooms';
    
    // Для русского языка используем склонения
    if (i18n.language === 'ru') {
      const lastDigit = num % 10;
      const lastTwoDigits = num % 100;
      
      if (type === 'bedroom') {
        if (lastTwoDigits >= 11 && lastTwoDigits <= 19) return 'спален';
        if (lastDigit === 1) return 'спальня';
        if (lastDigit >= 2 && lastDigit <= 4) return 'спальни';
        return 'спален';
      } else {
        if (lastTwoDigits >= 11 && lastTwoDigits <= 19) return 'ванных';
        if (lastDigit === 1) return 'ванная';
        if (lastDigit >= 2 && lastDigit <= 4) return 'ванные';
        return 'ванных';
      }
    }
    
    return t(key);
  };

  const handleShowCompleteness = (property: OwnerProperty) => {
    setSelectedProperty(property);
    setCompletenessModalVisible(true);
  };

  // ✅ ИДЕАЛЬНЫЙ рендер информации о занятости
  const renderOccupancyInfo = (property: OwnerProperty) => {
    if (!property.has_blocked_dates) {
      return (
        <div className="occupancy-status">
          <CheckCircleOutlined className="occupancy-icon success" />
          <span className="occupancy-text">{t('ownerPortal.noBlockedDates')}</span>
        </div>
      );
    }

    if (property.nearest_blocked_period) {
      const start = dayjs(property.nearest_blocked_period.start_date);
      const end = dayjs(property.nearest_blocked_period.end_date);
      const isToday = start.isSame(dayjs(), 'day');
      const daysUntil = start.diff(dayjs(), 'day');

      let statusText = '';
      if (isToday) {
        statusText = t('ownerPortal.occupiedToday');
      } else if (daysUntil > 0) {
        statusText = t('ownerPortal.nextOccupiedIn', { days: daysUntil });
      } else {
        statusText = t('ownerPortal.currentlyOccupied');
      }

      return (
        <div className="occupancy-status-container">
          <div className="occupancy-status">
            <CloseCircleOutlined className="occupancy-icon error" />
            <span className="occupancy-text">{statusText}</span>
          </div>
          <div className="occupancy-dates">
            {start.format('DD.MM')} - {end.format('DD.MM.YYYY')}
          </div>
        </div>
      );
    }

    return null;
  };

  // ✅ ИДЕАЛЬНЫЙ рендер фотографий
  const renderPropertyPhotos = (property: OwnerProperty) => {
    const photos = property.photos && property.photos.length > 0 
      ? property.photos 
      : property.cover_photo 
        ? [{ url: property.cover_photo }] 
        : [];

    if (photos.length === 0) {
      return (
        <div className="property-no-photo">
          <HomeOutlined />
        </div>
      );
    }

    if (photos.length === 1) {
      return (
        <div className="property-photo">
          <img src={photos[0].url} alt={property.property_name || property.property_number} />
        </div>
      );
    }

    return (
      <Carousel 
        autoplay 
        autoplaySpeed={3000} 
        className="property-carousel"
        dots={{ className: 'custom-dots' }}
        arrows
        prevArrow={<Button type="text" icon={<LeftOutlined />} className="carousel-arrow carousel-arrow-left" />}
        nextArrow={<Button type="text" icon={<RightOutlined />} className="carousel-arrow carousel-arrow-right" />}
      >
        {photos.map((photo, index) => (
          <div key={index} className="property-photo">
            <img src={photo.url} alt={`${property.property_name || property.property_number} ${index + 1}`} />
          </div>
        ))}
      </Carousel>
    );
  };

  // Desktop Header
  const renderDesktopHeader = () => (
    <Header className="dashboard-header">
      <div className="header-container">
        <div className="header-logo">
          <HomeOutlined className="logo-icon" />
          <div className="logo-text">
            <div className="logo-title">NOVA ESTATE</div>
          </div>
        </div>

        <div className="header-actions">
          <Select
            value={i18n.language}
            onChange={handleChangeLanguage}
            className="language-select"
            suffixIcon={<GlobalOutlined />}
            options={[
              { value: 'ru', label: 'Русский' },
              { value: 'en', label: 'English' },
              { value: 'zh', label: '中文' }
            ]}
          />

          <Button
            icon={<SettingOutlined />}
            onClick={() => setChangePasswordModalVisible(true)}
            className="header-button"
          >
            {t('ownerPortal.changePassword')}
          </Button>

          <Button
            danger
            icon={<LogoutOutlined />}
            onClick={handleLogout}
            className="header-button"
          >
            {t('ownerPortal.logout')}
          </Button>
        </div>
      </div>
    </Header>
  );

// Mobile Header
const renderMobileHeader = () => (
  <Header className="dashboard-header mobile">
    <div className="header-container">
      <HomeOutlined className="mobile-logo-icon" />

      <div className="mobile-actions">
        <Select
          value={i18n.language}
          onChange={handleChangeLanguage}
          size="small"
          className="mobile-language-select"
          suffixIcon={<GlobalOutlined />}
          options={[
            { value: 'ru', label: 'RU' },
            { value: 'en', label: 'EN' },
            { value: 'zh', label: 'ZH' }
          ]}
        />

        <Button
          type="text"
          size="small"
          icon={<SettingOutlined />}
          onClick={() => setChangePasswordModalVisible(true)}
          className="mobile-icon-button"
        />
      </div>
    </div>
  </Header>
);

  return (
    <Layout className="owner-dashboard">
      {isMobile ? renderMobileHeader() : renderDesktopHeader()}

      <Content className="dashboard-content">
        <div className="content-container">
          <Title level={2} className="page-title">
            {t('ownerPortal.myProperties')}
          </Title>

          {loading ? (
            <div className="loading-container">
              <Spin size="large" />
            </div>
          ) : properties.length === 0 ? (
            <Card className="empty-state">
              <HomeOutlined className="empty-icon" />
              <Title level={4}>{t('ownerPortal.noProperties')}</Title>
              <Text type="secondary">{t('ownerPortal.noPropertiesText')}</Text>
            </Card>
          ) : (
            <Row gutter={[16, 16]}>
              {properties.map((property) => (
                <Col xs={24} sm={12} lg={8} xl={6} key={property.id}>
                  <Card className="property-card" hoverable>
                    {/* Фотографии */}
                    <div className="property-media">
                      {renderPropertyPhotos(property)}
                    </div>

                    {/* Контент карточки */}
                    <div className="property-content">
                      {/* Заголовок и тип сделки */}
                      <div className="property-header">
                        <Title level={5} className="property-title" ellipsis={{ rows: 2 }}>
                          {property.property_name || property.property_number}
                        </Title>
                        <Tag color={getDealTypeColor(property.deal_type)} className="deal-type-tag">
                          {getDealTypeLabel(property.deal_type)}
                        </Tag>
                      </div>

                      {/* Номер объекта */}
                      <Tag className="property-number">{property.property_number}</Tag>

{/* Комнаты */}
{(hasValidRoomCount(property.bedrooms) || hasValidRoomCount(property.bathrooms)) && (
  <div className="property-rooms">
    {hasValidRoomCount(property.bedrooms) && (
      <span className="room-item">
        <UserOutlined className="room-icon" />
        <span className="room-text">
          {formatRoomCount(property.bedrooms)} {getRoomLabel(property.bedrooms || 0, 'bedroom')}
        </span>
      </span>
    )}
    {hasValidRoomCount(property.bedrooms) && hasValidRoomCount(property.bathrooms) && (
      <span className="room-separator">|</span>
    )}
    {hasValidRoomCount(property.bathrooms) && (
      <span className="room-text">
        {formatRoomCount(property.bathrooms)} {getRoomLabel(property.bathrooms || 0, 'bathroom')}
      </span>
    )}
  </div>
)}

                      {/* Заполненность */}
                      <div className="completeness-section">
                        <div className="completeness-header">
                          <span className="completeness-label">
                            {t('ownerPortal.completeness')}
                            <Button
                              type="link"
                              size="small"
                              icon={<InfoCircleOutlined />}
                              onClick={() => handleShowCompleteness(property)}
                              className="info-button"
                            />
                          </span>
                          <span className="completeness-value" style={{ color: getCompletenessColor(property.completeness) }}>
                            {property.completeness}%
                          </span>
                        </div>
                        <Progress
                          percent={property.completeness}
                          strokeColor={getCompletenessColor(property.completeness)}
                          showInfo={false}
                          size="small"
                          className="completeness-progress"
                        />
                      </div>

                      {/* Занятость */}
                      <div className="occupancy-section">
                        {renderOccupancyInfo(property)}
                      </div>

                      {/* Кнопки */}
                      <div className="property-actions">
                        <Button
                          type="primary"
                          icon={<DollarOutlined />}
                          onClick={() => handleManageProperty(property.id, 'pricing')}
                          block
                        >
                          {t('ownerPortal.managePricing')}
                        </Button>
                        <Button
                          icon={<CalendarOutlined />}
                          onClick={() => handleManageProperty(property.id, 'calendar')}
                          block
                        >
                          {t('ownerPortal.manageCalendar')}
                        </Button>
                      </div>
                    </div>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </div>
      </Content>

{/* Completeness Modal */}
<Modal
  title={t('ownerPortal.completenessDetails')}
  open={completenessModalVisible}
  onCancel={() => setCompletenessModalVisible(false)}
  width={isMobile ? '90%' : 600}
  footer={[
    <Button key="close" onClick={() => setCompletenessModalVisible(false)}>
      {t('common.close')}
    </Button>,
    selectedProperty && selectedProperty.completeness < 100 && (
      <Button
        key="fill"
        type="primary"
        icon={<DollarOutlined />}
        onClick={() => {
          setCompletenessModalVisible(false);
          handleManageProperty(selectedProperty.id, 'pricing');
        }}
      >
        {t('ownerPortal.fillData')}
      </Button>
    )
  ]}
  className="completeness-modal"
>
  {selectedProperty && (
    <div className="completeness-modal-content">
      <div className="modal-property-info">
        <Title level={5} ellipsis>
          {selectedProperty.property_name || selectedProperty.property_number}
        </Title>
        <Progress
          percent={selectedProperty.completeness}
          strokeColor={getCompletenessColor(selectedProperty.completeness)}
          status={selectedProperty.completeness === 100 ? 'success' : 'active'}
        />
      </div>

      {selectedProperty.completeness === 100 ? (
        <div className="all-filled-state">
          <CheckCircleOutlined />
          <Title level={4}>{t('ownerPortal.allFieldsFilled')}</Title>
          <Text type="secondary">{t('ownerPortal.allFieldsFilledDescription')}</Text>
        </div>
      ) : (
        <>
          {/* ✅ ЗАПОЛНЕННЫЕ ПОЛЯ (ЗЕЛЁНЫМ) */}
          {selectedProperty.completeness_details?.filled && selectedProperty.completeness_details.filled.length > 0 && (
            <>
              <Divider />
              <div className="filled-fields-header">
                <CheckCircleOutlined />
                <Text strong>Заполненные поля</Text>
              </div>
              <div className="filled-fields-list">
                {selectedProperty.completeness_details.filled.map((item: any, index: number) => (
                  <div key={index} className="filled-field-item">
                    <span className="field-name">{item.name}</span>
                    <span className="field-weight">{Math.round(item.weight)}%</span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ✅ НЕЗАПОЛНЕННЫЕ ПОЛЯ (ЖЁЛТЫМ) */}
          {selectedProperty.completeness_details?.missing && selectedProperty.completeness_details.missing.length > 0 && (
            <>
              <Divider />
              <div className="missing-fields-header">
                <WarningOutlined />
                <Text strong>Не заполненные поля</Text>
              </div>
              <div className="missing-fields-list">
                {selectedProperty.completeness_details.missing.map((item: any, index: number) => (
                  <div key={index} className="missing-field-item">
                    <span className="field-name">{item.name}</span>
                    <span className="field-weight">{Math.round(item.weight)}%</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )}
</Modal>

      {/* Password Change Modal */}
      <Modal
        title={t('ownerPortal.changePassword')}
        open={changePasswordModalVisible}
        onCancel={() => {
          setChangePasswordModalVisible(false);
          passwordForm.resetFields();
        }}
        footer={null}
      >
        <Form
          form={passwordForm}
          onFinish={handleChangePassword}
          layout="vertical"
        >
          <Form.Item
            name="current_password"
            label={t('ownerPortal.currentPassword')}
            rules={[{ required: true, message: t('ownerPortal.currentPasswordRequired') }]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item
            name="new_password"
            label={t('ownerPortal.newPassword')}
            rules={[
              { required: true, message: t('ownerPortal.newPasswordRequired') },
              { min: 6, message: t('ownerPortal.passwordMinLength') }
            ]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item
            name="confirm_password"
            label={t('ownerPortal.confirmPassword')}
            dependencies={['new_password']}
            rules={[
              { required: true, message: t('ownerPortal.confirmPasswordRequired') },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('new_password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error(t('ownerPortal.passwordsNotMatch')));
                }
              })
            ]}
          >
            <Input.Password />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => {
                setChangePasswordModalVisible(false);
                passwordForm.resetFields();
              }}>
                {t('common.cancel')}
              </Button>
              <Button type="primary" htmlType="submit" loading={changingPassword}>
                {t('common.save')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Layout>
  );
};

export default OwnerDashboard;