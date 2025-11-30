// frontend/src/modules/Properties/PropertyForm.tsx
import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Stack,
  Group,
  Grid,
  Text,
  Badge,
  Stepper,
  Progress,
  Paper,
  ActionIcon,
  Divider,
  Accordion,
  Affix,
  Transition,
  Box,
  Title,
  ThemeIcon,
  Button,
  Alert,
  Tabs,
  TextInput,
  NumberInput,
  Select,
  Textarea,
  Checkbox,
  Radio,
  Modal,
  Tooltip,
  useMantineTheme,
  Loader,
  Center
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useMediaQuery, useDisclosure, useScrollIntoView } from '@mantine/hooks';
import { useForm } from '@mantine/form';
import { modals } from '@mantine/modals';
import {
  IconDeviceFloppy,
  IconInfoCircle,
  IconMapPin,
  IconEye,
  IconRobot,
  IconUser,
  IconHome,
  IconLanguage,
  IconTags,
  IconCurrencyDollar,
  IconPhoto,
  IconCalendar,
  IconChevronRight,
  IconChevronLeft,
  IconCheck,
  IconX,
  IconAlertCircle,
  IconArrowLeft,
  IconBuildingEstate,
  IconPencil,
  IconClipboardText,
  IconSettings,
  IconChevronDown,
  IconChevronUp
} from '@tabler/icons-react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { propertiesApi } from '@/api/properties.api';
import { extractCoordinatesFromGoogleMapsLink } from '@/utils/googleMapsUtils';
import PhotosUploader from './components/PhotosUploader';
import FloorPlanUploader from './components/FloorPlanUploader';
import VRPanoramaUploader from './components/VRPanoramaUploader';
import SeasonalPricing from './components/SeasonalPricing';
import SalePriceForm from './components/SalePriceForm';
import YearPriceForm from './components/YearPriceForm';
import MonthlyPricing from './components/MonthlyPricing';
import { PROPERTY_FEATURES } from './constants/features';
import dayjs from 'dayjs';
import VideoUploader from './components/VideoUploader';
import CalendarManager from './components/CalendarManager';
import { useAuthStore } from '@/store/authStore'; 
import DepositForm from './components/DepositForm';
import UtilitiesForm from './components/UtilitiesForm';
import AIDescriptionGenerator from './components/AIDescriptionGenerator';
import TranslationsEditor from './components/TranslationsEditor';
import AIPropertyCreationModal from './components/AIPropertyCreationModal';
import OwnerAccessModal from './components/OwnerAccessModal';

interface PropertyFormProps {
  viewMode?: boolean;
}

const PropertyForm = ({ viewMode = false }: PropertyFormProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const theme = useMantineTheme();
  const [depositType, setDepositType] = useState<'one_month' | 'two_months' | 'custom'>('one_month');
  const [depositAmount, setDepositAmount] = useState<number>(0);

  const { canEditProperty, canViewPropertyOwner, canChangePropertyStatus } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [detectingCoords, setDetectingCoords] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [dealType, setDealType] = useState<'sale' | 'rent' | 'both'>('sale');
  const [showRenovationDate, setShowRenovationDate] = useState(false);
  const [propertyData, setPropertyData] = useState<any>(null);
  const [googleMapsLink, setGoogleMapsLink] = useState('');
  const [hasCoordinatesForCurrentLink, setHasCoordinatesForCurrentLink] = useState(true);
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [fillingFromAI, setFillingFromAI] = useState(false);
  const [ownerAccessModalVisible, setOwnerAccessModalVisible] = useState(false);
  const [aiTempData, setAiTempData] = useState<{
    monthlyPricing?: any[];
    blockedDates?: any[];
    photosFromGoogleDrive?: string | null;
  }>({});

  // Состояния для "Показать больше/Скрыть" в особенностях
  const [showAllPropertyFeatures, setShowAllPropertyFeatures] = useState(false);
  const [showAllOutdoorFeatures, setShowAllOutdoorFeatures] = useState(false);
  const [showAllRentalFeatures, setShowAllRentalFeatures] = useState(false);
  const [showAllLocationFeatures, setShowAllLocationFeatures] = useState(false);
  const [showAllViews, setShowAllViews] = useState(false);

  const isEdit = !!id;
  const isViewMode = viewMode;
  
  const [canEdit, setCanEdit] = useState(false);
  const [showOwnerTab, setShowOwnerTab] = useState(false);
  const [canEditStatus, setCanEditStatus] = useState(false);

  // Медиа запросы
  const isMobile = useMediaQuery('(max-width: 768px)');
  const isTablet = useMediaQuery('(max-width: 1024px)');

  // Scroll into view
  const { scrollIntoView, targetRef } = useScrollIntoView<HTMLDivElement>({
    offset: 60,
  });

  // Модальные окна
  const [complexInfoOpened, { open: openComplexInfo, close: closeComplexInfo }] = useDisclosure(false);

  // Форма Mantine
  const form = useForm({
    initialValues: {
      property_number: '',
      property_name: '',
      complex_name: '',
      deal_type: 'sale',
      property_type: '',
      region: '',
      address: '',
      google_maps_link: '',
      latitude: null as number | null,
      longitude: null as number | null,
      bedrooms: null as number | null,
      bathrooms: null as number | null,
      indoor_area: null as number | null,
      outdoor_area: null as number | null,
      plot_size: null as number | null,
      floors: null as number | null,
      floor: '',
      penthouse_floors: null as number | null,
      construction_year: null as number | null,
      construction_month: '',
      furniture_status: '',
      parking_spaces: null as number | null,
      pets_allowed: 'yes',
      pets_custom: '',
      building_ownership: '',
      land_ownership: '',
      ownership_type: '',
      sale_price: null as number | null,
      year_price: null as number | null,
      minimum_nights: null as number | null,
      ics_calendar_url: '',
      video_url: '',
      status: 'draft',
      owner_name: '',
      owner_phone: '',
      owner_email: '',
      owner_telegram: '',
      owner_instagram: '',
      owner_notes: '',
      sale_commission_type: '',
      sale_commission_value: null as number | null,
      rent_commission_type: '',
      rent_commission_value: null as number | null,
      renovation_type: '',
      renovation_date: null as Date | null,
      rental_includes: '',
      deposit_type: '',
      deposit_amount: null as number | null,
      electricity_rate: null as number | null,
      water_rate: null as number | null,
      distance_to_beach: null as number | null,
      features: {
        property: [] as string[],
        outdoor: [] as string[],
        rental: [] as string[],
        location: [] as string[],
        views: [] as string[]
      },
      translations: {
        ru: { description: '' },
        en: { description: '' },
        th: { description: '' },
        zh: { description: '' },
        he: { description: '' }
      },
      seasonalPricing: [] as any[]
    },
    validate: {
      property_number: (value) => (!value ? t('validation.required') : null),
      deal_type: (value) => (!value ? t('validation.required') : null),
      property_type: (value) => (!value ? t('validation.required') : null),
      region: (value) => (!value ? t('validation.required') : null),
      address: (value) => (!value ? t('validation.required') : null),
      property_name: (value) => (!value ? t('validation.required') : null),
    },
  });

  // Шаги формы - НОВЫЙ ПОРЯДОК
  const steps = useMemo(() => {
    const baseSteps = [
      { 
        value: 0, 
        key: 'basic',
        label: t('properties.tabs.basic'), 
        icon: IconHome,
      },
      {
        value: 1,
        key: 'media',
        label: t('properties.tabs.media'),
        icon: IconPhoto,
      },
      {
        value: 2,
        key: 'features',
        label: t('properties.tabs.features'),
        icon: IconTags,
      },
      {
        value: 3,
        key: 'pricing',
        label: t('properties.tabs.pricing'),
        icon: IconCurrencyDollar,
      },
      {
        value: 4,
        key: 'calendar',
        label: t('properties.tabs.calendar'),
        icon: IconCalendar
      }
    ];

    if (showOwnerTab) {
      baseSteps.push({
        value: 5,
        key: 'owner',
        label: t('properties.tabs.owner'),
        icon: IconUser,
      });
    }

    baseSteps.push({
      value: showOwnerTab ? 6 : 5,
      key: 'translations',
      label: t('properties.tabs.translations'),
      icon: IconLanguage,
    });

    return baseSteps;
  }, [showOwnerTab, t]);

  // Вычисление прогресса
  const calculateProgress = () => {
    const values = form.values;
    let filled = 0;
    let total = 0;

    // Базовые обязательные поля
    const requiredFields = ['property_number', 'deal_type', 'property_type', 'region', 'address', 'property_name'];
    requiredFields.forEach(field => {
      total++;
      if (values[field as keyof typeof values]) filled++;
    });

    // Координаты
    total += 2;
    if (values.latitude) filled++;
    if (values.longitude) filled++;

    // Спальни и ванные
    total += 2;
    if (values.bedrooms) filled++;
    if (values.bathrooms) filled++;

    // Площади
    total += 3;
    if (values.indoor_area) filled++;
    if (values.outdoor_area) filled++;
    if (values.plot_size) filled++;

    // Переводы (хотя бы один)
    total++;
    if (values.translations.ru?.description || 
        values.translations.en?.description ||
        values.translations.th?.description ||
        values.translations.zh?.description ||
        values.translations.he?.description) {
      filled++;
    }

    // Фичи
    total++;
    if (values.features.property.length > 0 ||
        values.features.outdoor.length > 0 ||
        values.features.rental.length > 0 ||
        values.features.location.length > 0 ||
        values.features.views.length > 0) {
      filled++;
    }

    // Цены
    if (dealType === 'sale' || dealType === 'both') {
      total++;
      if (values.sale_price) filled++;
    }
    if (dealType === 'rent' || dealType === 'both') {
      total++;
      if (values.year_price || values.seasonalPricing.length > 0) filled++;
    }

    return Math.round((filled / total) * 100);
  };

  const progress = calculateProgress();

  useEffect(() => {
    if (isEdit) {
      loadProperty();
    }
  }, [id]);

  useEffect(() => {
    if (form.values.google_maps_link && (!form.values.latitude || !form.values.longitude)) {
      setHasCoordinatesForCurrentLink(false);
    } else {
      setHasCoordinatesForCurrentLink(true);
    }
  }, [form.values.google_maps_link, form.values.latitude, form.values.longitude]);

  useEffect(() => {
    if (propertyData) {
      const userCanEdit = canEditProperty(propertyData.created_by);
      const showOwner = canViewPropertyOwner(propertyData.created_by);
      const canEditStatusFlag = canChangePropertyStatus();
      
      setCanEdit(userCanEdit);
      setShowOwnerTab(showOwner);
      setCanEditStatus(canEditStatusFlag);
      
      if (isEdit && !isViewMode && !userCanEdit) {
        notifications.show({
          title: t('properties.messages.noEditPermission'),
          message: t('properties.messages.noEditPermissionDescription') || 'У вас нет прав на редактирование',
          color: 'orange',
          icon: <IconAlertCircle size={18} />
        });
        navigate(`/properties/view/${id}`);
      }
    } else if (!isEdit) {
      setCanEdit(true);
      setShowOwnerTab(true);
      setCanEditStatus(canChangePropertyStatus());
    }
  }, [propertyData, isEdit, isViewMode, canEditProperty, canViewPropertyOwner, canChangePropertyStatus, id, navigate, t]);

  const loadProperty = async () => {
    setLoading(true);
    try {
      const { data } = await propertiesApi.getById(Number(id));
      const property = data.data;
      
      setPropertyData(property);
      setDealType(property.deal_type);
      setGoogleMapsLink(property.google_maps_link || '');
      
      console.log('Loading monthly pricing from DB:', property.monthly_pricing);
      setAiTempData({
        monthlyPricing: property.monthly_pricing || [],
        blockedDates: [],
        photosFromGoogleDrive: null
      });
      
      // Парсим features
      let parsedFeatures = {
        property: [] as string[],
        outdoor: [] as string[],
        rental: [] as string[],
        location: [] as string[],
        views: [] as string[]
      };
      
      if (property.features) {
        try {
          if (Array.isArray(property.features)) {
            const featuresMap: any = {
              property: [],
              outdoor: [],
              rental: [],
              location: [],
              views: []
            };
            
            property.features.forEach((f: any) => {
              if (f.feature_type && f.feature_value) {
                let mappedType = f.feature_type;
                if (f.feature_type === 'view') {
                  mappedType = 'views';
                }
                
                if (!featuresMap[mappedType]) {
                  featuresMap[mappedType] = [];
                }
                featuresMap[mappedType].push(f.feature_value);
              }
            });
            
            parsedFeatures = featuresMap;
          } else if (typeof property.features === 'object') {
            parsedFeatures = property.features;
          }
        } catch (e) {
          console.error('Error parsing features:', e);
        }
      }

      // Парсим translations
      const translations: any = {
        ru: { description: '' },
        en: { description: '' },
        th: { description: '' },
        zh: { description: '' },
        he: { description: '' }
      };

      if (property.translations) {
        if (Array.isArray(property.translations)) {
          property.translations.forEach((t: any) => {
            if (translations[t.language_code]) {
              translations[t.language_code] = {
                description: t.description || ''
              };
            }
          });
        } else if (typeof property.translations === 'object') {
          Object.keys(property.translations).forEach((lang) => {
            if (translations[lang]) {
              translations[lang] = {
                description: property.translations[lang].description || ''
              };
            }
          });
        }
      }

      // Устанавливаем все значения в форму
      form.setValues({
        property_number: property.property_number || '',
        property_name: property.property_name || '',
        complex_name: property.complex_name || '',
        deal_type: property.deal_type,
        property_type: property.property_type || '',
        region: property.region || '',
        address: property.address || '',
        google_maps_link: property.google_maps_link || '',
        latitude: property.latitude,
        longitude: property.longitude,
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        indoor_area: property.indoor_area,
        outdoor_area: property.outdoor_area,
        plot_size: property.plot_size,
        floors: property.floors,
        floor: property.floor || '',
        penthouse_floors: property.penthouse_floors,
        construction_year: property.construction_year,
        construction_month: property.construction_month || '',
        furniture_status: property.furniture_status || '',
        parking_spaces: property.parking_spaces,
        pets_allowed: property.pets_allowed || 'yes',
        pets_custom: property.pets_custom || '',
        building_ownership: property.building_ownership || '',
        land_ownership: property.land_ownership || '',
        ownership_type: property.ownership_type || '',
        sale_price: property.sale_price,
        year_price: property.year_price,
        minimum_nights: property.minimum_nights,
        ics_calendar_url: property.ics_calendar_url || '',
        video_url: property.video_url || '',
        status: property.status,
        owner_name: property.owner_name || '',
        owner_phone: property.owner_phone || '',
        owner_email: property.owner_email || '',
        owner_telegram: property.owner_telegram || '',
        owner_instagram: property.owner_instagram || '',
        owner_notes: property.owner_notes || '',
        renovation_type: property.renovation_type || '',
        renovation_date: property.renovation_date ? new Date(property.renovation_date) : null,
        rental_includes: property.rental_includes || '',
        deposit_type: property.deposit_type || '',
        deposit_amount: property.deposit_amount,
        electricity_rate: property.electricity_rate,
        water_rate: property.water_rate,
        distance_to_beach: property.distance_to_beach,
        features: parsedFeatures,
        translations: translations,
        seasonalPricing: property.pricing || []
      });

      if (property.renovation_type) {
        setShowRenovationDate(true);
      }
    } catch (error: any) {
      notifications.show({
        title: t('errors.generic'),
        message: error.response?.data?.message || t('errors.generic'),
        color: 'red',
        icon: <IconX size={18} />
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAIGenerated = (descriptions: any, featuresFound: string[]) => {
    form.setFieldValue('translations', {
      ru: {
        description: descriptions.ru?.description || form.values.translations.ru?.description || ''
      },
      en: {
        description: descriptions.en?.description || form.values.translations.en?.description || ''
      },
      th: {
        description: descriptions.th?.description || form.values.translations.th?.description || ''
      },
      zh: {
        description: descriptions.zh?.description || form.values.translations.zh?.description || ''
      },
      he: {
        description: descriptions.he?.description || form.values.translations.he?.description || ''
      }
    });
  
    if (featuresFound && featuresFound.length > 0) {
      const currentFeatures = form.values.features;
      const updatedFeatures = { ...currentFeatures };
      
      featuresFound.forEach((feature: string) => {
        if (PROPERTY_FEATURES.property.includes(feature)) {
          if (!updatedFeatures.property.includes(feature)) {
            updatedFeatures.property.push(feature);
          }
        } else if (PROPERTY_FEATURES.outdoor.includes(feature)) {
          if (!updatedFeatures.outdoor.includes(feature)) {
            updatedFeatures.outdoor.push(feature);
          }
        } else if (PROPERTY_FEATURES.rental.includes(feature)) {
          if (!updatedFeatures.rental.includes(feature)) {
            updatedFeatures.rental.push(feature);
          }
        } else if (PROPERTY_FEATURES.location.includes(feature)) {
          if (!updatedFeatures.location.includes(feature)) {
            updatedFeatures.location.push(feature);
          }
        } else if (PROPERTY_FEATURES.views.includes(feature)) {
          if (!updatedFeatures.views.includes(feature)) {
            updatedFeatures.views.push(feature);
          }
        }
      });
    
      form.setFieldValue('features', updatedFeatures);
      
      notifications.show({
        title: t('common.success'),
        message: t('properties.messages.aiFeaturesFound', { count: featuresFound.length }),
        color: 'green',
        icon: <IconCheck size={18} />
      });
    }
  
    notifications.show({
      title: t('common.success'),
      message: t('properties.messages.aiDescriptionsGenerated'),
      color: 'green',
      icon: <IconCheck size={18} />
    });
  };

  const handleAutoDetectCoordinates = async () => {
    const link = form.values.google_maps_link;

    if (!link) {
      notifications.show({
        title: t('properties.messages.coordinatesWarning'),
        message: t('properties.messages.coordinatesWarningDescription') || 'Введите ссылку на Google Maps',
        color: 'orange',
        icon: <IconAlertCircle size={18} />
      });
      return;
    }

    setDetectingCoords(true);
    try {
      const coords = await extractCoordinatesFromGoogleMapsLink(link);

      form.setFieldValue('latitude', coords.lat);
      form.setFieldValue('longitude', coords.lng);

      setHasCoordinatesForCurrentLink(true);
      notifications.show({
        title: t('common.success'),
        message: t('properties.messages.coordinatesDetected'),
        color: 'green',
        icon: <IconCheck size={18} />
      });

      try {
        const { data } = await propertiesApi.calculateBeachDistance(coords.lat, coords.lng);

        form.setFieldValue('distance_to_beach', data.data.distance);

        notifications.show({
          title: t('common.success'),
          message: t('properties.messages.beachDistanceCalculated', { 
            distance: data.data.distanceFormatted,
            beach: data.data.nearestBeach
          }),
          color: 'green',
          icon: <IconCheck size={18} />
        });
      } catch (error) {
        console.error('Failed to calculate beach distance:', error);
      }
    } catch (error: any) {
      notifications.show({
        title: t('errors.generic'),
        message: t('properties.messages.coordinatesError'),
        color: 'red',
        icon: <IconX size={18} />
      });
      console.error(error);
    } finally {
      setDetectingCoords(false);
    }
  };

  const handleGoogleMapsLinkChange = (value: string) => {
    form.setFieldValue('google_maps_link', value);
    setGoogleMapsLink(value);
    
    if (value !== propertyData?.google_maps_link) {
      setHasCoordinatesForCurrentLink(false);
    }
  };

  const showComplexInfo = () => {
    openComplexInfo();
  };

  const handleSubmit = async (values: typeof form.values) => {
    if (!values.property_name) {
      notifications.show({
        title: t('errors.generic'),
        message: t('properties.messages.propertyNameRequired'),
        color: 'red',
        icon: <IconX size={18} />
      });
      setActiveStep(0);
      return;
    }

    if (values.status !== 'draft') {
      const hasAnyDescription = values.translations?.ru?.description || 
                                values.translations?.en?.description || 
                                values.translations?.th?.description ||
                                values.translations?.zh?.description ||
                                values.translations?.he?.description;

      if (!hasAnyDescription) {
        notifications.show({
          title: t('errors.generic'),
          message: t('properties.messages.descriptionRequired'),
          color: 'red',
          icon: <IconX size={18} />
        });
        // Переходим на вкладку translations (последняя)
        setActiveStep(steps.length - 1);
        return;
      }
    }

    setLoading(true);
    try {
      const formData = {
        ...values,
        renovation_date: values.renovation_date 
          ? dayjs(values.renovation_date).format('YYYY-MM-01')
          : null,
        propertyFeatures: values.features?.property || [],
        outdoorFeatures: values.features?.outdoor || [],
        rentalFeatures: values.features?.rental || [],
        locationFeatures: values.features?.location || [],
        views: values.features?.views || [],
        translations: values.translations,
        seasonalPricing: values.seasonalPricing || [],
        year_price: values.year_price || null,
        monthlyPricing: aiTempData.monthlyPricing || [],
        blockedDates: aiTempData.blockedDates || [],
        photosFromGoogleDrive: aiTempData.photosFromGoogleDrive || null
      };
    
      if (isEdit) {
        await propertiesApi.update(Number(id), formData);
        notifications.show({
          title: t('common.success'),
          message: t('properties.updateSuccess'),
          color: 'green',
          icon: <IconCheck size={18} />
        });
        loadProperty();
      } else {
        const { data } = await propertiesApi.create(formData);
        notifications.show({
          title: t('common.success'),
          message: t('properties.createSuccess'),
          color: 'green',
          icon: <IconCheck size={18} />
        });
        
        if (aiTempData.monthlyPricing && aiTempData.monthlyPricing.length > 0) {
          notifications.show({
            title: t('common.success'),
            message: t('properties.messages.savedMonthlyPrices', { count: aiTempData.monthlyPricing.length }),
            color: 'green'
          });
        }
        
        if (aiTempData.blockedDates && aiTempData.blockedDates.length > 0) {
          notifications.show({
            title: t('common.success'),
            message: t('properties.messages.savedBlockedDates', { count: aiTempData.blockedDates.length }),
            color: 'green'
          });
        }
        
        if (aiTempData.photosFromGoogleDrive) {
          notifications.show({
            title: t('common.info'),
            message: t('properties.messages.googleDrivePhotosLoading'),
            color: 'blue'
          });
        }
        
        setAiTempData({});
        
        navigate(`/properties/edit/${data.data.propertyId}`);
      }
    } catch (error: any) {
      console.error('Submit error:', error);
      notifications.show({
        title: t('errors.generic'),
        message: error.response?.data?.message || t('errors.generic'),
        color: 'red',
        icon: <IconX size={18} />
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDealTypeChange = (value: string) => {
    setDealType(value as 'sale' | 'rent' | 'both');
    form.setFieldValue('deal_type', value);
  };

  const handleRenovationChange = (value: string | null) => {
    if (value) {
      setShowRenovationDate(true);
    } else {
      setShowRenovationDate(false);
      form.setFieldValue('renovation_date', null);
    }
  };

  const handleAISuccess = async (propertyData: any) => {
    setFillingFromAI(true);
    setAiModalVisible(false);

    try {
      notifications.show({
        id: 'ai-fill',
        title: t('properties.messages.aiFillingForm'),
        message: t('properties.messages.pleaseWait') || 'Подождите...',
        loading: true,
        autoClose: false,
        withCloseButton: false
      });

      const tempData: any = {
        monthlyPricing: propertyData.monthlyPricing || [],
        blockedDates: propertyData.blockedDates || [],
        photosFromGoogleDrive: propertyData.photosFromGoogleDrive || null
      };
      
      setAiTempData(tempData);

      const features = {
        property: propertyData.propertyFeatures || [],
        outdoor: propertyData.outdoorFeatures || [],
        rental: propertyData.rentalFeatures || [],
        location: propertyData.locationFeatures || [],
        views: propertyData.views || []
      };

      form.setValues({
        property_number: propertyData.property_number || '',
        property_name: propertyData.property_name || '',
        complex_name: propertyData.complex_name || '',
        deal_type: propertyData.deal_type || 'sale',
        property_type: propertyData.property_type || '',
        region: propertyData.region || '',
        address: propertyData.address || '',
        google_maps_link: propertyData.google_maps_link || '',
        latitude: propertyData.latitude || null,
        longitude: propertyData.longitude || null,
        bedrooms: propertyData.bedrooms || null,
        bathrooms: propertyData.bathrooms || null,
        indoor_area: propertyData.indoor_area || null,
        outdoor_area: propertyData.outdoor_area || null,
        plot_size: propertyData.plot_size || null,
        floors: propertyData.floors || null,
        floor: propertyData.floor || '',
        construction_year: propertyData.construction_year || null,
        construction_month: propertyData.construction_month || '',
        furniture_status: propertyData.furniture_status || '',
        parking_spaces: propertyData.parking_spaces || null,
        pets_allowed: propertyData.pets_allowed || 'yes',
        building_ownership: propertyData.building_ownership || '',
        land_ownership: propertyData.land_ownership || '',
        ownership_type: propertyData.ownership_type || '',
        sale_price: propertyData.sale_price || null,
        year_price: propertyData.year_price || null,
        status: 'draft',
        video_url: propertyData.video_url || '',
        renovation_type: propertyData.renovation_type || '',
        renovation_date: propertyData.renovation_date ? new Date(propertyData.renovation_date) : null,
        sale_commission_type: propertyData.sale_commission_type || '',
        sale_commission_value: propertyData.sale_commission_value || null,
        rent_commission_type: propertyData.rent_commission_type || '',
        rent_commission_value: propertyData.rent_commission_value || null,
        owner_name: propertyData.owner_name || '',
        owner_phone: propertyData.owner_phone || '',
        owner_email: propertyData.owner_email || '',
        owner_telegram: propertyData.owner_telegram || '',
        owner_instagram: propertyData.owner_instagram || '',
        owner_notes: propertyData.owner_notes || '',
        deposit_type: propertyData.deposit_type || '',
        deposit_amount: propertyData.deposit_amount || null,
        electricity_rate: propertyData.electricity_rate || null,
        water_rate: propertyData.water_rate || null,
        rental_includes: propertyData.rental_includes || '',
        features: features,
        seasonalPricing: propertyData.seasonalPricing || [],
        translations: form.values.translations,
        minimum_nights: null,
        ics_calendar_url: '',
        pets_custom: '',
        penthouse_floors: null,
        distance_to_beach: null
      });

      if (tempData.monthlyPricing.length > 0) {
        notifications.show({
          title: t('common.info'),
          message: t('properties.messages.aiMonthlyPrices', { count: tempData.monthlyPricing.length }),
          color: 'blue'
        });
      }
      
      if (tempData.blockedDates.length > 0) {
        notifications.show({
          title: t('common.info'),
          message: t('properties.messages.aiBlockedDates', { count: tempData.blockedDates.length }),
          color: 'blue'
        });
      }
      
      if (tempData.photosFromGoogleDrive) {
        notifications.show({
          title: t('common.info'),
          message: t('properties.messages.aiGoogleDrivePhotos'),
          color: 'blue'
        });
      }

      if (propertyData.deal_type) {
        setDealType(propertyData.deal_type);
      }

      if (propertyData.google_maps_link) {
        setGoogleMapsLink(propertyData.google_maps_link);
      }

      notifications.update({
        id: 'ai-fill',
        title: t('common.success'),
        message: t('properties.messages.aiFormFilled'),
        color: 'green',
        icon: <IconCheck size={18} />,
        loading: false,
        autoClose: 3000
      });

      if (propertyData.google_maps_link && !propertyData.latitude && !propertyData.longitude) {
        notifications.show({
          title: t('common.info'),
          message: t('properties.messages.aiCoordinatesDetecting'),
          color: 'blue'
        });
        setHasCoordinatesForCurrentLink(false);
        
        setTimeout(() => {
          handleAutoDetectCoordinates();
        }, 500);
      }

      modals.openConfirmModal({
        title: t('properties.ai.modalTitle'),
        children: (
          <Stack gap="sm">
            <Text>{t('properties.ai.modalDescription')}</Text>
            <Text fw={600}>{t('properties.ai.modalWarning')}</Text>
            <Text>{t('properties.ai.modalCheckTitle')}</Text>
            <Stack gap="xs" pl="md">
              <Text size="sm">• {t('properties.ai.modalCheckPrices', { 
                info: tempData.monthlyPricing.length > 0 
                  ? t('properties.ai.modalPricesSet', { count: tempData.monthlyPricing.length })
                  : t('properties.ai.modalPricesNotSet')
              })}</Text>
              <Text size="sm">• {t('properties.ai.modalCheckCoordinates')}</Text>
              <Text size="sm">• {t('properties.ai.modalCheckFeatures')}</Text>
              <Text size="sm">• {t('properties.ai.modalCheckOwner')}</Text>
              {tempData.blockedDates.length > 0 && (
                <Text size="sm">• {t('properties.ai.modalCheckCalendar', { count: tempData.blockedDates.length })}</Text>
              )}
              {tempData.photosFromGoogleDrive && (
                <Text size="sm">• {t('properties.ai.modalCheckPhotos')}</Text>
              )}
            </Stack>
          </Stack>
        ),
        labels: { confirm: t('properties.ai.modalOkButton') || 'OK', cancel: '' },
        confirmProps: { color: 'blue' },
        withCloseButton: false,
        onConfirm: () => {}
      });

      setActiveStep(0);

    } catch (error) {
      console.error('AI fill error:', error);
      notifications.show({
        title: t('errors.generic'),
        message: t('properties.messages.aiFillError'),
        color: 'red',
        icon: <IconX size={18} />
      });
    } finally {
      setFillingFromAI(false);
    }
  };

  const handleSaveClick = async () => {
    const validation = form.validate();
    
    if (validation.hasErrors) {
      notifications.show({
        title: t('errors.generic'),
        message: t('properties.messages.fillRequiredFields'),
        color: 'red',
        icon: <IconX size={18} />
      });
      setActiveStep(0);
      return;
    }

    await handleSubmit(form.values);
  };

  const nextStep = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep(activeStep + 1);
      scrollIntoView();
    }
  };

  const prevStep = () => {
    if (activeStep > 0) {
      setActiveStep(activeStep - 1);
      scrollIntoView();
    }
  };

  // Компонент прогресс-бара
  const ProgressIndicator = () => (
    <Paper shadow="sm" p="md" radius="md" withBorder mb="lg">
      <Group justify="space-between" mb="xs">
        <Text size="sm" fw={500}>{t('properties.form.completionProgress') || 'Прогресс заполнения'}</Text>
        <Text size="sm" c="dimmed">{progress}%</Text>
      </Group>
      <Progress value={progress} size="lg" radius="md" />
    </Paper>
  );

  // Рендер особенностей с показом первых 10
  const renderFeaturesGroup = (
    features: string[],
    selectedFeatures: string[],
    onChange: (value: string[]) => void,
    showAll: boolean,
    setShowAll: (value: boolean) => void,
    title: string,
    color: string
  ) => {
    const displayFeatures = showAll ? features : features.slice(0, 10);
    const hasMore = features.length > 10;

    return (
      <Card shadow="sm" padding="md" radius="md" withBorder>
        <Stack gap="md">
          <Group>
            <ThemeIcon size="lg" radius="md" variant="light" color={color}>
              <IconTags size={20} />
            </ThemeIcon>
            <Text fw={500}>{title}</Text>
          </Group>
          <Checkbox.Group
            value={selectedFeatures}
            onChange={onChange}
          >
            <Grid gutter="xs">
              {displayFeatures.map(feature => (
                <Grid.Col key={feature} span={{ base: 12, xs: 6, sm: 4 }}>
                  <Checkbox
                    value={feature}
                    label={t(`properties.features.${feature}`)}
                    disabled={isViewMode}
                    styles={{
                      root: { fontSize: '16px' } // Предотвращаем зум на iOS
                    }}
                  />
                </Grid.Col>
              ))}
            </Grid>
          </Checkbox.Group>
          {hasMore && (
            <Button
              variant="subtle"
              size="sm"
              onClick={() => setShowAll(!showAll)}
              rightSection={showAll ? <IconChevronUp size={16} /> : <IconChevronDown size={16} />}
              fullWidth
            >
              {showAll ? t('common.showLess') : t('common.showMore')}
            </Button>
          )}
        </Stack>
      </Card>
    );
  };

  // Рендер контента для каждого шага
  const renderStepContent = () => {
    // Базовая информация
    if (steps[activeStep].key === 'basic') {
      return (
        <Stack gap="md">
          <Accordion defaultValue={['main', 'location', 'details']} multiple variant="separated">
            {/* Основная информация */}
            <Accordion.Item value="main">
              <Accordion.Control icon={<IconBuildingEstate size={20} />}>
                <Text fw={500}>{t('properties.form.mainInfo') || 'Основная информация'}</Text>
              </Accordion.Control>
              <Accordion.Panel>
                <Grid gutter="md">
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <TextInput
                      label={t('properties.propertyNumber')}
                      placeholder="L6, V123, etc."
                      required
                      disabled={isViewMode}
                      {...form.getInputProps('property_number')}
                      styles={{
                        input: { fontSize: '16px' } // Предотвращаем зум на iOS
                      }}
                    />
                  </Grid.Col>

                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Select
                      label={t('properties.dealType')}
                      placeholder={t('common.select')}
                      required
                      disabled={isViewMode}
                      data={[
                        { value: 'sale', label: t('properties.dealTypes.sale') },
                        { value: 'rent', label: t('properties.dealTypes.rent') },
                        { value: 'both', label: t('properties.dealTypes.both') }
                      ]}
                      value={form.values.deal_type}
                      onChange={(value) => handleDealTypeChange(value!)}
                      styles={{
                        input: { fontSize: '16px' } // Предотвращаем зум на iOS
                      }}
                    />
                  </Grid.Col>

                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Select
                      label={t('properties.propertyType')}
                      placeholder={t('common.select')}
                      required
                      disabled={isViewMode}
                      data={[
                        { value: 'villa', label: t('properties.propertyTypes.villa') },
                        { value: 'apartment', label: t('properties.propertyTypes.apartment') },
                        { value: 'condo', label: t('properties.propertyTypes.condo') },
                        { value: 'penthouse', label: t('properties.propertyTypes.penthouse') },
                        { value: 'house', label: t('properties.propertyTypes.house') },
                        { value: 'land', label: t('properties.propertyTypes.land') }
                      ]}
                      {...form.getInputProps('property_type')}
                      styles={{
                        input: { fontSize: '16px' }
                      }}
                    />
                  </Grid.Col>

                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Select
                      label={t('properties.region')}
                      placeholder={t('common.select')}
                      required
                      searchable
                      disabled={isViewMode}
                      data={[
                        { value: 'bangtao', label: t('properties.regions.bangtao') },
                        { value: 'kamala', label: t('properties.regions.kamala') },
                        { value: 'surin', label: t('properties.regions.surin') },
                        { value: 'layan', label: t('properties.regions.layan') },
                        { value: 'rawai', label: t('properties.regions.rawai') },
                        { value: 'patong', label: t('properties.regions.patong') },
                        { value: 'kata', label: t('properties.regions.kata') },
                        { value: 'chalong', label: t('properties.regions.chalong') },
                        { value: 'naiharn', label: t('properties.regions.naiharn') },
                        { value: 'phukettown', label: t('properties.regions.phukettown') },
                        { value: 'maikhao', label: t('properties.regions.maikhao') },
                        { value: 'yamu', label: t('properties.regions.yamu') },
                        { value: 'paklok', label: t('properties.regions.paklok') }
                      ]}
                      {...form.getInputProps('region')}
                      styles={{
                        input: { fontSize: '16px' }
                      }}
                    />
                  </Grid.Col>

                  {(dealType === 'sale' || dealType === 'both') && (
                    <>
                      <Grid.Col span={{ base: 12, sm: 6 }}>
                        <Select
                          label={t('properties.buildingOwnership')}
                          placeholder={t('common.select')}
                          disabled={isViewMode}
                          data={[
                            { value: 'freehold', label: t('properties.ownershipTypes.freehold') },
                            { value: 'leasehold', label: t('properties.ownershipTypes.leasehold') },
                            { value: 'company', label: t('properties.ownershipTypes.company') }
                          ]}
                          {...form.getInputProps('building_ownership')}
                          styles={{
                            input: { fontSize: '16px' }
                          }}
                        />
                      </Grid.Col>

                      <Grid.Col span={{ base: 12, sm: 6 }}>
                        <Select
                          label={t('properties.landOwnership')}
                          placeholder={t('common.select')}
                          disabled={isViewMode}
                          data={[
                            { value: 'freehold', label: t('properties.ownershipTypes.freehold') },
                            { value: 'leasehold', label: t('properties.ownershipTypes.leasehold') },
                            { value: 'company', label: t('properties.ownershipTypes.company') }
                          ]}
                          {...form.getInputProps('land_ownership')}
                          styles={{
                            input: { fontSize: '16px' }
                          }}
                        />
                      </Grid.Col>

                      <Grid.Col span={{ base: 12, sm: 6 }}>
                        <Select
                          label={t('properties.ownership')}
                          placeholder={t('common.select')}
                          disabled={isViewMode}
                          data={[
                            { value: 'freehold', label: t('properties.ownershipTypes.freehold') },
                            { value: 'leasehold', label: t('properties.ownershipTypes.leasehold') },
                            { value: 'company', label: t('properties.ownershipTypes.company') }
                          ]}
                          {...form.getInputProps('ownership_type')}
                          styles={{
                            input: { fontSize: '16px' }
                          }}
                        />
                      </Grid.Col>
                    </>
                  )}

                  <Grid.Col span={12}>
                    <TextInput
                      label={t('properties.form.propertyNameLabel')}
                      placeholder={t('properties.form.propertyNamePlaceholder')}
                      description={t('properties.form.propertyNameExtra')}
                      maxLength={100}
                      disabled={isViewMode}
                      {...form.getInputProps('property_name')}
                      styles={{
                        input: { fontSize: '16px' }
                      }}
                    />
                  </Grid.Col>

                  <Grid.Col span={12}>
                    <TextInput
                      label={
                        <Group gap="xs">
                          <Text>{t('properties.complexName')}</Text>
                          <Tooltip label={t('properties.complexInfo')}>
                            <ActionIcon
                              variant="subtle"
                              size="sm"
                              onClick={showComplexInfo}
                            >
                              <IconInfoCircle size={16} />
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      }
                      placeholder={t('properties.complexNamePlaceholder')}
                      disabled={isViewMode}
                      {...form.getInputProps('complex_name')}
                      styles={{
                        input: { fontSize: '16px' }
                      }}
                    />
                  </Grid.Col>
                </Grid>
              </Accordion.Panel>
            </Accordion.Item>

            {/* Локация */}
            <Accordion.Item value="location">
              <Accordion.Control icon={<IconMapPin size={20} />}>
                <Text fw={500}>{t('properties.form.locationInfo') || 'Местоположение'}</Text>
              </Accordion.Control>
              <Accordion.Panel>
                <Stack gap="md">
                  <Textarea
                    label={t('properties.address')}
                    placeholder={t('properties.form.addressPlaceholder')}
                    required
                    minRows={2}
                    disabled={isViewMode}
                    {...form.getInputProps('address')}
                    styles={{
                      input: { fontSize: '16px' }
                    }}
                  />

                  <TextInput
                    label={
                      <Group gap="xs" justify="space-between" style={{ width: '100%' }}>
                        <Group gap="xs">
                          <Text>{t('properties.googleMapsLink')}</Text>
                          {!isViewMode && googleMapsLink && !hasCoordinatesForCurrentLink && (
                            <Badge color="orange" size="sm">
                              {t('properties.form.googleMapsWarning')}
                            </Badge>
                          )}
                        </Group>
                        {!isViewMode && (
                          <Button
                            variant={!hasCoordinatesForCurrentLink && googleMapsLink ? "filled" : "light"}
                            size="xs"
                            leftSection={<IconMapPin size={14} />}
                            onClick={handleAutoDetectCoordinates}
                            loading={detectingCoords}
                            color={!hasCoordinatesForCurrentLink && googleMapsLink ? "red" : "blue"}
                          >
                            {t('properties.autoDetectCoordinates')}
                          </Button>
                        )}
                      </Group>
                    }
                    placeholder={t('properties.form.googleMapsPlaceholder')}
                    value={form.values.google_maps_link}
                    onChange={(e) => handleGoogleMapsLinkChange(e.currentTarget.value)}
                    disabled={isViewMode}
                    styles={{
                      input: { fontSize: '16px' }
                    }}
                  />

                  <Grid gutter="md">
                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <NumberInput
                        label={t('properties.latitude')}
                        placeholder="7.123456"
                        decimalScale={6}
                        disabled={isViewMode}
                        {...form.getInputProps('latitude')}
                        styles={{
                          input: { fontSize: '16px' }
                        }}
                      />
                    </Grid.Col>

                    <Grid.Col span={{ base: 12, sm: 6 }}>
                      <NumberInput
                        label={t('properties.longitude')}
                        placeholder="98.123456"
                        decimalScale={6}
                        disabled={isViewMode}
                        {...form.getInputProps('longitude')}
                        styles={{
                          input: { fontSize: '16px' }
                        }}
                      />
                    </Grid.Col>
                  </Grid>
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>

            {/* Детали объекта */}
            <Accordion.Item value="details">
              <Accordion.Control icon={<IconClipboardText size={20} />}>
                <Text fw={500}>{t('properties.form.propertyDetails') || 'Детали объекта'}</Text>
              </Accordion.Control>
              <Accordion.Panel>
                <Grid gutter="md">
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <NumberInput
                      label={t('properties.bedrooms')}
                      placeholder="0"
                      min={0}
                      step={0.5}
                      disabled={isViewMode}
                      {...form.getInputProps('bedrooms')}
                      styles={{
                        input: { fontSize: '16px' }
                      }}
                    />
                  </Grid.Col>

                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <NumberInput
                      label={t('properties.bathrooms')}
                      placeholder="0"
                      min={0}
                      step={0.5}
                      disabled={isViewMode}
                      {...form.getInputProps('bathrooms')}
                      styles={{
                        input: { fontSize: '16px' }
                      }}
                    />
                  </Grid.Col>

                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <NumberInput
                      label={t('properties.indoorArea')}
                      placeholder="0"
                      min={0}
                      suffix=" м²"
                      disabled={isViewMode}
                      {...form.getInputProps('indoor_area')}
                      styles={{
                        input: { fontSize: '16px' }
                      }}
                    />
                  </Grid.Col>

                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <NumberInput
                      label={t('properties.outdoorArea')}
                      placeholder="0"
                      min={0}
                      suffix=" м²"
                      disabled={isViewMode}
                      {...form.getInputProps('outdoor_area')}
                      styles={{
                        input: { fontSize: '16px' }
                      }}
                    />
                  </Grid.Col>

                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <NumberInput
                      label={t('properties.plotSize')}
                      placeholder="0"
                      min={0}
                      suffix=" м²"
                      disabled={isViewMode}
                      {...form.getInputProps('plot_size')}
                      styles={{
                        input: { fontSize: '16px' }
                      }}
                    />
                  </Grid.Col>

                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <NumberInput
                      label={t('properties.floors')}
                      placeholder="1"
                      min={1}
                      disabled={isViewMode}
                      {...form.getInputProps('floors')}
                      styles={{
                        input: { fontSize: '16px' }
                      }}
                    />
                  </Grid.Col>

                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <TextInput
                      label={t('properties.floor')}
                      placeholder={t('properties.form.floorPlaceholder')}
                      disabled={isViewMode}
                      {...form.getInputProps('floor')}
                      styles={{
                        input: { fontSize: '16px' }
                      }}
                    />
                  </Grid.Col>

                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <NumberInput
                      label={t('properties.constructionYear')}
                      placeholder="2020"
                      min={1900}
                      max={2100}
                      disabled={isViewMode}
                      {...form.getInputProps('construction_year')}
                      styles={{
                        input: { fontSize: '16px' }
                      }}
                    />
                  </Grid.Col>

                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Select
                      label={t('properties.constructionMonth')}
                      placeholder={t('properties.form.constructionMonthPlaceholder')}
                      disabled={isViewMode}
                      data={[
                        { value: '01', label: t('properties.form.months.january') },
                        { value: '02', label: t('properties.form.months.february') },
                        { value: '03', label: t('properties.form.months.march') },
                        { value: '04', label: t('properties.form.months.april') },
                        { value: '05', label: t('properties.form.months.may') },
                        { value: '06', label: t('properties.form.months.june') },
                        { value: '07', label: t('properties.form.months.july') },
                        { value: '08', label: t('properties.form.months.august') },
                        { value: '09', label: t('properties.form.months.september') },
                        { value: '10', label: t('properties.form.months.october') },
                        { value: '11', label: t('properties.form.months.november') },
                        { value: '12', label: t('properties.form.months.december') }
                      ]}
                      {...form.getInputProps('construction_month')}
                      styles={{
                        input: { fontSize: '16px' }
                      }}
                    />
                  </Grid.Col>

                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Select
                      label={t('properties.furnitureStatus')}
                      placeholder={t('common.select')}
                      disabled={isViewMode}
                      data={[
                        { value: 'fullyFurnished', label: t('properties.form.furnitureStatuses.fullyFurnished') },
                        { value: 'partiallyFurnished', label: t('properties.form.furnitureStatuses.partiallyFurnished') },
                        { value: 'unfurnished', label: t('properties.form.furnitureStatuses.unfurnished') },
                        { value: 'builtIn', label: t('properties.form.furnitureStatuses.builtIn') },
                        { value: 'empty', label: t('properties.form.furnitureStatuses.empty') }
                      ]}
                      {...form.getInputProps('furniture_status')}
                      styles={{
                        input: { fontSize: '16px' }
                      }}
                    />
                  </Grid.Col>

                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <NumberInput
                      label={t('properties.parkingSpaces')}
                      placeholder="0"
                      min={0}
                      disabled={isViewMode}
                      {...form.getInputProps('parking_spaces')}
                      styles={{
                        input: { fontSize: '16px' }
                      }}
                    />
                  </Grid.Col>

                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Select
                      label={t('properties.petsAllowed')}
                      placeholder={t('common.select')}
                      disabled={isViewMode}
                      data={[
                        { value: 'yes', label: t('properties.form.petsOptions.yes') },
                        { value: 'no', label: t('properties.form.petsOptions.no') },
                        { value: 'negotiable', label: t('properties.form.petsOptions.negotiable') },
                        { value: 'custom', label: t('properties.form.petsOptions.custom') }
                      ]}
                      {...form.getInputProps('pets_allowed')}
                      styles={{
                        input: { fontSize: '16px' }
                      }}
                    />
                  </Grid.Col>

                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Select
                      label={t('properties.status')}
                      placeholder={t('common.select')}
                      required
                      disabled={!canEditStatus || isViewMode}
                      data={[
                        { value: 'draft', label: t('properties.statuses.draft') },
                        { value: 'published', label: t('properties.statuses.published') },
                        { value: 'hidden', label: t('properties.statuses.hidden') },
                        { value: 'archived', label: t('properties.statuses.archived') }
                      ]}
                      {...form.getInputProps('status')}
                      styles={{
                        input: { fontSize: '16px' }
                      }}
                    />
                  </Grid.Col>

                  <Grid.Col span={12}>
                    <TextInput
                      label={t('properties.form.videoUrlLabel')}
                      placeholder={t('properties.form.videoUrlPlaceholder')}
                      disabled={isViewMode}
                      {...form.getInputProps('video_url')}
                      styles={{
                        input: { fontSize: '16px' }
                      }}
                    />
                  </Grid.Col>
                </Grid>
              </Accordion.Panel>
            </Accordion.Item>
          </Accordion>
        </Stack>
      );
    }

    // Media
    if (steps[activeStep].key === 'media') {
      return (
        <Stack gap="md">
          <PhotosUploader
            propertyId={Number(id) || 0}
            photos={propertyData?.photos || []}
            bedrooms={form.values.bedrooms || 1}
            onUpdate={isEdit ? loadProperty : () => {}}
            viewMode={isViewMode}
          />
    
          <VideoUploader
            propertyId={Number(id) || 0}
            videos={propertyData?.videos || []}
            onUpdate={isEdit ? loadProperty : () => {}}
            viewMode={isViewMode}
          />
    
          <FloorPlanUploader
            propertyId={Number(id) || 0}
            floorPlanUrl={propertyData?.floor_plan_url}
            onUpdate={isEdit ? loadProperty : () => {}}
            viewMode={isViewMode}
          />
    
          <VRPanoramaUploader
            propertyId={Number(id) || 0}
            onUpdate={isEdit ? loadProperty : () => {}}
            viewMode={isViewMode}
          />
        </Stack>
      );
    }

    // Features
    if (steps[activeStep].key === 'features') {
      return (
        <Stack gap="md">
          <Accordion defaultValue={['renovation', 'beach', 'rental']} multiple variant="separated">
            {/* Renovation */}
            <Accordion.Item value="renovation">
              <Accordion.Control icon={<IconSettings size={20} />}>
                <Text fw={500}>{t('properties.renovation.title')}</Text>
              </Accordion.Control>
              <Accordion.Panel>
                <Stack gap="md">
                  <Radio.Group
                    label={t('properties.renovation.type')}
                    value={form.values.renovation_type}
                    onChange={(value) => {
                      form.setFieldValue('renovation_type', value);
                      handleRenovationChange(value);
                    }}
                  >
                    <Stack gap="xs" mt="xs">
                      <Radio value="" label={t('properties.renovation.noRenovation')} disabled={isViewMode} />
                      <Radio value="partial" label={t('properties.renovation.types.partial')} disabled={isViewMode} />
                      <Radio value="full" label={t('properties.renovation.types.full')} disabled={isViewMode} />
                    </Stack>
                  </Radio.Group>

                  {showRenovationDate && (
                    <Grid gutter="md">
                      <Grid.Col span={{ base: 12, sm: 6 }}>
                        <Select
                          label={t('properties.renovation.month') || 'Месяц реновации'}
                          placeholder={t('properties.form.constructionMonthPlaceholder')}
                          disabled={isViewMode}
                          data={[
                            { value: '01', label: t('properties.form.months.january') },
                            { value: '02', label: t('properties.form.months.february') },
                            { value: '03', label: t('properties.form.months.march') },
                            { value: '04', label: t('properties.form.months.april') },
                            { value: '05', label: t('properties.form.months.may') },
                            { value: '06', label: t('properties.form.months.june') },
                            { value: '07', label: t('properties.form.months.july') },
                            { value: '08', label: t('properties.form.months.august') },
                            { value: '09', label: t('properties.form.months.september') },
                            { value: '10', label: t('properties.form.months.october') },
                            { value: '11', label: t('properties.form.months.november') },
                            { value: '12', label: t('properties.form.months.december') }
                          ]}
                          value={form.values.renovation_date ? dayjs(form.values.renovation_date).format('MM') : ''}
                          onChange={(value) => {
                            if (value) {
                              const currentYear = form.values.renovation_date 
                                ? dayjs(form.values.renovation_date).year() 
                                : new Date().getFullYear();
                              form.setFieldValue('renovation_date', new Date(currentYear, parseInt(value) - 1, 1));
                            }
                          }}
                          styles={{
                            input: { fontSize: '16px' }
                          }}
                        />
                      </Grid.Col>
                        
                      <Grid.Col span={{ base: 12, sm: 6 }}>
                        <NumberInput
                          label={t('properties.renovation.year') || 'Год реновации'}
                          placeholder="2020"
                          min={1900}
                          max={2100}
                          disabled={isViewMode}
                          value={form.values.renovation_date ? dayjs(form.values.renovation_date).year() : undefined}
                          onChange={(value) => {
                            if (value) {
                              const currentMonth = form.values.renovation_date 
                                ? dayjs(form.values.renovation_date).month() 
                                : 0;
                              form.setFieldValue('renovation_date', new Date(Number(value), currentMonth, 1));
                            } else {
                              // Если пользователь очистил поле года - очищаем всю дату
                              form.setFieldValue('renovation_date', null);
                            }
                          }}
                          styles={{
                            input: { fontSize: '16px' }
                          }}
                        />
                      </Grid.Col>
                    </Grid>
                  )}
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>

            {/* Beach Distance */}
            <Accordion.Item value="beach">
              <Accordion.Control icon={<IconMapPin size={20} />}>
                <Text fw={500}>{t('properties.distance.title')}</Text>
              </Accordion.Control>
              <Accordion.Panel>
                <Stack gap="md">
                  <NumberInput
                    label={t('properties.distance.label')}
                    placeholder={t('properties.distance.placeholder')}
                    description={t('properties.distance.tooltip')}
                    min={0}
                    suffix=" м"
                    disabled={isViewMode}
                    {...form.getInputProps('distance_to_beach')}
                    styles={{
                      input: { fontSize: '16px' }
                    }}
                  />

                  {form.values.distance_to_beach && (
                    <Badge size="lg" variant="light" color="blue">
                      {form.values.distance_to_beach < 200 && t('properties.distance.categories.onBeach')}
                      {form.values.distance_to_beach >= 200 && form.values.distance_to_beach <= 500 && t('properties.distance.categories.nearBeach')}
                      {form.values.distance_to_beach > 500 && form.values.distance_to_beach <= 1000 && t('properties.distance.categories.closeToBeach')}
                      {form.values.distance_to_beach > 1000 && form.values.distance_to_beach <= 2000 && t('properties.distance.categories.within2km')}
                      {form.values.distance_to_beach > 2000 && form.values.distance_to_beach <= 5000 && t('properties.distance.categories.within5km')}
                      {form.values.distance_to_beach > 5000 && t('properties.distance.categories.farFromBeach')}
                    </Badge>
                  )}

                  {!isViewMode && form.values.latitude && form.values.longitude && (
                    <Alert icon={<IconInfoCircle size={18} />} color="blue">
                      {t('properties.distance.autoCalculateDescription')}
                    </Alert>
                  )}
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>

            {/* Rental Includes */}
            {(dealType === 'rent' || dealType === 'both') && (
              <Accordion.Item value="rental">
                <Accordion.Control icon={<IconClipboardText size={20} />}>
                  <Text fw={500}>{t('properties.rental.includedTitle')}</Text>
                </Accordion.Control>
                <Accordion.Panel>
                  <Textarea
                    label={t('properties.rental.includedLabel')}
                    placeholder={t('properties.rental.includedPlaceholder')}
                    description={t('properties.rental.includedTooltip')}
                    minRows={3}
                    disabled={isViewMode}
                    {...form.getInputProps('rental_includes')}
                    styles={{
                      input: { fontSize: '16px' }
                    }}
                  />
                </Accordion.Panel>
              </Accordion.Item>
            )}
          </Accordion>

          {/* Property Features */}
          {renderFeaturesGroup(
            PROPERTY_FEATURES.property,
            form.values.features.property,
            (value) => form.setFieldValue('features.property', value),
            showAllPropertyFeatures,
            setShowAllPropertyFeatures,
            t('properties.features.propertyFeatures'),
            'blue'
          )}

          {/* Outdoor Features */}
          {renderFeaturesGroup(
            PROPERTY_FEATURES.outdoor,
            form.values.features.outdoor,
            (value) => form.setFieldValue('features.outdoor', value),
            showAllOutdoorFeatures,
            setShowAllOutdoorFeatures,
            t('properties.features.outdoorFeatures'),
            'green'
          )}

          {/* Rental Features */}
          {(dealType === 'rent' || dealType === 'both') && renderFeaturesGroup(
            PROPERTY_FEATURES.rental,
            form.values.features.rental,
            (value) => form.setFieldValue('features.rental', value),
            showAllRentalFeatures,
            setShowAllRentalFeatures,
            t('properties.features.rentalFeatures'),
            'cyan'
          )}

          {/* Location Features */}
          {renderFeaturesGroup(
            PROPERTY_FEATURES.location,
            form.values.features.location,
            (value) => form.setFieldValue('features.location', value),
            showAllLocationFeatures,
            setShowAllLocationFeatures,
            t('properties.features.locationFeatures'),
            'orange'
          )}

          {/* Views */}
          {renderFeaturesGroup(
            PROPERTY_FEATURES.views,
            form.values.features.views,
            (value) => form.setFieldValue('features.views', value),
            showAllViews,
            setShowAllViews,
            t('properties.features.views'),
            'violet'
          )}
        </Stack>
      );
    }

// Pricing
if (steps[activeStep].key === 'pricing') {
  return (
    <Stack gap="md">
      {(dealType === 'sale' || dealType === 'both') && (
        <SalePriceForm
          propertyId={Number(id) || 0}
          initialData={propertyData ? {
            price: propertyData.sale_price,
            pricing_mode: propertyData.sale_pricing_mode || 'net',
            commission_type: propertyData.sale_commission_type_new || null,
            commission_value: propertyData.sale_commission_value_new || null,
            source_price: propertyData.sale_source_price || null
          } : undefined}
          viewMode={isViewMode}
          onChange={() => {
            if (isEdit) loadProperty();
          }}
        />
      )}

      {(dealType === 'rent' || dealType === 'both') && (
        <>
          <YearPriceForm
            propertyId={Number(id) || 0}
            initialData={propertyData ? {
              price: propertyData.year_price,
              pricing_mode: propertyData.year_pricing_mode || 'net',
              commission_type: propertyData.year_commission_type || null,
              commission_value: propertyData.year_commission_value || null,
              source_price: propertyData.year_source_price || null
            } : undefined}
            viewMode={isViewMode}
            onChange={() => {
              if (isEdit) loadProperty();
            }}
          />

          <MonthlyPricing
            propertyId={Number(id) || 0}
            initialPricing={
              isEdit 
                ? (propertyData?.monthly_pricing || []) 
                : (aiTempData.monthlyPricing || [])
            }
            viewMode={isViewMode}
            onChange={(monthlyPricing) => {
              console.log('PropertyForm: Received monthly pricing update:', monthlyPricing);
              setAiTempData(prev => ({
                ...prev,
                monthlyPricing: monthlyPricing
              }));
            }}
          />

          <SeasonalPricing viewMode={isViewMode} form={form} />

          <DepositForm
            dealType="rent"
            viewMode={false}
            depositType={depositType}
            depositAmount={depositAmount}
            onDepositTypeChange={setDepositType}
            onDepositAmountChange={setDepositAmount}
          />
          
          <UtilitiesForm viewMode={isViewMode} />
        </>
      )}
    </Stack>
  );
}

    // Calendar
    if (steps[activeStep].key === 'calendar') {
      return (
        <CalendarManager 
          propertyId={Number(id) || 0} 
          viewMode={isViewMode}
          initialBlockedDates={
            isEdit 
              ? undefined
              : (aiTempData.blockedDates || [])
          }
        />
      );
    }

    // Owner
    if (steps[activeStep].key === 'owner') {
      if (!showOwnerTab) return null;
      return (
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Stack gap="md">
            <Group>
              <ThemeIcon size="lg" radius="md" variant="light">
                <IconUser size={20} />
              </ThemeIcon>
              <div>
                <Text fw={500}>{t('properties.ownerInfo')}</Text>
                <Text size="sm" c="dimmed">{t('properties.form.ownerInfoDescription') || 'Контактные данные владельца'}</Text>
              </div>
            </Group>

            <Divider />

            <Grid gutter="md">
              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput
                  label={t('properties.ownerName')}
                  placeholder={t('properties.form.ownerNamePlaceholder') || 'Имя владельца'}
                  disabled={isViewMode}
                  {...form.getInputProps('owner_name')}
                  styles={{
                    input: { fontSize: '16px' }
                  }}
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput
                  label={t('properties.ownerPhone')}
                  placeholder="+66 XXX XXX XXX"
                  disabled={isViewMode}
                  {...form.getInputProps('owner_phone')}
                  styles={{
                    input: { fontSize: '16px' }
                  }}
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput
                  label={t('properties.ownerEmail')}
                  placeholder="owner@example.com"
                  type="email"
                  disabled={isViewMode}
                  {...form.getInputProps('owner_email')}
                  styles={{
                    input: { fontSize: '16px' }
                  }}
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput
                  label={t('properties.ownerTelegram')}
                  placeholder="@username"
                  disabled={isViewMode}
                  {...form.getInputProps('owner_telegram')}
                  styles={{
                    input: { fontSize: '16px' }
                  }}
                />
              </Grid.Col>

              <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput
                  label={t('properties.ownerInstagram')}
                  placeholder="@username"
                  disabled={isViewMode}
                  {...form.getInputProps('owner_instagram')}
                  styles={{
                    input: { fontSize: '16px' }
                  }}
                />
              </Grid.Col>

              <Grid.Col span={12}>
                <Textarea
                  label={t('properties.ownerNotes')}
                  placeholder={t('properties.form.ownerNotesPlaceholder')}
                  minRows={4}
                  disabled={isViewMode}
                  {...form.getInputProps('owner_notes')}
                  styles={{
                    input: { fontSize: '16px' }
                  }}
                />
              </Grid.Col>

              {isEdit && form.values.owner_name && !isViewMode && (
                <Grid.Col span={12}>
                  <Button
                    variant="light"
                    leftSection={<IconUser size={18} />}
                    onClick={() => setOwnerAccessModalVisible(true)}
                    fullWidth
                    size="md"
                  >
                    {t('properties.ownerAccess.createButton')}
                  </Button>
                </Grid.Col>
              )}
            </Grid>
          </Stack>
        </Card>
      );
    }

// Translations
if (steps[activeStep].key === 'translations') {
  return (
    <Stack gap="md">
      {isEdit && !isViewMode && (
        <AIDescriptionGenerator
          propertyId={Number(id)}
          onGenerated={handleAIGenerated}
          disabled={false}
        />
      )}

      {!isEdit && (
        <Alert
          icon={<IconInfoCircle size={18} />}
          title={t('properties.ai.generatorAlert')}
          color="blue"
        >
          {t('properties.ai.generatorAlertDescription')}
        </Alert>
      )}

      <TranslationsEditor viewMode={isViewMode} form={form} />
    </Stack>
  );
}

    return null;
  };

  if (loading && !propertyData) {
    return (
      <Center h={400}>
        <Stack align="center" gap="md">
          <Loader size="xl" />
          <Text c="dimmed">{t('common.loading') || 'Загрузка...'}</Text>
        </Stack>
      </Center>
    );
  }

  return (
    <Box ref={targetRef}>
      <Card shadow="sm" padding={0} radius="md" withBorder>
        {/* Header */}
        <Paper p="lg" withBorder style={{ borderBottom: `1px solid ${theme.colors.dark[4]}` }}>
          <Stack gap="md">
            <Group justify="space-between" wrap="wrap">
              <Group>
                <ActionIcon
                  variant="subtle"
                  size="lg"
                  onClick={() => navigate('/properties')}
                >
                  <IconArrowLeft size={20} />
                </ActionIcon>
                <div>
                  <Group gap="xs">
                    {isViewMode && <IconEye size={20} />}
                    <Title order={3}>
                      {isViewMode 
                        ? t('properties.form.viewMode') 
                        : (isEdit ? t('properties.form.editMode') : t('properties.form.createMode'))
                      }
                    </Title>
                  </Group>
                  {isEdit && propertyData && (
                    <Text size="sm" c="dimmed">
                      {propertyData.property_name || propertyData.property_number}
                    </Text>
                  )}
                </div>
              </Group>

              <Group>
                {!isEdit && !isViewMode && (
                  <Button
                    variant="gradient"
                    gradient={{ from: 'violet', to: 'grape', deg: 135 }}
                    leftSection={<IconRobot size={18} />}
                    onClick={() => setAiModalVisible(true)}
                    size={isMobile ? 'sm' : 'md'}
                  >
                    {!isMobile && t('properties.form.createWithAI')}
                  </Button>
                )}

                {isViewMode && canEdit && (
                  <Button
                    leftSection={<IconPencil size={18} />}
                    onClick={() => navigate(`/properties/edit/${id}`)}
                    size={isMobile ? 'sm' : 'md'}
                  >
                    {!isMobile && t('properties.form.editButton')}
                  </Button>
                )}
              </Group>
            </Group>

            {!isViewMode && <ProgressIndicator />}
          </Stack>
        </Paper>

        {/* Content */}
        <Box p={isMobile ? 'md' : 'lg'}>
          {isMobile ? (
            // Stepper для мобильных
            <Stack gap="lg">
              <Stepper 
                active={activeStep} 
                onStepClick={setActiveStep} // ИСПРАВЛЕНО: убрали условие
                orientation="vertical"
                iconSize={32}
                allowNextStepsSelect={true} // ДОБАВЛЕНО: разрешаем выбирать любые шаги
              >
                {steps.map((step) => {
                  const StepIcon = step.icon;
                  return (
                    <Stepper.Step
                      key={step.value}
                      label={step.label}
                      icon={<StepIcon size={16} />}
                      allowStepSelect={true} // ИСПРАВЛЕНО: всегда true
                    >
                      {renderStepContent()}
                    </Stepper.Step>
                  );
                })}
              </Stepper>
              
              {/* Navigation Buttons */}
              {!isViewMode && (
                <Group justify="space-between">
                  <Button
                    variant="light"
                    leftSection={<IconChevronLeft size={18} />}
                    onClick={prevStep}
                    disabled={activeStep === 0}
                  >
                    {t('common.previous')}
                  </Button>
                  {activeStep < steps.length - 1 ? (
                    <Button
                      rightSection={<IconChevronRight size={18} />}
                      onClick={nextStep}
                    >
                      {t('common.next')}
                    </Button>
                  ) : (
                    <Button
                      leftSection={<IconDeviceFloppy size={18} />}
                      onClick={handleSaveClick}
                      loading={loading || fillingFromAI}
                    >
                      {isEdit ? t('common.save') : t('common.create')}
                    </Button>
                  )}
                </Group>
              )}
            </Stack>
              ) : (
                // Tabs для десктопа
                <Tabs value={activeStep.toString()} onChange={(value) => setActiveStep(Number(value))}>
                  <Tabs.List grow={isTablet}>
                    {steps.map((step) => {
                      const StepIcon = step.icon;
                      return (
                        <Tabs.Tab
                          key={step.value}
                          value={step.value.toString()}
                          leftSection={<StepIcon size={16} />}
                        >
                          {step.label}
                        </Tabs.Tab>
                      );
                    })}
                  </Tabs.List>
                  
                  {steps.map((step) => (
                    <Tabs.Panel key={step.value} value={step.value.toString()} pt="lg">
                      {renderStepContent()}
                    </Tabs.Panel>
                  ))}
                </Tabs>
              )}
        </Box>

        {/* Floating Save Button для десктопа */}
        {!isViewMode && !isMobile && (
          <Affix position={{ bottom: 20, right: 20 }}>
            <Transition transition="slide-up" mounted>
              {(transitionStyles) => (
                <Button
                  style={transitionStyles}
                  leftSection={<IconDeviceFloppy size={18} />}
                  size="lg"
                  onClick={handleSaveClick}
                  loading={loading || fillingFromAI}
                  radius="xl"
                >
                  {isEdit ? t('common.save') : t('common.create')}
                </Button>
              )}
            </Transition>
          </Affix>
        )}
      </Card>

      {/* Modals */}
      <AIPropertyCreationModal
        visible={aiModalVisible}
        onCancel={() => setAiModalVisible(false)}
        onSuccess={handleAISuccess}
      />

      <OwnerAccessModal
        visible={ownerAccessModalVisible}
        onClose={() => setOwnerAccessModalVisible(false)}
        ownerName={form.values.owner_name || ''}
      />

      <Modal
        opened={complexInfoOpened}
        onClose={closeComplexInfo}
        title={t('properties.complexInfo')}
        size="lg"
        centered
      >
        <Text>{t('properties.complexInfoText')}</Text>
      </Modal>
    </Box>
  );
};

export default PropertyForm;