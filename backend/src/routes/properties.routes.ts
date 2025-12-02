// backend/src/routes/properties.routes.ts
import { Router } from 'express';
import propertiesController from '../controllers/properties.controller';
import { 
  authenticate, 
  requirePermission,
  canEditProperty,
  requireSuperAdmin,
  authenticateAdminOrOwner,
  canEditPropertyUniversal
} from '../middlewares/auth.middleware';
import { 
  uploadPropertyPhotos, 
  uploadFloorPlan, 
  uploadVRPanorama,
  uploadVideo 
} from '../config/upload.config';
import { generatePreviewUrl } from '../utils/previewToken';
import logger from '../utils/logger';
import db from '../config/database';

const router = Router();

// Основные CRUD операции
router.get('/', authenticate, requirePermission('properties.read'), propertiesController.getAll.bind(propertiesController));
router.get('/owners/unique', authenticate, requirePermission('properties.update'), propertiesController.getUniqueOwners.bind(propertiesController));

// ⚠️ ВАЖНО: Специфичные роуты ПЕРЕД общим роутом /:id
// Preview URL - ДОЛЖЕН БЫТЬ ПЕРЕД /:id
router.get(
  '/:id/preview-url',
  authenticate,
  async (req: any, res: any) => {
    try {
      const { id } = req.params;
      const previewUrl = generatePreviewUrl(id);
      
      res.json({
        success: true,
        data: {
          previewUrl
        }
      });
    } catch (error) {
      console.error('Error generating preview URL:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate preview URL'
      });
    }
  }
);

// Prices route - ПЕРЕД /:id
router.get('/:id/prices', propertiesController.getPropertyPrices.bind(propertiesController));

// Общий роут для получения по ID - ДОЛЖЕН БЫТЬ ПОСЛЕ специфичных роутов
router.get('/:id', authenticate, requirePermission('properties.read'), propertiesController.getById.bind(propertiesController));

router.post('/', authenticate, requirePermission('properties.create'), propertiesController.create.bind(propertiesController));
router.put('/:id', authenticate, canEditProperty, propertiesController.update.bind(propertiesController));

// Удаление и изменение статуса
router.delete('/:id', authenticate, requireSuperAdmin, propertiesController.delete.bind(propertiesController));
router.post('/:id/restore', authenticate, requireSuperAdmin, propertiesController.restore.bind(propertiesController));
router.patch('/:id/visibility', authenticate, requireSuperAdmin, propertiesController.toggleVisibility.bind(propertiesController));

// Скачать фотографии
router.post('/:id/photos/download', authenticate, requirePermission('properties.read'), propertiesController.downloadPhotos.bind(propertiesController));

// Фотографии
router.post(
  '/:id/photos', 
  authenticate, 
  canEditProperty,
  uploadPropertyPhotos.array('photos', 200), 
  propertiesController.uploadPhotos.bind(propertiesController)
);
router.delete(
  '/:id/photos/:photoId',
  authenticate, 
  canEditProperty,
  propertiesController.deletePhoto.bind(propertiesController)
);
router.put(
  '/:id/photos/reorder', 
  authenticate, 
  canEditProperty,
  propertiesController.updatePhotosOrder.bind(propertiesController)
);
router.patch(
  '/:id/photos/:photoId/primary',
  authenticate, 
  canEditProperty,
  propertiesController.setPrimaryPhoto.bind(propertiesController)
);

// ✅ НОВОЕ: Импорт медиа из Google Drive и Dropbox
router.post(
  '/:id/import-from-drive',
  authenticate,
  canEditProperty,
  async (req: any, res: any) => {
    try {
      const { id } = req.params;
      const { driveUrl } = req.body;

      if (!driveUrl) {
        return res.status(400).json({
          success: false,
          message: 'Не указана ссылка на Google Drive'
        });
      }

      // Проверяем существование объекта
      const property = await db.queryOne(
        'SELECT id FROM properties WHERE id = ? AND deleted_at IS NULL',
        [id]
      );

      if (!property) {
        return res.status(404).json({
          success: false,
          message: 'Объект не найден'
        });
      }

      // Запускаем импорт асинхронно
      const mediaImportService = require('../services/mediaImport.service').default;
      mediaImportService.importFromGoogleDrive(parseInt(id), driveUrl);

      res.status(202).json({
        success: true,
        message: 'Импорт из Google Drive начат. Проверяйте статус через /import-status'
      });
    } catch (error: any) {
      logger.error('Start Google Drive import error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Ошибка запуска импорта'
      });
    }
  }
);

router.post(
  '/:id/import-from-dropbox',
  authenticate,
  canEditProperty,
  async (req: any, res: any) => {
    try {
      const { id } = req.params;
      const { dropboxUrl } = req.body;

      if (!dropboxUrl) {
        return res.status(400).json({
          success: false,
          message: 'Не указана ссылка на Dropbox'
        });
      }

      // Проверяем существование объекта
      const property = await db.queryOne(
        'SELECT id FROM properties WHERE id = ? AND deleted_at IS NULL',
        [id]
      );

      if (!property) {
        return res.status(404).json({
          success: false,
          message: 'Объект не найден'
        });
      }

      // Запускаем импорт асинхронно
      const mediaImportService = require('../services/mediaImport.service').default;
      mediaImportService.importFromDropbox(parseInt(id), dropboxUrl);

      res.status(202).json({
        success: true,
        message: 'Импорт из Dropbox начат. Проверяйте статус через /import-status'
      });
    } catch (error: any) {
      logger.error('Start Dropbox import error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Ошибка запуска импорта'
      });
    }
  }
);

// Получение статуса импорта
router.get(
  '/:id/import-status',
  authenticate,
  requirePermission('properties.read'),
  async (req: any, res: any) => {
    try {
      const { id } = req.params;
      
      const mediaImportService = require('../services/mediaImport.service').default;
      const status = mediaImportService.getImportStatus(parseInt(id));

      res.json({
        success: true,
        data: status
      });
    } catch (error: any) {
      logger.error('Get import status error:', error);
      res.status(500).json({
        success: false,
        message: 'Ошибка получения статуса'
      });
    }
  }
);

// Планировка
router.post(
  '/:id/floor-plan', 
  authenticate, 
  canEditProperty,
  uploadFloorPlan.single('floorPlan'), 
  propertiesController.uploadFloorPlan.bind(propertiesController)
);

// VR панорамы
router.get(
  '/:id/vr-panoramas', 
  authenticate, 
  requirePermission('properties.read'),
  propertiesController.getVRPanoramas.bind(propertiesController)
);
router.post(
  '/:id/vr-panoramas', 
  authenticate, 
  canEditProperty,
  uploadVRPanorama.fields([
    { name: 'front', maxCount: 1 },
    { name: 'back', maxCount: 1 },
    { name: 'left', maxCount: 1 },
    { name: 'right', maxCount: 1 },
    { name: 'top', maxCount: 1 },
    { name: 'bottom', maxCount: 1 }
  ]), 
  propertiesController.createVRPanorama.bind(propertiesController)
);
router.delete(
  '/:id/vr-panoramas/:panoramaId',
  authenticate, 
  canEditProperty,
  propertiesController.deleteVRPanorama.bind(propertiesController)
);

// Видео
router.post(
  '/:id/videos',
  authenticate,
  canEditProperty,
  uploadVideo.array('videos', 10),
  propertiesController.uploadVideos.bind(propertiesController)
);
router.delete(
  '/:id/videos/:videoId',
  authenticate,
  canEditProperty,
  propertiesController.deleteVideo.bind(propertiesController)
);
router.put(
  '/:id/videos/:videoId',
  authenticate,
  canEditProperty,
  propertiesController.updateVideo.bind(propertiesController)
);

// Цены (доступно админам и владельцам)
router.get(
  '/:id/pricing-details', 
  authenticateAdminOrOwner,
  propertiesController.getPricingDetails.bind(propertiesController)
);

router.put(
  '/:id/monthly-pricing',
  authenticateAdminOrOwner,
  canEditPropertyUniversal,
  propertiesController.updateMonthlyPricing.bind(propertiesController)
);

// Календарь (доступно админам и владельцам)
router.get(
  '/:id/calendar', 
  authenticateAdminOrOwner,
  propertiesController.getCalendar.bind(propertiesController)
);

router.post(
  '/:id/calendar/block',
  authenticateAdminOrOwner,
  canEditPropertyUniversal,
  propertiesController.addBlockedPeriod.bind(propertiesController)
);

router.delete(
  '/:id/calendar/block',
  authenticateAdminOrOwner,
  canEditPropertyUniversal,
  propertiesController.removeBlockedDates.bind(propertiesController)
);

router.get(
  '/:id/ics',
  authenticateAdminOrOwner,
  propertiesController.getICSInfo.bind(propertiesController)
);

// Внешние календари (доступно админам и владельцам)
router.post(
  '/:id/external-calendars/analyze',
  authenticateAdminOrOwner,
  propertiesController.analyzeExternalCalendars.bind(propertiesController)
);

router.post(
  '/:id/external-calendars/sync',
  authenticateAdminOrOwner,
  canEditPropertyUniversal,
  propertiesController.syncExternalCalendars.bind(propertiesController)
);

router.get(
  '/:id/external-calendars',
  authenticateAdminOrOwner,
  propertiesController.getExternalCalendars.bind(propertiesController)
);

router.post(
  '/:id/external-calendars',
  authenticateAdminOrOwner,
  canEditPropertyUniversal,
  propertiesController.addExternalCalendar.bind(propertiesController)
);

router.patch(
  '/:id/external-calendars/:calendarId/toggle',
  authenticateAdminOrOwner,
  canEditPropertyUniversal,
  propertiesController.toggleExternalCalendar.bind(propertiesController)
);

router.delete(
  '/:id/external-calendars/:calendarId',
  authenticateAdminOrOwner,
  canEditPropertyUniversal,
  propertiesController.removeExternalCalendar.bind(propertiesController)
);

// AI Generation routes
router.get(
  '/:id/ai-generation/readiness',
  authenticate,
  requirePermission('properties.read'),
  propertiesController.checkAIGenerationReadiness.bind(propertiesController)
);

router.post(
  '/:id/ai-generation/generate',
  authenticate,
  canEditProperty,
  propertiesController.generateAIDescription.bind(propertiesController)
);

// AI создание объекта
router.post('/create-with-ai', authenticate, requirePermission('properties.create'), propertiesController.createWithAI.bind(propertiesController));
router.post('/save-from-ai', authenticate, requirePermission('properties.create'), propertiesController.saveFromAI.bind(propertiesController));

// Генерация HTML презентации
router.post(
  '/:id/generate-html',
  authenticate,
  propertiesController.generateHTML.bind(propertiesController)
);

export default router;