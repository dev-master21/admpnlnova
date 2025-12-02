// frontend/src/modules/Properties/components/PhotosUploader.tsx
import { useState, useEffect } from 'react';
import { 
  Card,
  Stack,
  Group,
  Button,
  Text,
  Progress,
  Badge,
  Modal,
  NumberInput,
  Paper,
  ActionIcon,
  ThemeIcon,
  Tooltip,
  Checkbox,
  Alert,
  Box,
  SimpleGrid,
  Image,
  Divider,
  Center,
  FileButton,
  Collapse,
  TextInput,
  Transition,
  Title,
  RingProgress
} from '@mantine/core';
import {
  IconUpload,
  IconTrash,
  IconStar,
  IconStarFilled,
  IconArrowRight,
  IconPlus,
  IconMinus,
  IconPhoto,
  IconHash,
  IconDownload,
  IconCheckbox,
  IconSquare,
  IconBed,
  IconBath,
  IconToolsKitchen2,
  IconArmchair,
  IconHome,
  IconSwimming,
  IconEye,
  IconChevronDown,
  IconChevronUp,
  IconInfoCircle,
  IconX,
  IconCheck,
  IconAlertCircle,
  IconBrandGoogle,
  IconBrandDropbox,
  IconClock,
  IconClipboard,
  IconLink,
  IconPhotoUp,
  IconVideo,
  IconAlertTriangle,
  IconCircleCheck,
  IconLoader2
} from '@tabler/icons-react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { useTranslation } from 'react-i18next';
import { notifications } from '@mantine/notifications';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { propertiesApi } from '@/api/properties.api';
import { saveAs } from 'file-saver';

interface Photo {
  id: number;
  photo_url: string;
  category: string;
  sort_order: number;
  is_primary: boolean;
}

interface TempPhoto {
  file: File;
  category: string;
  preview: string;
}

interface ImportStatus {
  status: 'initializing' | 'downloading' | 'processing' | 'completed' | 'error';
  message: string;
  processed: number;
  total: number;
  photos: number;
  videos: number;
  errors: number;
  errorDetails: string[];
  duration?: number;
}

interface PhotosUploaderProps {
  propertyId: number;
  photos: Photo[];
  bedrooms: number;
  onUpdate: () => void;
  viewMode?: boolean;
  onChange?: (photos: TempPhoto[]) => void;
}

const CategoryIcons: { [key: string]: any } = {
  general: IconPhoto,
  bedroom: IconBed,
  bathroom: IconBath,
  kitchen: IconToolsKitchen2,
  living: IconArmchair,
  exterior: IconHome,
  pool: IconSwimming,
  view: IconEye
};

const PhotosUploader = ({ 
  propertyId, 
  photos, 
  bedrooms: initialBedrooms, 
  onUpdate, 
  viewMode = false,
  onChange
}: PhotosUploaderProps) => {
  const { t } = useTranslation();
  const isMobile = useMediaQuery('(max-width: 768px)');

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState('general');
  const [localPhotos, setLocalPhotos] = useState<Photo[]>(photos);
  const [tempPhotos, setTempPhotos] = useState<TempPhoto[]>([]);
  const isCreatingMode = propertyId === 0;
  const [bedroomCount, setBedroomCount] = useState(initialBedrooms || 1);
  
  const [movingPhotoId, setMovingPhotoId] = useState<number | null>(null);
  const [moveModalOpened, { open: openMoveModal, close: closeMoveModal }] = useDisclosure(false);
  
  const [positionChangePhotoId, setPositionChangePhotoId] = useState<number | null>(null);
  const [positionModalOpened, { open: openPositionModal, close: closePositionModal }] = useDisclosure(false);
  const [newPosition, setNewPosition] = useState<number | string>('');
  
  const [deletePhotoId, setDeletePhotoId] = useState<number | null>(null);
  const [deleteModalOpened, { open: openDeleteModal, close: closeDeleteModal }] = useDisclosure(false);
  
  const [deleteSelectedModalOpened, { open: openDeleteSelectedModal, close: closeDeleteSelectedModal }] = useDisclosure(false);
  const [deletingSelected, setDeletingSelected] = useState(false);
  
  const [activeCategories, setActiveCategories] = useState<string[]>(['general']);
  const [selectedPhotos, setSelectedPhotos] = useState<Set<number>>(new Set());
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [downloadingSelected, setDownloadingSelected] = useState(false);

  // ✅ Состояния для импорта
  const [importUrl, setImportUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<ImportStatus | null>(null);
  const [importModalOpened, { open: openImportModal, close: closeImportModal }] = useDisclosure(false);
  const [importType, setImportType] = useState<'drive' | 'dropbox' | null>(null);
  const [urlError, setUrlError] = useState<string>('');

  useEffect(() => {
    if (isCreatingMode && onChange) {
      onChange(tempPhotos);
    }
  }, [tempPhotos, isCreatingMode, onChange]);

  useEffect(() => {
    return () => {
      tempPhotos.forEach(photo => {
        URL.revokeObjectURL(photo.preview);
      });
    };
  }, []);

  // ✅ Валидация URL в реальном времени
  useEffect(() => {
    if (!importUrl.trim()) {
      setUrlError('');
      return;
    }

  if (importType === 'drive') {
    const drivePatterns = [
      /drive\.google\.com\/file\/d\//,
      /drive\.google\.com\/drive\/folders\//,
      /drive\.google\.com\/.*[?&]id=/,
      /drive\.google\.com\/open\?id=/
    ];
      const isValid = drivePatterns.some(pattern => pattern.test(importUrl));
      setUrlError(isValid ? '' : t('photosUploader.invalidDriveUrl'));
    } else if (importType === 'dropbox') {
      const isValid = importUrl.includes('dropbox.com');
      setUrlError(isValid ? '' : t('photosUploader.invalidDropboxUrl'));
    }
  }, [importUrl, importType, t]);

  // ✅ Polling для статуса импорта
  useEffect(() => {
    if (!importing || isCreatingMode) return;

    const interval = setInterval(async () => {
      try {
        const response = await propertiesApi.getImportStatus(propertyId);
        const status = response.data.data;
        setImportStatus(status);

        if (status.status === 'completed' || status.status === 'error') {
          setImporting(false);
          
          if (status.status === 'completed') {
            notifications.show({
              title: t('common.success'),
              message: `${t('photosUploader.importCompleted')}: ${status.photos} ${t('photosUploader.photos')}, ${status.videos} ${t('photosUploader.videos')}`,
              color: 'green',
              icon: <IconCheck size={18} />,
              autoClose: 10000
            });
            onUpdate();
          } else {
            notifications.show({
              title: t('errors.generic'),
              message: status.message,
              color: 'red',
              icon: <IconX size={18} />,
              autoClose: false
            });
          }
        }
      } catch (error) {
        console.error('Error fetching import status:', error);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [importing, propertyId, isCreatingMode, t, onUpdate]);

  // ✅ Вставка из буфера обмена
  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setImportUrl(text);
      notifications.show({
        message: t('photosUploader.urlPasted'),
        color: 'blue',
        icon: <IconCheck size={18} />,
        autoClose: 2000
      });
    } catch (error) {
      notifications.show({
        message: t('photosUploader.clipboardError'),
        color: 'red',
        icon: <IconX size={18} />
      });
    }
  };

  // ✅ Обработчик импорта
  const handleStartImport = async () => {
    if (!importUrl.trim() || !importType || urlError) return;

    try {
      setImporting(true);
      setImportStatus({
        status: 'initializing',
        message: t('photosUploader.importStarting'),
        processed: 0,
        total: 0,
        photos: 0,
        videos: 0,
        errors: 0,
        errorDetails: []
      });

      if (importType === 'drive') {
        await propertiesApi.importFromGoogleDrive(propertyId, importUrl);
      } else {
        await propertiesApi.importFromDropbox(propertyId, importUrl);
      }

      closeImportModal();
      setImportUrl('');
      setUrlError('');
      
      notifications.show({
        title: t('common.info'),
        message: t('photosUploader.importStarted'),
        color: 'blue',
        icon: <IconClock size={18} />
      });
    } catch (error: any) {
      setImporting(false);
      notifications.show({
        title: t('errors.generic'),
        message: error.response?.data?.message || t('photosUploader.importError'),
        color: 'red',
        icon: <IconX size={18} />
      });
    }
  };

  useEffect(() => {
    setLocalPhotos(photos);
  }, [photos]);

  const baseCategories = [
    { value: 'general', label: t('photosUploader.categories.general'), color: 'blue' },
    { value: 'bedroom', label: t('photosUploader.categories.bedroom'), color: 'violet' },
    { value: 'bathroom', label: t('photosUploader.categories.bathroom'), color: 'cyan' },
    { value: 'kitchen', label: t('photosUploader.categories.kitchen'), color: 'orange' },
    { value: 'living', label: t('photosUploader.categories.living'), color: 'grape' },
    { value: 'exterior', label: t('photosUploader.categories.exterior'), color: 'green' },
    { value: 'pool', label: t('photosUploader.categories.pool'), color: 'teal' },
    { value: 'view', label: t('photosUploader.categories.view'), color: 'indigo' }
  ];

  const generateCategories = () => {
    const cats: Array<{ value: string; label: string; color: string; isSubcategory?: boolean }> = [...baseCategories];
    
    for (let i = 1; i <= bedroomCount; i++) {
      cats.push({
        value: `bedroom-${i}`,
        label: t('photosUploader.bedroomNumber', { number: i }),
        color: 'violet',
        isSubcategory: true
      });
    }
    
    return cats;
  };

  const categories = generateCategories();

  const groupedPhotos = localPhotos.reduce((acc, photo) => {
    if (!acc[photo.category]) {
      acc[photo.category] = [];
    }
    acc[photo.category].push(photo);
    return acc;
  }, {} as Record<string, Photo[]>);

  Object.keys(groupedPhotos).forEach(category => {
    groupedPhotos[category].sort((a, b) => a.sort_order - b.sort_order);
  });

  const getCategoryIcon = (category: string) => {
    if (category.startsWith('bedroom-')) {
      return IconBed;
    }
    return CategoryIcons[category] || IconPhoto;
  };

  const handleAddBedroom = () => {
    setBedroomCount(prev => prev + 1);
    notifications.show({
      title: t('common.success'),
      message: t('photosUploader.bedroomAdded', { number: bedroomCount + 1 }),
      color: 'green',
      icon: <IconCheck size={18} />
    });
  };

  const handleRemoveBedroom = (bedroomNumber: number) => {
    const category = `bedroom-${bedroomNumber}`;
    const bedroomPhotos = groupedPhotos[category] || [];

    if (bedroomPhotos.length > 0) {
      if (window.confirm(t('photosUploader.removeBedroomConfirm', { 
        number: bedroomNumber, 
        count: bedroomPhotos.length 
      }))) {
        (async () => {
          if (!isCreatingMode) {
            for (const photo of bedroomPhotos) {
              try {
                await propertiesApi.deletePhoto(propertyId, photo.id);
              } catch (error) {
                console.error('Failed to delete photo:', error);
              }
            }
          }
          setBedroomCount(prev => Math.max(1, prev - 1));
          if (!isCreatingMode) {
            onUpdate();
          }
          notifications.show({
            title: t('common.success'),
            message: t('photosUploader.bedroomRemoved', { number: bedroomNumber }),
            color: 'green',
            icon: <IconCheck size={18} />
          });
        })();
      }
    } else {
      setBedroomCount(prev => Math.max(1, prev - 1));
      notifications.show({
        title: t('common.success'),
        message: t('photosUploader.bedroomRemoved', { number: bedroomNumber }),
        color: 'green',
        icon: <IconCheck size={18} />
      });
    }
  };

  const handleFileSelect = async (files: File[]) => {
    if (files.length === 0) return;

    const oversizedFiles = files.filter(file => file.size > 50 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      notifications.show({
        title: t('errors.generic'),
        message: t('photosUploader.filesExceedSize', { 
          files: oversizedFiles.map(f => f.name).join(', ') 
        }),
        color: 'red',
        icon: <IconX size={18} />
      });
      return;
    }

    const invalidFiles = files.filter(file => !file.type.startsWith('image/'));
    if (invalidFiles.length > 0) {
      notifications.show({
        title: t('errors.generic'),
        message: t('photosUploader.filesNotImages', { 
          files: invalidFiles.map(f => f.name).join(', ') 
        }),
        color: 'red',
        icon: <IconX size={18} />
      });
      return;
    }

    if (isCreatingMode) {
      const newTempPhotos = await Promise.all(
        files.map(async (file) => {
          const preview = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.readAsDataURL(file);
          });

          return {
            file,
            category: selectedCategory,
            preview
          };
        })
      );

      setTempPhotos([...tempPhotos, ...newTempPhotos]);
      notifications.show({
        title: t('common.success'),
        message: t('photosUploader.photosAddedTemp', { count: files.length }),
        color: 'green',
        icon: <IconCheck size={18} />
      });
      setSelectedCategory('general');
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);
    
      const formData = new FormData();
      files.forEach(file => {
        formData.append('photos', file);
      });
      formData.append('category', selectedCategory);
    
      await propertiesApi.uploadPhotos(propertyId, formData, (progress) => {
        setUploadProgress(progress);
      });
    
      notifications.show({
        title: t('common.success'),
        message: t('photosUploader.photosUploaded', { count: files.length }),
        color: 'green',
        icon: <IconCheck size={18} />
      });
      onUpdate();
      setSelectedCategory('general');
    } catch (error: any) {
      notifications.show({
        title: t('errors.generic'),
        message: error.response?.data?.message || t('photosUploader.errorUploading'),
        color: 'red',
        icon: <IconX size={18} />
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDeleteTempPhoto = (index: number) => {
    const photoToDelete = tempPhotos[index];
    URL.revokeObjectURL(photoToDelete.preview);
    setTempPhotos(tempPhotos.filter((_, i) => i !== index));
    notifications.show({
      title: t('common.success'),
      message: t('photosUploader.photoDeleted'),
      color: 'green',
      icon: <IconCheck size={18} />
    });
  };

  const handleDeletePhotoConfirm = async () => {
    if (!deletePhotoId) return;
    
    const oldPhotos = [...localPhotos];
    setLocalPhotos(localPhotos.filter(p => p.id !== deletePhotoId));
    closeDeleteModal();

    try {
      await propertiesApi.deletePhoto(propertyId, deletePhotoId);
      notifications.show({
        title: t('common.success'),
        message: t('photosUploader.photoDeleted'),
        color: 'green',
        icon: <IconCheck size={18} />
      });
      onUpdate();
      setSelectedPhotos(prev => {
        const newSet = new Set(prev);
        newSet.delete(deletePhotoId);
        return newSet;
      });
    } catch (error: any) {
      notifications.show({
        title: t('errors.generic'),
        message: error.response?.data?.message || t('photosUploader.errorDeleting'),
        color: 'red',
        icon: <IconX size={18} />
      });
      setLocalPhotos(oldPhotos);
    } finally {
      setDeletePhotoId(null);
    }
  };

  const handleDeleteSelectedConfirm = async () => {
    if (selectedPhotos.size === 0) return;

    const photosToDelete = Array.from(selectedPhotos);
    const oldPhotos = [...localPhotos];
    
    setLocalPhotos(localPhotos.filter(p => !selectedPhotos.has(p.id)));
    closeDeleteSelectedModal();
    setDeletingSelected(true);

    try {
      await Promise.all(
        photosToDelete.map(photoId => propertiesApi.deletePhoto(propertyId, photoId))
      );
      
      notifications.show({
        title: t('common.success'),
        message: t('photosUploader.photosDeleted', { count: photosToDelete.length }),
        color: 'green',
        icon: <IconCheck size={18} />
      });
      
      setSelectedPhotos(new Set());
      onUpdate();
    } catch (error: any) {
      notifications.show({
        title: t('errors.generic'),
        message: error.response?.data?.message || t('photosUploader.errorDeleting'),
        color: 'red',
        icon: <IconX size={18} />
      });
      setLocalPhotos(oldPhotos);
    } finally {
      setDeletingSelected(false);
    }
  };

  const handleSetPrimary = async (photoId: number) => {
    const oldPhotos = [...localPhotos];
    setLocalPhotos(localPhotos.map(p => ({
      ...p,
      is_primary: p.id === photoId
    })));

    try {
      await propertiesApi.setPrimaryPhoto(propertyId, photoId);
      notifications.show({
        title: t('common.success'),
        message: t('photosUploader.primaryPhotoSet'),
        color: 'green',
        icon: <IconCheck size={18} />
      });
      onUpdate();
    } catch (error: any) {
      notifications.show({
        title: t('errors.generic'),
        message: error.response?.data?.message || t('photosUploader.error'),
        color: 'red',
        icon: <IconX size={18} />
      });
      setLocalPhotos(oldPhotos);
    }
  };

  const getPhotoCategory = (photoId: number) => {
    const photo = localPhotos.find(p => p.id === photoId);
    return photo?.category || 'general';
  };

  const handleMovePhoto = async (clickedPhotoId: number, newCategory: string) => {
    const oldPhotos = [...localPhotos];

    let photosToMove: number[];
    
    if (selectedPhotos.size > 0 && selectedPhotos.has(clickedPhotoId)) {
      photosToMove = Array.from(selectedPhotos);
    } else {
      photosToMove = [clickedPhotoId];
    }

    setLocalPhotos(localPhotos.map(p =>
      photosToMove.includes(p.id) ? { ...p, category: newCategory } : p
    ));

    closeMoveModal();
    setMovingPhotoId(null);

    try {
      const updates = photosToMove.map((photoId, index) => ({
        id: photoId,
        sort_order: (groupedPhotos[newCategory]?.length || 0) + index,
        category: newCategory
      }));

      await propertiesApi.updatePhotosOrder(propertyId, updates);
      
      if (photosToMove.length > 1) {
        notifications.show({
          title: t('common.success'),
          message: t('photosUploader.photosMoved', { count: photosToMove.length }),
          color: 'green',
          icon: <IconCheck size={18} />
        });
        setSelectedPhotos(new Set());
      } else {
        notifications.show({
          title: t('common.success'),
          message: t('photosUploader.photoMoved'),
          color: 'green',
          icon: <IconCheck size={18} />
        });
      }
      
      onUpdate();
    } catch (error) {
      console.error('Failed to move photo:', error);
      notifications.show({
        title: t('errors.generic'),
        message: t('photosUploader.errorMoving'),
        color: 'red',
        icon: <IconX size={18} />
      });
      setLocalPhotos(oldPhotos);
    }
  };

  const handleChangePosition = async () => {
    const position = typeof newPosition === 'number' ? newPosition : parseInt(String(newPosition));
    const photo = localPhotos.find(p => p.id === positionChangePhotoId);
    if (!photo) return;

    const categoryPhotos = groupedPhotos[photo.category || 'general'];

    if (isNaN(position) || position < 1 || position > categoryPhotos.length) {
      notifications.show({
        title: t('errors.generic'),
        message: t('photosUploader.positionRange', { max: categoryPhotos.length }),
        color: 'red',
        icon: <IconX size={18} />
      });
      return;
    }

    const updatedPhotos = [...categoryPhotos];
    const currentIndex = updatedPhotos.findIndex(p => p.id === positionChangePhotoId);
    const [movedItem] = updatedPhotos.splice(currentIndex, 1);
    updatedPhotos.splice(position - 1, 0, movedItem);

    const reorderedPhotos = updatedPhotos.map((p, index) => ({
      ...p,
      sort_order: index
    }));

    const newLocalPhotos = localPhotos.map(p => {
      const updated = reorderedPhotos.find(rp => rp.id === p.id);
      return updated || p;
    });

    setLocalPhotos(newLocalPhotos);

    try {
      const photosToUpdate = reorderedPhotos.map((p, index) => ({
        id: p.id,
        sort_order: index,
        category: p.category
      }));

      await propertiesApi.updatePhotosOrder(propertyId, photosToUpdate);
      notifications.show({
        title: t('common.success'),
        message: t('photosUploader.positionChanged'),
        color: 'green',
        icon: <IconCheck size={18} />
      });
      closePositionModal();
      setPositionChangePhotoId(null);
      setNewPosition('');
    } catch (error) {
      console.error('Failed to change position:', error);
      notifications.show({
        title: t('errors.generic'),
        message: t('photosUploader.errorChangingPosition'),
        color: 'red',
        icon: <IconX size={18} />
      });
    }
  };

  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination) return;
  
    const sourceCategory = result.source.droppableId;
    const destinationCategory = result.destination.droppableId;
  
    const oldPhotos = [...localPhotos];
  
    if (sourceCategory !== destinationCategory) {
      const movedItem = groupedPhotos[sourceCategory][result.source.index];
      
      const updatedPhoto = {
        ...movedItem,
        category: destinationCategory,
        sort_order: result.destination.index
      };
    
      const newLocalPhotos = localPhotos.map(p =>
        p.id === movedItem.id ? updatedPhoto : p
      );
    
      setLocalPhotos(newLocalPhotos);
    
      try {
        const updates = [{
          id: movedItem.id,
          sort_order: result.destination.index,
          category: destinationCategory
        }];
      
        await propertiesApi.updatePhotosOrder(propertyId, updates);
        notifications.show({
          title: t('common.success'),
          message: t('photosUploader.photoMoved'),
          color: 'green',
          icon: <IconCheck size={18} />
        });
        onUpdate();
      } catch (error) {
        console.error('Failed to move photo:', error);
        notifications.show({
          title: t('errors.generic'),
          message: t('photosUploader.errorMoving'),
          color: 'red',
          icon: <IconX size={18} />
        });
        setLocalPhotos(oldPhotos);
      }
    } else {
      const items = Array.from(groupedPhotos[sourceCategory]);
      const [reorderedItem] = items.splice(result.source.index, 1);
      items.splice(result.destination.index, 0, reorderedItem);
    
      const updatedPhotos = items.map((item, index) => ({
        ...item,
        sort_order: index
      }));
    
      const newLocalPhotos = localPhotos.map(p => {
        const updated = updatedPhotos.find(up => up.id === p.id);
        return updated || p;
      });
    
      setLocalPhotos(newLocalPhotos);
    
      try {
        const photosToUpdate = updatedPhotos.map((p, index) => ({
          id: p.id,
          sort_order: index,
          category: p.category
        }));
      
        await propertiesApi.updatePhotosOrder(propertyId, photosToUpdate);
      } catch (error) {
        console.error('Failed to reorder photos:', error);
        notifications.show({
          title: t('errors.generic'),
          message: t('photosUploader.errorReordering'),
          color: 'red',
          icon: <IconX size={18} />
        });
        setLocalPhotos(oldPhotos);
      }
    }
  };

  const handleTogglePhoto = (photoId: number) => {
    setSelectedPhotos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(photoId)) {
        newSet.delete(photoId);
      } else {
        newSet.add(photoId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    setSelectedPhotos(new Set(localPhotos.map(p => p.id)));
  };

  const handleDeselectAll = () => {
    setSelectedPhotos(new Set());
  };

  const handleDownloadSelected = async () => {
    if (selectedPhotos.size === 0) {
      notifications.show({
        title: t('photosUploader.selectPhotosToDownload'),
        message: '',
        color: 'orange',
        icon: <IconAlertCircle size={18} />
      });
      return;
    }

    setDownloadingSelected(true);
    try {
      const photoIds = Array.from(selectedPhotos);
      const response = await propertiesApi.downloadPhotos(propertyId, photoIds);
      
      const filename = photoIds.length === 1
        ? `property_${propertyId}_photo_${photoIds[0]}.jpg`
        : `property_${propertyId}_selected_photos.zip`;
      
      const blob = new Blob([response.data]);
      saveAs(blob, filename);
      
      notifications.show({
        title: t('common.success'),
        message: t('photosUploader.photosDownloaded', { count: photoIds.length }),
        color: 'green',
        icon: <IconCheck size={18} />
      });
    } catch (error) {
      console.error('Download error:', error);
      notifications.show({
        title: t('errors.generic'),
        message: t('photosUploader.errorDownloading'),
        color: 'red',
        icon: <IconX size={18} />
      });
    } finally {
      setDownloadingSelected(false);
    }
  };

  const handleDownloadAll = async () => {
    if (localPhotos.length === 0) {
      notifications.show({
        title: t('photosUploader.noPhotosToDownload'),
        message: '',
        color: 'orange',
        icon: <IconAlertCircle size={18} />
      });
      return;
    }

    setDownloadingAll(true);
    try {
      const response = await propertiesApi.downloadPhotos(propertyId);
      
      const filename = localPhotos.length === 1
        ? `property_${propertyId}_photo_${localPhotos[0].id}.jpg`
        : `property_${propertyId}_all_photos.zip`;
      
      const blob = new Blob([response.data]);
      saveAs(blob, filename);
      
      notifications.show({
        title: t('common.success'),
        message: t('photosUploader.photosDownloaded', { count: localPhotos.length }),
        color: 'green',
        icon: <IconCheck size={18} />
      });
    } catch (error) {
      console.error('Download error:', error);
      notifications.show({
        title: t('errors.generic'),
        message: t('photosUploader.errorDownloading'),
        color: 'red',
        icon: <IconX size={18} />
      });
    } finally {
      setDownloadingAll(false);
    }
  };

  // ✅ Вычисляем прогресс в процентах
  const progressPercent = importStatus && importStatus.total > 0 
    ? Math.round((importStatus.processed / importStatus.total) * 100) 
    : 0;

  return (
    <Stack gap="lg">
      {/* ✅ ПЕРЕРАБОТАННЫЙ: Панель быстрого импорта */}
      {!isCreatingMode && !viewMode && (
        <Card 
          shadow="md" 
          radius="md" 
          withBorder
          style={{
            background: 'linear-gradient(135deg, rgba(66, 153, 225, 0.1) 0%, rgba(147, 51, 234, 0.1) 100%)',
            borderColor: 'var(--mantine-color-blue-3)'
          }}
        >
          <Stack gap="lg">
            {/* Header */}
            <Group justify="space-between" wrap="nowrap">
              <Group gap="sm">
                <ThemeIcon 
                  size="xl" 
                  radius="md" 
                  variant="gradient"
                  gradient={{ from: 'blue', to: 'cyan', deg: 45 }}
                >
                  <IconLink size={24} />
                </ThemeIcon>
                <div>
                  <Title order={4} mb={4}>
                    {t('photosUploader.bulkImport')}
                  </Title>
                  <Text size="sm" c="dimmed">
                    {t('photosUploader.importDescription')}
                  </Text>
                </div>
              </Group>
            </Group>

            {/* ✅ Кнопки выбора источника - только если не идет импорт */}
            {!importing && (
              <>
                <Divider />
                <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                  {/* Google Drive Button */}
                  <Paper
                    p="md"
                    radius="md"
                    withBorder
                    style={{
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      background: 'var(--mantine-color-dark-6)',
                      borderColor: 'var(--mantine-color-dark-4)'
                    }}
                    onClick={() => {
                      setImportType('drive');
                      openImportModal();
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(66, 153, 225, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <Stack gap="md" align="center">
                      <ThemeIcon size={60} radius="xl" variant="light" color="red">
                        <IconBrandGoogle size={32} />
                      </ThemeIcon>
                      <div style={{ textAlign: 'center' }}>
                        <Text fw={600} size="lg" mb={4}>
                          Google Drive
                        </Text>
                        <Text size="xs" c="dimmed">
                          {t('photosUploader.importFromFolder')}
                        </Text>
                      </div>
                    </Stack>
                  </Paper>

                  {/* Dropbox Button */}
                  <Paper
                    p="md"
                    radius="md"
                    withBorder
                    style={{
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      background: 'var(--mantine-color-dark-6)',
                      borderColor: 'var(--mantine-color-dark-4)'
                    }}
                    onClick={() => {
                      setImportType('dropbox');
                      openImportModal();
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <Stack gap="md" align="center">
                      <ThemeIcon size={60} radius="xl" variant="light" color="blue">
                        <IconBrandDropbox size={32} />
                      </ThemeIcon>
                      <div style={{ textAlign: 'center' }}>
                        <Text fw={600} size="lg" mb={4}>
                          Dropbox
                        </Text>
                        <Text size="xs" c="dimmed">
                          {t('photosUploader.importFromArchive')}
                        </Text>
                      </div>
                    </Stack>
                  </Paper>
                </SimpleGrid>
              </>
            )}

{/* ✅ УЛУЧШЕННЫЙ: Прогресс импорта */}
{importing && importStatus && (
  <Transition mounted={importing && !!importStatus} transition="fade" duration={300}>
    {(styles) => (
      <Box style={styles}>
        <Divider mb="md" />
        
        <Paper p="lg" radius="md" withBorder bg="dark.7">
          <Stack gap="lg">
            {/* Заголовок с статусом */}
            <Group justify="space-between">
              <Group gap="sm">
                {importStatus.status === 'completed' ? (
                  <ThemeIcon size="lg" radius="xl" color="green" variant="light">
                    <IconCircleCheck size={20} />
                  </ThemeIcon>
                ) : importStatus.status === 'error' ? (
                  <ThemeIcon size="lg" radius="xl" color="red" variant="light">
                    <IconAlertTriangle size={20} />
                  </ThemeIcon>
                ) : (
                  <ThemeIcon size="lg" radius="xl" color="blue" variant="light">
                    <IconLoader2 size={20} className="rotating-icon" />
                  </ThemeIcon>
                )}
                <div>
                  <Text fw={600} size="lg">
                    {importStatus.message}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {importStatus.status === 'initializing' && t('photosUploader.preparingImport')}
                    {importStatus.status === 'downloading' && t('photosUploader.downloadingFiles')}
                    {importStatus.status === 'processing' && t('photosUploader.processingFiles')}
                    {importStatus.status === 'completed' && t('photosUploader.importFinished')}
                    {importStatus.status === 'error' && t('photosUploader.importFailed')}
                  </Text>
                </div>
              </Group>
              
              <Badge 
                size="lg" 
                variant="filled"
                color={
                  importStatus.status === 'completed' ? 'green' :
                  importStatus.status === 'error' ? 'red' : 'blue'
                }
              >
                {importStatus.status}
              </Badge>
            </Group>

            {/* Круговой прогресс с числами */}
            {importStatus.total > 0 && (
              <>
                <Group justify="space-between" align="flex-start">
                  {/* Левая часть - круговой прогресс */}
                  <Group gap="xl">
                    <RingProgress
                      size={120}
                      thickness={12}
                      roundCaps
                      sections={[
                        { value: progressPercent, color: importStatus.status === 'error' ? 'red' : 'blue' }
                      ]}
                      label={
                        <Center>
                          <Stack gap={0} align="center">
                            <Text size="xl" fw={700}>
                              {progressPercent}%
                            </Text>
                            <Text size="xs" c="dimmed">
                              {t('photosUploader.complete')}
                            </Text>
                          </Stack>
                        </Center>
                      }
                    />

                    {/* Статистика */}
                    <Stack gap="xs">
                      <Group gap="xs">
                        <ThemeIcon size="sm" radius="xl" color="blue" variant="light">
                          <IconPhotoUp size={14} />
                        </ThemeIcon>
                        <Text size="sm">
                          <Text span fw={600}>{importStatus.photos}</Text> {t('photosUploader.photos')}
                        </Text>
                      </Group>
                      
                      <Group gap="xs">
                        <ThemeIcon size="sm" radius="xl" color="grape" variant="light">
                          <IconVideo size={14} />
                        </ThemeIcon>
                        <Text size="sm">
                          <Text span fw={600}>{importStatus.videos}</Text> {t('photosUploader.videos')}
                        </Text>
                      </Group>
                      
                      {importStatus.errors > 0 && (
                        <Group gap="xs">
                          <ThemeIcon size="sm" radius="xl" color="red" variant="light">
                            <IconAlertCircle size={14} />
                          </ThemeIcon>
                          <Text size="sm" c="red">
                            <Text span fw={600}>{importStatus.errors}</Text> {t('common.errors')}
                          </Text>
                        </Group>
                      )}
                      
                      <Divider my={4} />
                      
                      <Text size="xs" c="dimmed">
                        {importStatus.processed} / {importStatus.total} {t('photosUploader.filesProcessed')}
                      </Text>
                    </Stack>
                  </Group>
                </Group>

                {/* Линейный прогресс-бар */}
                <Progress
                  value={progressPercent}
                  size="xl"
                  radius="xl"
                  animated={importStatus.status === 'processing'}
                  color={importStatus.status === 'error' ? 'red' : 'blue'}
                  styles={{
                    label: { fontSize: '14px', fontWeight: 600 }
                  }}
                />
              </>
            )}

            {/* Предупреждение об ошибках */}
            {importStatus.errors > 0 && (
              <Alert 
                color="orange" 
                icon={<IconAlertCircle size={16} />}
                title={t('photosUploader.errorsDetected')}
              >
                <Text size="sm">
                  {t('photosUploader.someFilesNotProcessed', { count: importStatus.errors })}
                </Text>
              </Alert>
            )}
          </Stack>
        </Paper>
      </Box>
    )}
  </Transition>
)}
          </Stack>
        </Card>
      )}

      {/* Selection and Download Panel */}
      {!isCreatingMode && localPhotos.length > 0 && (
        <Paper p="md" radius="md" withBorder bg="dark.6">
          <Stack gap="md">
            <Group justify="space-between" wrap="wrap" gap="md">
              <Group wrap="wrap">
                <Button
                  size="sm"
                  variant="light"
                  leftSection={<IconCheckbox size={16} />}
                  onClick={handleSelectAll}
                >
                  {t('photosUploader.selectAll', { count: localPhotos.length })}
                </Button>
                <Button
                  size="sm"
                  variant="subtle"
                  leftSection={<IconSquare size={16} />}
                  onClick={handleDeselectAll}
                  disabled={selectedPhotos.size === 0}
                >
                  {t('photosUploader.deselectAll')}
                </Button>
                {selectedPhotos.size > 0 && (
                  <Badge size="lg" variant="filled" color="blue">
                    {t('photosUploader.selected', { count: selectedPhotos.size })}
                  </Badge>
                )}
              </Group>
              <Group wrap="wrap">
                <Button
                  size="sm"
                  variant="filled"
                  leftSection={<IconDownload size={16} />}
                  onClick={handleDownloadSelected}
                  loading={downloadingSelected}
                  disabled={selectedPhotos.size === 0}
                >
                  {isMobile ? t('photosUploader.download') : t('photosUploader.downloadSelected', { count: selectedPhotos.size })}
                </Button>
                <Button
                  size="sm"
                  variant="light"
                  leftSection={<IconDownload size={16} />}
                  onClick={handleDownloadAll}
                  loading={downloadingAll}
                >
                  {isMobile ? t('common.all') : t('photosUploader.downloadAll', { count: localPhotos.length })}
                </Button>
              </Group>
            </Group>

            {selectedPhotos.size > 0 && (
              <>
                <Divider />
                <Group wrap="wrap">
                  <Button
                    size="sm"
                    variant="light"
                    color="blue"
                    leftSection={<IconArrowRight size={16} />}
                    onClick={() => {
                      const firstSelectedId = Array.from(selectedPhotos)[0];
                      setMovingPhotoId(firstSelectedId);
                      openMoveModal();
                    }}
                  >
                    {t('photosUploader.changeCategory')}
                  </Button>
                  <Button
                    size="sm"
                    variant="light"
                    color="red"
                    leftSection={<IconTrash size={16} />}
                    onClick={openDeleteSelectedModal}
                    loading={deletingSelected}
                  >
                    {t('photosUploader.deleteSelected', { count: selectedPhotos.size })}
                  </Button>
                </Group>
              </>
            )}
          </Stack>
        </Paper>
      )}

      {/* Upload Section */}
      {!viewMode && (
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Stack gap="lg">
            <Group>
              <ThemeIcon size="lg" radius="md" variant="light" color="blue">
                <IconUpload size={20} />
              </ThemeIcon>
              <div>
                <Text fw={600} size="lg">
                  {t('photosUploader.uploadingPhotos')}
                </Text>
                <Text size="sm" c="dimmed">
                  {isCreatingMode 
                    ? t('photosUploader.uploadInfoCreating')
                    : t('photosUploader.uploadInfo')
                  }
                </Text>
              </div>
            </Group>

            <Divider />

            {/* Category Selection */}
            <Stack gap="md">
              <Group justify="space-between">
                <Text fw={500}>{t('photosUploader.selectCategory')}</Text>
                {selectedCategory.startsWith('bedroom-') && (
                  <Button
                    size="xs"
                    variant="light"
                    leftSection={<IconPlus size={14} />}
                    onClick={handleAddBedroom}
                  >
                    {t('photosUploader.addBedroom')}
                  </Button>
                )}
              </Group>

              <SimpleGrid cols={{ base: 2, xs: 3, sm: 4, md: 5 }} spacing="xs">
                {categories.map((cat) => {
                  const isSelected = selectedCategory === cat.value;
                  const photoCount = groupedPhotos[cat.value]?.length || 0;
                  const tempPhotoCount = tempPhotos.filter(p => p.category === cat.value).length;
                  const totalCount = photoCount + tempPhotoCount;
                  const Icon = getCategoryIcon(cat.value);

                  return (
                    <Box key={cat.value} pos="relative">
                      <Button
                        variant={isSelected ? 'filled' : 'light'}
                        color={cat.color}
                        onClick={() => setSelectedCategory(cat.value)}
                        fullWidth
                        styles={{
                          root: {
                            height: 'auto',
                            padding: isMobile ? '8px 4px' : '12px 8px'
                          },
                          inner: {
                            flexDirection: 'column',
                            gap: 4
                          }
                        }}
                      >
                        <Icon size={isMobile ? 18 : 24} />
                        <Text size={isMobile ? 'xs' : 'sm'} ta="center" lineClamp={1}>
                          {cat.label}
                        </Text>
                        {totalCount > 0 && (
                          <Badge size="sm" variant="filled" color={cat.color}>
                            {totalCount}
                          </Badge>
                        )}
                      </Button>

                      {cat.value.startsWith('bedroom-') && totalCount === 0 && bedroomCount > 1 && (
                        <Tooltip label={t('photosUploader.removeBedroom')}>
                          <ActionIcon
                            color="red"
                            variant="filled"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveBedroom(parseInt(cat.value.split('-')[1]));
                            }}
                            style={{
                              position: 'absolute',
                              top: -6,
                              right: -6,
                              zIndex: 1
                            }}
                          >
                            <IconMinus size={14} />
                          </ActionIcon>
                        </Tooltip>
                      )}
                    </Box>
                  );
                })}
              </SimpleGrid>
            </Stack>

            {/* Upload Button */}
            <FileButton onChange={handleFileSelect} accept="image/*" multiple>
              {(props) => (
                <Button
                  {...props}
                  size="lg"
                  variant="gradient"
                  gradient={{ from: 'blue', to: 'cyan', deg: 90 }}
                  leftSection={<IconUpload size={20} />}
                  disabled={uploading}
                  fullWidth
                >
                  {uploading 
                    ? t('photosUploader.uploadingProgress', { percent: uploadProgress }) 
                    : t('photosUploader.selectFiles')
                  }
                </Button>
              )}
            </FileButton>

            {uploading && (
              <Progress value={uploadProgress} size="lg" radius="xl" striped animated />
            )}
          </Stack>
        </Card>
      )}

      {/* Temporary Photos (Creation Mode) */}
      {isCreatingMode && tempPhotos.length > 0 && (
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          <Stack gap="md">
            <Group justify="space-between">
              <Group gap="sm">
                <ThemeIcon size="lg" radius="md" variant="light" color="orange">
                  <IconPhoto size={20} />
                </ThemeIcon>
                <div>
                  <Text fw={600}>{t('photosUploader.photosForUpload')}</Text>
                  <Badge variant="light" color="orange">
                    {t('photosUploader.willBeUploadedAfterSave')}
                  </Badge>
                </div>
              </Group>
              <Badge size="lg" variant="filled" color="blue">
                {tempPhotos.length}
              </Badge>
            </Group>

            <SimpleGrid cols={{ base: 2, sm: 3, md: 4, lg: 5 }} spacing="md">
              {tempPhotos.map((photo, index) => (
                <Paper key={index} pos="relative" radius="md" style={{ overflow: 'hidden' }}>
                  <Image
                    src={photo.preview}
                    alt={`Temp ${index + 1}`}
                    height={180}
                    fit="cover"
                    style={{ border: '2px dashed var(--mantine-color-blue-6)' }}
                  />
                  
                  <Badge
                    variant="filled"
                    color="blue"
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8
                    }}
                  >
                    {categories.find(c => c.value === photo.category)?.label}
                  </Badge>

                  <Badge
                    variant="filled"
                    color="dark"
                    style={{
                      position: 'absolute',
                      bottom: 8,
                      left: 8
                    }}
                  >
                    #{index + 1}
                  </Badge>

                  {!viewMode && (
                    <ActionIcon
                      color="red"
                      variant="filled"
                      onClick={() => handleDeleteTempPhoto(index)}
                      style={{
                        position: 'absolute',
                        bottom: 8,
                        right: 8
                      }}
                    >
                      <IconTrash size={16} />
                    </ActionIcon>
                  )}
                </Paper>
              ))}
            </SimpleGrid>
          </Stack>
        </Card>
      )}

      {/* Empty State */}
      {!isCreatingMode && localPhotos.length === 0 && tempPhotos.length === 0 ? (
        <Paper shadow="sm" p="xl" radius="md" withBorder>
          <Center>
            <Stack align="center" gap="md">
              <ThemeIcon size={80} radius="xl" variant="light" color="gray">
                <IconPhoto size={40} />
              </ThemeIcon>
              <Text size="lg" c="dimmed" ta="center">
                {t('photosUploader.noPhotos')}
              </Text>
              <Text size="sm" c="dimmed" ta="center">
                {t('photosUploader.uploadPhotosInstruction')}
              </Text>
            </Stack>
          </Center>
        </Paper>
      ) : !isCreatingMode && localPhotos.length > 0 && (
        /* Photos Grid with Drag & Drop */
        <DragDropContext onDragEnd={handleDragEnd}>
          <Stack gap="md">
            {categories
              .filter(cat => groupedPhotos[cat.value])
              .map((category) => {
                const categoryPhotos = groupedPhotos[category.value];
                const isOpened = activeCategories.includes(category.value);
                const Icon = getCategoryIcon(category.value);

                return (
                  <Paper key={category.value} shadow="sm" radius="md" withBorder>
                    <Group
                      p="md"
                      justify="space-between"
                      onClick={() => {
                        setActiveCategories(prev =>
                          prev.includes(category.value)
                            ? prev.filter(c => c !== category.value)
                            : [...prev, category.value]
                        );
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <Group gap="sm">
                        <ThemeIcon size="lg" radius="md" variant="light" color={category.color}>
                          <Icon size={20} />
                        </ThemeIcon>
                        <Text fw={600}>{category.label}</Text>
                        <Badge variant="filled" color={category.color}>
                          {categoryPhotos.length}
                        </Badge>
                      </Group>
                      <ActionIcon variant="subtle" size="lg">
                        {isOpened ? <IconChevronUp size={20} /> : <IconChevronDown size={20} />}
                      </ActionIcon>
                    </Group>

                    <Collapse in={isOpened}>
                      <Divider />
                      <Droppable droppableId={category.value} direction="horizontal" isDropDisabled={viewMode}>
                        {(provided, snapshot) => (
                          <Box
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            p="md"
                            style={{
                              backgroundColor: snapshot.isDraggingOver 
                                ? 'var(--mantine-color-blue-0)' 
                                : 'transparent',
                              border: snapshot.isDraggingOver 
                                ? '2px dashed var(--mantine-color-blue-6)' 
                                : 'none',
                              borderRadius: 8,
                              minHeight: 200
                            }}
                          >
                            <SimpleGrid cols={{ base: 2, sm: 3, md: 4, lg: 5 }} spacing="md">
                              {categoryPhotos.map((photo, index) => (
                                <Draggable
                                  key={photo.id}
                                  draggableId={String(photo.id)}
                                  index={index}
                                  isDragDisabled={viewMode}
                                >
                                  {(provided, snapshot) => (
                                    <Paper
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      pos="relative"
                                      radius="md"
                                      style={{
                                        ...provided.draggableProps.style,
                                        opacity: snapshot.isDragging ? 0.5 : 1,
                                        overflow: 'hidden',
                                        cursor: viewMode ? 'default' : 'move'
                                      }}
                                    >
                                      <Checkbox
                                        checked={selectedPhotos.has(photo.id)}
                                        onChange={() => handleTogglePhoto(photo.id)}
                                        style={{
                                          position: 'absolute',
                                          top: 8,
                                          left: 8,
                                          zIndex: 10,
                                          background: 'rgba(0,0,0,0.6)',
                                          borderRadius: 4,
                                          padding: 4
                                        }}
                                        styles={{
                                          input: { cursor: 'pointer' }
                                        }}
                                      />

                                      <Image
                                        src={photo.photo_url}
                                        alt={`Photo ${photo.id}`}
                                        height={180}
                                        fit="cover"
                                      />

                                      {photo.is_primary && (
                                        <Badge
                                          variant="filled"
                                          color="yellow"
                                          leftSection={<IconStarFilled size={12} />}
                                          style={{
                                            position: 'absolute',
                                            top: 8,
                                            right: 8
                                          }}
                                        >
                                          {t('photosUploader.primary')}
                                        </Badge>
                                      )}

                                      <Badge
                                        variant="filled"
                                        color="dark"
                                        style={{
                                          position: 'absolute',
                                          bottom: 8,
                                          left: 8
                                        }}
                                      >
                                        #{index + 1}
                                      </Badge>

                                      {!viewMode && (
                                        <Group
                                          gap={4}
                                          justify="center"
                                          style={{
                                            position: 'absolute',
                                            bottom: 0,
                                            left: 0,
                                            right: 0,
                                            background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
                                            padding: '24px 8px 8px 8px'
                                          }}
                                        >
                                          {!photo.is_primary && (
                                            <Tooltip label={t('photosUploader.makePrimary')}>
                                              <ActionIcon
                                                variant="subtle"
                                                color="yellow"
                                                onClick={() => handleSetPrimary(photo.id)}
                                              >
                                                <IconStar size={16} />
                                              </ActionIcon>
                                            </Tooltip>
                                          )}
                                          
                                          <Tooltip label={
                                            selectedPhotos.has(photo.id) && selectedPhotos.size > 1
                                              ? t('photosUploader.moveMultiplePhotos', { count: selectedPhotos.size })
                                              : t('photosUploader.moveToCategory')
                                          }>
                                            <ActionIcon
                                              variant="subtle"
                                              color="blue"
                                              onClick={() => {
                                                setMovingPhotoId(photo.id);
                                                openMoveModal();
                                              }}
                                            >
                                              <IconArrowRight size={16} />
                                            </ActionIcon>
                                          </Tooltip>

                                          <Tooltip label={t('photosUploader.changePosition')}>
                                            <ActionIcon
                                              variant="subtle"
                                              color="cyan"
                                              onClick={() => {
                                                setPositionChangePhotoId(photo.id);
                                                setNewPosition(index + 1);
                                                openPositionModal();
                                              }}
                                            >
                                              <IconHash size={16} />
                                            </ActionIcon>
                                          </Tooltip>

                                          <Tooltip label={t('common.delete')}>
                                            <ActionIcon
                                              variant="subtle"
                                              color="red"
                                              onClick={() => {
                                                setDeletePhotoId(photo.id);
                                                openDeleteModal();
                                              }}
                                            >
                                              <IconTrash size={16} />
                                            </ActionIcon>
                                          </Tooltip>
                                        </Group>
                                      )}
                                    </Paper>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </SimpleGrid>
                          </Box>
                        )}
                      </Droppable>
                    </Collapse>
                  </Paper>
                );
              })}
          </Stack>
        </DragDropContext>
      )}

      {/* Delete Single Photo Modal */}
      <Modal
        opened={deleteModalOpened}
        onClose={() => {
          closeDeleteModal();
          setDeletePhotoId(null);
        }}
        title={t('photosUploader.deletePhoto')}
        centered
      >
        <Stack gap="md">
          <Text>{t('common.confirmDelete')}</Text>
          <Group justify="flex-end">
            <Button variant="subtle" onClick={() => {
              closeDeleteModal();
              setDeletePhotoId(null);
            }}>
              {t('common.no')}
            </Button>
            <Button color="red" onClick={handleDeletePhotoConfirm}>
              {t('common.yes')}
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Delete Selected Photos Modal */}
      <Modal
        opened={deleteSelectedModalOpened}
        onClose={closeDeleteSelectedModal}
        title={t('photosUploader.deleteSelectedPhotos')}
        centered
      >
        <Stack gap="md">
          <Text>
            {t('photosUploader.confirmDeleteSelected', { count: selectedPhotos.size })}
          </Text>
          <Group justify="flex-end">
            <Button variant="subtle" onClick={closeDeleteSelectedModal}>
              {t('common.no')}
            </Button>
            <Button color="red" onClick={handleDeleteSelectedConfirm} loading={deletingSelected}>
              {t('common.yes')}
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Move Photo Modal */}
      <Modal
        opened={moveModalOpened}
        onClose={() => {
          closeMoveModal();
          setMovingPhotoId(null);
        }}
        title={
          movingPhotoId && selectedPhotos.has(movingPhotoId) && selectedPhotos.size > 1
            ? t('photosUploader.moveSelectedPhotosTitle', { count: selectedPhotos.size })
            : t('photosUploader.movePhotoTitle')
        }
        size="lg"
        centered
      >
        <Stack gap="md">
          {movingPhotoId && selectedPhotos.has(movingPhotoId) && selectedPhotos.size > 1 && (
            <Alert icon={<IconInfoCircle size={18} />} color="blue" variant="light">
              {t('photosUploader.willBeMoved', { count: selectedPhotos.size })}
            </Alert>
          )}

          <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="md">
            {categories.map((cat) => {
              const Icon = getCategoryIcon(cat.value);
              const isCurrentCategory = movingPhotoId ? getPhotoCategory(movingPhotoId) === cat.value : false;
              
              return (
                <Button
                  key={cat.value}
                  variant={isCurrentCategory ? 'filled' : 'light'}
                  color={cat.color}
                  onClick={() => movingPhotoId && handleMovePhoto(movingPhotoId, cat.value)}
                  disabled={Boolean(isCurrentCategory)}
                  styles={{
                    root: { height: 'auto', padding: '12px 8px' },
                    inner: { flexDirection: 'column', gap: 4 }
                  }}
                >
                  <Icon size={24} />
                  <Text size="sm" ta="center">
                    {cat.label}
                  </Text>
                </Button>
              );
            })}
          </SimpleGrid>
        </Stack>
      </Modal>

      {/* Change Position Modal */}
      <Modal
        opened={positionModalOpened}
        onClose={() => {
          closePositionModal();
          setPositionChangePhotoId(null);
          setNewPosition('');
        }}
        title={t('photosUploader.changePositionTitle')}
        centered
      >
        <Stack gap="md">
          <Text size="sm">
            {t('photosUploader.enterNewPosition')}
          </Text>
          <NumberInput
            label={t('photosUploader.position')}
            placeholder="1"
            min={1}
            max={positionChangePhotoId ? (groupedPhotos[getPhotoCategory(positionChangePhotoId)]?.length || 1) : 1}
            value={newPosition}
            onChange={setNewPosition}
            styles={{
              input: { fontSize: '16px' }
            }}
          />
          <Group justify="flex-end">
            <Button variant="subtle" onClick={() => {
              closePositionModal();
              setPositionChangePhotoId(null);
              setNewPosition('');
            }}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleChangePosition}>
              {t('photosUploader.change')}
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* ✅ ПЕРЕРАБОТАННОЕ: Модальное окно импорта */}
      <Modal
        opened={importModalOpened}
        onClose={() => {
          closeImportModal();
          setImportUrl('');
          setImportType(null);
          setUrlError('');
        }}
        title={
          <Group gap="sm">
            <ThemeIcon 
              size="lg" 
              radius="md" 
              variant="gradient"
              gradient={importType === 'drive' ? 
                { from: 'red', to: 'orange', deg: 45 } : 
                { from: 'blue', to: 'cyan', deg: 45 }
              }
            >
              {importType === 'drive' ? <IconBrandGoogle size={20} /> : <IconBrandDropbox size={20} />}
            </ThemeIcon>
            <Text fw={600}>
              {importType === 'drive' ? 'Google Drive' : 'Dropbox'}
            </Text>
          </Group>
        }
        size="lg"
        centered
      >
        <Stack gap="lg">
          {/* Инструкции */}
          <Alert color="blue" variant="light" icon={<IconInfoCircle size={16} />}>
            <Text size="sm" fw={500} mb={4}>
              {importType === 'drive' 
                ? t('photosUploader.howToImportDrive')
                : t('photosUploader.howToImportDropbox')
              }
            </Text>
            <Text size="xs" c="dimmed">
              {importType === 'drive' 
                ? t('photosUploader.driveInstructions')
                : t('photosUploader.dropboxInstructions')
              }
            </Text>
          </Alert>

          {/* Поле ввода с кнопкой вставки */}
          <Box>
            <TextInput
              label={t('photosUploader.pasteLink')}
              placeholder={importType === 'drive' 
                ? 'https://drive.google.com/drive/folders/...'
                : 'https://www.dropbox.com/...'
              }
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
              size="md"
              error={urlError}
              rightSection={
                <Tooltip label={t('photosUploader.pasteFromClipboard')}>
                  <ActionIcon
                    variant="subtle"
                    color="blue"
                    onClick={handlePasteFromClipboard}
                    size="lg"
                  >
                    <IconClipboard size={18} />
                  </ActionIcon>
                </Tooltip>
              }
              rightSectionWidth={50}
              styles={{
                input: { fontSize: '14px', paddingRight: 50 }
              }}
            />
            <Text size="xs" c="dimmed" mt={4}>
              {t('photosUploader.clickPasteButton')}
            </Text>
          </Box>

          {/* Примеры ссылок */}
          <Paper p="sm" radius="md" bg="dark.6">
            <Text size="xs" fw={500} mb={8} c="dimmed">
              {t('photosUploader.exampleLinks')}:
            </Text>
            <Stack gap={4}>
              {importType === 'drive' ? (
                <>
                  <Text size="xs" c="dimmed" ff="monospace">
                    drive.google.com/drive/folders/xxxxx
                  </Text>
                  <Text size="xs" c="dimmed" ff="monospace">
                    drive.google.com/file/d/xxxxx/view
                  </Text>
                </>
              ) : (
                <>
                  <Text size="xs" c="dimmed" ff="monospace">
                    dropbox.com/scl/fo/xxxxx
                  </Text>
                  <Text size="xs" c="dimmed" ff="monospace">
                    dropbox.com/s/xxxxx
                  </Text>
                </>
              )}
            </Stack>
          </Paper>

          {/* Кнопки */}
          <Group justify="space-between">
            <Button
              variant="subtle"
              onClick={() => {
                closeImportModal();
                setImportUrl('');
                setImportType(null);
                setUrlError('');
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleStartImport}
              disabled={!importUrl.trim() || !!urlError}
              leftSection={importType === 'drive' ? <IconBrandGoogle size={18} /> : <IconBrandDropbox size={18} />}
              variant="gradient"
              gradient={importType === 'drive' ? 
                { from: 'red', to: 'orange', deg: 45 } : 
                { from: 'blue', to: 'cyan', deg: 45 }
              }
            >
              {t('photosUploader.startImport')}
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* ✅ CSS для анимации */}
      <style>{`
        @keyframes rotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        .rotating-icon {
          animation: rotate 2s linear infinite;
        }
      `}</style>
    </Stack>
  );
};

export default PhotosUploader;