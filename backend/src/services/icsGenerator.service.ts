// backend/src/services/icsGenerator.service.ts
import fs from 'fs-extra';
import path from 'path';
import logger from '../utils/logger';

interface CalendarEvent {
  blocked_date: string;
  reason: string | null;
}

class ICSGeneratorService {
  private icsDirectory = path.join('/var/www/www-root/data/www/admin.novaestate.company/backend/public', 'ics');

  constructor() {
    this.ensureICSDirectory();
  }

  private async ensureICSDirectory() {
    try {
      await fs.ensureDir(this.icsDirectory);
      logger.info('ICS directory ensured at:', this.icsDirectory);
    } catch (error) {
      logger.error('Failed to create ICS directory:', error);
    }
  }

  /**
   * Генерирует безопасное имя файла из названия объекта
   */
  private sanitizePropertyName(propertyName: string | null): string {
    if (!propertyName) return 'Property';
    
    // Убираем все символы, кроме букв, цифр и пробелов
    // Заменяем пробелы на подчеркивание
    return propertyName
      .replace(/[^a-zA-Z0-9а-яА-ЯёЁ\s]/g, '')
      .replace(/\s+/g, '_')
      .substring(0, 50) // Ограничиваем длину
      || 'Property';
  }

  /**
   * Генерирует .ics файл для объекта
   * НОВЫЙ ФОРМАТ: PropertyName_PropertyID.ics
   */
  async generateICSFile(
    propertyId: number,
    propertyName: string | null,
    events: CalendarEvent[]
  ): Promise<{ filename: string; filepath: string; url: string }> {
    const safeName = this.sanitizePropertyName(propertyName);
    const filename = `${safeName}_${propertyId}.ics`;
    const filepath = path.join(this.icsDirectory, filename);
    const url = `/ics/${filename}`;

    // Генерируем содержимое .ics файла
    const icsContent = this.generateICSContent(propertyName || `Property ${propertyId}`, events);

    // Сохраняем файл
    await fs.writeFile(filepath, icsContent, 'utf-8');

    logger.info(`ICS file generated: ${filename} with ${events.length} events`);

    return {
      filename,
      filepath,
      url
    };
  }

  /**
   * Генерирует содержимое .ics файла в формате iCalendar
   */
  private generateICSContent(propertyIdentifier: string, events: CalendarEvent[]): string {
    const now = new Date();
    const timestamp = this.formatDateTimeForICS(now);

    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//NovaEstate//Property Calendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      `X-WR-CALNAME:${this.escapeICSText(propertyIdentifier)} - Blocked Dates`,
      'X-WR-TIMEZONE:Asia/Bangkok',
      'X-WR-CALDESC:Blocked dates for property rental'
    ].join('\r\n');

    // Группируем события по непрерывным периодам
    const groupedEvents = this.groupConsecutiveDates(events);

    groupedEvents.forEach((group, index) => {
      const eventId = `${propertyIdentifier}-${index}-${timestamp}`;
      const startDate = this.formatDateOnlyForICS(new Date(group.startDate));
      const endDate = this.formatDateOnlyForICS(new Date(new Date(group.endDate).getTime() + 86400000)); // +1 день
      const summary = group.reason || 'Blocked';
      const description = group.reason || 'This property is blocked for the selected dates';

      icsContent += '\r\n';
      icsContent += [
        'BEGIN:VEVENT',
        `UID:${eventId}@admin.novaestate.company`,
        `DTSTAMP:${timestamp}`,
        `DTSTART;VALUE=DATE:${startDate}`,
        `DTEND;VALUE=DATE:${endDate}`,
        `SUMMARY:${this.escapeICSText(summary)}`,
        `DESCRIPTION:${this.escapeICSText(description)}`,
        'STATUS:CONFIRMED',
        'TRANSP:OPAQUE',
        'END:VEVENT'
      ].join('\r\n');
    });

    icsContent += '\r\nEND:VCALENDAR';
    return icsContent;
  }

  /**
   * Группирует последовательные даты в периоды
   */
  private groupConsecutiveDates(events: CalendarEvent[]): Array<{
    startDate: string;
    endDate: string;
    reason: string | null;
  }> {
    if (events.length === 0) return [];

    const sorted = [...events].sort((a, b) => 
      new Date(a.blocked_date).getTime() - new Date(b.blocked_date).getTime()
    );

    const groups: Array<{ startDate: string; endDate: string; reason: string | null }> = [];
    let currentGroup = {
      startDate: sorted[0].blocked_date,
      endDate: sorted[0].blocked_date,
      reason: sorted[0].reason
    };

    for (let i = 1; i < sorted.length; i++) {
      const currentDate = new Date(sorted[i].blocked_date);
      const previousDate = new Date(sorted[i - 1].blocked_date);
      const dayDiff = (currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24);

      if (dayDiff === 1 && sorted[i].reason === currentGroup.reason) {
        currentGroup.endDate = sorted[i].blocked_date;
      } else {
        groups.push({ ...currentGroup });
        currentGroup = {
          startDate: sorted[i].blocked_date,
          endDate: sorted[i].blocked_date,
          reason: sorted[i].reason
        };
      }
    }

    groups.push(currentGroup);
    return groups;
  }

  /**
   * Форматирует дату и время в формат ICS (для DTSTAMP)
   */
  private formatDateTimeForICS(date: Date): string {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');

    return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
  }

  /**
   * Форматирует только дату в формат ICS (YYYYMMDD)
   */
  private formatDateOnlyForICS(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}${month}${day}`;
  }

  /**
   * Экранирует специальные символы для .ics
   */
  private escapeICSText(text: string): string {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n');
  }

  /**
   * Удаляет .ics файл
   */
  async deleteICSFile(filepath: string): Promise<void> {
    try {
      if (await fs.pathExists(filepath)) {
        await fs.remove(filepath);
        logger.info('ICS file deleted:', filepath);
      }
    } catch (error) {
      logger.error('Failed to delete ICS file:', error);
    }
  }
}

export default new ICSGeneratorService();