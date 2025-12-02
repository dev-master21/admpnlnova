// backend/src/services/mediaImport.service.ts
import { google } from 'googleapis';
import axios from 'axios';
import path from 'path';
import fs from 'fs-extra';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger';
import db from '../config/database';
import { imageProcessorService } from './imageProcessor.service';

const unzipper = require('unzipper');

interface ImportStatus {
  status: 'initializing' | 'downloading' | 'processing' | 'completed' | 'error';
  message: string;
  processed: number;
  total: number;
  photos: number;
  videos: number;
  errors: number;
  errorDetails: string[];
  startTime: number;
  duration?: number;
}

class MediaImportService {
  private driveClient: any = null;
  private importStatuses: Map<string, ImportStatus> = new Map();
  
  // ✅ НОВОЕ: Базовый путь для сохранения файлов
  private readonly UPLOADS_BASE_PATH = '/var/www/www-root/data/www/novaestate.company/backend/uploads/properties';

  constructor() {
    this.initializeGoogleDrive();
  }

  /**
   * Инициализация Google Drive API (синхронно)
   */
  private initializeGoogleDrive() {
    try {
      const credentialsPath = path.join(process.cwd(), 'credentials', 'google-drive-credentials.json');
      
      logger.info(`Attempting to load Google Drive credentials from: ${credentialsPath}`);
      
      if (!fs.existsSync(credentialsPath)) {
        logger.error(`Google Drive credentials file not found at: ${credentialsPath}`);
        logger.error(`Current working directory: ${process.cwd()}`);
        logger.error(`Directory contents: ${JSON.stringify(fs.readdirSync(path.join(process.cwd(), 'credentials')))}`);
        return;
      }

      const credentials = fs.readJsonSync(credentialsPath);
      
      if (!credentials.client_email || !credentials.private_key) {
        logger.error('Invalid credentials format: missing client_email or private_key');
        return;
      }

      logger.info(`Loading credentials for service account: ${credentials.client_email}`);

      this.driveClient = new google.auth.JWT({
        email: credentials.client_email,
        key: credentials.private_key,
        scopes: ['https://www.googleapis.com/auth/drive.readonly']
      });

      logger.info('Google Drive API client initialized successfully');
    } catch (error: any) {
      logger.error('Error initializing Google Drive API:', error.message);
      logger.error('Stack trace:', error.stack);
    }
  }

  /**
   * Получить статус импорта
   */
  getImportStatus(propertyId: number): ImportStatus {
    const key = `property_${propertyId}`;
    return this.importStatuses.get(key) || {
      status: 'initializing',
      message: 'Импорт не начат',
      processed: 0,
      total: 0,
      photos: 0,
      videos: 0,
      errors: 0,
      errorDetails: [],
      startTime: Date.now()
    };
  }

  /**
   * Обновить статус импорта
   */
  private updateStatus(propertyId: number, updates: Partial<ImportStatus>) {
    const key = `property_${propertyId}`;
    const current = this.getImportStatus(propertyId);
    this.importStatuses.set(key, { ...current, ...updates });
  }

  /**
   * Импорт из Google Drive
   */
async importFromGoogleDrive(propertyId: number, driveUrl: string): Promise<void> {
  const key = `property_${propertyId}`;
  
  try {
    // ✅ ИСПРАВЛЕНИЕ: Полностью сбрасываем статус перед новым импортом
    this.importStatuses.set(key, {
      status: 'initializing',
      message: 'Инициализация импорта из Google Drive...',
      processed: 0,
      total: 0,
      photos: 0,
      videos: 0,
      errors: 0,
      errorDetails: [],
      startTime: Date.now()
    });

    if (!this.driveClient) {
      logger.error('Drive client is null');
      throw new Error('Google Drive API не инициализирован. Проверьте файл credentials/google-drive-credentials.json');
    }

      logger.info(`Starting Google Drive import for property ${propertyId}, URL: ${driveUrl}`);

      const fileId = this.extractGoogleDriveId(driveUrl);
      if (!fileId) {
        throw new Error('Неверный формат ссылки Google Drive');
      }

      logger.info(`Extracted file/folder ID: ${fileId}`);

      const drive = google.drive({ version: 'v3', auth: this.driveClient });
      
      let fileInfo;
      try {
        fileInfo = await drive.files.get({
          fileId,
          fields: 'name,mimeType'
        });
        logger.info(`File info retrieved: ${fileInfo.data.name}, type: ${fileInfo.data.mimeType}`);
      } catch (error: any) {
        logger.error('Error getting file info:', error.message);
        throw new Error('Не удалось получить информацию о файле. Проверьте права доступа к ссылке (должна быть открыта для всех)');
      }

      const isFolder = fileInfo.data.mimeType === 'application/vnd.google-apps.folder';

      let files: any[] = [];
      
      if (isFolder) {
        this.updateStatus(propertyId, {
          status: 'initializing',
          message: 'Получение списка файлов из папки...'
        });

        files = await this.listGoogleDriveFolderContents(fileId);
        logger.info(`Found ${files.length} files in folder`);
      } else {
        files = [{
          id: fileId,
          name: fileInfo.data.name,
          mimeType: fileInfo.data.mimeType
        }];
      }

      const mediaFiles = files.filter(file => {
        const mime = file.mimeType || '';
        return mime.startsWith('image/') || mime.startsWith('video/');
      });

      logger.info(`Found ${mediaFiles.length} media files (photos/videos)`);

      if (mediaFiles.length === 0) {
        throw new Error('В папке не найдено изображений или видео');
      }

      this.updateStatus(propertyId, {
        total: mediaFiles.length,
        message: `Найдено ${mediaFiles.length} файлов для импорта`
      });

      const tempDir = path.join(os.tmpdir(), `drive_import_${propertyId}_${Date.now()}`);
      await fs.ensureDir(tempDir);
      logger.info(`Created temp directory: ${tempDir}`);

      try {
        await this.downloadAndProcessGoogleDriveFiles(propertyId, mediaFiles, tempDir);

        const endTime = Date.now();
        const duration = (endTime - this.getImportStatus(propertyId).startTime) / 1000;

        const finalStatus = this.getImportStatus(propertyId);
        logger.info(`Import completed: ${finalStatus.photos} photos, ${finalStatus.videos} videos, ${finalStatus.errors} errors`);

        this.updateStatus(propertyId, {
          status: 'completed',
          message: 'Импорт успешно завершен',
          duration
        });

        setTimeout(() => {
          this.importStatuses.delete(key);
        }, 3600000);

      } finally {
        await fs.remove(tempDir).catch(err => 
          logger.error('Error removing temp directory:', err)
        );
      }

    } catch (error: any) {
      logger.error('Google Drive import error:', error.message);
      logger.error('Stack:', error.stack);
      
      this.updateStatus(propertyId, {
        status: 'error',
        message: `Ошибка импорта: ${error.message}`,
        errorDetails: [...this.getImportStatus(propertyId).errorDetails, error.message]
      });
      
      throw error;
    }
  }

  /**
   * Импорт из Dropbox
   */
async importFromDropbox(propertyId: number, dropboxUrl: string): Promise<void> {
  const key = `property_${propertyId}`;
  
  try {
    // ✅ ИСПРАВЛЕНИЕ: Полностью сбрасываем статус перед новым импортом
    this.importStatuses.set(key, {
      status: 'initializing',
      message: 'Инициализация импорта из Dropbox...',
      processed: 0,
      total: 0,
      photos: 0,
      videos: 0,
      errors: 0,
      errorDetails: [],
      startTime: Date.now()
    });

    logger.info(`Starting Dropbox import for property ${propertyId}, URL: ${dropboxUrl}`);
    
      const tempDir = path.join(os.tmpdir(), `dropbox_import_${propertyId}_${Date.now()}`);
      const extractDir = path.join(tempDir, 'extracted');
      await fs.ensureDir(tempDir);
      await fs.ensureDir(extractDir);

      try {
        this.updateStatus(propertyId, {
          status: 'downloading',
          message: 'Скачивание архива из Dropbox...'
        });

        const archivePath = path.join(tempDir, 'archive.zip');
        await this.downloadDropboxArchive(dropboxUrl, archivePath);
        logger.info(`Downloaded archive to: ${archivePath}`);

        this.updateStatus(propertyId, {
          status: 'processing',
          message: 'Распаковка архива...'
        });

        await this.extractZipArchive(archivePath, extractDir);
        logger.info(`Extracted archive to: ${extractDir}`);

        const mediaFiles = await this.getMediaFilesRecursively(extractDir);
        logger.info(`Found ${mediaFiles.length} media files in archive`);

        if (mediaFiles.length === 0) {
          throw new Error('В архиве не найдено изображений или видео');
        }

        this.updateStatus(propertyId, {
          total: mediaFiles.length,
          message: `Найдено ${mediaFiles.length} файлов для обработки`
        });

        await this.processLocalMediaFiles(propertyId, mediaFiles);

        const endTime = Date.now();
        const duration = (endTime - this.getImportStatus(propertyId).startTime) / 1000;

        const finalStatus = this.getImportStatus(propertyId);
        logger.info(`Import completed: ${finalStatus.photos} photos, ${finalStatus.videos} videos, ${finalStatus.errors} errors`);

        this.updateStatus(propertyId, {
          status: 'completed',
          message: 'Импорт успешно завершен',
          duration
        });

        setTimeout(() => {
          this.importStatuses.delete(key);
        }, 3600000);

      } finally {
        await fs.remove(tempDir).catch(err =>
          logger.error('Error removing temp directory:', err)
        );
      }

    } catch (error: any) {
      logger.error('Dropbox import error:', error.message);
      logger.error('Stack:', error.stack);
      
      this.updateStatus(propertyId, {
        status: 'error',
        message: `Ошибка импорта: ${error.message}`,
        errorDetails: [...this.getImportStatus(propertyId).errorDetails, error.message]
      });
      
      throw error;
    }
  }

  /**
   * Извлечь ID из Google Drive URL
   */
  private extractGoogleDriveId(url: string): string | null {
    const patterns = [
      /\/file\/d\/([^/?]+)/,
      /\/folders\/([^/?]+)/,
      /[?&]id=([^&]+)/,
      /\/open\?id=([^&]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }

    return null;
  }

  /**
   * Получить список файлов из папки Google Drive
   */
  private async listGoogleDriveFolderContents(folderId: string): Promise<any[]> {
    const drive = google.drive({ version: 'v3', auth: this.driveClient });
    const files: any[] = [];

    let pageToken: string | undefined = undefined;

    do {
      const response: any = await drive.files.list({
        q: `'${folderId}' in parents and trashed = false`,
        fields: 'nextPageToken, files(id, name, mimeType, size)',
        pageSize: 1000,
        pageToken
      });

      files.push(...(response.data.files || []));
      pageToken = response.data.nextPageToken || undefined;
    } while (pageToken);

    return files;
  }

  /**
   * Скачать и обработать файлы из Google Drive
   */
  private async downloadAndProcessGoogleDriveFiles(
    propertyId: number,
    files: any[],
    tempDir: string
  ): Promise<void> {
    const drive = google.drive({ version: 'v3', auth: this.driveClient });
    const batchSize = 3;

    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);

      await Promise.all(batch.map(async (file) => {
        try {
          const ext = path.extname(file.name) || this.getExtensionFromMime(file.mimeType);
          const filename = `${uuidv4()}${ext}`;
          const filepath = path.join(tempDir, filename);

          logger.info(`Downloading file: ${file.name}`);

          const response = await drive.files.get(
            { fileId: file.id, alt: 'media' },
            { responseType: 'stream' }
          );

          await new Promise((resolve, reject) => {
            const dest = fs.createWriteStream(filepath);
            response.data
              .on('end', resolve)
              .on('error', reject)
              .pipe(dest);
          });

          logger.info(`Downloaded: ${file.name} -> ${filename}`);

          await this.processMediaFile(propertyId, filepath, file.name, file.mimeType);

          const status = this.getImportStatus(propertyId);
          this.updateStatus(propertyId, {
            processed: status.processed + 1,
            message: `Обработано ${status.processed + 1} из ${status.total} файлов`
          });

        } catch (error: any) {
          logger.error(`Error processing file ${file.name}:`, error.message);
          
          const status = this.getImportStatus(propertyId);
          this.updateStatus(propertyId, {
            errors: status.errors + 1,
            errorDetails: [...status.errorDetails, `${file.name}: ${error.message}`]
          });
        }
      }));
    }
  }

  /**
   * Скачать архив из Dropbox
   */
  private async downloadDropboxArchive(url: string, destinationPath: string): Promise<void> {
    const downloadUrl = this.getDropboxDownloadUrl(url);
    logger.info(`Downloading from Dropbox URL: ${downloadUrl}`);

    const response = await axios.get(downloadUrl, {
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      maxRedirects: 10
    });

    if (response.headers['content-type']?.includes('text/html')) {
      throw new Error('Dropbox вернул HTML вместо файла. Проверьте ссылку и права доступа.');
    }

    const buffer = Buffer.from(response.data);

    if (buffer.length < 4 || buffer[0] !== 0x50 || buffer[1] !== 0x4B) {
      throw new Error('Скачанный файл не является ZIP-архивом');
    }

    await fs.writeFile(destinationPath, buffer);
    logger.info(`Archive saved to: ${destinationPath}, size: ${buffer.length} bytes`);
  }

  /**
   * Получить URL для скачивания из Dropbox
   */
  private getDropboxDownloadUrl(url: string): string {
    if (url.includes('dropbox.com/scl/fo/')) {
      const hasQuery = url.includes('?');
      const hasDl = url.includes('dl=');
      if (hasDl) {
        return url.replace('dl=0', 'dl=1');
      }
      return `${url}${hasQuery ? '&' : '?'}dl=1`;
    }

    if (url.includes('dropbox.com/s/')) {
      return url.replace('www.dropbox.com/s/', 'dl.dropboxusercontent.com/s/');
    }

    const baseUrl = url.split('?')[0];
    return `${baseUrl}?dl=1`;
  }

  /**
   * Распаковать ZIP архив
   */
  private async extractZipArchive(zipPath: string, extractPath: string): Promise<void> {
    return new Promise((resolve) => {
      fs.createReadStream(zipPath)
        .pipe(unzipper.Extract({ path: extractPath }))
        .on('close', resolve)
        .on('error', (err: any) => {
          logger.error('ZIP extraction error:', err);
          resolve();
        });
    });
  }

  /**
   * Получить все медиафайлы рекурсивно из директории
   */
  private async getMediaFilesRecursively(dir: string): Promise<Array<{ path: string; name: string }>> {
    const files: Array<{ path: string; name: string }> = [];
    const items = await fs.readdir(dir, { withFileTypes: true });

    for (const item of items) {
      const itemPath = path.join(dir, item.name);

      if (item.isDirectory()) {
        files.push(...await this.getMediaFilesRecursively(itemPath));
      } else {
        const ext = path.extname(item.name).toLowerCase();
        const mediaExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.mp4', '.mov', '.avi', '.webm', '.mkv'];
        
        if (mediaExtensions.includes(ext)) {
          files.push({ path: itemPath, name: item.name });
        }
      }
    }

    return files;
  }

  /**
   * Обработать локальные медиафайлы
   */
  private async processLocalMediaFiles(
    propertyId: number,
    files: Array<{ path: string; name: string }>
  ): Promise<void> {
    const batchSize = 3;

    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);

      await Promise.all(batch.map(async (file) => {
        try {
          const mimeType = this.getMimeTypeFromExtension(path.extname(file.name));
          await this.processMediaFile(propertyId, file.path, file.name, mimeType);

          const status = this.getImportStatus(propertyId);
          this.updateStatus(propertyId, {
            processed: status.processed + 1,
            message: `Обработано ${status.processed + 1} из ${status.total} файлов`
          });

        } catch (error: any) {
          logger.error(`Error processing file ${file.name}:`, error.message);
          
          const status = this.getImportStatus(propertyId);
          this.updateStatus(propertyId, {
            errors: status.errors + 1,
            errorDetails: [...status.errorDetails, `${file.name}: ${error.message}`]
          });
        }
      }));
    }
  }

  /**
   * Обработать один медиафайл (фото или видео)
   */
  private async processMediaFile(
    propertyId: number,
    filepath: string,
    originalFilename: string,
    mimeType: string
  ): Promise<void> {
    const isVideo = mimeType.startsWith('video/');

    if (isVideo) {
      await this.processVideo(propertyId, filepath, originalFilename, mimeType);
      
      const status = this.getImportStatus(propertyId);
      this.updateStatus(propertyId, {
        videos: status.videos + 1
      });
    } else {
      await this.processPhoto(propertyId, filepath, originalFilename);
      
      const status = this.getImportStatus(propertyId);
      this.updateStatus(propertyId, {
        photos: status.photos + 1
      });
    }
  }

  /**
   * Обработать фотографию
   */
  private async processPhoto(
    propertyId: number,
    filepath: string,
    originalFilename: string
  ): Promise<void> {
    // ✅ ИСПРАВЛЕНО: используем путь к novaestate.company
    const uploadsDir = path.join(this.UPLOADS_BASE_PATH, 'photos');
    await fs.ensureDir(uploadsDir);

    const ext = path.extname(filepath);
    const filename = `${uuidv4()}${ext}`;
    const destPath = path.join(uploadsDir, filename);

    await fs.copy(filepath, destPath);
    await imageProcessorService.processImage(destPath);

    const maxOrder = await db.queryOne<any>(
      'SELECT COALESCE(MAX(sort_order), -1) as max_order FROM property_photos WHERE property_id = ? AND category = ?',
      [propertyId, 'general']
    );

    const sortOrder = (maxOrder?.max_order || -1) + 1;

    const dbPath = `/uploads/properties/photos/${filename}`;
    await db.query(
      `INSERT INTO property_photos (property_id, photo_url, category, sort_order, is_primary)
       VALUES (?, ?, ?, ?, ?)`,
      [propertyId, dbPath, 'general', sortOrder, false]
    );

    logger.info(`Photo imported: ${originalFilename} -> ${filename} (saved to ${destPath})`);
  }

  /**
   * Обработать видео
   */
  private async processVideo(
    propertyId: number,
    filepath: string,
    originalFilename: string,
    mimeType: string
  ): Promise<void> {
    const ffmpeg = require('fluent-ffmpeg');
    
    // ✅ ИСПРАВЛЕНО: используем путь к novaestate.company
    const uploadsDir = path.join(this.UPLOADS_BASE_PATH, 'videos');
    const thumbnailsDir = path.join(uploadsDir, 'thumbnails');
    
    await fs.ensureDir(uploadsDir);
    await fs.ensureDir(thumbnailsDir);

    const ext = path.extname(filepath);
    const filename = `${uuidv4()}${ext}`;
    const destPath = path.join(uploadsDir, filename);

    await fs.copy(filepath, destPath);

    const thumbnailFilename = `${path.parse(filename).name}.jpg`;
    const thumbnailPath = path.join(thumbnailsDir, thumbnailFilename);

    await new Promise<void>((resolve) => {
      ffmpeg(destPath)
        .screenshots({
          timestamps: ['00:00:01.000'],
          filename: thumbnailFilename,
          folder: thumbnailsDir,
          size: '400x?'
        })
        .on('end', () => resolve())
        .on('error', (err: any) => {
          logger.warn('Error creating video thumbnail:', err);
          resolve();
        });
    });

    const stats = await fs.stat(destPath);
    const fileSize = stats.size;

    let duration = 0;
    try {
      duration = await new Promise<number>((resolve, reject) => {
        ffmpeg.ffprobe(destPath, (err: any, metadata: any) => {
          if (err) reject(err);
          else resolve(metadata.format.duration || 0);
        });
      });
    } catch (err) {
      logger.warn('Could not get video duration:', err);
    }

    const maxOrder = await db.queryOne<any>(
      'SELECT COALESCE(MAX(sort_order), -1) as max_order FROM property_videos WHERE property_id = ?',
      [propertyId]
    );

    const sortOrder = (maxOrder?.max_order || -1) + 1;

    const videoUrl = `/uploads/properties/videos/${filename}`;
    const thumbnailUrl = await fs.pathExists(thumbnailPath) 
      ? `/uploads/properties/videos/thumbnails/${thumbnailFilename}`
      : null;

    await db.query(
      `INSERT INTO property_videos (property_id, video_url, title, file_size, duration, mime_type, thumbnail_url, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [propertyId, videoUrl, originalFilename, fileSize, duration, mimeType, thumbnailUrl, sortOrder]
    );

    logger.info(`Video imported: ${originalFilename} -> ${filename} (saved to ${destPath})`);
  }

  /**
   * Получить расширение из MIME типа
   */
  private getExtensionFromMime(mimeType: string): string {
    const mimeMap: { [key: string]: string } = {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'image/bmp': '.bmp',
      'video/mp4': '.mp4',
      'video/quicktime': '.mov',
      'video/x-msvideo': '.avi',
      'video/webm': '.webm',
      'video/x-matroska': '.mkv'
    };

    return mimeMap[mimeType] || '.jpg';
  }

  /**
   * Получить MIME тип из расширения
   */
  private getMimeTypeFromExtension(ext: string): string {
    const extMap: { [key: string]: string } = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.bmp': 'image/bmp',
      '.mp4': 'video/mp4',
      '.mov': 'video/quicktime',
      '.avi': 'video/x-msvideo',
      '.webm': 'video/webm',
      '.mkv': 'video/x-matroska'
    };

    return extMap[ext.toLowerCase()] || 'application/octet-stream';
  }
}

export default new MediaImportService();