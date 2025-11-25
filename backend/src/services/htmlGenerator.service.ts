import db from '../config/database';
import logger from '../utils/logger';
import fs from 'fs-extra';
import path from 'path';

interface HTMLGeneratorOptions {
  language: string;
  showRentalPrices: boolean;
  showSalePrices: boolean;
  includeSeasonalPrices: boolean;
  includeMonthlyPrices: boolean;
  includeYearlyPrice: boolean;
  forAgent?: boolean;
}

class HTMLGeneratorService {
  /**
   * Конвертировать изображение в base64
   */
  private async imageToBase64(imagePath: string): Promise<string> {
    try {
      const fullPath = path.join('/var/www/www-root/data/www/novaestate.company/backend', imagePath);
      
      if (!await fs.pathExists(fullPath)) {
        logger.warn(`Image not found: ${fullPath}`);
        return '';
      }

      const imageBuffer = await fs.readFile(fullPath);
      const base64 = imageBuffer.toString('base64');
      const ext = path.extname(imagePath).toLowerCase();
      
      let mimeType = 'image/jpeg';
      if (ext === '.png') mimeType = 'image/png';
      else if (ext === '.gif') mimeType = 'image/gif';
      else if (ext === '.webp') mimeType = 'image/webp';

      return `data:${mimeType};base64,${base64}`;
    } catch (error) {
      logger.error(`Error converting image to base64: ${imagePath}`, error);
      return '';
    }
  }

  /**
   * Получить логотип в base64
   */
  private getLogoBase64(): string {
    const svgContent = `<?xml version="1.0" standalone="no"?>
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 20010904//EN" "http://www.w3.org/TR/2001/REC-SVG-20010904/DTD/svg10.dtd">
<svg version="1.0" xmlns="http://www.w3.org/2000/svg" width="1024.000000pt" height="1024.000000pt" viewBox="0 0 1024.000000 1024.000000" preserveAspectRatio="xMidYMid meet">
<g transform="translate(0.000000,1024.000000) scale(0.100000,-0.100000)" fill="#000000" stroke="none">
<path d="M3290 7470 l0 -110 665 0 665 0 0 110 0 110 -665 0 -665 0 0 -110z"/>
<path d="M360 5850 l0 -1170 95 0 95 0 2 887 3 888 760 -888 760 -887 82 0 83 0 0 1170 0 1170 -95 0 -95 0 -2 -893 -3 -893 -758 893 -758 893 -85 0 -84 0 0 -1170z"/>
<path d="M3795 7013 c-251 -31 -506 -156 -684 -334 -108 -108 -158 -180 -226 -321 -128 -267 -149 -542 -64 -843 100 -353 340 -622 669 -748 182 -70 249 -81 485 -82 198 0 216 2 312 27 347 93 611 307 771 624 100 199 140 490 98 722 -19 107 -64 248 -102 324 -104 206 -309 417 -489 503 -221 105 -359 136 -594 134 -80 -1 -159 -4 -176 -6z m386 -157 c157 -40 320 -154 410 -288 63 -93 126 -233 160 -358 31 -110 32 -125 36 -347 5 -263 -2 -323 -62 -491 -85 -238 -246 -414 -455 -499 -107 -43 -191 -55 -335 -50 -240 8 -393 82 -538 259 -67 82 -157 262 -191 383 -71 253 -75 600 -9 809 84 269 228 444 446 547 133 62 371 77 538 35z"/>
<path d="M5493 7008 c2 -7 153 -350 335 -763 181 -412 410 -933 508 -1157 l179 -408 115 0 115 0 182 428 c100 235 316 740 478 1122 163 382 305 716 316 743 l19 47 -124 0 -124 0 -14 -37 c-376 -970 -764 -1951 -770 -1945 -5 6 -302 711 -757 1799 l-76 183 -194 0 c-150 0 -192 -3 -188 -12z"/>
<path d="M8736 6933 c-46 -106 -1006 -2235 -1013 -2245 -2 -5 40 -8 95 -8 l99 0 175 367 174 368 490 -3 c269 -2 492 -7 495 -10 3 -4 75 -168 160 -364 l154 -358 177 0 c98 0 178 3 177 8 0 4 -222 529 -493 1167 l-492 1160 -80 3 -80 3 -38 -88z m225 -868 l198 -460 -42 -7 c-53 -8 -665 -8 -732 0 l-51 7 188 440 c103 242 194 458 203 480 15 36 18 38 28 20 6 -11 100 -227 208 -480z"/>
<path d="M2300 3440 l0 -410 255 0 255 0 0 60 0 60 -187 2 -188 3 0 110 0 110 188 3 187 2 0 60 0 60 -190 0 -190 0 0 110 0 110 190 0 191 0 -3 63 -3 62 -252 3 -253 2 0 -410z"/>
<path d="M4380 3790 l0 -60 110 0 110 0 0 -350 0 -350 65 0 65 0 0 350 0 350 115 0 115 0 0 60 0 60 -290 0 -290 0 0 -60z"/>
<path d="M5634 3842 c-7 -5 -245 -562 -341 -799 -4 -10 11 -13 58 -13 l64 0 42 98 41 97 187 0 186 0 42 -97 42 -98 62 0 c61 0 62 1 54 23 -38 99 -316 757 -327 775 -11 17 -24 22 -57 22 -23 0 -47 -4 -53 -8z m126 -304 c40 -101 75 -189 77 -195 4 -10 -30 -13 -151 -13 -86 0 -156 2 -156 4 0 12 151 386 156 386 1 0 35 -82 74 -182z"/>
<path d="M6430 3790 l0 -60 110 0 110 0 0 -350 0 -350 70 0 70 0 0 350 0 349 113 3 112 3 3 58 3 57 -296 0 -295 0 0 -60z"/>
<path d="M7520 3440 l0 -410 255 0 255 0 0 60 0 60 -187 2 -188 3 0 110 0 110 188 3 187 2 0 60 0 60 -187 2 -188 3 -3 108 -3 107 191 0 191 0 -3 63 -3 62 -252 3 -253 2 0 -410z"/>
<path d="M3510 3820 c-96 -33 -150 -119 -136 -218 12 -92 63 -141 194 -188 42 -15 100 -36 129 -46 71 -26 113 -66 113 -110 0 -78 -79 -138 -181 -138 -65 0 -147 42 -175 90 -10 16 -22 30 -26 30 -5 0 -26 -12 -48 -26 l-40 -26 19 -27 c51 -70 144 -125 233 -137 59 -8 172 11 228 40 154 78 158 292 7 380 -23 14 -87 37 -142 52 -148 39 -185 68 -185 147 0 66 55 107 145 107 66 0 108 -16 157 -59 20 -17 40 -31 44 -31 5 0 25 14 44 30 l35 30 -37 33 c-20 18 -62 45 -92 60 -47 23 -67 27 -143 27 -60 -1 -106 -7 -143 -20z"/>
</g>
</svg>`;
    
    const base64 = Buffer.from(svgContent).toString('base64');
    return `data:image/svg+xml;base64,${base64}`;
  }

  /**
   * Получить SVG иконку
   */
  private getSVGIcon(name: string): string {
    const icons: { [key: string]: string } = {
      bed: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M7 13c1.66 0 3-1.34 3-3S8.66 7 7 7s-3 1.34-3 3 1.34 3 3 3zm12-6h-8v7H3V7H1v13h2v-2h18v2h2v-9c0-1.1-.9-2-2-2zm0 8h-8V9h8v6z"/></svg>',
      bath: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM7 3c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm13 15H4v-2h16v2zm0-5H4V5h16v8z"/></svg>',
      area: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z"/><path d="M7 7h10v2H7zm0 4h10v2H7zm0 4h10v2H7z"/></svg>',
      location: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z"/></svg>',
      map: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z"/></svg>',
      check: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>',
      chevronDown: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/></svg>',
      chevronUp: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/></svg>',
      chevronLeft: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12l4.58-4.59z"/></svg>',
      chevronRight: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12l-4.58 4.59z"/></svg>',
      calendar: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 002 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM9 14H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2zm-8 4H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2z"/></svg>',
      dollar: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"/></svg>',
      home: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>',
      pool: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M22 21c-1.11 0-1.73-.37-2.18-.64-.37-.22-.6-.36-1.15-.36-.56 0-.78.13-1.15.36-.46.27-1.07.64-2.18.64s-1.73-.37-2.18-.64c-.37-.22-.6-.36-1.15-.36-.56 0-.78.13-1.15.36-.46.27-1.08.64-2.19.64-1.11 0-1.73-.37-2.18-.64-.37-.23-.6-.36-1.15-.36s-.78.13-1.15.36c-.46.27-1.08.64-2.19.64v-2c.56 0 .78-.13 1.15-.36.46-.27 1.08-.64 2.19-.64s1.73.37 2.18.64c.37.23.59.36 1.15.36.56 0 .78-.13 1.15-.36.46-.27 1.08-.64 2.19-.64 1.11 0 1.73.37 2.18.64.37.22.6.36 1.15.36s.78-.13 1.15-.36c.45-.27 1.07-.64 2.18-.64s1.73.37 2.18.64c.37.23.59.36 1.15.36v2zm0-4.5c-1.11 0-1.73-.37-2.18-.64-.37-.22-.6-.36-1.15-.36-.56 0-.78.13-1.15.36-.45.27-1.07.64-2.18.64s-1.73-.37-2.18-.64c-.37-.22-.6-.36-1.15-.36-.56 0-.78.13-1.15.36-.45.27-1.07.64-2.18.64s-1.73-.37-2.18-.64c-.37-.22-.6-.36-1.15-.36s-.78.13-1.15.36c-.47.27-1.09.64-2.2.64v-2c.56 0 .78-.13 1.15-.36.45-.27 1.07-.64 2.18-.64s1.73.37 2.18.64c.37.22.6.36 1.15.36.56 0 .78-.13 1.15-.36.45-.27 1.07-.64 2.18-.64s1.73.37 2.18.64c.37.22.6.36 1.15.36s.78-.13 1.15-.36c.45-.27 1.07-.64 2.18-.64s1.73.37 2.18.64c.37.22.6.36 1.15.36v2zM8.67 12c.56 0 .78-.13 1.15-.36.46-.27 1.08-.64 2.19-.64 1.11 0 1.73.37 2.18.64.37.22.6.36 1.15.36s.78-.13 1.15-.36c.12-.07.26-.15.41-.23L10.48 5C8.93 3.45 7.5 2.99 5 3v2.5c1.82-.01 2.89.39 4 1.5l1 1-3.25 3.25c.31.12.56.27.77.39.37.23.59.36 1.15.36z"/></svg>',
      wifi: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M1 9l2 2c4.97-4.97 13.03-4.97 18 0l2-2C16.93 2.93 7.08 2.93 1 9zm8 8l3 3 3-3a4.237 4.237 0 00-6 0zm-4-4l2 2a7.074 7.074 0 0110 0l2-2C15.14 9.14 8.87 9.14 5 13z"/></svg>',
      images: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M22 16V4c0-1.1-.9-2-2-2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2zm-11-4l2.03 2.71L16 11l4 5H8l3-4zM2 6v14c0 1.1.9 2 2 2h14v-2H4V6H2z"/></svg>'
    };
    return icons[name] || '';
  }

  /**
   * Получить переводы характеристик
   */
  private getFeatureTranslations(language: string): { [key: string]: string } {
    const translations: { [key: string]: { [key: string]: string } } = {
      ru: {
        // Property features - Комнаты и помещения
        'mediaRoom': 'Медиа комната',
        'privateGym': 'Частный тренажёрный зал',
        'privateLift': 'Частный лифт',
        'privateSauna': 'Частная сауна',
        'jacuzzi': 'Джакузи',
        'cornerUnit': 'Угловая квартира',
        'maidsQuarters': 'Комната для персонала',
        'duplex': 'Дуплекс',
        'triplex': 'Триплекс',
        'balcony': 'Балкон',
        'study': 'Кабинет',
        'library': 'Библиотека',
        'winecellar': 'Винный погреб',
        'elevator': 'Лифт',
        'homeElevator': 'Домашний лифт',
        'gameRoom': 'Игровая комната',
        'billiardRoom': 'Бильярдная',
        'kidsRoom': 'Детская комната',
        'nursery': 'Детская',
        'guestRoom': 'Гостевая комната',
        'serviceRoom': 'Служебная комната',
        'utilityRoom': 'Подсобное помещение',
        'pantry': 'Кладовая',
        'wetRoom': 'Влажная комната',
        'powderRoom': 'Туалетная комната',
        'ensuiteBathroom': 'Ванная в спальне',
        'sharedBathroom': 'Общая ванная',
        'outdoorBathroom': 'Уличная ванная',
        'steamRoom': 'Паровая баня',
        'hammam': 'Хаммам',
        'massage': 'Массажная комната',
        'yogaRoom': 'Йога комната',
        'meditationRoom': 'Комната для медитации',
        'artStudio': 'Художественная студия',
        'workshop': 'Мастерская',

        // Кухня и ванная
        'westernKitchen': 'Западная кухня',
        'thaiKitchen': 'Тайская кухня',
        'openKitchen': 'Открытая кухня',
        'closedKitchen': 'Закрытая кухня',
        'bathtub': 'Ванна',
        'shower': 'Душ',
        'separateShower': 'Отдельный душ',

        // Бассейны
        'privatePool': 'Частный бассейн',
        'sharedPool': 'Общий бассейн',
        'infinityPool': 'Инфинити бассейн',
        'kidPool': 'Детский бассейн',

        // Системы безопасности
        'smartHome': 'Умный дом',
        'securitySystem': 'Система безопасности',
        'cctv': 'Видеонаблюдение',
        'alarmSystem': 'Сигнализация',
        'intercom': 'Домофон',
        'videoIntercom': 'Видеодомофон',
        'safebox': 'Сейф',

        // Климат-контроль
        'airConditioning': 'Кондиционер',
        'centralAC': 'Центральный кондиционер',
        'heating': 'Отопление',
        'floorHeating': 'Тёплый пол',
        'fireplace': 'Камин',

        // Энергетика
        'solarPanels': 'Солнечные панели',
        'waterHeater': 'Водонагреватель',
        'solarWaterHeater': 'Солнечный водонагреватель',
        'generator': 'Генератор',
        'ups': 'ИБП',

        // Архитектурные особенности
        'highCeiling': 'Высокие потолки',
        'largeWindows': 'Большие окна',
        'floorToFloorWindows': 'Панорамные окна',
        'walkinCloset': 'Гардеробная',
        'builtinWardrobe': 'Встроенный шкаф',
        'separateEntrance': 'Отдельный вход',
        'privateEntrance': 'Частный вход',
        'soundproofing': 'Звукоизоляция',

        // Системы очистки
        'waterFiltration': 'Фильтрация воды',
        'airPurifier': 'Очиститель воздуха',

        // Техника
        'washer': 'Стиральная машина',
        'dryer': 'Сушильная машина',
        'dishwasher': 'Посудомоечная машина',
        'refrigerator': 'Холодильник',
        'microwave': 'Микроволновая печь',
        'oven': 'Духовка',
        'stove': 'Плита',
        'gasStove': 'Газовая плита',
        'electricStove': 'Электрическая плита',
        'inductionStove': 'Индукционная плита',
        'coffeemaker': 'Кофеварка',
        'waterDispenser': 'Кулер для воды',

        // Развлечения
        'tv': 'Телевизор',
        'smartTV': 'Smart TV',
        'wifi': 'Wi-Fi',
        'highSpeedInternet': 'Высокоскоростной интернет',
        'fiberOptic': 'Оптоволокно',
        'telephone': 'Телефон',
        'satelliteTV': 'Спутниковое ТВ',
        'surround': 'Объёмный звук',
        'homeTheater': 'Домашний кинотеатр',
        'musicSystem': 'Музыкальная система',
        'piano': 'Фортепиано',

        // Меблировка и состояние
        'furnished': 'Меблированная',
        'partiallyFurnished': 'Частично меблированная',
        'fullyEquipped': 'Полностью оборудованная',
        'euroRenovation': 'Евроремонт',
        'designerRenovation': 'Дизайнерский ремонт',
        'modernDesign': 'Современный дизайн',
        'traditionalStyle': 'Традиционный стиль',
        'minimalist': 'Минимализм',
        'luxury': 'Люкс',

        // Планировка
        'penthouseLevel': 'Пентхаус уровень',
        'groundFloor': 'Первый этаж',
        'topFloor': 'Верхний этаж',
        'multiLevel': 'Многоуровневая',
        'studio': 'Студия',
        'openPlan': 'Открытая планировка',

        // Доступность
        'petFriendly': 'Можно с питомцами',
        'childFriendly': 'Подходит для детей',
        'wheelchair': 'Доступно для инвалидных колясок',
        'disabledAccess': 'Доступ для инвалидов',
        'ramp': 'Пандус',

        // Безопасность
        'emergencyExit': 'Аварийный выход',
        'fireExtinguisher': 'Огнетушитель',
        'firstAidKit': 'Аптечка',
        'smokeDetector': 'Детектор дыма',
        'carbonMonoxide': 'Детектор угарного газа',

        // Экология
        'eco': 'Экологичный',
        'energyEfficient': 'Энергоэффективный',
        'sustainable': 'Устойчивое развитие',
        'greenBuilding': 'Зелёное здание',
        'leed': 'LEED сертификат',

        // Статус
        'newConstruction': 'Новое строительство',
        'underConstruction': 'В процессе строительства',
        'readyToMove': 'Готов к заселению',
        'offPlan': 'На стадии проекта',
        'resale': 'Перепродажа',

        // Outdoor features - Сад и ландшафт
        'garden': 'Сад',
        'privateGarden': 'Частный сад',
        'landscaped': 'Ландшафтный дизайн',
        'tropicalGarden': 'Тропический сад',
        'japaneseGarden': 'Японский сад',
        'vegetableGarden': 'Огород',
        'fruitTrees': 'Фруктовые деревья',
        'flowerGarden': 'Цветник',

        // Террасы и крыши
        'terrace': 'Терраса',
        'rooftop': 'Крыша',
        'rooftopTerrace': 'Терраса на крыше',
        'skyGarden': 'Сад на крыше',

        // Зоны отдыха и готовки
        'bbqArea': 'Зона барбекю',
        'outdoorKitchen': 'Уличная кухня',
        'outdoorShower': 'Уличный душ',
        'beachShower': 'Пляжный душ',
        'summerKitchen': 'Летняя кухня',
        'outdoorDining': 'Обеденная зона на улице',
        'lounge': 'Лаунж зона',
        'sunbeds': 'Шезлонги',
        'sunshade': 'Зонт от солнца',
        'pergola': 'Пергола',
        'gazebo': 'Беседка',
        'pavilion': 'Павильон',

        // Парковка
        'garage': 'Гараж',
        'carport': 'Навес для авто',
        'coveredParking': 'Крытая парковка',
        'openParking': 'Открытая парковка',
        'secureParking': 'Охраняемая парковка',
        'guestParking': 'Парковка для гостей',
        'electricCarCharger': 'Зарядка для электромобиля',
        'bikestorage': 'Велопарковка',

        // Водные элементы
        'poolBar': 'Бар у бассейна',
        'fountain': 'Фонтан',
        'pond': 'Пруд',
        'koiPond': 'Пруд с карпами кои',
        'waterfall': 'Водопад',
        'streambed': 'Ручей',

        // Детские зоны
        'playground': 'Детская площадка',
        'swingSet': 'Качели',
        'slide': 'Горка',
        'sandbox': 'Песочница',
        'trampoline': 'Батут',

        // Зоны для животных
        'petArea': 'Зона для питомцев',
        'dogRun': 'Выгул для собак',
        'petShower': 'Душ для питомцев',

        // Хранение и хозяйство
        'storageRoom': 'Кладовая',
        'shed': 'Сарай',
        'greenhouse': 'Теплица',
        'laundryRoom': 'Прачечная',
        'dryingArea': 'Сушильная зона',

        // Спортивные площадки
        'outdoorGym': 'Уличный тренажёрный зал',
        'sportsArea': 'Спортивная зона',
        'tennisCourt': 'Теннисный корт',
        'basketballCourt': 'Баскетбольная площадка',
        'footballField': 'Футбольное поле',
        'volleyball': 'Волейбольная площадка',
        'badminton': 'Площадка для бадминтона',
        'puttingGreen': 'Площадка для гольфа',
        'bocce': 'Площадка для боче',
        'skatepark': 'Скейтпарк',
        'joggingTrack': 'Беговая дорожка',
        'walkingPath': 'Пешеходная дорожка',
        'cyclingPath': 'Велодорожка',

        // Водный доступ
        'fishingPier': 'Рыболовный пирс',
        'boatDock': 'Причал для лодок',
        'marina': 'Марина',
        'beachAccess': 'Выход к пляжу',
        'privateBeach': 'Частный пляж',
        'beachCabana': 'Пляжная беседка',

        // Ограждение и безопасность
        'fence': 'Забор',
        'wall': 'Стена',
        'gate': 'Ворота',
        'electricGate': 'Электрические ворота',
        'securityGate': 'Охраняемые ворота',
        'driveway': 'Подъездная дорога',
        'pavedDriveway': 'Асфальтированная дорога',
        'gravelDriveway': 'Гравийная дорога',

        // Освещение
        'streetLighting': 'Уличное освещение',
        'gardenLighting': 'Садовое освещение',
        'securityLighting': 'Охранное освещение',
        'decorativeLighting': 'Декоративное освещение',

        // Системы полива
        'sprinklerSystem': 'Система полива',
        'automaticSprinklers': 'Автоматический полив',
        'drip': 'Капельный полив',
        'irrigationSystem': 'Ирригационная система',
        'rainwaterCollection': 'Сбор дождевой воды',

        // Водоснабжение
        'well': 'Колодец',
        'borehole': 'Скважина',
        'waterTank': 'Водяной бак',
        'waterPump': 'Водяной насос',
        'septicTank': 'Септик',
        'sewageSystem': 'Канализация',
        'drainageSystem': 'Дренажная система',

        // Rental features - Услуги персонала
        'maidService': 'Услуги горничной',
        'dailyCleaning': 'Ежедневная уборка',
        'weeklyCleaning': 'Еженедельная уборка',
        'chefService': 'Услуги повара',
        'privateChef': 'Личный повар',
        'cateringService': 'Кейтеринг',
        'driverService': 'Услуги водителя',

        // Трансфер и транспорт
        'airportTransfer': 'Трансфер из аэропорта',
        'carRental': 'Аренда автомобиля',
        'bicycleRental': 'Аренда велосипедов',
        'scooterRental': 'Аренда скутеров',
        'boatRental': 'Аренда лодки',
        'kayakRental': 'Аренда каяка',

        // Питание
        'breakfastIncluded': 'Завтрак включен',
        'halfBoard': 'Полупансион',
        'fullBoard': 'Полный пансион',
        'allInclusive': 'Всё включено',

        // Уборка и стирка
        'cleaning': 'Уборка',
        'linenChange': 'Смена белья',
        'towelChange': 'Смена полотенец',
        'laundryService': 'Прачечная',
        'dryClean': 'Химчистка',
        'ironing': 'Глажка',

        // Коммунальные услуги
        'utilitiesIncluded': 'Коммунальные услуги включены',
        'electricityIncluded': 'Электричество включено',
        'waterIncluded': 'Вода включена',
        'gasIncluded': 'Газ включен',
        'wifiIncluded': 'Wi-Fi включен',
        'internetIncluded': 'Интернет включен',
        'cableTv': 'Кабельное ТВ',
        'streamingServices': 'Стриминговые сервисы',

        // Сервисы
        'conciergeService': 'Консьерж',
        '24hConcierge': 'Консьерж 24/7',
        'securityGuard': 'Охрана',
        '24hSecurity': 'Охрана 24/7',
        'management': 'Управление',
        'propertyManagement': 'Управление недвижимостью',
        'maintenance': 'Техническое обслуживание',
        'repairService': 'Ремонт',
        'gardenMaintenance': 'Уход за садом',
        'poolMaintenance': 'Обслуживание бассейна',
        'pestControl': 'Борьба с вредителями',
        'wasteDisposal': 'Вывоз мусора',
        'recycling': 'Переработка отходов',

        // Уход
        'petCare': 'Уход за питомцами',
        'petSitting': 'Присмотр за питомцами',
        'dogWalking': 'Выгул собак',
        'babysitting': 'Няня',
        'childcare': 'Уход за детьми',
        'eldercare': 'Уход за пожилыми',

        // Медицина
        'medicalService': 'Медицинские услуги',
        'nurseOnCall': 'Медсестра на вызов',
        'doctorOnCall': 'Врач на вызов',
        'ambulance': 'Скорая помощь',
        'pharmacy': 'Аптека',

        // Доставка
        'grocery': 'Доставка продуктов',
        'shopping': 'Шоппинг сервис',
        'delivery': 'Доставка',
        'courierService': 'Курьерская служба',
        'mailHandling': 'Обработка почты',
        'packageReceiving': 'Приём посылок',

        // Автосервис
        'valetParking': 'Парковщик',
        'carWash': 'Автомойка',
        'carService': 'Автосервис',

        // Водные виды спорта
        'snorkeling': 'Снорклинг',
        'divingEquipment': 'Снаряжение для дайвинга',
        'fishing': 'Рыбалка',
        'surfingLessons': 'Уроки серфинга',
        'kitesurfing': 'Кайтсерфинг',
        'wakeboarding': 'Вейкбординг',
        'jetski': 'Гидроцикл',
        'parasailing': 'Парасейлинг',
        'bananaBoat': 'Банан',
        'speedboat': 'Скоростная лодка',
        'yachtCharter': 'Аренда яхты',

        // Премиум услуги
        'helicopterService': 'Вертолёт',
        'privatePlane': 'Частный самолёт',
        'limousineService': 'Лимузин',

        // Бронирование
        'tourBooking': 'Бронирование туров',
        'ticketBooking': 'Бронирование билетов',
        'restaurantReservation': 'Бронирование ресторанов',
        'spaBooking': 'Бронирование СПА',

        // Красота и здоровье
        'massageService': 'Массаж',
        'beautyService': 'Салон красоты',
        'hairSalon': 'Парикмахерская',
        'nailSalon': 'Маникюрный салон',

        // Спорт и фитнес
        'personalTrainer': 'Персональный тренер',
        'yogaInstructor': 'Инструктор йоги',
        'pilatesInstructor': 'Инструктор пилатеса',
        'tennisCoach': 'Тренер по теннису',
        'golfCoach': 'Тренер по гольфу',
        'swimInstructor': 'Инструктор по плаванию',

        // Мероприятия
        'eventPlanning': 'Организация мероприятий',
        'partyPlanning': 'Организация вечеринок',
        'weddingPlanning': 'Организация свадеб',
        'catering': 'Кейтеринг',
        'florist': 'Флорист',
        'photographer': 'Фотограф',
        'videographer': 'Видеограф',
        'musician': 'Музыкант',
        'dj': 'Диджей',
        'entertainer': 'Аниматор',

        // Профессиональные услуги
        'translation': 'Перевод',
        'interpreter': 'Переводчик',
        'legalService': 'Юридические услуги',
        'lawyer': 'Адвокат',
        'notary': 'Нотариус',
        'accounting': 'Бухгалтерия',
        'taxService': 'Налоговые услуги',
        'insurance': 'Страхование',
        'visaAssistance': 'Помощь с визой',
        'immigration': 'Иммиграция',
        'relocation': 'Переезд',

        // Аренда
        'storage': 'Хранение',
        'furnitureRental': 'Аренда мебели',
        'applianceRental': 'Аренда техники',

        // Типы аренды
        'shortTermRental': 'Краткосрочная аренда',
        'longTermRental': 'Долгосрочная аренда',
        'monthlyRental': 'Помесячная аренда',
        'weeklyRental': 'Понедельная аренда',
        'dailyRental': 'Посуточная аренда',

        // Условия заезда
        'flexibleCheckIn': 'Гибкий заезд',
        'lateCheckOut': 'Поздний выезд',
        'earlyCheckIn': 'Ранний заезд',

        // Оплата
        'depositRequired': 'Требуется депозит',
        'noDeposit': 'Без депозита',
        'creditCardRequired': 'Требуется кредитная карта',
        'cashPayment': 'Оплата наличными',
        'bankTransfer': 'Банковский перевод',
        'onlinePayment': 'Онлайн оплата',
        'installmentPlan': 'План рассрочки',

        // Скидки
        'discountAvailable': 'Доступны скидки',
        'seasonalDiscount': 'Сезонная скидка',
        'longStayDiscount': 'Скидка за длительное проживание',
        'earlyBooking': 'Раннее бронирование',
        'lastMinute': 'Последняя минута',
        'studentDiscount': 'Скидка для студентов',
        'seniorDiscount': 'Скидка для пенсионеров',
        'militaryDiscount': 'Скидка для военных',
        'corporateRate': 'Корпоративный тариф',
        'groupRate': 'Групповой тариф',

        // Правила
        'noSmoking': 'Курение запрещено',
        'smokingAllowed': 'Курение разрешено',
        'noPets': 'Питомцы запрещены',
        'noParties': 'Вечеринки запрещены',
        'quietHours': 'Тихие часы',
        'noiseCurfew': 'Комендантский час по шуму',
        'minimumAge': 'Минимальный возраст',
        'adultsOnly': 'Только для взрослых',
        'familyFriendly': 'Для семей',
        'kidfriendly': 'Для детей',
        'infantFriendly': 'Для младенцев',
        'teenagerFriendly': 'Для подростков',

        // Location features - Пляж
        'beachFront': 'Первая линия',
        'secondLine': 'Вторая линия',
        'walkToBeach': 'Пешком до пляжа',

        // Образование
        'nearSchool': 'Рядом школа',
        'nearInternationalSchool': 'Рядом международная школа',
        'nearKindergarten': 'Рядом детский сад',
        'nearUniversity': 'Рядом университет',

        // Медицина
        'nearHospital': 'Рядом больница',
        'nearClinic': 'Рядом клиника',
        'nearPharmacy': 'Рядом аптека',

        // Магазины
        'nearSupermarket': 'Рядом супермаркет',
        'nearConvenience': 'Рядом мини-маркет',
        'nearMarket': 'Рядом рынок',
        'nearMall': 'Рядом торговый центр',
        'nearShops': 'Рядом магазины',

        // Рестораны и бары
        'nearRestaurant': 'Рядом рестораны',
        'nearCafe': 'Рядом кафе',
        'nearBar': 'Рядом бары',
        'nearNightlife': 'Рядом ночная жизнь',

        // Спорт и отдых
        'nearGolfCourse': 'Рядом поле для гольфа',
        'nearMarina': 'Рядом марина',
        'nearYachtClub': 'Рядом яхт-клуб',
        'nearTennisCourt': 'Рядом теннисный корт',
        'nearBasketball': 'Рядом баскетбольная площадка',
        'nearFootball': 'Рядом футбольное поле',
        'nearVolleyball': 'Рядом волейбольная площадка',
        'nearSkatepark': 'Рядом скейтпарк',
        'nearGym': 'Рядом тренажёрный зал',
        'nearFitness': 'Рядом фитнес-центр',
        'nearYoga': 'Рядом йога студия',
        'nearSpa': 'Рядом СПА',
        'nearWellness': 'Рядом велнес-центр',

        // Транспорт
        'nearAirport': 'Рядом аэропорт',
        'nearBusStop': 'Рядом автобусная остановка',
        'nearBusTerminal': 'Рядом автовокзал',
        'nearTaxiStand': 'Рядом стоянка такси',
        'nearMetro': 'Рядом метро',
        'nearTrain': 'Рядом ж/д станция',
        'nearHighway': 'Рядом шоссе',
        'nearMainRoad': 'Рядом главная дорога',

        // Сервисы
        'nearBank': 'Рядом банк',
        'nearAtm': 'Рядом банкомат',
        'nearPostOffice': 'Рядом почта',
        'nearPolice': 'Рядом полиция',
        'nearFireStation': 'Рядом пожарная станция',
        'nearEmbassy': 'Рядом посольство',
        'nearGovernment': 'Рядом госучреждения',
        'nearSalon': 'Рядом салон красоты',
        'nearVet': 'Рядом ветклиника',
        'nearPetShop': 'Рядом зоомагазин',

        // Религия
        'nearTemple': 'Рядом храм',
        'nearMosque': 'Рядом мечеть',
        'nearChurch': 'Рядом церковь',
        'nearSynagogue': 'Рядом синагога',

        // Природа
        'nearPark': 'Рядом парк',
        'nearPlayground': 'Рядом детская площадка',
        'nearGarden': 'Рядом сад',
        'nearForest': 'Рядом лес',
        'nearMountain': 'Рядом горы',
        'nearLake': 'Рядом озеро',
        'nearRiver': 'Рядом река',
        'nearWaterfall': 'Рядом водопад',
        'nearNationalPark': 'Рядом национальный парк',
        'nearNatureReserve': 'Рядом природный заповедник',

        // Развлечения
        'nearZoo': 'Рядом зоопарк',
        'nearAquarium': 'Рядом аквариум',
        'nearMuseum': 'Рядом музей',
        'nearGallery': 'Рядом галерея',
        'nearTheater': 'Рядом театр',
        'nearCinema': 'Рядом кинотеатр',
        'nearConcertHall': 'Рядом концертный зал',
        'nearStadium': 'Рядом стадион',
        'nearSportsCenter': 'Рядом спортивный центр',
        'nearLibrary': 'Рядом библиотека',
        'nearBookstore': 'Рядом книжный магазин',

        // Туризм
        'nearTouristAttraction': 'Рядом достопримечательности',
        'nearLandmark': 'Рядом известная достопримечательность',
        'nearViewpoint': 'Рядом смотровая площадка',
        'nearDiveSite': 'Рядом место для дайвинга',
        'nearSurfSpot': 'Рядом место для серфинга',
        'nearSnorkeling': 'Рядом место для снорклинга',
        'nearHiking': 'Рядом пешие тропы',
        'nearCycling': 'Рядом велосипедные маршруты',
        'nearJogging': 'Рядом беговые дорожки',

        // Характер района
        'quietArea': 'Тихий район',
        'peacefulLocation': 'Спокойное место',
        'residentialArea': 'Жилой район',
        'commercialArea': 'Коммерческий район',
        'businessDistrict': 'Деловой район',
        'touristArea': 'Туристический район',
        'localArea': 'Местный район',
        'expatArea': 'Район экспатов',
        'internationalCommunity': 'Международное сообщество',
        'gatedCommunity': 'Закрытый посёлок',
        'secureComplex': 'Охраняемый комплекс',
        'privateCommunity': 'Частное сообщество',
        'luxuryDevelopment': 'Элитная застройка',
        'newDevelopment': 'Новая застройка',
        'establishedArea': 'Устоявшийся район',
        'upAndComing': 'Развивающийся район',
        'trendyArea': 'Модный район',
        'historicDistrict': 'Исторический район',
        'culturalQuarter': 'Культурный квартал',
        'artDistrict': 'Художественный район',
        'entertainmentDistrict': 'Развлекательный район',
        'financialDistrict': 'Финансовый район',
        'shoppingDistrict': 'Торговый район',

        // Расположение в городе
        'cityCentre': 'Центр города',
        'cityCenter': 'Центр города',
        'downtown': 'Центр',
        'midtown': 'Центральная часть',
        'uptown': 'Верхняя часть города',
        'suburb': 'Пригород',
        'outskirts': 'Окраина',
        'countryside': 'Сельская местность',
        'rural': 'Деревня',
        'urban': 'Городская местность',
        'metropolitan': 'Метрополия',

        // Географическое положение
        'coastal': 'Прибрежный',
        'inland': 'Внутри страны',
        'hillside': 'На склоне холма',
        'hilltop': 'На вершине холма',
        'valley': 'В долине',
        'plateau': 'На плато',
        'peninsula': 'На полуострове',
        'island': 'На острове',
        'mainland': 'На материке',
        'waterfront': 'У воды',
        'riverside': 'У реки',
        'lakeside': 'У озера',
        'mountainside': 'На склоне горы',
        'forestEdge': 'На опушке леса',
        'parkside': 'Возле парка',

        // Зонирование
        'greenBelt': 'Зелёная зона',
        'openSpace': 'Открытое пространство',
        'lowDensity': 'Низкая плотность застройки',
        'highDensity': 'Высокая плотность застройки',
        'mixedUse': 'Смешанное использование',
        'liveworkPlay': 'Жизнь-работа-отдых',
        'masterPlanned': 'Генплан',
        'smartCity': 'Умный город',
        'ecoVillage': 'Эко-деревня',
        'sustainableCommunity': 'Устойчивое сообщество',

        // Транспортная доступность
        'walkable': 'Пешеходная доступность',
        'bikeFriendly': 'Велосипедная инфраструктура',
        'publicTransport': 'Общественный транспорт',
        'transitOriented': 'Ориентирован на транспорт',
        'carDependent': 'Нужен автомобиль',
        'carFree': 'Без автомобилей',
        'pedestrianZone': 'Пешеходная зона',

        // Дорожная обстановка
        'lowTraffic': 'Низкий трафик',
        'noThroughTraffic': 'Нет транзитного движения',
        'deadEnd': 'Тупик',
        'culDeSac': 'Тупик',
        'mainStreet': 'Главная улица',
        'sideStreet': 'Боковая улица',
        'privateStreet': 'Частная улица',
        'pavedRoad': 'Асфальтированная дорога',
        'dirtRoad': 'Грунтовая дорога',
        'streetParking': 'Парковка на улице',

        // Безопасность района
        'wellLit': 'Хорошо освещено',
        'darkAtNight': 'Темно ночью',
        'safeArea': 'Безопасный район',
        'lowCrime': 'Низкий уровень преступности',

        // Общество
        'neighborhood': 'Соседство',
        'communitySpirit': 'Дух общины',
        'familyOriented': 'Ориентировано на семьи',
        'professionalArea': 'Профессиональный район',
        'studentArea': 'Студенческий район',
        'retirementCommunity': 'Поселение для пенсионеров',

        // Views - Морские виды
        'seaView': 'Вид на море',
        'oceanView': 'Вид на океан',
        'beachView': 'Вид на пляж',
        'bayView': 'Вид на залив',
        'coastalView': 'Вид на побережье',
        'partialSeaView': 'Частичный вид на море',
        'glimpseOfSea': 'Вид на море сбоку',
        'distantSeaView': 'Дальний вид на море',

        // Природные виды
        'sunsetView': 'Вид на закат',
        'sunriseView': 'Вид на рассвет',
        'mountainView': 'Вид на горы',
        'hillView': 'Вид на холмы',
        'volcanoView': 'Вид на вулкан',
        'forestView': 'Вид на лес',
        'lakeView': 'Вид на озеро',
        'riverView': 'Вид на реку',
        'waterfallView': 'Вид на водопад',
        'pondView': 'Вид на пруд',

        // Виды на территорию
        'poolView': 'Вид на бассейн',
        'gardenView': 'Вид на сад',
        'parkView': 'Вид на парк',

        // Городские виды
        'cityView': 'Вид на город',
        'skylineView': 'Вид на линию горизонта',

        // Характер вида
        'panoramicView': 'Панорамный вид',
        'unobstructedView': 'Открытый вид',
        '180View': 'Вид на 180°',
        '360View': 'Вид на 360°',
        'scenicView': 'Живописный вид',
        'spectacularView': 'Зрелищный вид',
        'breathtakingView': 'Захватывающий вид',
        'stunningView': 'Потрясающий вид',
        'magnificentView': 'Великолепный вид',
        'beautifulView': 'Красивый вид',
        'niceView': 'Хороший вид',
        'pleasantView': 'Приятный вид',

        // С точки обзора
        'rooftopView': 'Вид с крыши',
        'balconyView': 'Вид с балкона',
        'terraceView': 'Вид с террасы',
        'windowView': 'Вид из окна',
        'floorToFloorView': 'Панорамный вид',
        'elevatedView': 'Вид сверху',
        'groundLevelView': 'Вид с первого этажа',
        'skylightView': 'Вид через световое окно',

        // Внутренние виды
        'noView': 'Без вида',
        'obstructedView': 'Закрытый вид',
        'limitedView': 'Ограниченный вид',
        'interiorView': 'Вид внутрь',
        'courtyardView': 'Вид во двор',
        'atriumView': 'Вид в атриум',

        // Виды на объекты
        'streetView': 'Вид на улицу',
        'roadView': 'Вид на дорогу',
        'parkingView': 'Вид на парковку',
        'neighborView': 'Вид на соседей',
        'wallView': 'Вид на стену',
        'buildingView': 'Вид на здание',
        'roofView': 'Вид на крышу',
        'towerView': 'Вид на башню',
        'bridgeView': 'Вид на мост',

        // Культурные объекты
        'monumentView': 'Вид на памятник',
        'templeView': 'Вид на храм',
        'palaceView': 'Вид на дворец',
        'castleView': 'Вид на замок',
        'stadiumView': 'Вид на стадион',

        // Транспортные объекты
        'airportView': 'Вид на аэропорт',
        'portView': 'Вид на порт',
        'marinaView': 'Вид на марину',
        'yachtView': 'Вид на яхты',
        'boatView': 'Вид на лодки',
        'shipView': 'Вид на корабли',

        // Прочее
        'islandView': 'Вид на остров',
        'horizonView': 'Вид на горизонт',
        'clearView': 'Чистый вид',
        'privateView': 'Приватный вид',
        'sharedView': 'Общий вид',

        // Стороны света
        'facingNorth': 'Выход на север',
        'facingSouth': 'Выход на юг',
        'facingEast': 'Выход на восток',
        'facingWest': 'Выход на запад',
        'northeastView': 'Вид на северо-восток',
        'northwestView': 'Вид на северо-запад',
        'southeastView': 'Вид на юго-восток',
        'southwestView': 'Вид на юго-запад'
      },
      
      he: {
        // Property features - Комнаты и помещения
        'mediaRoom': 'חדר מדיה',
        'privateGym': 'חדר כושר פרטי',
        'privateLift': 'מעלית פרטית',
        'privateSauna': 'סאונה פרטית',
        'jacuzzi': 'ג\'קוזי',
        'cornerUnit': 'דירת פינה',
        'maidsQuarters': 'חדר עוזרת',
        'duplex': 'דופלקס',
        'triplex': 'טריפלקס',
        'balcony': 'מרפסת',
        'study': 'חדר עבודה',
        'library': 'ספרייה',
        'winecellar': 'מרתף יין',
        'elevator': 'מעלית',
        'homeElevator': 'מעלית ביתית',
        'gameRoom': 'חדר משחקים',
        'billiardRoom': 'חדר ביליארד',
        'kidsRoom': 'חדר ילדים',
        'nursery': 'חדר תינוקות',
        'guestRoom': 'חדר אורחים',
        'serviceRoom': 'חדר שירות',
        'utilityRoom': 'חדר עזר',
        'pantry': 'מזווה',
        'wetRoom': 'חדר רטוב',
        'powderRoom': 'שירותי אורחים',
        'ensuiteBathroom': 'חדר רחצה צמוד',
        'sharedBathroom': 'חדר רחצה משותף',
        'outdoorBathroom': 'חדר רחצה חיצוני',
        'steamRoom': 'חדר אדים',
        'hammam': 'חמאם',
        'massage': 'חדר עיסוי',
        'yogaRoom': 'חדר יוגה',
        'meditationRoom': 'חדר מדיטציה',
        'artStudio': 'סטודיו אמנות',
        'workshop': 'בית מלאכה',

        // Кухня и ванная
        'westernKitchen': 'מטבח מערבי',
        'thaiKitchen': 'מטבח תאילנדי',
        'openKitchen': 'מטבח פתוח',
        'closedKitchen': 'מטבח סגור',
        'bathtub': 'אמבטיה',
        'shower': 'מקלחת',
        'separateShower': 'מקלחת נפרדת',

        // Бассейны
        'privatePool': 'בריכה פרטית',
        'sharedPool': 'בריכה משותפת',
        'infinityPool': 'בריכת אינפיניטי',
        'kidPool': 'בריכת ילדים',

        // Системы безопасности
        'smartHome': 'בית חכם',
        'securitySystem': 'מערכת אבטחה',
        'cctv': 'מצלמות אבטחה',
        'alarmSystem': 'מערכת אזעקה',
        'intercom': 'אינטרקום',
        'videoIntercom': 'אינטרקום וידאו',
        'safebox': 'כספת',

        // Климат-контроль
        'airConditioning': 'מיזוג אוויר',
        'centralAC': 'מיזוג מרכזי',
        'heating': 'חימום',
        'floorHeating': 'חימום תת רצפתי',
        'fireplace': 'אח',

        // Энергетика
        'solarPanels': 'פאנלים סולאריים',
        'waterHeater': 'דוד מים',
        'solarWaterHeater': 'דוד שמש',
        'generator': 'גנרטור',
        'ups': 'UPS',

        // Архитектурные особенности
        'highCeiling': 'תקרות גבוהות',
        'largeWindows': 'חלונות גדולים',
        'floorToFloorWindows': 'חלונות פנורמיים',
        'walkinCloset': 'חדר ארונות',
        'builtinWardrobe': 'ארון בגדים מובנה',
        'separateEntrance': 'כניסה נפרדת',
        'privateEntrance': 'כניסה פרטית',
        'soundproofing': 'בידוד אקוסטי',

        // Системы очистки
        'waterFiltration': 'סינון מים',
        'airPurifier': 'מטהר אוויר',

        // Техника
        'washer': 'מכונת כביסה',
        'dryer': 'מייבש כביסה',
        'dishwasher': 'מדיח כלים',
        'refrigerator': 'מקרר',
        'microwave': 'מיקרוגל',
        'oven': 'תנור',
        'stove': 'כיריים',
        'gasStove': 'כיריים גז',
        'electricStove': 'כיריים חשמליות',
        'inductionStove': 'כיריים אינדוקציה',
        'coffeemaker': 'מכונת קפה',
        'waterDispenser': 'מתקן מים',

        // Развлечения
        'tv': 'טלוויזיה',
        'smartTV': 'טלוויזיה חכמה',
        'wifi': 'Wi-Fi',
        'highSpeedInternet': 'אינטרנט מהיר',
        'fiberOptic': 'סיבים אופטיים',
        'telephone': 'טלפון',
        'satelliteTV': 'טלוויזיה לוויינית',
        'surround': 'סראונד',
        'homeTheater': 'קולנוע ביתי',
        'musicSystem': 'מערכת מוזיקה',
        'piano': 'פסנתר',

        // Меблировка и состояние
        'furnished': 'מרוהט',
        'partiallyFurnished': 'מרוהט חלקית',
        'fullyEquipped': 'מצויד במלואו',
        'euroRenovation': 'שיפוץ אירופאי',
        'designerRenovation': 'שיפוץ מעצב',
        'modernDesign': 'עיצוב מודרני',
        'traditionalStyle': 'סגנון מסורתי',
        'minimalist': 'מינימליסטי',
        'luxury': 'יוקרתי',

        // Планировка
        'penthouseLevel': 'רמת פנטהאוז',
        'groundFloor': 'קומת קרקע',
        'topFloor': 'קומה עליונה',
        'multiLevel': 'רב מפלסי',
        'studio': 'סטודיו',
        'openPlan': 'תכנון פתוח',

        // Доступность
        'petFriendly': 'ידידותי לחיות מחמד',
        'childFriendly': 'מתאים לילדים',
        'wheelchair': 'נגיש לכיסאות גלגלים',
        'disabledAccess': 'גישה לנכים',
        'ramp': 'רמפה',

        // Безопасность
        'emergencyExit': 'יציאת חירום',
        'fireExtinguisher': 'מטף כיבוי אש',
        'firstAidKit': 'ערכת עזרה ראשונה',
        'smokeDetector': 'גלאי עשן',
        'carbonMonoxide': 'גלאי פחמן חד חמצני',

        // Экология
        'eco': 'אקולוגי',
        'energyEfficient': 'חסכוני באנרגיה',
        'sustainable': 'בר קיימא',
        'greenBuilding': 'בניין ירוק',
        'leed': 'תעודת LEED',

        // Статус
        'newConstruction': 'בנייה חדשה',
        'underConstruction': 'בבנייה',
        'readyToMove': 'מוכן למגורים',
        'offPlan': 'על הנייר',
        'resale': 'משנייה',

        // Outdoor features - Сад и ландшафт
        'garden': 'גינה',
        'privateGarden': 'גינה פרטית',
        'landscaped': 'גינון',
        'tropicalGarden': 'גינה טרופית',
        'japaneseGarden': 'גינה יפנית',
        'vegetableGarden': 'גינת ירק',
        'fruitTrees': 'עצי פרי',
        'flowerGarden': 'גינת פרחים',

        // Террасы и крыши
        'terrace': 'מרפסת',
        'rooftop': 'גג',
        'rooftopTerrace': 'מרפסת גג',
        'skyGarden': 'גן גג',

        // Зоны отдыха и готовки
        'bbqArea': 'אזור ברביקיו',
        'outdoorKitchen': 'מטבח חיצוני',
        'outdoorShower': 'מקלחת חיצונית',
        'beachShower': 'מקלחת חוף',
        'summerKitchen': 'מטבח קיץ',
        'outdoorDining': 'פינת אוכל חיצונית',
        'lounge': 'אזור טרקלין',
        'sunbeds': 'מיטות שיזוף',
        'sunshade': 'שמשייה',
        'pergola': 'פרגולה',
        'gazebo': 'ביתן',
        'pavilion': 'פביליון',

        // Парковка
        'garage': 'מוסך',
        'carport': 'חניה מקורה',
        'coveredParking': 'חניה מקורה',
        'openParking': 'חניה פתוחה',
        'secureParking': 'חניה מאובטחת',
        'guestParking': 'חניית אורחים',
        'electricCarCharger': 'טעינה לרכב חשמלי',
        'bikestorage': 'חניית אופניים',

        // Водные элементы
        'poolBar': 'בר ליד הבריכה',
        'fountain': 'מזרקה',
        'pond': 'בריכת נוי',
        'koiPond': 'בריכת קוי',
        'waterfall': 'מפל מים',
        'streambed': 'נחל',

        // Детские зоны
        'playground': 'מגרש משחקים',
        'swingSet': 'נדנדות',
        'slide': 'מגלשה',
        'sandbox': 'ארגז חול',
        'trampoline': 'טרמפולינה',

        // Зоны для животных
        'petArea': 'אזור לחיות מחמד',
        'dogRun': 'אזור טיול כלבים',
        'petShower': 'מקלחת לחיות מחמד',

        // Хранение и хозяйство
        'storageRoom': 'מחסן',
        'shed': 'מחסן',
        'greenhouse': 'חממה',
        'laundryRoom': 'חדר כביסה',
        'dryingArea': 'אזור ייבוש',

        // Спортивные площадки
        'outdoorGym': 'חדר כושר חיצוני',
        'sportsArea': 'אזור ספורט',
        'tennisCourt': 'מגרש טניס',
        'basketballCourt': 'מגרש כדורסל',
        'footballField': 'מגרש כדורגל',
        'volleyball': 'מגרש כדורעף',
        'badminton': 'מגרש בדמינטון',
        'puttingGreen': 'מגרש גולף',
        'bocce': 'מגרש בוצ\'י',
        'skatepark': 'פארק סקייט',
        'joggingTrack': 'מסלול ריצה',
        'walkingPath': 'שביל הליכה',
        'cyclingPath': 'שביל אופניים',

        // Водный доступ
        'fishingPier': 'רציף דיג',
        'boatDock': 'מעגן סירות',
        'marina': 'מרינה',
        'beachAccess': 'גישה לחוף',
        'privateBeach': 'חוף פרטי',
        'beachCabana': 'ביתן חוף',

        // Ограждение и безопасность
        'fence': 'גדר',
        'wall': 'חומה',
        'gate': 'שער',
        'electricGate': 'שער חשמלי',
        'securityGate': 'שער מאובטח',
        'driveway': 'שביל גישה',
        'pavedDriveway': 'שביל גישה סלול',
        'gravelDriveway': 'שביל חצץ',

        // Освещение
        'streetLighting': 'תאורת רחוב',
        'gardenLighting': 'תאורת גינה',
        'securityLighting': 'תאורת אבטחה',
        'decorativeLighting': 'תאורה דקורטיבית',

        // Системы полива
        'sprinklerSystem': 'מערכת ספרינקלרים',
        'automaticSprinklers': 'השקיה אוטומטית',
        'drip': 'השקיה בטפטוף',
        'irrigationSystem': 'מערכת השקיה',
        'rainwaterCollection': 'איסוף מי גשמים',

        // Водоснабжение
        'well': 'באר',
        'borehole': 'קידוח',
        'waterTank': 'מיכל מים',
        'waterPump': 'משאבת מים',
        'septicTank': 'בור ספיגה',
        'sewageSystem': 'מערכת ביוב',
        'drainageSystem': 'מערכת ניקוז',

        // Rental features - Услуги персонала
        'maidService': 'שירות משרתת',
        'dailyCleaning': 'ניקיון יומי',
        'weeklyCleaning': 'ניקיון שבועי',
        'chefService': 'שירות שף',
        'privateChef': 'שף פרטי',
        'cateringService': 'שירות קייטרינג',
        'driverService': 'שירות נהג',

        // Трансфер и транспорт
        'airportTransfer': 'הסעה משדה התעופה',
        'carRental': 'השכרת רכב',
        'bicycleRental': 'השכרת אופניים',
        'scooterRental': 'השכרת קטנועים',
        'boatRental': 'השכרת סירה',
        'kayakRental': 'השכרת קיאק',

        // Питание
        'breakfastIncluded': 'ארוחת בוקר כלולה',
        'halfBoard': 'חצי פנסיון',
        'fullBoard': 'פנסיון מלא',
        'allInclusive': 'הכל כלול',

        // Уборка и стирка
        'cleaning': 'ניקיון',
        'linenChange': 'החלפת מצעים',
        'towelChange': 'החלפת מגבות',
        'laundryService': 'שירות כביסה',
        'dryClean': 'ניקוי יבש',
        'ironing': 'גיהוץ',

        // Коммунальные услуги
        'utilitiesIncluded': 'שירותים כלולים',
        'electricityIncluded': 'חשמל כלול',
        'waterIncluded': 'מים כלולים',
        'gasIncluded': 'גז כלול',
        'wifiIncluded': 'Wi-Fi כלול',
        'internetIncluded': 'אינטרנט כלול',
        'cableTv': 'טלוויזיה בכבלים',
        'streamingServices': 'שירותי סטרימינג',

        // Сервисы
        'conciergeService': 'שירות קונסיירז\'',
        '24hConcierge': 'קונסיירז\' 24/7',
        'securityGuard': 'מאבטח',
        '24hSecurity': 'אבטחה 24/7',
        'management': 'ניהול',
        'propertyManagement': 'ניהול נכסים',
        'maintenance': 'תחזוקה',
        'repairService': 'שירות תיקונים',
        'gardenMaintenance': 'תחזוקת גינה',
        'poolMaintenance': 'תחזוקת בריכה',
        'pestControl': 'הדברה',
        'wasteDisposal': 'פינוי אשפה',
        'recycling': 'מיחזור',

        // Уход
        'petCare': 'טיפול בחיות מחמד',
        'petSitting': 'שמרטפות',
        'dogWalking': 'טיול כלבים',
        'babysitting': 'שמרטפות',
        'childcare': 'טיפול בילדים',
        'eldercare': 'טיפול בקשישים',

        // Медицина
        'medicalService': 'שירותים רפואיים',
        'nurseOnCall': 'אחות לפי קריאה',
        'doctorOnCall': 'רופא לפי קריאה',
        'ambulance': 'אמבולנס',
        'pharmacy': 'בית מרקחת',

        // Доставка
        'grocery': 'משלוח מצרכים',
        'shopping': 'שירות קניות',
        'delivery': 'משלוחים',
        'courierService': 'שירות שליחויות',
        'mailHandling': 'טיפול בדואר',
        'packageReceiving': 'קבלת חבילות',

        // Автосервис
        'valetParking': 'חניה מטופחת',
        'carWash': 'שטיפת רכב',
        'carService': 'שירות רכב',

        // Водные виды спорта
        'snorkeling': 'שנורקלינג',
        'divingEquipment': 'ציוד צלילה',
        'fishing': 'דיג',
        'surfingLessons': 'שיעורי גלישה',
        'kitesurfing': 'קייטסרפינג',
        'wakeboarding': 'וויקבורד',
        'jetski': 'אופנוע ים',
        'parasailing': 'פאראסיילינג',
        'bananaBoat': 'בננה',
        'speedboat': 'סירת מהירות',
        'yachtCharter': 'שכירת יאכטה',

        // Премиум услуги
        'helicopterService': 'שירות מסוק',
        'privatePlane': 'מטוס פרטי',
        'limousineService': 'שירות לימוזין',

        // Бронирование
        'tourBooking': 'הזמנת טיולים',
        'ticketBooking': 'הזמנת כרטיסים',
        'restaurantReservation': 'הזמנת מסעדות',
        'spaBooking': 'הזמנת ספא',

        // Красота и здоровье
        'massageService': 'שירותי עיסוי',
        'beautyService': 'שירותי יופי',
        'hairSalon': 'מספרה',
        'nailSalon': 'סלון ציפורניים',

        // Спорт и фитнес
        'personalTrainer': 'מאמן אישי',
        'yogaInstructor': 'מדריך יוגה',
        'pilatesInstructor': 'מדריך פילאטיס',
        'tennisCoach': 'מאמן טניס',
        'golfCoach': 'מאמן גולף',
        'swimInstructor': 'מדריך שחייה',

        // Мероприятия
        'eventPlanning': 'תכנון אירועים',
        'partyPlanning': 'תכנון מסיבות',
        'weddingPlanning': 'תכנון חתונות',
        'catering': 'קייטרינג',
        'florist': 'פרחים',
        'photographer': 'צלם',
        'videographer': 'צלם וידאו',
        'musician': 'מוזיקאי',
        'dj': 'DJ',
        'entertainer': 'בדרן',

        // Профессиональные услуги
        'translation': 'תרגום',
        'interpreter': 'מתורגמן',
        'legalService': 'שירותים משפטיים',
        'lawyer': 'עורך דין',
        'notary': 'נוטריון',
        'accounting': 'הנהלת חשבונות',
        'taxService': 'שירותי מס',
        'insurance': 'ביטוח',
        'visaAssistance': 'סיוע בוויזה',
        'immigration': 'הגירה',
        'relocation': 'העברת דירה',

        // Аренда
        'storage': 'אחסון',
        'furnitureRental': 'השכרת ריהוט',
        'applianceRental': 'השכרת מכשירים',

        // Типы аренды
        'shortTermRental': 'השכרה לטווח קצר',
        'longTermRental': 'השכרה לטווח ארוך',
        'monthlyRental': 'השכרה חודשית',
        'weeklyRental': 'השכרה שבועית',
        'dailyRental': 'השכרה יומית',

        // Условия заезда
        'flexibleCheckIn': 'צ\'ק-אין גמיש',
        'lateCheckOut': 'צ\'ק-אאוט מאוחר',
        'earlyCheckIn': 'צ\'ק-אין מוקדם',

        // Оплата
        'depositRequired': 'נדרש פיקדון',
        'noDeposit': 'ללא פיקדון',
        'creditCardRequired': 'נדרש כרטיס אשראי',
        'cashPayment': 'תשלום במזומן',
        'bankTransfer': 'העברה בנקאית',
        'onlinePayment': 'תשלום מקוון',
        'installmentPlan': 'תכנית תשלומים',

        // Скидки
        'discountAvailable': 'הנחות זמינות',
        'seasonalDiscount': 'הנחה עונתית',
        'longStayDiscount': 'הנחה לשהייה ארוכה',
        'earlyBooking': 'הזמנה מוקדמת',
        'lastMinute': 'הזמנת דקה אחרונה',
        'studentDiscount': 'הנחה לסטודנטים',
        'seniorDiscount': 'הנחה לגמלאים',
        'militaryDiscount': 'הנחה לחיילים',
        'corporateRate': 'תעריף ארגוני',
        'groupRate': 'תעריף קבוצתי',

        // Правила
        'noSmoking': 'אסור לעשן',
        'smokingAllowed': 'עישון מותר',
        'noPets': 'חיות מחמד אסורות',
        'noParties': 'מסיבות אסורות',
        'quietHours': 'שעות שקט',
        'noiseCurfew': 'עוצר רעש',
        'minimumAge': 'גיל מינימום',
        'adultsOnly': 'למבוגרים בלבד',
        'familyFriendly': 'ידידותי למשפחות',
        'kidfriendly': 'ידידותי לילדים',
        'infantFriendly': 'ידידותי לתינוקות',
        'teenagerFriendly': 'ידידותי למתבגרים',

        // Location features - Пляж
        'beachFront': 'קו ראשון לים',
        'secondLine': 'קו שני',
        'walkToBeach': 'הליכה לחוף',

        // Образование
        'nearSchool': 'קרוב לבית ספר',
        'nearInternationalSchool': 'קרוב לבית ספר בינלאומי',
        'nearKindergarten': 'קרוב לגן ילדים',
        'nearUniversity': 'קרוב לאוניברסיטה',

        // Медицина
        'nearHospital': 'קרוב לבית חולים',
        'nearClinic': 'קרוב למרפאה',
        'nearPharmacy': 'קרוב לבית מרקחת',

        // Магазины
        'nearSupermarket': 'קרוב לסופרמרקט',
        'nearConvenience': 'קרוב למכולת',
        'nearMarket': 'קרוב לשוק',
        'nearMall': 'קרוב לקניון',
        'nearShops': 'קרוב לחנויות',

        // Рестораны и бары
        'nearRestaurant': 'קרוב למסעדות',
        'nearCafe': 'קרוב לבתי קפה',
        'nearBar': 'קרוב לברים',
        'nearNightlife': 'קרוב לחיי לילה',

        // Спорт и отдых
        'nearGolfCourse': 'קרוב למגרש גולף',
        'nearMarina': 'קרוב למרינה',
        'nearYachtClub': 'קרוב למועדון יאכטות',
        'nearTennisCourt': 'קרוב למגרש טניס',
        'nearBasketball': 'קרוב למגרש כדורסל',
        'nearFootball': 'קרוב למגרש כדורגל',
        'nearVolleyball': 'קרוב למגרש כדורעף',
        'nearSkatepark': 'קרוב לפארק סקייט',
        'nearGym': 'קרוב לחדר כושר',
        'nearFitness': 'קרוב למכון כושר',
        'nearYoga': 'קרוב לסטודיו יוגה',
        'nearSpa': 'קרוב לספא',
        'nearWellness': 'קרוב למרכז בריאות',

        // Транспорт
        'nearAirport': 'קרוב לשדה תעופה',
        'nearBusStop': 'קרוב לתחנת אוטובוס',
        'nearBusTerminal': 'קרוב לתחנה מרכזית',
        'nearTaxiStand': 'קרוב לתחנת מוניות',
        'nearMetro': 'קרוב לרכבת תחתית',
        'nearTrain': 'קרוב לתחנת רכבת',
        'nearHighway': 'קרוב לכביש מהיר',
        'nearMainRoad': 'קרוב לכביש ראשי',

        // Сервисы
        'nearBank': 'קרוב לבנק',
        'nearAtm': 'קרוב לכספומט',
        'nearPostOffice': 'קרוב לדואר',
        'nearPolice': 'קרוב למשטרה',
        'nearFireStation': 'קרוב לכבאות',
        'nearEmbassy': 'קרוב לשגרירות',
        'nearGovernment': 'קרוב למוסדות ממשלתיים',
        'nearSalon': 'קרוב למספרה',
        'nearVet': 'קרוב לווטרינר',
        'nearPetShop': 'קרוב לחנות חיות',

        // Религия
        'nearTemple': 'קרוב למקדש',
        'nearMosque': 'קרוב למסגד',
        'nearChurch': 'קרוב לכנסייה',
        'nearSynagogue': 'קרוב לבית כנסת',

        // Природа
        'nearPark': 'קרוב לפארק',
        'nearPlayground': 'קרוב למגרש משחקים',
        'nearGarden': 'קרוב לגן',
        'nearForest': 'קרוב ליער',
        'nearMountain': 'קרוב להרים',
        'nearLake': 'קרוב לאגם',
        'nearRiver': 'קרוב לנהר',
        'nearWaterfall': 'קרוב למפל',
        'nearNationalPark': 'קרוב לפארק לאומי',
        'nearNatureReserve': 'קרוב לשמורת טבע',

        // Развлечения
        'nearZoo': 'קרוב לגן חיות',
        'nearAquarium': 'קרוב לאקווריום',
        'nearMuseum': 'קרוב למוזיאון',
        'nearGallery': 'קרוב לגלריה',
        'nearTheater': 'קרוב לתיאטרון',
        'nearCinema': 'קרוב לקולנוע',
        'nearConcertHall': 'קרוב לאולם קונצרטים',
        'nearStadium': 'קרוב לאצטדיון',
        'nearSportsCenter': 'קרוב למרכז ספורט',
        'nearLibrary': 'קרוב לספרייה',
        'nearBookstore': 'קרוב לחנות ספרים',

        // Туризм
        'nearTouristAttraction': 'קרוב לאטרקציות תיירותיות',
        'nearLandmark': 'קרוב לנקודת ציון',
        'nearViewpoint': 'קרוב לנקודת תצפית',
        'nearDiveSite': 'קרוב לאתר צלילה',
        'nearSurfSpot': 'קרוב לנקודת גלישה',
        'nearSnorkeling': 'קרוב לשנורקלינג',
        'nearHiking': 'קרוב לטיול רגלי',
        'nearCycling': 'קרוב למסלולי אופניים',
        'nearJogging': 'קרוב למסלולי ריצה',

        // Характер района
        'quietArea': 'אזור שקט',
        'peacefulLocation': 'מיקום שליו',
        'residentialArea': 'אזור מגורים',
        'commercialArea': 'אזור מסחרי',
        'businessDistrict': 'רובע עסקים',
        'touristArea': 'אזור תיירותי',
        'localArea': 'אזור מקומי',
        'expatArea': 'אזור גולים',
        'internationalCommunity': 'קהילה בינלאומית',
        'gatedCommunity': 'קהילה סגורה',
        'secureComplex': 'מתחם מאובטח',
        'privateCommunity': 'קהילה פרטית',
        'luxuryDevelopment': 'פיתוח יוקרתי',
        'newDevelopment': 'פיתוח חדש',
        'establishedArea': 'אזור מבוסס',
        'upAndComing': 'אזור מתפתח',
        'trendyArea': 'אזור אופנתי',
        'historicDistrict': 'רובע היסטורי',
        'culturalQuarter': 'רובע תרבותי',
        'artDistrict': 'רובע אמנות',
        'entertainmentDistrict': 'רובע בידור',
        'financialDistrict': 'רובע פיננסי',
        'shoppingDistrict': 'רובע קניות',

        // Расположение в городе
        'cityCentre': 'מרכז העיר',
        'cityCenter': 'מרכז העיר',
        'downtown': 'מרכז',
        'midtown': 'אזור מרכזי',
        'uptown': 'אזור עליון',
        'suburb': 'פרבר',
        'outskirts': 'שולי העיר',
        'countryside': 'כפרי',
        'rural': 'כפר',
        'urban': 'עירוני',
        'metropolitan': 'מטרופולין',

        // Географическое положение
        'coastal': 'חופי',
        'inland': 'פנים הארץ',
        'hillside': 'מדרון גבעה',
        'hilltop': 'פסגת גבעה',
        'valley': 'עמק',
        'plateau': 'רמה',
        'peninsula': 'חצי אי',
        'island': 'אי',
        'mainland': 'יבשת',
        'waterfront': 'חוף המים',
        'riverside': 'גדת נהר',
        'lakeside': 'גדת אגם',
        'mountainside': 'מדרון הר',
        'forestEdge': 'קצה היער',
        'parkside': 'ליד פארק',

        // Зонирование
        'greenBelt': 'חגורה ירוקה',
        'openSpace': 'שטח פתוח',
        'lowDensity': 'צפיפות נמוכה',
        'highDensity': 'צפיפות גבוהה',
        'mixedUse': 'שימוש מעורב',
        'liveworkPlay': 'חיים-עבודה-בילוי',
        'masterPlanned': 'מתוכנן',
        'smartCity': 'עיר חכמה',
        'ecoVillage': 'כפר אקולוגי',
        'sustainableCommunity': 'קהילה בת-קיימא',

        // Транспортная доступность
        'walkable': 'ניתן להליכה',
        'bikeFriendly': 'ידידותי לאופניים',
        'publicTransport': 'תחבורה ציבורית',
        'transitOriented': 'מוכוון תחבורה',
        'carDependent': 'תלוי ברכב',
        'carFree': 'ללא מכוניות',
        'pedestrianZone': 'אזור הולכי רגל',

        // Дорожная обстановка
        'lowTraffic': 'תנועה נמוכה',
        'noThroughTraffic': 'אין תנועה עוברת',
        'deadEnd': 'מבוי סתום',
        'culDeSac': 'מבוי סתום',
        'mainStreet': 'רחוב ראשי',
        'sideStreet': 'רחוב צדדי',
        'privateStreet': 'רחוב פרטי',
        'pavedRoad': 'כביש מסופלט',
        'dirtRoad': 'דרך עפר',
        'streetParking': 'חניה ברחוב',

        // Безопасность района
        'wellLit': 'מואר היטב',
        'darkAtNight': 'חשוך בלילה',
        'safeArea': 'אזור בטוח',
        'lowCrime': 'פשיעה נמוכה',

        // Общество
        'neighborhood': 'שכונה',
        'communitySpirit': 'רוח קהילתית',
        'familyOriented': 'מוכוון משפחות',
        'professionalArea': 'אזור מקצועי',
        'studentArea': 'אזור סטודנטים',
        'retirementCommunity': 'קהילת פנסיונרים',

        // Views - Морские виды
        'seaView': 'נוף לים',
        'oceanView': 'נוף לאוקיינוס',
        'beachView': 'נוף לחוף',
        'bayView': 'נוף למפרץ',
        'coastalView': 'נוף לחוף',
        'partialSeaView': 'נוף חלקי לים',
        'glimpseOfSea': 'הצצה לים',
        'distantSeaView': 'נוף רחוק לים',

        // Природные виды
        'sunsetView': 'נוף לשקיעה',
        'sunriseView': 'נוף לזריחה',
        'mountainView': 'נוף להרים',
        'hillView': 'נוף לגבעות',
        'volcanoView': 'נוף להר געש',
        'forestView': 'נוף ליער',
        'lakeView': 'נוף לאגם',
        'riverView': 'נוף לנהר',
        'waterfallView': 'נוף למפל',
        'pondView': 'נוף לבריכת נוי',

        // Виды на территорию
        'poolView': 'נוף לבריכה',
        'gardenView': 'נוף לגינה',
        'parkView': 'נוף לפארק',

        // Городские виды
        'cityView': 'נוף לעיר',
        'skylineView': 'נוף לקו הרקיע',

        // Характер вида
        'panoramicView': 'נוף פנורמי',
        'unobstructedView': 'נוף פתוח',
        '180View': 'נוף 180°',
        '360View': 'נוף 360°',
        'scenicView': 'נוף ציורי',
        'spectacularView': 'נוף מרהיב',
        'breathtakingView': 'נוף עוצר נשימה',
        'stunningView': 'נוף מהמם',
        'magnificentView': 'נוף מפואר',
        'beautifulView': 'נוף יפה',
        'niceView': 'נוף נחמד',
        'pleasantView': 'נוף נעים',

        // С точки обзора
        'rooftopView': 'נוף מהגג',
        'balconyView': 'נוף מהמרפסת',
        'terraceView': 'נוף מהמרפסת',
        'windowView': 'נוף מהחלון',
        'floorToFloorView': 'נוף פנורמי',
        'elevatedView': 'נוף גבוה',
        'groundLevelView': 'נוף מקומת קרקע',
        'skylightView': 'נוף דרך צוהר',

        // Внутренние виды
        'noView': 'ללא נוף',
        'obstructedView': 'נוף חסום',
        'limitedView': 'נוף מוגבל',
        'interiorView': 'נוף פנימי',
        'courtyardView': 'נוף לחצר',
        'atriumView': 'נוף לאטריום',

        // Виды на объекты
        'streetView': 'נוף לרחוב',
        'roadView': 'נוף לכביש',
        'parkingView': 'נוף לחניה',
        'neighborView': 'נוף לשכנים',
        'wallView': 'נוף לקיר',
        'buildingView': 'נוף לבניין',
        'roofView': 'נוף לגג',
        'towerView': 'נוף למגדל',
        'bridgeView': 'נוף לגשר',

        // Культурные объекты
        'monumentView': 'נוף לאנדרטה',
        'templeView': 'נוף למקדש',
        'palaceView': 'נוף לארמון',
        'castleView': 'נוף לטירה',
        'stadiumView': 'נוף לאצטדיון',

        // Транспортные объекты
        'airportView': 'נוף לשדה תעופה',
        'portView': 'נוף לנמל',
        'marinaView': 'נוף למרינה',
        'yachtView': 'נוף ליאכטות',
        'boatView': 'נוף לסירות',
        'shipView': 'נוף לאוניות',

        // Прочее
        'islandView': 'נוף לאי',
        'horizonView': 'נוף לאופק',
        'clearView': 'נוף צלול',
        'privateView': 'נוף פרטי',
        'sharedView': 'נוף משותף',

        // Стороны света
        'facingNorth': 'פונה צפונה',
        'facingSouth': 'פונה דרומה',
        'facingEast': 'פונה מזרחה',
        'facingWest': 'פונה מערבה',
        'northeastView': 'נוף לצפון-מזרח',
        'northwestView': 'נוף לצפון-מערב',
        'southeastView': 'נוף לדרום-מזרח',
        'southwestView': 'נוף לדרום-מערב'
      },

      zh: {
                // Property features - Комнаты и помещения
        'mediaRoom': '媒体室',
        'privateGym': '私人健身房',
        'privateLift': '私人电梯',
        'privateSauna': '私人桑拿',
        'jacuzzi': '按摩浴缸',
        'cornerUnit': '角落单位',
        'maidsQuarters': '佣人房',
        'duplex': '复式',
        'triplex': '三层复式',
        'balcony': '阳台',
        'study': '书房',
        'library': '图书馆',
        'winecellar': '酒窖',
        'elevator': '电梯',
        'homeElevator': '家用电梯',
        'gameRoom': '游戏室',
        'billiardRoom': '台球室',
        'kidsRoom': '儿童房',
        'nursery': '婴儿房',
        'guestRoom': '客房',
        'serviceRoom': '服务室',
        'utilityRoom': '杂物间',
        'pantry': '储藏室',
        'wetRoom': '湿房',
        'powderRoom': '客用洗手间',
        'ensuiteBathroom': '套间浴室',
        'sharedBathroom': '共用浴室',
        'outdoorBathroom': '户外浴室',
        'steamRoom': '蒸汽房',
        'hammam': '土耳其浴室',
        'massage': '按摩室',
        'yogaRoom': '瑜伽室',
        'meditationRoom': '冥想室',
        'artStudio': '艺术工作室',
        'workshop': '工作坊',

        // Кухня и ванная
        'westernKitchen': '西式厨房',
        'thaiKitchen': '泰式厨房',
        'openKitchen': '开放式厨房',
        'closedKitchen': '封闭式厨房',
        'bathtub': '浴缸',
        'shower': '淋浴',
        'separateShower': '独立淋浴间',

        // Бассейны
        'privatePool': '私人泳池',
        'sharedPool': '共用泳池',
        'infinityPool': '无边泳池',
        'kidPool': '儿童泳池',

        // Системы безопасности
        'smartHome': '智能家居',
        'securitySystem': '安防系统',
        'cctv': '监控摄像头',
        'alarmSystem': '警报系统',
        'intercom': '对讲机',
        'videoIntercom': '可视对讲',
        'safebox': '保险箱',

        // Климат-контроль
        'airConditioning': '空调',
        'centralAC': '中央空调',
        'heating': '暖气',
        'floorHeating': '地暖',
        'fireplace': '壁炉',

        // Энергетика
        'solarPanels': '太阳能板',
        'waterHeater': '热水器',
        'solarWaterHeater': '太阳能热水器',
        'generator': '发电机',
        'ups': '不间断电源',

        // Архитектурные особенности
        'highCeiling': '高天花板',
        'largeWindows': '大窗户',
        'floorToFloorWindows': '落地窗',
        'walkinCloset': '步入式衣帽间',
        'builtinWardrobe': '内置衣柜',
        'separateEntrance': '独立入口',
        'privateEntrance': '私人入口',
        'soundproofing': '隔音',

        // Системы очистки
        'waterFiltration': '水过滤系统',
        'airPurifier': '空气净化器',

        // Техника
        'washer': '洗衣机',
        'dryer': '烘干机',
        'dishwasher': '洗碗机',
        'refrigerator': '冰箱',
        'microwave': '微波炉',
        'oven': '烤箱',
        'stove': '炉灶',
        'gasStove': '燃气灶',
        'electricStove': '电炉',
        'inductionStove': '电磁炉',
        'coffeemaker': '咖啡机',
        'waterDispenser': '饮水机',

        // Развлечения
        'tv': '电视',
        'smartTV': '智能电视',
        'wifi': 'Wi-Fi',
        'highSpeedInternet': '高速网络',
        'fiberOptic': '光纤',
        'telephone': '电话',
        'satelliteTV': '卫星电视',
        'surround': '环绕音响',
        'homeTheater': '家庭影院',
        'musicSystem': '音响系统',
        'piano': '钢琴',

        // Меблировка и состояние
        'furnished': '带家具',
        'partiallyFurnished': '部分家具',
        'fullyEquipped': '全套设备',
        'euroRenovation': '欧式装修',
        'designerRenovation': '设计师装修',
        'modernDesign': '现代设计',
        'traditionalStyle': '传统风格',
        'minimalist': '极简风格',
        'luxury': '豪华',

        // Планировка
        'penthouseLevel': '顶层公寓',
        'groundFloor': '一楼',
        'topFloor': '顶楼',
        'multiLevel': '多层',
        'studio': '开间',
        'openPlan': '开放式布局',

        // Доступность
        'petFriendly': '允许宠物',
        'childFriendly': '适合儿童',
        'wheelchair': '轮椅通道',
        'disabledAccess': '无障碍通道',
        'ramp': '坡道',

        // Безопасность
        'emergencyExit': '紧急出口',
        'fireExtinguisher': '灭火器',
        'firstAidKit': '急救箱',
        'smokeDetector': '烟雾探测器',
        'carbonMonoxide': '一氧化碳探测器',

        // Экология
        'eco': '环保',
        'energyEfficient': '节能',
        'sustainable': '可持续',
        'greenBuilding': '绿色建筑',
        'leed': 'LEED认证',

        // Статус
        'newConstruction': '新建',
        'underConstruction': '在建',
        'readyToMove': '即可入住',
        'offPlan': '期房',
        'resale': '二手房',

        // Outdoor features - Сад и ландшафт
        'garden': '花园',
        'privateGarden': '私人花园',
        'landscaped': '景观设计',
        'tropicalGarden': '热带花园',
        'japaneseGarden': '日式花园',
        'vegetableGarden': '菜园',
        'fruitTrees': '果树',
        'flowerGarden': '花圃',

        // Террасы и крыши
        'terrace': '露台',
        'rooftop': '屋顶',
        'rooftopTerrace': '屋顶露台',
        'skyGarden': '空中花园',

        // Зоны отдыха и готовки
        'bbqArea': '烧烤区',
        'outdoorKitchen': '户外厨房',
        'outdoorShower': '户外淋浴',
        'beachShower': '海滩淋浴',
        'summerKitchen': '夏季厨房',
        'outdoorDining': '户外用餐区',
        'lounge': '休息区',
        'sunbeds': '躺椅',
        'sunshade': '遮阳伞',
        'pergola': '凉棚',
        'gazebo': '凉亭',
        'pavilion': '亭子',

        // Парковка
        'garage': '车库',
        'carport': '车棚',
        'coveredParking': '有顶停车场',
        'openParking': '露天停车场',
        'secureParking': '安全停车场',
        'guestParking': '访客停车位',
        'electricCarCharger': '电动车充电桩',
        'bikestorage': '自行车停车位',

        // Водные элементы
        'poolBar': '泳池吧',
        'fountain': '喷泉',
        'pond': '池塘',
        'koiPond': '锦鲤池',
        'waterfall': '瀑布',
        'streambed': '溪流',

        // Детские зоны
        'playground': '儿童游乐场',
        'swingSet': '秋千',
        'slide': '滑梯',
        'sandbox': '沙坑',
        'trampoline': '蹦床',

        // Зоны для животных
        'petArea': '宠物区',
        'dogRun': '遛狗区',
        'petShower': '宠物淋浴',

        // Хранение и хозяйство
        'storageRoom': '储藏室',
        'shed': '棚屋',
        'greenhouse': '温室',
        'laundryRoom': '洗衣房',
        'dryingArea': '晾晒区',

        // Спортивные площадки
        'outdoorGym': '户外健身房',
        'sportsArea': '运动区',
        'tennisCourt': '网球场',
        'basketballCourt': '篮球场',
        'footballField': '足球场',
        'volleyball': '排球场',
        'badminton': '羽毛球场',
        'puttingGreen': '高尔夫果岭',
        'bocce': '地掷球场',
        'skatepark': '滑板公园',
        'joggingTrack': '跑步道',
        'walkingPath': '步行道',
        'cyclingPath': '自行车道',

        // Водный доступ
        'fishingPier': '钓鱼码头',
        'boatDock': '船坞',
        'marina': '码头',
        'beachAccess': '海滩通道',
        'privateBeach': '私人海滩',
        'beachCabana': '海滩小屋',

        // Ограждение и безопасность
        'fence': '围栏',
        'wall': '围墙',
        'gate': '大门',
        'electricGate': '电动门',
        'securityGate': '安全门',
        'driveway': '车道',
        'pavedDriveway': '铺装车道',
        'gravelDriveway': '碎石车道',

        // Освещение
        'streetLighting': '路灯',
        'gardenLighting': '花园照明',
        'securityLighting': '安全照明',
        'decorativeLighting': '装饰照明',

        // Системы полива
        'sprinklerSystem': '喷灌系统',
        'automaticSprinklers': '自动喷灌',
        'drip': '滴灌',
        'irrigationSystem': '灌溉系统',
        'rainwaterCollection': '雨水收集',

        // Водоснабжение
        'well': '水井',
        'borehole': '钻孔',
        'waterTank': '水箱',
        'waterPump': '水泵',
        'septicTank': '化粪池',
        'sewageSystem': '污水系统',
        'drainageSystem': '排水系统',

        // Rental features - Услуги персонала
        'maidService': '女佣服务',
        'dailyCleaning': '每日清洁',
        'weeklyCleaning': '每周清洁',
        'chefService': '厨师服务',
        'privateChef': '私人厨师',
        'cateringService': '餐饮服务',
        'driverService': '司机服务',

        // Трансфер и транспорт
        'airportTransfer': '机场接送',
        'carRental': '汽车租赁',
        'bicycleRental': '自行车租赁',
        'scooterRental': '摩托车租赁',
        'boatRental': '游艇租赁',
        'kayakRental': '皮划艇租赁',

        // Питание
        'breakfastIncluded': '含早餐',
        'halfBoard': '半食宿',
        'fullBoard': '全食宿',
        'allInclusive': '全包',

        // Уборка и стирка
        'cleaning': '清洁',
        'linenChange': '更换床单',
        'towelChange': '更换毛巾',
        'laundryService': '洗衣服务',
        'dryClean': '干洗',
        'ironing': '熨烫',

        // Коммунальные услуги
        'utilitiesIncluded': '含公用设施',
        'electricityIncluded': '含电费',
        'waterIncluded': '含水费',
        'gasIncluded': '含燃气费',
        'wifiIncluded': '含Wi-Fi',
        'internetIncluded': '含网络',
        'cableTv': '有线电视',
        'streamingServices': '流媒体服务',

        // Сервисы
        'conciergeService': '礼宾服务',
        '24hConcierge': '24小时礼宾',
        'securityGuard': '保安',
        '24hSecurity': '24小时安保',
        'management': '管理',
        'propertyManagement': '物业管理',
        'maintenance': '维护',
        'repairService': '维修服务',
        'gardenMaintenance': '花园维护',
        'poolMaintenance': '泳池维护',
        'pestControl': '害虫防治',
        'wasteDisposal': '垃圾处理',
        'recycling': '回收',

        // Уход
        'petCare': '宠物护理',
        'petSitting': '宠物看管',
        'dogWalking': '遛狗',
        'babysitting': '保姆',
        'childcare': '儿童看护',
        'eldercare': '老人护理',

        // Медицина
        'medicalService': '医疗服务',
        'nurseOnCall': '随叫护士',
        'doctorOnCall': '随叫医生',
        'ambulance': '救护车',
        'pharmacy': '药房',

        // Доставка
        'grocery': '杂货配送',
        'shopping': '购物服务',
        'delivery': '配送',
        'courierService': '快递服务',
        'mailHandling': '邮件处理',
        'packageReceiving': '包裹接收',

        // Автосервис
        'valetParking': '代客泊车',
        'carWash': '洗车',
        'carService': '汽车服务',

        // Водные виды спорта
        'snorkeling': '浮潜',
        'divingEquipment': '潜水装备',
        'fishing': '钓鱼',
        'surfingLessons': '冲浪课程',
        'kitesurfing': '风筝冲浪',
        'wakeboarding': '尾波滑水',
        'jetski': '水上摩托',
        'parasailing': '帆伞运动',
        'bananaBoat': '香蕉船',
        'speedboat': '快艇',
        'yachtCharter': '游艇租赁',

        // Премиум услуги
        'helicopterService': '直升机服务',
        'privatePlane': '私人飞机',
        'limousineService': '豪华轿车服务',

        // Бронирование
        'tourBooking': '旅游预订',
        'ticketBooking': '门票预订',
        'restaurantReservation': '餐厅预订',
        'spaBooking': '水疗预订',

        // Красота и здоровье
        'massageService': '按摩服务',
        'beautyService': '美容服务',
        'hairSalon': '美发沙龙',
        'nailSalon': '美甲沙龙',

        // Спорт и фитнес
        'personalTrainer': '私人教练',
        'yogaInstructor': '瑜伽教练',
        'pilatesInstructor': '普拉提教练',
        'tennisCoach': '网球教练',
        'golfCoach': '高尔夫教练',
        'swimInstructor': '游泳教练',

        // Мероприятия
        'eventPlanning': '活动策划',
        'partyPlanning': '派对策划',
        'weddingPlanning': '婚礼策划',
        'catering': '餐饮',
        'florist': '花艺',
        'photographer': '摄影师',
        'videographer': '摄像师',
        'musician': '音乐家',
        'dj': 'DJ',
        'entertainer': '艺人',

        // Профессиональные услуги
        'translation': '翻译',
        'interpreter': '口译',
        'legalService': '法律服务',
        'lawyer': '律师',
        'notary': '公证',
        'accounting': '会计',
        'taxService': '税务服务',
        'insurance': '保险',
        'visaAssistance': '签证协助',
        'immigration': '移民',
        'relocation': '搬迁',

        // Аренда
        'storage': '储存',
        'furnitureRental': '家具租赁',
        'applianceRental': '电器租赁',

        // Типы аренды
        'shortTermRental': '短期租赁',
        'longTermRental': '长期租赁',
        'monthlyRental': '月租',
        'weeklyRental': '周租',
        'dailyRental': '日租',

        // Условия заезда
        'flexibleCheckIn': '灵活入住',
        'lateCheckOut': '延迟退房',
        'earlyCheckIn': '提前入住',

        // Оплата
        'depositRequired': '需要押金',
        'noDeposit': '无押金',
        'creditCardRequired': '需要信用卡',
        'cashPayment': '现金支付',
        'bankTransfer': '银行转账',
        'onlinePayment': '在线支付',
        'installmentPlan': '分期付款',

        // Скидки
        'discountAvailable': '有折扣',
        'seasonalDiscount': '季节性折扣',
        'longStayDiscount': '长住折扣',
        'earlyBooking': '早鸟优惠',
        'lastMinute': '最后一刻',
        'studentDiscount': '学生折扣',
        'seniorDiscount': '老年折扣',
        'militaryDiscount': '军人折扣',
        'corporateRate': '企业价',
        'groupRate': '团体价',

        // Правила
        'noSmoking': '禁止吸烟',
        'smokingAllowed': '允许吸烟',
        'noPets': '禁止宠物',
        'noParties': '禁止派对',
        'quietHours': '安静时间',
        'noiseCurfew': '噪音宵禁',
        'minimumAge': '最低年龄',
        'adultsOnly': '仅限成人',
        'familyFriendly': '适合家庭',
        'kidfriendly': '适合儿童',
        'infantFriendly': '适合婴儿',
        'teenagerFriendly': '适合青少年',

        // Location features - Пляж
        'beachFront': '海滨',
        'secondLine': '第二排',
        'walkToBeach': '步行到海滩',

        // Образование
        'nearSchool': '靠近学校',
        'nearInternationalSchool': '靠近国际学校',
        'nearKindergarten': '靠近幼儿园',
        'nearUniversity': '靠近大学',

        // Медицина
        'nearHospital': '靠近医院',
        'nearClinic': '靠近诊所',
        'nearPharmacy': '靠近药房',

        // Магазины
        'nearSupermarket': '靠近超市',
        'nearConvenience': '靠近便利店',
        'nearMarket': '靠近市场',
        'nearMall': '靠近购物中心',
        'nearShops': '靠近商店',

        // Рестораны и бары
        'nearRestaurant': '靠近餐厅',
        'nearCafe': '靠近咖啡馆',
        'nearBar': '靠近酒吧',
        'nearNightlife': '靠近夜生活',

        // Спорт и отдых
        'nearGolfCourse': '靠近高尔夫球场',
        'nearMarina': '靠近码头',
        'nearYachtClub': '靠近游艇俱乐部',
        'nearTennisCourt': '靠近网球场',
        'nearBasketball': '靠近篮球场',
        'nearFootball': '靠近足球场',
        'nearVolleyball': '靠近排球场',
        'nearSkatepark': '靠近滑板公园',
        'nearGym': '靠近健身房',
        'nearFitness': '靠近健身中心',
        'nearYoga': '靠近瑜伽馆',
        'nearSpa': '靠近水疗中心',
        'nearWellness': '靠近养生中心',

        // Транспорт
        'nearAirport': '靠近机场',
        'nearBusStop': '靠近公交站',
        'nearBusTerminal': '靠近汽车站',
        'nearTaxiStand': '靠近出租车站',
        'nearMetro': '靠近地铁',
        'nearTrain': '靠近火车站',
        'nearHighway': '靠近高速公路',
        'nearMainRoad': '靠近主干道',

        // Сервисы
        'nearBank': '靠近银行',
        'nearAtm': '靠近ATM',
        'nearPostOffice': '靠近邮局',
        'nearPolice': '靠近警察局',
        'nearFireStation': '靠近消防站',
        'nearEmbassy': '靠近大使馆',
        'nearGovernment': '靠近政府机构',
        'nearSalon': '靠近美容院',
        'nearVet': '靠近兽医',
        'nearPetShop': '靠近宠物店',

        // Религия
        'nearTemple': '靠近寺庙',
        'nearMosque': '靠近清真寺',
        'nearChurch': '靠近教堂',
        'nearSynagogue': '靠近犹太教堂',

        // Природа
        'nearPark': '靠近公园',
        'nearPlayground': '靠近游乐场',
        'nearGarden': '靠近花园',
        'nearForest': '靠近森林',
        'nearMountain': '靠近山',
        'nearLake': '靠近湖',
        'nearRiver': '靠近河',
        'nearWaterfall': '靠近瀑布',
        'nearNationalPark': '靠近国家公园',
        'nearNatureReserve': '靠近自然保护区',

        // Развлечения
        'nearZoo': '靠近动物园',
        'nearAquarium': '靠近水族馆',
        'nearMuseum': '靠近博物馆',
        'nearGallery': '靠近画廊',
        'nearTheater': '靠近剧院',
        'nearCinema': '靠近电影院',
        'nearConcertHall': '靠近音乐厅',
        'nearStadium': '靠近体育场',
        'nearSportsCenter': '靠近体育中心',
        'nearLibrary': '靠近图书馆',
        'nearBookstore': '靠近书店',

        // Туризм
        'nearTouristAttraction': '靠近旅游景点',
        'nearLandmark': '靠近地标',
        'nearViewpoint': '靠近观景点',
        'nearDiveSite': '靠近潜水点',
        'nearSurfSpot': '靠近冲浪点',
        'nearSnorkeling': '靠近浮潜点',
        'nearHiking': '靠近徒步路线',
        'nearCycling': '靠近自行车道',
        'nearJogging': '靠近跑步道',

        // Характер района
        'quietArea': '安静区域',
        'peacefulLocation': '宁静地段',
        'residentialArea': '住宅区',
        'commercialArea': '商业区',
        'businessDistrict': '商务区',
        'touristArea': '旅游区',
        'localArea': '本地区域',
        'expatArea': '外籍人士区',
        'internationalCommunity': '国际社区',
        'gatedCommunity': '封闭社区',
        'secureComplex': '安全小区',
        'privateCommunity': '私人社区',
        'luxuryDevelopment': '豪华开发',
        'newDevelopment': '新开发',
        'establishedArea': '成熟区域',
        'upAndComing': '新兴区域',
        'trendyArea': '时尚区域',
        'historicDistrict': '历史街区',
        'culturalQuarter': '文化区',
        'artDistrict': '艺术区',
        'entertainmentDistrict': '娱乐区',
        'financialDistrict': '金融区',
        'shoppingDistrict': '购物区',

        // Расположение в городе
        'cityCentre': '市中心',
        'cityCenter': '市中心',
        'downtown': '市中心',
        'midtown': '中城',
        'uptown': '上城',
        'suburb': '郊区',
        'outskirts': '郊外',
        'countryside': '乡村',
        'rural': '农村',
        'urban': '城市',
        'metropolitan': '大都市',

        // Географическое положение
        'coastal': '沿海',
        'inland': '内陆',
        'hillside': '山坡',
        'hilltop': '山顶',
        'valley': '山谷',
        'plateau': '高原',
        'peninsula': '半岛',
        'island': '岛屿',
        'mainland': '大陆',
        'waterfront': '滨水',
        'riverside': '河边',
        'lakeside': '湖边',
        'mountainside': '山腰',
        'forestEdge': '林边',
        'parkside': '公园旁',

        // Зонирование
        'greenBelt': '绿化带',
        'openSpace': '开放空间',
        'lowDensity': '低密度',
        'highDensity': '高密度',
        'mixedUse': '综合用途',
        'liveworkPlay': '工作生活娱乐',
        'masterPlanned': '总体规划',
        'smartCity': '智慧城市',
        'ecoVillage': '生态村',
        'sustainableCommunity': '可持续社区',

        // Транспортная доступность
        'walkable': '步行可达',
        'bikeFriendly': '自行车友好',
        'publicTransport': '公共交通',
        'transitOriented': '交通导向',
        'carDependent': '依赖汽车',
        'carFree': '无车',
        'pedestrianZone': '步行区',

        // Дорожная обстановка
        'lowTraffic': '低交通流量',
        'noThroughTraffic': '无过境交通',
        'deadEnd': '死胡同',
        'culDeSac': '尽头路',
        'mainStreet': '主街',
        'sideStreet': '小街',
        'privateStreet': '私人街道',
        'pavedRoad': '铺装道路',
        'dirtRoad': '土路',
        'streetParking': '街边停车',

        // Безопасность района
        'wellLit': '照明良好',
        'darkAtNight': '夜晚昏暗',
        'safeArea': '安全区域',
        'lowCrime': '低犯罪率',

        // Общество
        'neighborhood': '社区',
        'communitySpirit': '社区精神',
        'familyOriented': '家庭导向',
        'professionalArea': '专业区域',
        'studentArea': '学生区',
        'retirementCommunity': '退休社区',

        // Views - Морские виды
        'seaView': '海景',
        'oceanView': '海洋景观',
        'beachView': '海滩景观',
        'bayView': '海湾景观',
        'coastalView': '海岸景观',
        'partialSeaView': '部分海景',
        'glimpseOfSea': '可见海景',
        'distantSeaView': '远海景观',

        // Природные виды
        'sunsetView': '日落景观',
        'sunriseView': '日出景观',
        'mountainView': '山景',
        'hillView': '山丘景观',
        'volcanoView': '火山景观',
        'forestView': '森林景观',
        'lakeView': '湖景',
        'riverView': '河景',
        'waterfallView': '瀑布景观',
        'pondView': '池塘景观',

        // Виды на территорию
        'poolView': '泳池景观',
        'gardenView': '花园景观',
        'parkView': '公园景观',

        // Городские виды
        'cityView': '城市景观',
        'skylineView': '天际线景观',

        // Характер вида
        'panoramicView': '全景',
        'unobstructedView': '无遮挡景观',
        '180View': '180度景观',
        '360View': '360度景观',
        'scenicView': '风景优美',
        'spectacularView': '壮观景象',
        'breathtakingView': '令人惊叹的景观',
        'stunningView': '迷人景观',
        'magnificentView': '壮丽景观',
        'beautifulView': '美丽景观',
        'niceView': '好景观',
        'pleasantView': '宜人景观',

        // С точки обзора
        'rooftopView': '屋顶景观',
        'balconyView': '阳台景观',
        'terraceView': '露台景观',
        'windowView': '窗景',
        'floorToFloorView': '全景窗',
        'elevatedView': '高处景观',
        'groundLevelView': '地面景观',
        'skylightView': '天窗景观',

        // Внутренние виды
        'noView': '无景观',
        'obstructedView': '遮挡景观',
        'limitedView': '有限景观',
        'interiorView': '内景',
        'courtyardView': '庭院景观',
        'atriumView': '中庭景观',

        // Виды на объекты
        'streetView': '街景',
        'roadView': '路景',
        'parkingView': '停车场景观',
        'neighborView': '邻居景观',
        'wallView': '墙景',
        'buildingView': '建筑景观',
        'roofView': '屋顶景观',
        'towerView': '塔景',
        'bridgeView': '桥景',

        // Культурные объекты
        'monumentView': '纪念碑景观',
        'templeView': '寺庙景观',
        'palaceView': '宫殿景观',
        'castleView': '城堡景观',
        'stadiumView': '体育场景观',

        // Транспортные объекты
        'airportView': '机场景观',
        'portView': '港口景观',
        'marinaView': '码头景观',
        'yachtView': '游艇景观',
        'boatView': '船景',
        'shipView': '轮船景观',

        // Прочее
        'islandView': '岛屿景观',
        'horizonView': '地平线景观',
        'clearView': '清晰景观',
        'privateView': '私密景观',
        'sharedView': '共享景观',

        // Стороны света
        'facingNorth': '朝北',
        'facingSouth': '朝南',
        'facingEast': '朝东',
        'facingWest': '朝西',
        'northeastView': '东北景观',
        'northwestView': '西北景观',
        'southeastView': '东南景观',
        'southwestView': '西南景观'
      },
      en: {
                // Property features - Комнаты и помещения
        'mediaRoom': 'Media Room',
        'privateGym': 'Private Gym',
        'privateLift': 'Private Lift',
        'privateSauna': 'Private Sauna',
        'jacuzzi': 'Jacuzzi',
        'cornerUnit': 'Corner Unit',
        'maidsQuarters': 'Maid\'s Quarters',
        'duplex': 'Duplex',
        'triplex': 'Triplex',
        'balcony': 'Balcony',
        'study': 'Study',
        'library': 'Library',
        'winecellar': 'Wine Cellar',
        'elevator': 'Elevator',
        'homeElevator': 'Home Elevator',
        'gameRoom': 'Game Room',
        'billiardRoom': 'Billiard Room',
        'kidsRoom': 'Kids Room',
        'nursery': 'Nursery',
        'guestRoom': 'Guest Room',
        'serviceRoom': 'Service Room',
        'utilityRoom': 'Utility Room',
        'pantry': 'Pantry',
        'wetRoom': 'Wet Room',
        'powderRoom': 'Powder Room',
        'ensuiteBathroom': 'Ensuite Bathroom',
        'sharedBathroom': 'Shared Bathroom',
        'outdoorBathroom': 'Outdoor Bathroom',
        'steamRoom': 'Steam Room',
        'hammam': 'Hammam',
        'massage': 'Massage Room',
        'yogaRoom': 'Yoga Room',
        'meditationRoom': 'Meditation Room',
        'artStudio': 'Art Studio',
        'workshop': 'Workshop',

        // Кухня и ванная
        'westernKitchen': 'Western Kitchen',
        'thaiKitchen': 'Thai Kitchen',
        'openKitchen': 'Open Kitchen',
        'closedKitchen': 'Closed Kitchen',
        'bathtub': 'Bathtub',
        'shower': 'Shower',
        'separateShower': 'Separate Shower',

        // Бассейны
        'privatePool': 'Private Pool',
        'sharedPool': 'Shared Pool',
        'infinityPool': 'Infinity Pool',
        'kidPool': 'Kids Pool',

        // Системы безопасности
        'smartHome': 'Smart Home',
        'securitySystem': 'Security System',
        'cctv': 'CCTV',
        'alarmSystem': 'Alarm System',
        'intercom': 'Intercom',
        'videoIntercom': 'Video Intercom',
        'safebox': 'Safe Box',

        // Климат-контроль
        'airConditioning': 'Air Conditioning',
        'centralAC': 'Central AC',
        'heating': 'Heating',
        'floorHeating': 'Floor Heating',
        'fireplace': 'Fireplace',

        // Энергетика
        'solarPanels': 'Solar Panels',
        'waterHeater': 'Water Heater',
        'solarWaterHeater': 'Solar Water Heater',
        'generator': 'Generator',
        'ups': 'UPS',

        // Архитектурные особенности
        'highCeiling': 'High Ceiling',
        'largeWindows': 'Large Windows',
        'floorToFloorWindows': 'Floor-to-Ceiling Windows',
        'walkinCloset': 'Walk-in Closet',
        'builtinWardrobe': 'Built-in Wardrobe',
        'separateEntrance': 'Separate Entrance',
        'privateEntrance': 'Private Entrance',
        'soundproofing': 'Soundproofing',

        // Системы очистки
        'waterFiltration': 'Water Filtration',
        'airPurifier': 'Air Purifier',

        // Техника
        'washer': 'Washer',
        'dryer': 'Dryer',
        'dishwasher': 'Dishwasher',
        'refrigerator': 'Refrigerator',
        'microwave': 'Microwave',
        'oven': 'Oven',
        'stove': 'Stove',
        'gasStove': 'Gas Stove',
        'electricStove': 'Electric Stove',
        'inductionStove': 'Induction Stove',
        'coffeemaker': 'Coffee Maker',
        'waterDispenser': 'Water Dispenser',

        // Развлечения
        'tv': 'TV',
        'smartTV': 'Smart TV',
        'wifi': 'Wi-Fi',
        'highSpeedInternet': 'High-Speed Internet',
        'fiberOptic': 'Fiber Optic',
        'telephone': 'Telephone',
        'satelliteTV': 'Satellite TV',
        'surround': 'Surround Sound',
        'homeTheater': 'Home Theater',
        'musicSystem': 'Music System',
        'piano': 'Piano',

        // Меблировка и состояние
        'furnished': 'Furnished',
        'partiallyFurnished': 'Partially Furnished',
        'fullyEquipped': 'Fully Equipped',
        'euroRenovation': 'European Renovation',
        'designerRenovation': 'Designer Renovation',
        'modernDesign': 'Modern Design',
        'traditionalStyle': 'Traditional Style',
        'minimalist': 'Minimalist',
        'luxury': 'Luxury',

        // Планировка
        'penthouseLevel': 'Penthouse Level',
        'groundFloor': 'Ground Floor',
        'topFloor': 'Top Floor',
        'multiLevel': 'Multi-Level',
        'studio': 'Studio',
        'openPlan': 'Open Plan',

        // Доступность
        'petFriendly': 'Pet Friendly',
        'childFriendly': 'Child Friendly',
        'wheelchair': 'Wheelchair Accessible',
        'disabledAccess': 'Disabled Access',
        'ramp': 'Ramp',

        // Безопасность
        'emergencyExit': 'Emergency Exit',
        'fireExtinguisher': 'Fire Extinguisher',
        'firstAidKit': 'First Aid Kit',
        'smokeDetector': 'Smoke Detector',
        'carbonMonoxide': 'Carbon Monoxide Detector',

        // Экология
        'eco': 'Eco-Friendly',
        'energyEfficient': 'Energy Efficient',
        'sustainable': 'Sustainable',
        'greenBuilding': 'Green Building',
        'leed': 'LEED Certified',

        // Статус
        'newConstruction': 'New Construction',
        'underConstruction': 'Under Construction',
        'readyToMove': 'Ready to Move',
        'offPlan': 'Off-Plan',
        'resale': 'Resale',

        // Outdoor features - Сад и ландшафт
        'garden': 'Garden',
        'privateGarden': 'Private Garden',
        'landscaped': 'Landscaped',
        'tropicalGarden': 'Tropical Garden',
        'japaneseGarden': 'Japanese Garden',
        'vegetableGarden': 'Vegetable Garden',
        'fruitTrees': 'Fruit Trees',
        'flowerGarden': 'Flower Garden',

        // Террасы и крыши
        'terrace': 'Terrace',
        'rooftop': 'Rooftop',
        'rooftopTerrace': 'Rooftop Terrace',
        'skyGarden': 'Sky Garden',

        // Зоны отдыха и готовки
        'bbqArea': 'BBQ Area',
        'outdoorKitchen': 'Outdoor Kitchen',
        'outdoorShower': 'Outdoor Shower',
        'beachShower': 'Beach Shower',
        'summerKitchen': 'Summer Kitchen',
        'outdoorDining': 'Outdoor Dining',
        'lounge': 'Lounge Area',
        'sunbeds': 'Sun Beds',
        'sunshade': 'Sunshade',
        'pergola': 'Pergola',
        'gazebo': 'Gazebo',
        'pavilion': 'Pavilion',

        // Парковка
        'garage': 'Garage',
        'carport': 'Carport',
        'coveredParking': 'Covered Parking',
        'openParking': 'Open Parking',
        'secureParking': 'Secure Parking',
        'guestParking': 'Guest Parking',
        'electricCarCharger': 'Electric Car Charger',
        'bikestorage': 'Bike Storage',

        // Водные элементы
        'poolBar': 'Pool Bar',
        'fountain': 'Fountain',
        'pond': 'Pond',
        'koiPond': 'Koi Pond',
        'waterfall': 'Waterfall',
        'streambed': 'Stream',

        // Детские зоны
        'playground': 'Playground',
        'swingSet': 'Swing Set',
        'slide': 'Slide',
        'sandbox': 'Sandbox',
        'trampoline': 'Trampoline',

        // Зоны для животных
        'petArea': 'Pet Area',
        'dogRun': 'Dog Run',
        'petShower': 'Pet Shower',

        // Хранение и хозяйство
        'storageRoom': 'Storage Room',
        'shed': 'Shed',
        'greenhouse': 'Greenhouse',
        'laundryRoom': 'Laundry Room',
        'dryingArea': 'Drying Area',

        // Спортивные площадки
        'outdoorGym': 'Outdoor Gym',
        'sportsArea': 'Sports Area',
        'tennisCourt': 'Tennis Court',
        'basketballCourt': 'Basketball Court',
        'footballField': 'Football Field',
        'volleyball': 'Volleyball Court',
        'badminton': 'Badminton Court',
        'puttingGreen': 'Putting Green',
        'bocce': 'Bocce Court',
        'skatepark': 'Skate Park',
        'joggingTrack': 'Jogging Track',
        'walkingPath': 'Walking Path',
        'cyclingPath': 'Cycling Path',

        // Водный доступ
        'fishingPier': 'Fishing Pier',
        'boatDock': 'Boat Dock',
        'marina': 'Marina',
        'beachAccess': 'Beach Access',
        'privateBeach': 'Private Beach',
        'beachCabana': 'Beach Cabana',

        // Ограждение и безопасность
        'fence': 'Fence',
        'wall': 'Wall',
        'gate': 'Gate',
        'electricGate': 'Electric Gate',
        'securityGate': 'Security Gate',
        'driveway': 'Driveway',
        'pavedDriveway': 'Paved Driveway',
        'gravelDriveway': 'Gravel Driveway',

        // Освещение
        'streetLighting': 'Street Lighting',
        'gardenLighting': 'Garden Lighting',
        'securityLighting': 'Security Lighting',
        'decorativeLighting': 'Decorative Lighting',

        // Системы полива
        'sprinklerSystem': 'Sprinkler System',
        'automaticSprinklers': 'Automatic Sprinklers',
        'drip': 'Drip Irrigation',
        'irrigationSystem': 'Irrigation System',
        'rainwaterCollection': 'Rainwater Collection',

        // Водоснабжение
        'well': 'Well',
        'borehole': 'Borehole',
        'waterTank': 'Water Tank',
        'waterPump': 'Water Pump',
        'septicTank': 'Septic Tank',
        'sewageSystem': 'Sewage System',
        'drainageSystem': 'Drainage System',

        // Rental features - Услуги персонала
        'maidService': 'Maid Service',
        'dailyCleaning': 'Daily Cleaning',
        'weeklyCleaning': 'Weekly Cleaning',
        'chefService': 'Chef Service',
        'privateChef': 'Private Chef',
        'cateringService': 'Catering Service',
        'driverService': 'Driver Service',

        // Трансфер и транспорт
        'airportTransfer': 'Airport Transfer',
        'carRental': 'Car Rental',
        'bicycleRental': 'Bicycle Rental',
        'scooterRental': 'Scooter Rental',
        'boatRental': 'Boat Rental',
        'kayakRental': 'Kayak Rental',

        // Питание
        'breakfastIncluded': 'Breakfast Included',
        'halfBoard': 'Half Board',
        'fullBoard': 'Full Board',
        'allInclusive': 'All Inclusive',

        // Уборка и стирка
        'cleaning': 'Cleaning',
        'linenChange': 'Linen Change',
        'towelChange': 'Towel Change',
        'laundryService': 'Laundry Service',
        'dryClean': 'Dry Cleaning',
        'ironing': 'Ironing',

        // Коммунальные услуги
        'utilitiesIncluded': 'Utilities Included',
        'electricityIncluded': 'Electricity Included',
        'waterIncluded': 'Water Included',
        'gasIncluded': 'Gas Included',
        'wifiIncluded': 'Wi-Fi Included',
        'internetIncluded': 'Internet Included',
        'cableTv': 'Cable TV',
        'streamingServices': 'Streaming Services',

        // Сервисы
        'conciergeService': 'Concierge Service',
        '24hConcierge': '24/7 Concierge',
        'securityGuard': 'Security Guard',
        '24hSecurity': '24/7 Security',
        'management': 'Management',
        'propertyManagement': 'Property Management',
        'maintenance': 'Maintenance',
        'repairService': 'Repair Service',
        'gardenMaintenance': 'Garden Maintenance',
        'poolMaintenance': 'Pool Maintenance',
        'pestControl': 'Pest Control',
        'wasteDisposal': 'Waste Disposal',
        'recycling': 'Recycling',

        // Уход
        'petCare': 'Pet Care',
        'petSitting': 'Pet Sitting',
        'dogWalking': 'Dog Walking',
        'babysitting': 'Babysitting',
        'childcare': 'Childcare',
        'eldercare': 'Elder Care',

        // Медицина
        'medicalService': 'Medical Service',
        'nurseOnCall': 'Nurse on Call',
        'doctorOnCall': 'Doctor on Call',
        'ambulance': 'Ambulance',
        'pharmacy': 'Pharmacy',

        // Доставка
        'grocery': 'Grocery Delivery',
        'shopping': 'Shopping Service',
        'delivery': 'Delivery',
        'courierService': 'Courier Service',
        'mailHandling': 'Mail Handling',
        'packageReceiving': 'Package Receiving',

        // Автосервис
        'valetParking': 'Valet Parking',
        'carWash': 'Car Wash',
        'carService': 'Car Service',

        // Водные виды спорта
        'snorkeling': 'Snorkeling',
        'divingEquipment': 'Diving Equipment',
        'fishing': 'Fishing',
        'surfingLessons': 'Surfing Lessons',
        'kitesurfing': 'Kitesurfing',
        'wakeboarding': 'Wakeboarding',
        'jetski': 'Jet Ski',
        'parasailing': 'Parasailing',
        'bananaBoat': 'Banana Boat',
        'speedboat': 'Speedboat',
        'yachtCharter': 'Yacht Charter',

        // Премиум услуги
        'helicopterService': 'Helicopter Service',
        'privatePlane': 'Private Plane',
        'limousineService': 'Limousine Service',

        // Бронирование
        'tourBooking': 'Tour Booking',
        'ticketBooking': 'Ticket Booking',
        'restaurantReservation': 'Restaurant Reservation',
        'spaBooking': 'Spa Booking',

        // Красота и здоровье
        'massageService': 'Massage Service',
        'beautyService': 'Beauty Service',
        'hairSalon': 'Hair Salon',
        'nailSalon': 'Nail Salon',

        // Спорт и фитнес
        'personalTrainer': 'Personal Trainer',
        'yogaInstructor': 'Yoga Instructor',
        'pilatesInstructor': 'Pilates Instructor',
        'tennisCoach': 'Tennis Coach',
        'golfCoach': 'Golf Coach',
        'swimInstructor': 'Swim Instructor',

        // Мероприятия
        'eventPlanning': 'Event Planning',
        'partyPlanning': 'Party Planning',
        'weddingPlanning': 'Wedding Planning',
        'catering': 'Catering',
        'florist': 'Florist',
        'photographer': 'Photographer',
        'videographer': 'Videographer',
        'musician': 'Musician',
        'dj': 'DJ',
        'entertainer': 'Entertainer',

        // Профессиональные услуги
        'translation': 'Translation',
        'interpreter': 'Interpreter',
        'legalService': 'Legal Service',
        'lawyer': 'Lawyer',
        'notary': 'Notary',
        'accounting': 'Accounting',
        'taxService': 'Tax Service',
        'insurance': 'Insurance',
        'visaAssistance': 'Visa Assistance',
        'immigration': 'Immigration',
        'relocation': 'Relocation',

        // Аренда
        'storage': 'Storage',
        'furnitureRental': 'Furniture Rental',
        'applianceRental': 'Appliance Rental',

        // Типы аренды
        'shortTermRental': 'Short-Term Rental',
        'longTermRental': 'Long-Term Rental',
        'monthlyRental': 'Monthly Rental',
        'weeklyRental': 'Weekly Rental',
        'dailyRental': 'Daily Rental',

        // Условия заезда
        'flexibleCheckIn': 'Flexible Check-In',
        'lateCheckOut': 'Late Check-Out',
        'earlyCheckIn': 'Early Check-In',

        // Оплата
        'depositRequired': 'Deposit Required',
        'noDeposit': 'No Deposit',
        'creditCardRequired': 'Credit Card Required',
        'cashPayment': 'Cash Payment',
        'bankTransfer': 'Bank Transfer',
        'onlinePayment': 'Online Payment',
        'installmentPlan': 'Installment Plan',

        // Скидки
        'discountAvailable': 'Discount Available',
        'seasonalDiscount': 'Seasonal Discount',
        'longStayDiscount': 'Long Stay Discount',
        'earlyBooking': 'Early Booking',
        'lastMinute': 'Last Minute',
        'studentDiscount': 'Student Discount',
        'seniorDiscount': 'Senior Discount',
        'militaryDiscount': 'Military Discount',
        'corporateRate': 'Corporate Rate',
        'groupRate': 'Group Rate',

        // Правила
        'noSmoking': 'No Smoking',
        'smokingAllowed': 'Smoking Allowed',
        'noPets': 'No Pets',
        'noParties': 'No Parties',
        'quietHours': 'Quiet Hours',
        'noiseCurfew': 'Noise Curfew',
        'minimumAge': 'Minimum Age',
        'adultsOnly': 'Adults Only',
        'familyFriendly': 'Family Friendly',
        'kidfriendly': 'Kid Friendly',
        'infantFriendly': 'Infant Friendly',
        'teenagerFriendly': 'Teenager Friendly',

        // Location features - Пляж
        'beachFront': 'Beach Front',
        'secondLine': 'Second Line',
        'walkToBeach': 'Walk to Beach',

        // Образование
        'nearSchool': 'Near School',
        'nearInternationalSchool': 'Near International School',
        'nearKindergarten': 'Near Kindergarten',
        'nearUniversity': 'Near University',

        // Медицина
        'nearHospital': 'Near Hospital',
        'nearClinic': 'Near Clinic',
        'nearPharmacy': 'Near Pharmacy',

        // Магазины
        'nearSupermarket': 'Near Supermarket',
        'nearConvenience': 'Near Convenience Store',
        'nearMarket': 'Near Market',
        'nearMall': 'Near Mall',
        'nearShops': 'Near Shops',

        // Рестораны и бары
        'nearRestaurant': 'Near Restaurants',
        'nearCafe': 'Near Cafe',
        'nearBar': 'Near Bars',
        'nearNightlife': 'Near Nightlife',

        // Спорт и отдых
        'nearGolfCourse': 'Near Golf Course',
        'nearMarina': 'Near Marina',
        'nearYachtClub': 'Near Yacht Club',
        'nearTennisCourt': 'Near Tennis Court',
        'nearBasketball': 'Near Basketball Court',
        'nearFootball': 'Near Football Field',
        'nearVolleyball': 'Near Volleyball Court',
        'nearSkatepark': 'Near Skate Park',
        'nearGym': 'Near Gym',
        'nearFitness': 'Near Fitness Center',
        'nearYoga': 'Near Yoga Studio',
        'nearSpa': 'Near Spa',
        'nearWellness': 'Near Wellness Center',

        // Транспорт
        'nearAirport': 'Near Airport',
        'nearBusStop': 'Near Bus Stop',
        'nearBusTerminal': 'Near Bus Terminal',
        'nearTaxiStand': 'Near Taxi Stand',
        'nearMetro': 'Near Metro',
        'nearTrain': 'Near Train Station',
        'nearHighway': 'Near Highway',
        'nearMainRoad': 'Near Main Road',

        // Сервисы
        'nearBank': 'Near Bank',
        'nearAtm': 'Near ATM',
        'nearPostOffice': 'Near Post Office',
        'nearPolice': 'Near Police Station',
        'nearFireStation': 'Near Fire Station',
        'nearEmbassy': 'Near Embassy',
        'nearGovernment': 'Near Government Office',
        'nearSalon': 'Near Salon',
        'nearVet': 'Near Veterinary',
        'nearPetShop': 'Near Pet Shop',

        // Религия
        'nearTemple': 'Near Temple',
        'nearMosque': 'Near Mosque',
        'nearChurch': 'Near Church',
        'nearSynagogue': 'Near Synagogue',

        // Природа
        'nearPark': 'Near Park',
        'nearPlayground': 'Near Playground',
        'nearGarden': 'Near Garden',
        'nearForest': 'Near Forest',
        'nearMountain': 'Near Mountain',
        'nearLake': 'Near Lake',
        'nearRiver': 'Near River',
        'nearWaterfall': 'Near Waterfall',
        'nearNationalPark': 'Near National Park',
        'nearNatureReserve': 'Near Nature Reserve',

        // Развлечения
        'nearZoo': 'Near Zoo',
        'nearAquarium': 'Near Aquarium',
        'nearMuseum': 'Near Museum',
        'nearGallery': 'Near Gallery',
        'nearTheater': 'Near Theater',
        'nearCinema': 'Near Cinema',
        'nearConcertHall': 'Near Concert Hall',
        'nearStadium': 'Near Stadium',
        'nearSportsCenter': 'Near Sports Center',
        'nearLibrary': 'Near Library',
        'nearBookstore': 'Near Bookstore',

        // Туризм
        'nearTouristAttraction': 'Near Tourist Attraction',
        'nearLandmark': 'Near Landmark',
        'nearViewpoint': 'Near Viewpoint',
        'nearDiveSite': 'Near Dive Site',
        'nearSurfSpot': 'Near Surf Spot',
        'nearSnorkeling': 'Near Snorkeling',
        'nearHiking': 'Near Hiking Trails',
        'nearCycling': 'Near Cycling Routes',
        'nearJogging': 'Near Jogging Tracks',

        // Характер района
        'quietArea': 'Quiet Area',
        'peacefulLocation': 'Peaceful Location',
        'residentialArea': 'Residential Area',
        'commercialArea': 'Commercial Area',
        'businessDistrict': 'Business District',
        'touristArea': 'Tourist Area',
        'localArea': 'Local Area',
        'expatArea': 'Expat Area',
        'internationalCommunity': 'International Community',
        'gatedCommunity': 'Gated Community',
        'secureComplex': 'Secure Complex',
        'privateCommunity': 'Private Community',
        'luxuryDevelopment': 'Luxury Development',
        'newDevelopment': 'New Development',
        'establishedArea': 'Established Area',
        'upAndComing': 'Up and Coming',
        'trendyArea': 'Trendy Area',
        'historicDistrict': 'Historic District',
        'culturalQuarter': 'Cultural Quarter',
        'artDistrict': 'Art District',
        'entertainmentDistrict': 'Entertainment District',
        'financialDistrict': 'Financial District',
        'shoppingDistrict': 'Shopping District',

        // Расположение в городе
        'cityCentre': 'City Centre',
        'cityCenter': 'City Center',
        'downtown': 'Downtown',
        'midtown': 'Midtown',
        'uptown': 'Uptown',
        'suburb': 'Suburb',
        'outskirts': 'Outskirts',
        'countryside': 'Countryside',
        'rural': 'Rural',
        'urban': 'Urban',
        'metropolitan': 'Metropolitan',

        // Географическое положение
        'coastal': 'Coastal',
        'inland': 'Inland',
        'hillside': 'Hillside',
        'hilltop': 'Hilltop',
        'valley': 'Valley',
        'plateau': 'Plateau',
        'peninsula': 'Peninsula',
        'island': 'Island',
        'mainland': 'Mainland',
        'waterfront': 'Waterfront',
        'riverside': 'Riverside',
        'lakeside': 'Lakeside',
        'mountainside': 'Mountainside',
        'forestEdge': 'Forest Edge',
        'parkside': 'Parkside',

        // Зонирование
        'greenBelt': 'Green Belt',
        'openSpace': 'Open Space',
        'lowDensity': 'Low Density',
        'highDensity': 'High Density',
        'mixedUse': 'Mixed Use',
        'liveworkPlay': 'Live-Work-Play',
        'masterPlanned': 'Master Planned',
        'smartCity': 'Smart City',
        'ecoVillage': 'Eco Village',
        'sustainableCommunity': 'Sustainable Community',

        // Транспортная доступность
        'walkable': 'Walkable',
        'bikeFriendly': 'Bike Friendly',
        'publicTransport': 'Public Transport',
        'transitOriented': 'Transit Oriented',
        'carDependent': 'Car Dependent',
        'carFree': 'Car Free',
        'pedestrianZone': 'Pedestrian Zone',

        // Дорожная обстановка
        'lowTraffic': 'Low Traffic',
        'noThroughTraffic': 'No Through Traffic',
        'deadEnd': 'Dead End',
        'culDeSac': 'Cul-de-Sac',
        'mainStreet': 'Main Street',
        'sideStreet': 'Side Street',
        'privateStreet': 'Private Street',
        'pavedRoad': 'Paved Road',
        'dirtRoad': 'Dirt Road',
        'streetParking': 'Street Parking',

        // Безопасность района
        'wellLit': 'Well Lit',
        'darkAtNight': 'Dark at Night',
        'safeArea': 'Safe Area',
        'lowCrime': 'Low Crime',

        // Общество
        'neighborhood': 'Neighborhood',
        'communitySpirit': 'Community Spirit',
        'familyOriented': 'Family Oriented',
        'professionalArea': 'Professional Area',
        'studentArea': 'Student Area',
        'retirementCommunity': 'Retirement Community',

        // Views - Морские виды
        'seaView': 'Sea View',
        'oceanView': 'Ocean View',
        'beachView': 'Beach View',
        'bayView': 'Bay View',
        'coastalView': 'Coastal View',
        'partialSeaView': 'Partial Sea View',
        'glimpseOfSea': 'Glimpse of Sea',
        'distantSeaView': 'Distant Sea View',

        // Природные виды
        'sunsetView': 'Sunset View',
        'sunriseView': 'Sunrise View',
        'mountainView': 'Mountain View',
        'hillView': 'Hill View',
        'volcanoView': 'Volcano View',
        'forestView': 'Forest View',
        'lakeView': 'Lake View',
        'riverView': 'River View',
        'waterfallView': 'Waterfall View',
        'pondView': 'Pond View',

        // Виды на территорию
        'poolView': 'Pool View',
        'gardenView': 'Garden View',
        'parkView': 'Park View',

        // Городские виды
        'cityView': 'City View',
        'skylineView': 'Skyline View',

        // Характер вида
        'panoramicView': 'Panoramic View',
        'unobstructedView': 'Unobstructed View',
        '180View': '180° View',
        '360View': '360° View',
        'scenicView': 'Scenic View',
        'spectacularView': 'Spectacular View',
        'breathtakingView': 'Breathtaking View',
        'stunningView': 'Stunning View',
        'magnificentView': 'Magnificent View',
        'beautifulView': 'Beautiful View',
        'niceView': 'Nice View',
        'pleasantView': 'Pleasant View',

        // С точки обзора
        'rooftopView': 'Rooftop View',
        'balconyView': 'Balcony View',
        'terraceView': 'Terrace View',
        'windowView': 'Window View',
        'floorToFloorView': 'Floor-to-Ceiling View',
        'elevatedView': 'Elevated View',
        'groundLevelView': 'Ground Level View',
        'skylightView': 'Skylight View',

        // Внутренние виды
        'noView': 'No View',
        'obstructedView': 'Obstructed View',
        'limitedView': 'Limited View',
        'interiorView': 'Interior View',
        'courtyardView': 'Courtyard View',
        'atriumView': 'Atrium View',

        // Виды на объекты
        'streetView': 'Street View',
        'roadView': 'Road View',
        'parkingView': 'Parking View',
        'neighborView': 'Neighbor View',
        'wallView': 'Wall View',
        'buildingView': 'Building View',
        'roofView': 'Roof View',
        'towerView': 'Tower View',
        'bridgeView': 'Bridge View',

        // Культурные объекты
        'monumentView': 'Monument View',
        'templeView': 'Temple View',
        'palaceView': 'Palace View',
        'castleView': 'Castle View',
        'stadiumView': 'Stadium View',

        // Транспортные объекты
        'airportView': 'Airport View',
        'portView': 'Port View',
        'marinaView': 'Marina View',
        'yachtView': 'Yacht View',
        'boatView': 'Boat View',
        'shipView': 'Ship View',

        // Прочее
        'islandView': 'Island View',
        'horizonView': 'Horizon View',
        'clearView': 'Clear View',
        'privateView': 'Private View',
        'sharedView': 'Shared View',

        // Стороны света
        'facingNorth': 'Facing North',
        'facingSouth': 'Facing South',
        'facingEast': 'Facing East',
        'facingWest': 'Facing West',
        'northeastView': 'Northeast View',
        'northwestView': 'Northwest View',
        'southeastView': 'Southeast View',
        'southwestView': 'Southwest View'
      },
      th: {
                // Property features - Комнаты и помещения
        'mediaRoom': 'ห้องมีเดีย',
        'privateGym': 'ห้องออกกำลังกายส่วนตัว',
        'privateLift': 'ลิฟต์ส่วนตัว',
        'privateSauna': 'ซาวน่าส่วนตัว',
        'jacuzzi': 'จากุซซี่',
        'cornerUnit': 'ห้องมุม',
        'maidsQuarters': 'ห้องแม่บ้าน',
        'duplex': 'ดูเพล็กซ์',
        'triplex': 'ทริปเพล็กซ์',
        'balcony': 'ระเบียง',
        'study': 'ห้องทำงาน',
        'library': 'ห้องสมุด',
        'winecellar': 'ห้องเก็บไวน์',
        'elevator': 'ลิฟต์',
        'homeElevator': 'ลิฟต์ในบ้าน',
        'gameRoom': 'ห้องเกม',
        'billiardRoom': 'ห้องบิลเลียด',
        'kidsRoom': 'ห้องเด็ก',
        'nursery': 'ห้องเด็กทารก',
        'guestRoom': 'ห้องรับแขก',
        'serviceRoom': 'ห้องบริการ',
        'utilityRoom': 'ห้องอเนกประสงค์',
        'pantry': 'ห้องเก็บของ',
        'wetRoom': 'ห้องน้ำแบบเปียก',
        'powderRoom': 'ห้องน้ำแขก',
        'ensuiteBathroom': 'ห้องน้ำในห้องนอน',
        'sharedBathroom': 'ห้องน้ำรวม',
        'outdoorBathroom': 'ห้องน้ำกลางแจ้ง',
        'steamRoom': 'ห้องอบไอน้ำ',
        'hammam': 'ห้องอบไอน้ำตุรกี',
        'massage': 'ห้องนวด',
        'yogaRoom': 'ห้องโยคะ',
        'meditationRoom': 'ห้องทำสมาธิ',
        'artStudio': 'สตูดิโออาร์ต',
        'workshop': 'เวิร์คช็อป',

        // Кухня и ванная
        'westernKitchen': 'ครัวตะวันตก',
        'thaiKitchen': 'ครัวไทย',
        'openKitchen': 'ครัวเปิด',
        'closedKitchen': 'ครัวปิด',
        'bathtub': 'อ่างอาบน้ำ',
        'shower': 'ฝักบัว',
        'separateShower': 'ห้องอาบน้ำแยก',

        // Бассейны
        'privatePool': 'สระว่ายน้ำส่วนตัว',
        'sharedPool': 'สระว่ายน้ำส่วนกลาง',
        'infinityPool': 'สระว่ายน้ำอินฟินิตี้',
        'kidPool': 'สระว่ายน้ำเด็ก',

        // Системы безопасности
        'smartHome': 'สมาร์ทโฮม',
        'securitySystem': 'ระบบรักษาความปลอดภัย',
        'cctv': 'กล้องวงจรปิด',
        'alarmSystem': 'ระบบสัญญาณเตือนภัย',
        'intercom': 'อินเตอร์คอม',
        'videoIntercom': 'วิดีโออินเตอร์คอม',
        'safebox': 'ตู้เซฟ',

        // Климат-контроль
        'airConditioning': 'เครื่องปรับอากาศ',
        'centralAC': 'แอร์กลาง',
        'heating': 'เครื่องทำความร้อน',
        'floorHeating': 'ระบบทำความร้อนใต้พื้น',
        'fireplace': 'เตาผิง',

        // Энергетика
        'solarPanels': 'แผงโซลาร์เซลล์',
        'waterHeater': 'เครื่องทำน้ำอุ่น',
        'solarWaterHeater': 'เครื่องทำน้ำอุ่นพลังงานแสงอาทิตย์',
        'generator': 'เครื่องกำเนิดไฟฟ้า',
        'ups': 'เครื่องสำรองไฟ',

        // Архитектурные особенности
        'highCeiling': 'เพดานสูง',
        'largeWindows': 'หน้าต่างขนาดใหญ่',
        'floorToFloorWindows': 'หน้าต่างบานใหญ่',
        'walkinCloset': 'ห้องเสื้อผ้า',
        'builtinWardrobe': 'ตู้เสื้อผ้าติดผนัง',
        'separateEntrance': 'ทางเข้าแยก',
        'privateEntrance': 'ทางเข้าส่วนตัว',
        'soundproofing': 'ป้องกันเสียง',

        // Системы очистки
        'waterFiltration': 'ระบบกรองน้ำ',
        'airPurifier': 'เครื่องฟอกอากาศ',

        // Техника
        'washer': 'เครื่องซักผ้า',
        'dryer': 'เครื่องอบผ้า',
        'dishwasher': 'เครื่องล้างจาน',
        'refrigerator': 'ตู้เย็น',
        'microwave': 'ไมโครเวฟ',
        'oven': 'เตาอบ',
        'stove': 'เตา',
        'gasStove': 'เตาแก๊ส',
        'electricStove': 'เตาไฟฟ้า',
        'inductionStove': 'เตาอินดักชั่น',
        'coffeemaker': 'เครื่องทำกาแฟ',
        'waterDispenser': 'ตู้น้ำดื่ม',

        // Развлечения
        'tv': 'ทีวี',
        'smartTV': 'สมาร์ททีวี',
        'wifi': 'ไวไฟ',
        'highSpeedInternet': 'อินเทอร์เน็ตความเร็วสูง',
        'fiberOptic': 'ไฟเบอร์ออปติก',
        'telephone': 'โทรศัพท์',
        'satelliteTV': 'ทีวีดาวเทียม',
        'surround': 'เสียงรอบทิศทาง',
        'homeTheater': 'โฮมเธียเตอร์',
        'musicSystem': 'ระบบเครื่องเสียง',
        'piano': 'เปียโน',

        // Меблировка и состояние
        'furnished': 'ติดตั้งเฟอร์นิเจอร์',
        'partiallyFurnished': 'เฟอร์นิเจอร์บางส่วน',
        'fullyEquipped': 'อุปกรณ์ครบครัน',
        'euroRenovation': 'ปรับปรุงแบบยุโรป',
        'designerRenovation': 'ปรับปรุงโดยดีไซเนอร์',
        'modernDesign': 'การออกแบบสมัยใหม่',
        'traditionalStyle': 'สไตล์ดั้งเดิม',
        'minimalist': 'มินิมอล',
        'luxury': 'หรูหรา',

        // Планировка
        'penthouseLevel': 'เพนท์เฮาส์',
        'groundFloor': 'ชั้นล่าง',
        'topFloor': 'ชั้นบนสุด',
        'multiLevel': 'หลายชั้น',
        'studio': 'สตูดิโอ',
        'openPlan': 'แปลนเปิด',

        // Доступность
        'petFriendly': 'อนุญาตสัตว์เลี้ยง',
        'childFriendly': 'เหมาะสำหรับเด็ก',
        'wheelchair': 'รถเข็นผ่านได้',
        'disabledAccess': 'ทางผ่านสำหรับผู้พิการ',
        'ramp': 'ทางลาด',

        // Безопасность
        'emergencyExit': 'ทางออกฉุกเฉิน',
        'fireExtinguisher': 'เครื่องดับเพลิง',
        'firstAidKit': 'ชุดปฐมพยาบาล',
        'smokeDetector': 'เครื่องตรวจจับควัน',
        'carbonMonoxide': 'เครื่องตรวจจับคาร์บอนมอนอกไซด์',

        // Экология
        'eco': 'เป็นมิตรกับสิ่งแวดล้อม',
        'energyEfficient': 'ประหยัดพลังงาน',
        'sustainable': 'ยั่งยืน',
        'greenBuilding': 'อาคารสีเขียว',
        'leed': 'ได้รับการรับรอง LEED',

        // Статус
        'newConstruction': 'ก่อสร้างใหม่',
        'underConstruction': 'กำลังก่อสร้าง',
        'readyToMove': 'พร้อมเข้าอยู่',
        'offPlan': 'ขายตามแบบ',
        'resale': 'ขายต่อ',

        // Outdoor features - Сад и ландшафт
        'garden': 'สวน',
        'privateGarden': 'สวนส่วนตัว',
        'landscaped': 'จัดสวน',
        'tropicalGarden': 'สวนเขตร้อน',
        'japaneseGarden': 'สวนญี่ปุ่น',
        'vegetableGarden': 'สวนผัก',
        'fruitTrees': 'ต้นไม้ผลไม้',
        'flowerGarden': 'สวนดอกไม้',

        // Террасы и крыши
        'terrace': 'ระเบียง',
        'rooftop': 'ดาดฟ้า',
        'rooftopTerrace': 'ระเบียงดาดฟ้า',
        'skyGarden': 'สวนบนดาดฟ้า',

        // Зоны отдыха и готовки
        'bbqArea': 'พื้นที่บาร์บีคิว',
        'outdoorKitchen': 'ครัวกลางแจ้ง',
        'outdoorShower': 'ฝักบัวกลางแจ้ง',
        'beachShower': 'ฝักบัวริมชายหาด',
        'summerKitchen': 'ครัวฤดูร้อน',
        'outdoorDining': 'พื้นที่รับประทานอาหารกลางแจ้ง',
        'lounge': 'พื้นที่พักผ่อน',
        'sunbeds': 'เตียงอาบแดด',
        'sunshade': 'ร่มกันแดด',
        'pergola': 'เพอร์โกลา',
        'gazebo': 'ศาลา',
        'pavilion': 'ศาลาเล็ก',

        // Парковка
        'garage': 'โรงรถ',
        'carport': 'ที่จอดรถมีหลังคา',
        'coveredParking': 'ที่จอดรถมีหลังคา',
        'openParking': 'ที่จอดรถโล่ง',
        'secureParking': 'ที่จอดรถปลอดภัย',
        'guestParking': 'ที่จอดรถสำหรับแขก',
        'electricCarCharger': 'เครื่องชาร์จรถไฟฟ้า',
        'bikestorage': 'ที่จอดจักรยาน',

        // Водные элементы
        'poolBar': 'บาร์ริมสระ',
        'fountain': 'น้ำพุ',
        'pond': 'สระน้ำ',
        'koiPond': 'สระปลาคาร์ฟ',
        'waterfall': 'น้ำตก',
        'streambed': 'ลำธาร',

        // Детские зоны
        'playground': 'สนามเด็กเล่น',
        'swingSet': 'ชิงช้า',
        'slide': 'สไลเดอร์',
        'sandbox': 'กระบะทราย',
        'trampoline': 'แทรมโพลีน',

        // Зоны для животных
        'petArea': 'พื้นที่สัตว์เลี้ยง',
        'dogRun': 'พื้นที่พาสุนัขเดิน',
        'petShower': 'ที่อาบน้ำสัตว์เลี้ยง',

        // Хранение и хозяйство
        'storageRoom': 'ห้องเก็บของ',
        'shed': 'โรงเก็บของ',
        'greenhouse': 'เรือนกระจก',
        'laundryRoom': 'ห้องซักรีด',
        'dryingArea': 'พื้นที่ตากผ้า',

        // Спортивные площадки
        'outdoorGym': 'ยิมกลางแจ้ง',
        'sportsArea': 'พื้นที่กีฬา',
        'tennisCourt': 'สนามเทนนิส',
        'basketballCourt': 'สนามบาสเก็ตบอล',
        'footballField': 'สนามฟุตบอล',
        'volleyball': 'สนามวอลเลย์บอล',
        'badminton': 'สนามแบดมินตัน',
        'puttingGreen': 'สนามกอล์ฟ',
        'bocce': 'สนามบอชชี',
        'skatepark': 'สวนสเก็ต',
        'joggingTrack': 'ลู่วิ่ง',
        'walkingPath': 'ทางเดิน',
        'cyclingPath': 'ทางจักรยาน',

        // Водный доступ
        'fishingPier': 'ท่าตกปลา',
        'boatDock': 'ท่าเรือ',
        'marina': 'ท่าเทียบเรือ',
        'beachAccess': 'ทางเข้าชายหาด',
        'privateBeach': 'ชายหาดส่วนตัว',
        'beachCabana': 'ศาลาริมหาด',

        // Ограждение и безопасность
        'fence': 'รั้ว',
        'wall': 'กำแพง',
        'gate': 'ประตู',
        'electricGate': 'ประตูไฟฟ้า',
        'securityGate': 'ประตูรักษาความปลอดภัย',
        'driveway': 'ทางรถเข้า',
        'pavedDriveway': 'ทางรถเข้าปูยาง',
        'gravelDriveway': 'ทางรถเข้าลูกรัง',

        // Освещение
        'streetLighting': 'ไฟถนน',
        'gardenLighting': 'ไฟสวน',
        'securityLighting': 'ไฟรักษาความปลอดภัย',
        'decorativeLighting': 'ไฟประดับ',

        // Системы полива
        'sprinklerSystem': 'ระบบสปริงเกอร์',
        'automaticSprinklers': 'สปริงเกอร์อัตโนมัติ',
        'drip': 'ระบบน้ำหยด',
        'irrigationSystem': 'ระบบชลประทาน',
        'rainwaterCollection': 'ระบบเก็บน้ำฝน',

        // Водоснабжение
        'well': 'บ่อน้ำ',
        'borehole': 'บ่อเจาะ',
        'waterTank': 'ถังเก็บน้ำ',
        'waterPump': 'ปั๊มน้ำ',
        'septicTank': 'บ่อเกรอะ',
        'sewageSystem': 'ระบบบำบัดน้ำเสีย',
        'drainageSystem': 'ระบบระบายน้ำ',

        // Rental features - Услуги персонала
        'maidService': 'บริการแม่บ้าน',
        'dailyCleaning': 'ทำความสะอาดทุกวัน',
        'weeklyCleaning': 'ทำความสะอาดทุกสัปดาห์',
        'chefService': 'บริการพ่อครัว',
        'privateChef': 'พ่อครัวส่วนตัว',
        'cateringService': 'บริการจัดเลี้ยง',
        'driverService': 'บริการคนขับรถ',

        // Трансфер и транспорт
        'airportTransfer': 'รับส่งสนามบิน',
        'carRental': 'เช่ารถ',
        'bicycleRental': 'เช่าจักรยาน',
        'scooterRental': 'เช่ามอเตอร์ไซค์',
        'boatRental': 'เช่าเรือ',
        'kayakRental': 'เช่าคายัค',

        // Питание
        'breakfastIncluded': 'รวมอาหารเช้า',
        'halfBoard': 'ครึ่งบอร์ด',
        'fullBoard': 'ฟูลบอร์ด',
        'allInclusive': 'ออลอินคลูซีฟ',

        // Уборка и стирка
        'cleaning': 'ทำความสะอาด',
        'linenChange': 'เปลี่ยนผ้าปูที่นอน',
        'towelChange': 'เปลี่ยนผ้าเช็ดตัว',
        'laundryService': 'บริการซักรีด',
        'dryClean': 'ซักแห้ง',
        'ironing': 'รีดผ้า',

        // Коммунальные услуги
        'utilitiesIncluded': 'รวมค่าสาธารณูปโภค',
        'electricityIncluded': 'รวมค่าไฟฟ้า',
        'waterIncluded': 'รวมค่าน้ำ',
        'gasIncluded': 'รวมค่าแก๊ส',
        'wifiIncluded': 'รวมไวไฟ',
        'internetIncluded': 'รวมอินเทอร์เน็ต',
        'cableTv': 'เคเบิลทีวี',
        'streamingServices': 'บริการสตรีมมิ่ง',

        // Сервисы
        'conciergeService': 'บริการคอนเซียร์จ',
        '24hConcierge': 'คอนเซียร์จตลอด 24 ชั่วโมง',
        'securityGuard': 'รปภ.',
        '24hSecurity': 'รักษาความปลอดภัยตลอด 24 ชั่วโมง',
        'management': 'การจัดการ',
        'propertyManagement': 'การจัดการอสังหาริมทรัพย์',
        'maintenance': 'การบำรุงรักษา',
        'repairService': 'บริการซ่อมแซม',
        'gardenMaintenance': 'ดูแลสวน',
        'poolMaintenance': 'ดูแลสระว่ายน้ำ',
        'pestControl': 'กำจัดแมลง',
        'wasteDisposal': 'กำจัดขยะ',
        'recycling': 'รีไซเคิล',

        // Уход
        'petCare': 'ดูแลสัตว์เลี้ยง',
        'petSitting': 'เลี้ยงสัตว์แทน',
        'dogWalking': 'พาสุนัขเดิน',
        'babysitting': 'เลี้ยงเด็ก',
        'childcare': 'ดูแลเด็ก',
        'eldercare': 'ดูแลผู้สูงอายุ',

        // Медицина
        'medicalService': 'บริการทางการแพทย์',
        'nurseOnCall': 'พยาบาลเรียกได้',
        'doctorOnCall': 'หมอเรียกได้',
        'ambulance': 'รถพยาบาล',
        'pharmacy': 'ร้านขายยา',

        // Доставка
        'grocery': 'จัดส่งของชำ',
        'shopping': 'บริการช้อปปิ้ง',
        'delivery': 'จัดส่ง',
        'courierService': 'บริการส่งพัสดุ',
        'mailHandling': 'จัดการไปรษณีย์',
        'packageReceiving': 'รับพัสดุ',

        // Автосервис
        'valetParking': 'บริการจอดรถ',
        'carWash': 'ล้างรถ',
        'carService': 'บริการรถ',

        // Водные виды спорта
        'snorkeling': 'ดำน้ำตื้น',
        'divingEquipment': 'อุปกรณ์ดำน้ำ',
        'fishing': 'ตกปลา',
        'surfingLessons': 'เรียนโต้คลื่น',
        'kitesurfing': 'ไคท์เซิร์ฟ',
        'wakeboarding': 'เวคบอร์ด',
        'jetski': 'เจ็ตสกี',
        'parasailing': 'พาราเซลลิ่ง',
        'bananaBoat': 'บานาน่าโบ๊ท',
        'speedboat': 'สปีดโบ๊ท',
        'yachtCharter': 'เช่ายอร์ช',

        // Премиум услуги
        'helicopterService': 'บริการเฮลิคอปเตอร์',
        'privatePlane': 'เครื่องบินส่วนตัว',
        'limousineService': 'บริการลีมูซีน',

        // Бронирование
        'tourBooking': 'จองทัวร์',
        'ticketBooking': 'จองตั๋ว',
        'restaurantReservation': 'จองร้านอาหาร',
        'spaBooking': 'จองสปา',

        // Красота и здоровье
        'massageService': 'บริการนวด',
        'beautyService': 'บริการความงาม',
        'hairSalon': 'ร้านทำผม',
        'nailSalon': 'ร้านทำเล็บ',

        // Спорт и фитнес
        'personalTrainer': 'เทรนเนอร์ส่วนตัว',
        'yogaInstructor': 'ครูสอนโยคะ',
        'pilatesInstructor': 'ครูสอนพิลาทิส',
        'tennisCoach': 'โค้ชเทนนิส',
        'golfCoach': 'โค้ชกอล์ฟ',
        'swimInstructor': 'ครูสอนว่ายน้ำ',

        // Мероприятия
        'eventPlanning': 'จัดกิจกรรม',
        'partyPlanning': 'จัดปาร์ตี้',
        'weddingPlanning': 'จัดงานแต่งงาน',
        'catering': 'บริการจัดเลี้ยง',
        'florist': 'ดอกไม้',
        'photographer': 'ช่างภาพ',
        'videographer': 'ช่างวีดีโอ',
        'musician': 'นักดนตรี',
        'dj': 'ดีเจ',
        'entertainer': 'นักแสดง',

        // Профессиональные услуги
        'translation': 'แปลภาษา',
        'interpreter': 'ล่าม',
        'legalService': 'บริการกฎหมาย',
        'lawyer': 'ทนายความ',
        'notary': 'โนตารี',
        'accounting': 'บัญชี',
        'taxService': 'บริการภาษี',
        'insurance': 'ประกัน',
        'visaAssistance': 'ช่วยเหลือวีซ่า',
        'immigration': 'ตรวจคนเข้าเมือง',
        'relocation': 'ย้ายที่',

        // Аренда
        'storage': 'เก็บของ',
        'furnitureRental': 'เช่าเฟอร์นิเจอร์',
        'applianceRental': 'เช่าเครื่องใช้ไฟฟ้า',

        // Типы аренды
        'shortTermRental': 'เช่าระยะสั้น',
        'longTermRental': 'เช่าระยะยาว',
        'monthlyRental': 'เช่ารายเดือน',
        'weeklyRental': 'เช่ารายสัปดาห์',
        'dailyRental': 'เช่ารายวัน',

        // Условия заезда
        'flexibleCheckIn': 'เช็คอินยืดหยุ่น',
        'lateCheckOut': 'เช็คเอาท์สาย',
        'earlyCheckIn': 'เช็คอินเร็ว',

        // Оплата
        'depositRequired': 'ต้องมีเงินมัดจำ',
        'noDeposit': 'ไม่ต้องมัดจำ',
        'creditCardRequired': 'ต้องมีบัตรเครดิต',
        'cashPayment': 'ชำระเงินสด',
        'bankTransfer': 'โอนเงินผ่านธนาคาร',
        'onlinePayment': 'ชำระเงินออนไลน์',
        'installmentPlan': 'แผนผ่อนชำระ',

        // Скидки
        'discountAvailable': 'มีส่วนลด',
        'seasonalDiscount': 'ส่วนลดตามฤดูกาล',
        'longStayDiscount': 'ส่วนลดพักยาว',
        'earlyBooking': 'จองล่วงหน้า',
        'lastMinute': 'นาทีสุดท้าย',
        'studentDiscount': 'ส่วนลดนักเรียน',
        'seniorDiscount': 'ส่วนลดผู้สูงอายุ',
        'militaryDiscount': 'ส่วนลดทหาร',
        'corporateRate': 'อัตราองค์กร',
        'groupRate': 'อัตรากลุ่ม',

        // Правила
        'noSmoking': 'ห้ามสูบบุหรี่',
        'smokingAllowed': 'อนุญาตให้สูบบุหรี่',
        'noPets': 'ห้ามนำสัตว์เลี้ยง',
        'noParties': 'ห้ามจัดปาร์ตี้',
        'quietHours': 'เวลาเงียบ',
        'noiseCurfew': 'เคอร์ฟิวเสียง',
        'minimumAge': 'อายุขั้นต่ำ',
        'adultsOnly': 'สำหรับผู้ใหญ่เท่านั้น',
        'familyFriendly': 'เหมาะสำหรับครอบครัว',
        'kidfriendly': 'เหมาะสำหรับเด็ก',
        'infantFriendly': 'เหมาะสำหรับทารก',
        'teenagerFriendly': 'เหมาะสำหรับวัยรุ่น',

        // Location features - Пляж
        'beachFront': 'หน้าชายหาด',
        'secondLine': 'แถวที่สอง',
        'walkToBeach': 'เดินถึงชายหาด',

        // Образование
        'nearSchool': 'ใกล้โรงเรียน',
        'nearInternationalSchool': 'ใกล้โรงเรียนนานาชาติ',
        'nearKindergarten': 'ใกล้โรงเรียนอนุบาล',
        'nearUniversity': 'ใกล้มหาวิทยาลัย',

        // Медицина
        'nearHospital': 'ใกล้โรงพยาบาล',
        'nearClinic': 'ใกล้คลินิก',
        'nearPharmacy': 'ใกล้ร้านขายยา',

        // Магазины
        'nearSupermarket': 'ใกล้ซูเปอร์มาร์เก็ต',
        'nearConvenience': 'ใกล้ร้านสะดวกซื้อ',
        'nearMarket': 'ใกล้ตลาด',
        'nearMall': 'ใกล้ห้างสรรพสินค้า',
        'nearShops': 'ใกล้ร้านค้า',

        // Рестораны и бары
        'nearRestaurant': 'ใกล้ร้านอาหาร',
        'nearCafe': 'ใกล้คาเฟ่',
        'nearBar': 'ใกล้บาร์',
        'nearNightlife': 'ใกล้ไนท์ไลฟ์',

        // Спорт и отдых
        'nearGolfCourse': 'ใกล้สนามกอล์ฟ',
        'nearMarina': 'ใกล้ท่าเทียบเรือ',
        'nearYachtClub': 'ใกล้สโมสรยอร์ช',
        'nearTennisCourt': 'ใกล้สนามเทนนิส',
        'nearBasketball': 'ใกล้สนามบาสเก็ตบอล',
        'nearFootball': 'ใกล้สนามฟุตบอล',
        'nearVolleyball': 'ใกล้สนามวอลเลย์บอล',
        'nearSkatepark': 'ใกล้สวนสเก็ต',
        'nearGym': 'ใกล้ฟิตเนส',
        'nearFitness': 'ใกล้ศูนย์ฟิตเนส',
        'nearYoga': 'ใกล้สตูดิโอโยคะ',
        'nearSpa': 'ใกล้สปา',
        'nearWellness': 'ใกล้ศูนย์สุขภาพ',

        // Транспорт
        'nearAirport': 'ใกล้สนามบิน',
        'nearBusStop': 'ใกล้ป้ายรถเมล์',
        'nearBusTerminal': 'ใกล้สถานีขนส่ง',
        'nearTaxiStand': 'ใกล้จุดจอดแท็กซี่',
        'nearMetro': 'ใกล้รถไฟฟ้าใต้ดิน',
        'nearTrain': 'ใกล้สถานีรถไฟ',
        'nearHighway': 'ใกล้ทางหลวง',
        'nearMainRoad': 'ใกล้ถนนใหญ่',

        // Сервисы
        'nearBank': 'ใกล้ธนาคาร',
        'nearAtm': 'ใกล้ตู้เอทีเอ็ม',
        'nearPostOffice': 'ใกล้ที่ทำการไปรษณีย์',
        'nearPolice': 'ใกล้สถานีตำรวจ',
        'nearFireStation': 'ใกล้สถานีดับเพลิง',
        'nearEmbassy': 'ใกล้สถานทูต',
        'nearGovernment': 'ใกล้หน่วยงานราชการ',
        'nearSalon': 'ใกล้ร้านเสริมสวย',
        'nearVet': 'ใกล้สัตวแพทย์',
        'nearPetShop': 'ใกล้ร้านขายสัตว์เลี้ยง',

        // Религия
        'nearTemple': 'ใกล้วัด',
        'nearMosque': 'ใกล้มัสยิด',
        'nearChurch': 'ใกล้โบสถ์',
        'nearSynagogue': 'ใกล้สุเหร่า',

        // Природа
        'nearPark': 'ใกล้สวนสาธารณะ',
        'nearPlayground': 'ใกล้สนามเด็กเล่น',
        'nearGarden': 'ใกล้สวน',
        'nearForest': 'ใกล้ป่า',
        'nearMountain': 'ใกล้ภูเขา',
        'nearLake': 'ใกล้ทะเลสาบ',
        'nearRiver': 'ใกล้แม่น้ำ',
        'nearWaterfall': 'ใกล้น้ำตก',
        'nearNationalPark': 'ใกล้อุทยานแห่งชาติ',
        'nearNatureReserve': 'ใกล้เขตอนุรักษ์ธรรมชาติ',

        // Развлечения
        'nearZoo': 'ใกล้สวนสัตว์',
        'nearAquarium': 'ใกล้พิพิธภัณฑ์สัตว์น้ำ',
        'nearMuseum': 'ใกล้พิพิธภัณฑ์',
        'nearGallery': 'ใกล้แกลเลอรี่',
        'nearTheater': 'ใกล้โรงละคร',
        'nearCinema': 'ใกล้โรงภาพยนตร์',
        'nearConcertHall': 'ใกล้ห้องคอนเสิร์ต',
        'nearStadium': 'ใกล้สนามกีฬา',
        'nearSportsCenter': 'ใกล้ศูนย์กีฬา',
        'nearLibrary': 'ใกล้ห้องสมุด',
        'nearBookstore': 'ใกล้ร้านหนังสือ',

        // Туризм
        'nearTouristAttraction': 'ใกล้สถานที่ท่องเที่ยว',
        'nearLandmark': 'ใกล้สถานที่สำคัญ',
        'nearViewpoint': 'ใกล้จุดชมวิว',
        'nearDiveSite': 'ใกล้จุดดำน้ำ',
        'nearSurfSpot': 'ใกล้จุดโต้คลื่น',
        'nearSnorkeling': 'ใกล้จุดดำน้ำตื้น',
        'nearHiking': 'ใกล้เส้นทางเดินป่า',
        'nearCycling': 'ใกล้เส้นทางปั่นจักรยาน',
        'nearJogging': 'ใกล้ลู่วิ่ง',

        // Характер района
        'quietArea': 'พื้นที่เงียบ',
        'peacefulLocation': 'สถานที่สงบ',
        'residentialArea': 'ย่านที่อยู่อาศัย',
        'commercialArea': 'ย่านพาณิชย์',
        'businessDistrict': 'ย่านธุรกิจ',
        'touristArea': 'ย่านท่องเที่ยว',
        'localArea': 'ย่านท้องถิ่น',
        'expatArea': 'ย่านชาวต่างชาติ',
        'internationalCommunity': 'ชุมชนนานาชาติ',
        'gatedCommunity': 'หมู่บ้านจัดสรร',
        'secureComplex': 'คอมเพล็กซ์ที่ปลอดภัย',
        'privateCommunity': 'ชุมชนส่วนตัว',
        'luxuryDevelopment': 'โครงการหรูหรา',
        'newDevelopment': 'โครงการใหม่',
        'establishedArea': 'พื้นที่จัดตั้ง',
        'upAndComing': 'พื้นที่กำลังพัฒนา',
        'trendyArea': 'พื้นที่ฮิต',
        'historicDistrict': 'ย่านประวัติศาสตร์',
        'culturalQuarter': 'ย่านวัฒนธรรม',
        'artDistrict': 'ย่านศิลปะ',
        'entertainmentDistrict': 'ย่านบันเทิง',
        'financialDistrict': 'ย่านการเงิน',
        'shoppingDistrict': 'ย่านช้อปปิ้ง',

        // Расположение в городе
        'cityCentre': 'ใจกลางเมือง',
        'cityCenter': 'ศูนย์กลางเมือง',
        'downtown': 'ดาวน์ทาวน์',
        'midtown': 'ย่านกลางเมือง',
        'uptown': 'ย่านบนเมือง',
        'suburb': 'ชานเมือง',
        'outskirts': 'ชายเมือง',
        'countryside': 'ชนบท',
        'rural': 'ชนบท',
        'urban': 'เมือง',
        'metropolitan': 'มหานคร',

        // Географическое положение
        'coastal': 'ชายฝั่ง',
        'inland': 'แผ่นดินใหญ่',
        'hillside': 'ไหล่เขา',
        'hilltop': 'ยอดเขา',
        'valley': 'หุบเขา',
        'plateau': 'ที่ราบสูง',
        'peninsula': 'คาบสมุทร',
        'island': 'เกาะ',
        'mainland': 'แผ่นดินใหญ่',
        'waterfront': 'ริมน้ำ',
        'riverside': 'ริมแม่น้ำ',
        'lakeside': 'ริมทะเลสาบ',
        'mountainside': 'เชิงเขา',
        'forestEdge': 'ชายป่า',
        'parkside': 'ข้างสวน',

        // Зонирование
        'greenBelt': 'เขตพื้นที่สีเขียว',
        'openSpace': 'พื้นที่เปิด',
        'lowDensity': 'ความหนาแน่นต่ำ',
        'highDensity': 'ความหนาแน่นสูง',
        'mixedUse': 'ใช้ประโยชน์หลากหลาย',
        'liveworkPlay': 'อยู่-ทำงาน-เล่น',
        'masterPlanned': 'วางแผนหลัก',
        'smartCity': 'สมาร์ทซิตี้',
        'ecoVillage': 'หมู่บ้านอีโค',
        'sustainableCommunity': 'ชุมชนยั่งยืน',

        // Транспортная доступность
        'walkable': 'เดินได้',
        'bikeFriendly': 'เป็นมิตรกับจักรยาน',
        'publicTransport': 'ขนส่งสาธารณะ',
        'transitOriented': 'มุ่งเน้นการขนส่ง',
        'carDependent': 'ต้องพึ่งรถยนต์',
        'carFree': 'ปลอดรถยนต์',
        'pedestrianZone': 'เขตคนเดินเท้า',

        // Дорожная обстановка
        'lowTraffic': 'การจราจรน้อย',
        'noThroughTraffic': 'ไม่มีการจราจรผ่าน',
        'deadEnd': 'ทางตัน',
        'culDeSac': 'ทางตัน',
        'mainStreet': 'ถนนใหญ่',
        'sideStreet': 'ซอย',
        'privateStreet': 'ถนนส่วนตัว',
        'pavedRoad': 'ถนนลาดยาง',
        'dirtRoad': 'ถนนดิน',
        'streetParking': 'จอดรถริมถนน',

        // Безопасность района
        'wellLit': 'แสงสว่างดี',
        'darkAtNight': 'มืดในเวลากลางคืน',
        'safeArea': 'พื้นที่ปลอดภัย',
        'lowCrime': 'อาชญากรรมต่ำ',

        // Общество
        'neighborhood': 'ละแวก',
        'communitySpirit': 'จิตวิญญาณชุมชน',
        'familyOriented': 'เน้นครอบครัว',
        'professionalArea': 'พื้นที่มืออาชีพ',
        'studentArea': 'พื้นที่นักเรียน',
        'retirementCommunity': 'ชุมชนผู้เกษียณ',

        // Views - Морские виды
        'seaView': 'วิวทะเล',
        'oceanView': 'วิวมหาสมุทร',
        'beachView': 'วิวชายหาด',
        'bayView': 'วิวอ่าว',
        'coastalView': 'วิวชายฝั่ง',
        'partialSeaView': 'วิวทะเลบางส่วน',
        'glimpseOfSea': 'มองเห็นทะเล',
        'distantSeaView': 'วิวทะเลไกล',

        // Природные виды
        'sunsetView': 'วิวพระอาทิตย์ตก',
        'sunriseView': 'วิวพระอาทิตย์ขึ้น',
        'mountainView': 'วิวภูเขา',
        'hillView': 'วิวเนินเขา',
        'volcanoView': 'วิวภูเขาไฟ',
        'forestView': 'วิวป่า',
        'lakeView': 'วิวทะเลสาบ',
        'riverView': 'วิวแม่น้ำ',
        'waterfallView': 'วิวน้ำตก',
        'pondView': 'วิวสระน้ำ',

        // Виды на территорию
        'poolView': 'วิวสระว่ายน้ำ',
        'gardenView': 'วิวสวน',
        'parkView': 'วิวสวนสาธารณะ',

        // Городские виды
        'cityView': 'วิวเมือง',
        'skylineView': 'วิวเส้นขอบฟ้า',

        // Характер вида
        'panoramicView': 'วิวพาโนรามา',
        'unobstructedView': 'วิวไม่บัง',
        '180View': 'วิว 180 องศา',
        '360View': 'วิว 360 องศา',
        'scenicView': 'วิวสวยงาม',
        'spectacularView': 'วิวงดงาม',
        'breathtakingView': 'วิวสุดตระการตา',
        'stunningView': 'วิวน่าทึ่ง',
        'magnificentView': 'วิวยอดเยี่ยม',
        'beautifulView': 'วิวสวย',
        'niceView': 'วิวดี',
        'pleasantView': 'วิวน่าพอใจ',

        // С точки обзора
        'rooftopView': 'วิวจากดาดฟ้า',
        'balconyView': 'วิวจากระเบียง',
        'terraceView': 'วิวจากระเบียง',
        'windowView': 'วิวจากหน้าต่าง',
        'floorToFloorView': 'วิวพาโนรามา',
        'elevatedView': 'วิวจากที่สูง',
        'groundLevelView': 'วิวระดับพื้นดิน',
        'skylightView': 'วิวจากหน้าต่างหลังคา',

        // Внутренние виды
        'noView': 'ไม่มีวิว',
        'obstructedView': 'วิวบัง',
        'limitedView': 'วิวจำกัด',
        'interiorView': 'วิวภายใน',
        'courtyardView': 'วิวลานบ้าน',
        'atriumView': 'วิวห้องโถงกลาง',

        // Виды на объекты
        'streetView': 'วิวถนน',
        'roadView': 'วิวถนน',
        'parkingView': 'วิวที่จอดรถ',
        'neighborView': 'วิวบ้านเพื่อนบ้าน',
        'wallView': 'วิวกำแพง',
        'buildingView': 'วิวอาคาร',
        'roofView': 'วิวหลังคา',
        'towerView': 'วิวหอคอย',
        'bridgeView': 'วิวสะพาน',

        // Культурные объекты
        'monumentView': 'วิวอนุสาวรีย์',
        'templeView': 'วิววัด',
        'palaceView': 'วิวพระราชวัง',
        'castleView': 'วิวปราสาท',
        'stadiumView': 'วิวสนามกีฬา',

        // Транспортные объекты
        'airportView': 'วิวสนามบิน',
        'portView': 'วิวท่าเรือ',
        'marinaView': 'วิวท่าเทียบเรือ',
        'yachtView': 'วิวยอร์ช',
        'boatView': 'วิวเรือ',
        'shipView': 'วิวเรือใหญ่',

        // Прочее
        'islandView': 'วิวเกาะ',
        'horizonView': 'วิวขอบฟ้า',
        'clearView': 'วิวชัดเจน',
        'privateView': 'วิวส่วนตัว',
        'sharedView': 'วิวร่วม',

        // Стороны света
        'facingNorth': 'หันหน้าไปทางเหนือ',
        'facingSouth': 'หันหน้าไปทางใต้',
        'facingEast': 'หันหน้าไปทางตะวันออก',
        'facingWest': 'หันหน้าไปทางตะวันตก',
        'northeastView': 'วิวทิศตะวันออกเฉียงเหนือ',
        'northwestView': 'วิวทิศตะวันตกเฉียงเหนือ',
        'southeastView': 'วิวทิศตะวันออกเฉียงใต้',
        'southwestView': 'วิวทิศตะวันตกเฉียงใต้'
      }
    };

    return translations[language] || translations['ru'];
  }

/**
   * Получить переводы интерфейса
   */
  private getUITranslations(language: string): { [key: string]: string } {
    const translations: { [key: string]: { [key: string]: string } } = {
      ru: {
        // Заголовки секций
        'description': 'Описание',
        'features': 'Особенности',
        'calendar': 'Календарь занятости',
        'property_features': 'Особенности объекта',
        'outdoor_amenities': 'Уличные удобства',
        'rental_conditions': 'Условия аренды',
        'location_features': 'Локация',
        'views': 'Виды',
        
        // Цены
        'sale_price': 'Цена продажи',
        'yearly_rent': 'Годовая аренда',
        'seasonal_prices': 'Сезонные цены',
        'monthly_prices': 'Месячные цены',
        
        // Инфо карточки
        'bedrooms': 'Спален',
        'bathrooms': 'Ванных',
        'area': 'м²',
        
        // Кнопки и действия
        'view_all': 'Посмотреть все',
        'open_map': 'Открыть на карте',
        
        // Календарь
        'available': 'Доступно',
        'occupied': 'Занято',
        'mon': 'Пн',
        'tue': 'Вт',
        'wed': 'Ср',
        'thu': 'Чт',
        'fri': 'Пт',
        'sat': 'Сб',
        'sun': 'Вс',
        
        // Месяцы
        'january': 'Январь',
        'february': 'Февраль',
        'march': 'Март',
        'april': 'Апрель',
        'may': 'Май',
        'june': 'Июнь',
        'july': 'Июль',
        'august': 'Август',
        'september': 'Сентябрь',
        'october': 'Октябрь',
        'november': 'Ноябрь',
        'december': 'Декабрь',
        
        // Месяцы короткие (для дат)
        'jan': 'янв',
        'feb': 'фев',
        'mar': 'мар',
        'apr': 'апр',
        'may_short': 'мая',
        'jun': 'июн',
        'jul': 'июл',
        'aug': 'авг',
        'sep': 'сен',
        'oct': 'окт',
        'nov': 'ноя',
        'dec': 'дек',
        
        // Футер
        'all_rights_reserved': 'Все права защищены'
      },
      
      en: {
        // Section headers
        'description': 'Description',
        'features': 'Features',
        'calendar': 'Availability Calendar',
        'property_features': 'Property Features',
        'outdoor_amenities': 'Outdoor Amenities',
        'rental_conditions': 'Rental Conditions',
        'location_features': 'Location',
        'views': 'Views',
        
        // Prices
        'sale_price': 'Sale Price',
        'yearly_rent': 'Yearly Rent',
        'seasonal_prices': 'Seasonal Prices',
        'monthly_prices': 'Monthly Prices',
        
        // Info cards
        'bedrooms': 'Bedrooms',
        'bathrooms': 'Bathrooms',
        'area': 'm²',
        
        // Buttons and actions
        'view_all': 'View All',
        'open_map': 'Open Map',
        
        // Calendar
        'available': 'Available',
        'occupied': 'Occupied',
        'mon': 'Mon',
        'tue': 'Tue',
        'wed': 'Wed',
        'thu': 'Thu',
        'fri': 'Fri',
        'sat': 'Sat',
        'sun': 'Sun',
        
        // Months
        'january': 'January',
        'february': 'February',
        'march': 'March',
        'april': 'April',
        'may': 'May',
        'june': 'June',
        'july': 'July',
        'august': 'August',
        'september': 'September',
        'october': 'October',
        'november': 'November',
        'december': 'December',
        
        // Short months (for dates)
        'jan': 'Jan',
        'feb': 'Feb',
        'mar': 'Mar',
        'apr': 'Apr',
        'may_short': 'May',
        'jun': 'Jun',
        'jul': 'Jul',
        'aug': 'Aug',
        'sep': 'Sep',
        'oct': 'Oct',
        'nov': 'Nov',
        'dec': 'Dec',
        
        // Footer
        'all_rights_reserved': 'All Rights Reserved'
      },
      
      th: {
        // Section headers
        'description': 'คำอธิบาย',
        'features': 'คุณสมบัติ',
        'calendar': 'ปฏิทินความพร้อม',
        'property_features': 'คุณสมบัติของทรัพย์สิน',
        'outdoor_amenities': 'สิ่งอำนวยความสะดวกกลางแจ้ง',
        'rental_conditions': 'เงื่อนไขการเช่า',
        'location_features': 'ทำเล',
        'views': 'วิว',
        
        // Prices
        'sale_price': 'ราคาขาย',
        'yearly_rent': 'ค่าเช่ารายปี',
        'seasonal_prices': 'ราคาตามฤดูกาล',
        'monthly_prices': 'ราคารายเดือน',
        
        // Info cards
        'bedrooms': 'ห้องนอน',
        'bathrooms': 'ห้องน้ำ',
        'area': 'ตร.ม.',
        
        // Buttons and actions
        'view_all': 'ดูทั้งหมด',
        'open_map': 'เปิดแผนที่',
        
        // Calendar
        'available': 'ว่าง',
        'occupied': 'ไม่ว่าง',
        'mon': 'จ',
        'tue': 'อ',
        'wed': 'พ',
        'thu': 'พฤ',
        'fri': 'ศ',
        'sat': 'ส',
        'sun': 'อา',
        
        // Months
        'january': 'มกราคม',
        'february': 'กุมภาพันธ์',
        'march': 'มีนาคม',
        'april': 'เมษายน',
        'may': 'พฤษภาคม',
        'june': 'มิถุนายน',
        'july': 'กรกฎาคม',
        'august': 'สิงหาคม',
        'september': 'กันยายน',
        'october': 'ตุลาคม',
        'november': 'พฤศจิกายน',
        'december': 'ธันวาคม',
        
        // Short months
        'jan': 'ม.ค.',
        'feb': 'ก.พ.',
        'mar': 'มี.ค.',
        'apr': 'เม.ย.',
        'may_short': 'พ.ค.',
        'jun': 'มิ.ย.',
        'jul': 'ก.ค.',
        'aug': 'ส.ค.',
        'sep': 'ก.ย.',
        'oct': 'ต.ค.',
        'nov': 'พ.ย.',
        'dec': 'ธ.ค.',
        
        // Footer
        'all_rights_reserved': 'สงวนลิขสิทธิ์'
      },
      
      zh: {
        // Section headers
        'description': '描述',
        'features': '特色',
        'calendar': '可用性日历',
        'property_features': '房产特色',
        'outdoor_amenities': '户外设施',
        'rental_conditions': '租赁条件',
        'location_features': '位置',
        'views': '景观',
        
        // Prices
        'sale_price': '售价',
        'yearly_rent': '年租金',
        'seasonal_prices': '季节性价格',
        'monthly_prices': '月度价格',
        
        // Info cards
        'bedrooms': '卧室',
        'bathrooms': '浴室',
        'area': '平方米',
        
        // Buttons and actions
        'view_all': '查看全部',
        'open_map': '打开地图',
        
        // Calendar
        'available': '可用',
        'occupied': '已占用',
        'mon': '一',
        'tue': '二',
        'wed': '三',
        'thu': '四',
        'fri': '五',
        'sat': '六',
        'sun': '日',
        
        // Months
        'january': '一月',
        'february': '二月',
        'march': '三月',
        'april': '四月',
        'may': '五月',
        'june': '六月',
        'july': '七月',
        'august': '八月',
        'september': '九月',
        'october': '十月',
        'november': '十一月',
        'december': '十二月',
        
        // Short months
        'jan': '1月',
        'feb': '2月',
        'mar': '3月',
        'apr': '4月',
        'may_short': '5月',
        'jun': '6月',
        'jul': '7月',
        'aug': '8月',
        'sep': '9月',
        'oct': '10月',
        'nov': '11月',
        'dec': '12月',
        
        // Footer
        'all_rights_reserved': '版权所有'
      },
      
      he: {
        // Section headers
        'description': 'תיאור',
        'features': 'תכונות',
        'calendar': 'לוח זמינות',
        'property_features': 'תכונות הנכס',
        'outdoor_amenities': 'מתקנים חיצוניים',
        'rental_conditions': 'תנאי השכירות',
        'location_features': 'מיקום',
        'views': 'נוף',
        
        // Prices
        'sale_price': 'מחיר מכירה',
        'yearly_rent': 'שכירות שנתית',
        'seasonal_prices': 'מחירים עונתיים',
        'monthly_prices': 'מחירים חודשיים',
        
        // Info cards
        'bedrooms': 'חדרי שינה',
        'bathrooms': 'חדרי רחצה',
        'area': 'מ"ר',
        
        // Buttons and actions
        'view_all': 'צפה בהכל',
        'open_map': 'פתח מפה',
        
        // Calendar
        'available': 'פנוי',
        'occupied': 'תפוס',
        'mon': 'ב',
        'tue': 'ג',
        'wed': 'ד',
        'thu': 'ה',
        'fri': 'ו',
        'sat': 'ש',
        'sun': 'א',
        
        // Months
        'january': 'ינואר',
        'february': 'פברואר',
        'march': 'מרץ',
        'april': 'אפריל',
        'may': 'מאי',
        'june': 'יוני',
        'july': 'יולי',
        'august': 'אוגוסט',
        'september': 'ספטמבר',
        'october': 'אוקטובר',
        'november': 'נובמבר',
        'december': 'דצמבר',
        
        // Short months
        'jan': 'ינו',
        'feb': 'פבר',
        'mar': 'מרץ',
        'apr': 'אפר',
        'may_short': 'מאי',
        'jun': 'יונ',
        'jul': 'יול',
        'aug': 'אוג',
        'sep': 'ספט',
        'oct': 'אוק',
        'nov': 'נוב',
        'dec': 'דצמ',
        
        // Footer
        'all_rights_reserved': 'כל הזכויות שמורות'
      }
    };

    return translations[language] || translations['ru'];
  }

  /**
   * Форматировать цену
   */
  private formatPrice(price: number, currency: string = '฿'): string {
    const rounded = Math.round(price);
    return `${currency}${rounded.toLocaleString('en-US')}`;
  }

/**
   * Получить название месяца
   */
  private getMonthName(monthNumber: number, language: string): string {
    const ui = this.getUITranslations(language);
    const months = [
      ui['january'], ui['february'], ui['march'], ui['april'],
      ui['may'], ui['june'], ui['july'], ui['august'],
      ui['september'], ui['october'], ui['november'], ui['december']
    ];

    return months[monthNumber - 1] || `Month ${monthNumber}`;
  }

/**
   * Форматировать дату для отображения (DD-MM формат)
   */
  private formatDateRange(start: string, end: string, language: string): string {
    const [startDay, startMonth] = start.split('-').map(Number);
    const [endDay, endMonth] = end.split('-').map(Number);
    
    const ui = this.getUITranslations(language);
    const months = [
      ui['jan'], ui['feb'], ui['mar'], ui['apr'],
      ui['may_short'], ui['jun'], ui['jul'], ui['aug'],
      ui['sep'], ui['oct'], ui['nov'], ui['dec']
    ];
    
    const startMonthName = months[startMonth - 1];
    const endMonthName = months[endMonth - 1];
    
    return `${startDay} ${startMonthName} - ${endDay} ${endMonthName}`;
  }

  /**
   * Capitalize first letter
   */
  private capitalizeFirstLetter(text: string): string {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  /**
   * Генерировать HTML для объекта
   */
  async generatePropertyHTML(
    propertyId: number,
    options: HTMLGeneratorOptions
  ): Promise<string> {
    try {
      // Загружаем данные объекта
      const property = await db.queryOne<any>(
        `SELECT 
          p.*,
          pt.property_name as translated_name,
          pt.description as translated_description
        FROM properties p
        LEFT JOIN property_translations pt ON p.id = pt.property_id AND pt.language_code = ?
        WHERE p.id = ? AND p.deleted_at IS NULL`,
        [options.language, propertyId]
      );

      if (!property) {
        throw new Error('Property not found');
      }

      // Загружаем фотографии
      let photos = await db.query<any>(
        `SELECT photo_url, is_primary 
         FROM property_photos 
         WHERE property_id = ? 
         ORDER BY is_primary DESC, sort_order ASC`,
        [propertyId]
      );

      // Берём до 20 фотографий
      if (photos.length > 20) {
        const primaryPhoto = photos.find((p: any) => p.is_primary);
        const otherPhotos = photos.filter((p: any) => !p.is_primary);
        const shuffled = otherPhotos.sort(() => Math.random() - 0.5);
        photos = primaryPhoto 
          ? [primaryPhoto, ...shuffled.slice(0, 19)]
          : shuffled.slice(0, 20);
      }

      // Конвертируем фото в base64
      const photosBase64 = await Promise.all(
        photos.map(async (photo: any) => await this.imageToBase64(photo.photo_url))
      );

      const validPhotos = photosBase64.filter(p => p !== '');

      if (validPhotos.length === 0) {
        throw new Error('No photos available for this property');
      }

      // Загружаем характеристики
      const features = await db.query<any>(
        'SELECT feature_type, feature_value FROM property_features WHERE property_id = ?',
        [propertyId]
      );

      const featuresByType: { [key: string]: string[] } = {};
      features.forEach((f: any) => {
        if (!featuresByType[f.feature_type]) {
          featuresByType[f.feature_type] = [];
        }
        featuresByType[f.feature_type].push(f.feature_value);
      });

      // Загружаем цены
      let seasonalPrices: any[] = [];
      let monthlyPrices: any[] = [];

      if (options.showRentalPrices) {
        if (options.includeSeasonalPrices) {
          seasonalPrices = await db.query(
            `SELECT * FROM property_pricing 
             WHERE property_id = ? 
             ORDER BY start_date_recurring ASC`,
            [propertyId]
          );
        }

        if (options.includeMonthlyPrices) {
          monthlyPrices = await db.query(
            `SELECT * FROM property_pricing_monthly 
             WHERE property_id = ? 
             ORDER BY month_number ASC`,
            [propertyId]
          );
        }
      }

      // Загружаем календарь занятости
      const blockedDates = await db.query<any>(
        `SELECT blocked_date, is_check_in, is_check_out
         FROM property_calendar
         WHERE property_id = ?
         ORDER BY blocked_date ASC`,
        [propertyId]
      );

      // Генерируем HTML
      const html = this.generateHTMLTemplate({
        property,
        photos: validPhotos,
        features: featuresByType,
        seasonalPrices,
        monthlyPrices,
        blockedDates,
        options,
        featureTranslations: this.getFeatureTranslations(options.language)
      });

      return html;
    } catch (error) {
      logger.error('Generate HTML error:', error);
      throw error;
    }
  }
  /**
   * Генерировать HTML шаблон
   */
  private generateHTMLTemplate(data: any): string {
    const { property, photos, features, seasonalPrices, monthlyPrices, blockedDates, options, featureTranslations } = data;

    // Получаем переводы интерфейса
    const ui = this.getUITranslations(options.language);
    const forAgent = options.forAgent || false;
    const propertyName = property.translated_name || property.property_name || `Property ${property.property_number}`;
    const description = property.translated_description || '';
    const propertyNumber = property.property_number || '';
    const region = this.capitalizeFirstLetter(property.region || '');

    // Логотип
    const logoBase64 = this.getLogoBase64();

    // Главное фото
    const mainPhoto = photos[0];
    
    // Генерируем миниатюры
    const thumbnailsCount = Math.min(3, photos.length - 1);
    let thumbnailsHTML = '';
    
    for (let i = 1; i <= thumbnailsCount; i++) {
      thumbnailsHTML += `
        <a href="#photo${i}" class="thumbnail">
          <img src="${photos[i]}" alt="Thumbnail" />
        </a>
      `;
    }

    if (photos.length > 4) {
      thumbnailsHTML += `
        <a href="#photo0" class="thumbnail view-all-thumbnail">
          <img src="${photos[thumbnailsCount]}" alt="Thumbnail" />
          <div class="view-all-overlay">
            ${this.getSVGIcon('images')}
            <span>${ui['view_all']}</span>
            <span class="photo-count">+${photos.length - 4}</span>
          </div>
        </a>
      `;
    } else if (photos.length === 4) {
      thumbnailsHTML += `
        <a href="#photo3" class="thumbnail">
          <img src="${photos[3]}" alt="Thumbnail" />
        </a>
      `;
    }

    // Генерируем галерею
    const galleryPhotosHTML = photos.map((photo: string, index: number) => `
      <div class="gallery-slide" id="photo${index}">
        <div class="gallery-content">
          <a href="#" class="gallery-close">×</a>
          ${index > 0 ? `<a href="#photo${index - 1}" class="gallery-nav prev">${this.getSVGIcon('chevronLeft')}</a>` : `<a href="#photo${photos.length - 1}" class="gallery-nav prev">${this.getSVGIcon('chevronLeft')}</a>`}
          <img src="${photo}" alt="Photo ${index + 1}" />
          ${index < photos.length - 1 ? `<a href="#photo${index + 1}" class="gallery-nav next">${this.getSVGIcon('chevronRight')}</a>` : `<a href="#photo0" class="gallery-nav next">${this.getSVGIcon('chevronRight')}</a>`}
          <div class="gallery-counter">${index + 1} / ${photos.length}</div>
        </div>
      </div>
    `).join('');

    // Генерируем характеристики
const generateFeaturesSection = (type: string, titleKey: string, iconName: string, iconColor: string) => {
      const typeFeatures = features[type] || [];
      if (typeFeatures.length === 0) return '';

      const featuresHTML = typeFeatures.map((feature: string) => `
        <div class="feature-badge">
          <span class="badge-icon" style="color: ${iconColor}">${this.getSVGIcon('check')}</span>
          <span>${featureTranslations[feature] || feature}</span>
        </div>
      `).join('');

      const count = typeFeatures.length;

      return `
        <details class="features-accordion">
          <summary class="features-accordion-header">
            <div class="accordion-title">
              <span class="accordion-icon" style="color: ${iconColor}">${this.getSVGIcon(iconName)}</span>
              <span>${ui[titleKey]}</span>
              <span class="feature-count">(${count})</span>
            </div>
            <span class="accordion-chevron">${this.getSVGIcon('chevronDown')}</span>
          </summary>
          <div class="features-accordion-content">
            <div class="features-grid">
              ${featuresHTML}
            </div>
          </div>
        </details>
      `;
    };

    // Генерируем секцию цен
    let pricesHTML = '';

if (options.showSalePrices && property.sale_price) {
      pricesHTML += `
        <div class="price-card sale-price">
          <div class="price-label">${ui['sale_price']}</div>
          <div class="price-amount">${this.formatPrice(property.sale_price)}</div>
        </div>
      `;
    }

    if (options.showRentalPrices) {
      if (options.includeYearlyPrice && property.year_price) {
        pricesHTML += `
          <div class="price-card">
            <div class="price-label">${ui['yearly_rent']}</div>
            <div class="price-amount">${this.formatPrice(property.year_price)}</div>
          </div>
        `;
      }

        if (options.includeSeasonalPrices && seasonalPrices.length > 0) {
        const seasonalHTML = seasonalPrices.map((price: any) => {
          const period = this.formatDateRange(price.start_date_recurring, price.end_date_recurring, options.language);
          
          return `
            <div class="seasonal-item">
              <span class="season-date">${this.getSVGIcon('calendar')} ${period}</span>
              <span class="season-price">${this.formatPrice(price.price_per_night)}</span>
            </div>
          `;
        }).join('');

        pricesHTML += `
          <div class="section">
            <details class="section-accordion">
              <summary class="section-accordion-header">
                <div class="section-title-row">
                  <span class="section-icon">${this.getSVGIcon('dollar')}</span>
                  <span class="section-title">${ui['seasonal_prices']}</span>
                </div>
                <span class="section-chevron">${this.getSVGIcon('chevronDown')}</span>
              </summary>
              <div class="section-accordion-content">
                <div class="seasonal-list">
                  ${seasonalHTML}
                </div>
              </div>
            </details>
          </div>
        `;
      }

      if (options.includeMonthlyPrices && monthlyPrices.length > 0) {
        const monthlyHTML = monthlyPrices.map((price: any) => {
          const monthName = this.getMonthName(price.month_number, options.language);
          return `
            <div class="monthly-item">
              <div class="month-name">${monthName}</div>
              <div class="month-price">${this.formatPrice(price.price_per_month)}</div>
            </div>
          `;
        }).join('');

        pricesHTML += `
          <div class="section">
            <details class="section-accordion">
              <summary class="section-accordion-header">
                <div class="section-title-row">
                  <span class="section-icon">${this.getSVGIcon('calendar')}</span>
                  <span class="section-title">${ui['monthly_prices']}</span>
                </div>
                <span class="section-chevron">${this.getSVGIcon('chevronDown')}</span>
              </summary>
              <div class="section-accordion-content">
                <div class="monthly-grid">
                  ${monthlyHTML}
                </div>
              </div>
            </details>
          </div>
        `;
      }
    }

    // Генерируем календари
// Генерируем календари
const generateCalendars = () => {
      const today = new Date();
      const calendars: string[] = [];
      
      const blockedByMonth: { [key: string]: Set<number> } = {};
      
      blockedDates.forEach((item: any) => {
        const date = new Date(item.blocked_date);
        const monthKey = `${date.getUTCFullYear()}-${date.getUTCMonth()}`;
        
        if (!blockedByMonth[monthKey]) {
          blockedByMonth[monthKey] = new Set();
        }
        
        blockedByMonth[monthKey].add(date.getUTCDate());
      });

      for (let i = 0; i < 12; i++) {
        const currentMonth = new Date(today.getFullYear(), today.getMonth() + i, 1);
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const monthKey = `${year}-${month}`;
        
        const monthName = this.getMonthName(month + 1, options.language); // ✅ Используем выбранный язык
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();
        
        let calendarDaysHTML = '';
        
        const emptyDays = firstDay === 0 ? 6 : firstDay - 1;
        for (let j = 0; j < emptyDays; j++) {
          calendarDaysHTML += '<div class="calendar-day empty"></div>';
        }
        
        const blockedDays = blockedByMonth[monthKey] || new Set();
        
        for (let day = 1; day <= daysInMonth; day++) {
          const isBlocked = blockedDays.has(day);
          const classes = isBlocked ? 'calendar-day blocked' : 'calendar-day';
          
          calendarDaysHTML += `<div class="${classes}">${day}</div>`;
        }

        calendars.push(`
          <div class="calendar-month" id="month${i}">
            <div class="calendar-month-header">
              <span class="calendar-month-name">${monthName} ${year}</span>
            </div>
            <div class="calendar-weekdays">
              <div>${ui['mon']}</div>
              <div>${ui['tue']}</div>
              <div>${ui['wed']}</div>
              <div>${ui['thu']}</div>
              <div>${ui['fri']}</div>
              <div>${ui['sat']}</div>
              <div>${ui['sun']}</div>
            </div>
            <div class="calendar-days">
              ${calendarDaysHTML}
            </div>
          </div>
        `);
      }

      return calendars.join('');
    };

    const calendarsHTML = generateCalendars();

return `
<!DOCTYPE html>
  <!-- Created by NOVA Estate (novaestate.company) (Need help? Telegram: @xmvsx) -->
  <!-- Created by NOVA Estate (novaestate.company) (Need help? Telegram: @xmvsx) -->
  <!-- Created by NOVA Estate (novaestate.company) (Need help? Telegram: @xmvsx) -->
  <!-- Created by NOVA Estate (novaestate.company) (Need help? Telegram: @xmvsx) -->
<html lang="${options.language}" dir="${options.language === 'he' ? 'rtl' : 'ltr'}">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>${propertyName}${!forAgent ? ' - NOVA Estate' : ''}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    html {
      scroll-behavior: smooth;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: #f8f9fa;
      color: #212529;
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }

    .container {
      max-width: 100%;
      margin: 0 auto;
      background: #ffffff;
    }

    /* Header */
    .header-bar {
      background: #ffffff;
      padding: 16px 20px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .logo img {
      height: 40px;
      width: auto;
    }

    /* Property Header */
    .property-header {
      padding: 24px 20px 16px;
      background: #ffffff;
    }

    .property-title-row {
      display: flex;
      align-items: baseline;
      gap: 12px;
      margin-bottom: 12px;
      flex-wrap: wrap;
    }

    .property-title {
      font-size: 28px;
      font-weight: 700;
      color: #1e293b;
      line-height: 1.3;
    }

    .property-number {
      font-size: 18px;
      font-weight: 600;
      color: #6366f1;
      padding: 4px 12px;
      background: #eef2ff;
      border-radius: 8px;
    }

    .property-location {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #64748b;
      font-size: 15px;
    }

    .property-location svg {
      width: 18px;
      height: 18px;
      flex-shrink: 0;
    }

    /* Gallery */
    .gallery-container {
      padding: 0 20px 20px;
    }

    .main-photo {
      width: 100%;
      border-radius: 16px;
      overflow: hidden;
      margin-bottom: 12px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.1);
    }

    .main-photo a {
      display: block;
    }

    .main-photo img {
      width: 100%;
      height: 400px;
      object-fit: cover;
      display: block;
    }

    .thumbnails-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
    }

    .thumbnail {
      border-radius: 12px;
      overflow: hidden;
      aspect-ratio: 1;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      position: relative;
      display: block;
      text-decoration: none;
    }

    .thumbnail img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .view-all-thumbnail {
      position: relative;
    }

    .view-all-thumbnail img {
      filter: blur(3px) brightness(0.7);
    }

    .view-all-overlay {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
      color: #ffffff;
      text-align: center;
      background: rgba(0, 0, 0, 0.3);
      pointer-events: none;
    }

    .view-all-overlay svg {
      width: 28px;
      height: 28px;
    }

    .view-all-overlay span {
      font-size: 12px;
      font-weight: 600;
    }

    .photo-count {
      font-size: 18px !important;
      font-weight: 700 !important;
    }

    /* Gallery Modal */
    .gallery-slide {
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.95);
      z-index: 1000;
      overflow: hidden;
    }

    .gallery-slide:target {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .gallery-content {
      position: relative;
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .gallery-slide img {
      max-width: 90%;
      max-height: 90vh;
      object-fit: contain;
    }

    .gallery-close {
      position: absolute;
      top: 20px;
      right: 20px;
      width: 44px;
      height: 44px;
      background: rgba(255, 255, 255, 0.2);
      border: none;
      border-radius: 50%;
      color: #ffffff;
      font-size: 28px;
      text-decoration: none;
      display: flex;
      align-items: center;
      justify-content: center;
      backdrop-filter: blur(10px);
      z-index: 10;
    }

    .gallery-nav {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      width: 44px;
      height: 44px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      color: #ffffff;
      backdrop-filter: blur(10px);
      display: flex;
      align-items: center;
      justify-content: center;
      text-decoration: none;
    }

    .gallery-nav.prev {
      left: 20px;
    }

    .gallery-nav.next {
      right: 20px;
    }

    .gallery-nav svg {
      width: 24px;
      height: 24px;
    }

    .gallery-counter {
      position: absolute;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.6);
      color: #ffffff;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
      backdrop-filter: blur(10px);
    }

    .map-button {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      background: #3b82f6;
      color: #ffffff;
      border: none;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 600;
      text-decoration: none;
      box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
      margin-top: 12px;
    }

    .map-button svg {
      width: 18px;
      height: 18px;
    }

    /* Quick Info */
    .quick-info {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      padding: 20px;
      background: #f8fafc;
    }

    .info-card {
      background: #ffffff;
      padding: 20px 16px;
      border-radius: 16px;
      text-align: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
    }

    .info-card svg {
      width: 32px;
      height: 32px;
      margin-bottom: 8px;
      color: #3b82f6;
    }

    .info-value {
      font-size: 24px;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 4px;
    }

    .info-label {
      font-size: 12px;
      color: #64748b;
      font-weight: 500;
    }

    /* Content */
    .content {
      padding: 0 20px 24px;
    }

    .section {
      margin-bottom: 24px;
    }

    .section-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 16px;
    }

    .section-icon {
      width: 24px;
      height: 24px;
      color: #3b82f6;
    }

    .section-icon svg {
      width: 100%;
      height: 100%;
    }

    .section-title {
      font-size: 20px;
      font-weight: 700;
      color: #1e293b;
    }

    .description-text {
      font-size: 15px;
      line-height: 1.7;
      color: #475569;
      white-space: pre-wrap;
    }

    /* Price Cards */
    .price-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
      border-radius: 16px;
      color: #ffffff;
      box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3);
      margin-bottom: 12px;
    }

    .sale-price {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    }

    .price-label {
      font-size: 13px;
      opacity: 0.9;
      margin-bottom: 8px;
      font-weight: 500;
    }

    .price-amount {
      font-size: 28px;
      font-weight: 700;
    }

    /* Accordions with details/summary */
    details {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      margin-bottom: 12px;
      overflow: hidden;
    }

    summary {
      padding: 16px;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
      list-style: none;
      user-select: none;
    }

    summary::-webkit-details-marker {
      display: none;
    }

    summary:active {
      background: #f8fafc;
    }

    .section-title-row, .accordion-title {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .section-title-row {
      font-size: 18px;
      font-weight: 700;
      color: #1e293b;
    }

    .accordion-title {
      font-size: 16px;
      font-weight: 600;
      color: #1e293b;
    }

    .accordion-icon {
      width: 24px;
      height: 24px;
    }

    .accordion-icon svg {
      width: 100%;
      height: 100%;
    }

    .feature-count {
      font-size: 14px;
      color: #94a3b8;
      font-weight: 500;
    }

    .accordion-chevron, .section-chevron {
      width: 20px;
      height: 20px;
      color: #94a3b8;
      transition: transform 0.3s ease;
    }

    .accordion-chevron svg, .section-chevron svg {
      width: 100%;
      height: 100%;
    }

    details[open] .accordion-chevron,
    details[open] .section-chevron {
      transform: rotate(180deg);
    }

    .section-accordion-content, .features-accordion-content {
      padding: 0 16px 16px;
    }

    /* Seasonal & Monthly Prices */
    .seasonal-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .seasonal-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #f8fafc;
      border-radius: 12px;
      padding: 12px 16px;
    }

    .season-date {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: #475569;
      font-weight: 500;
    }

    .season-date svg {
      width: 16px;
      height: 16px;
      color: #94a3b8;
    }

    .season-price {
      font-size: 18px;
      font-weight: 700;
      color: #1e293b;
    }

    .monthly-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }

    .monthly-item {
      background: #f8fafc;
      border-radius: 12px;
      padding: 12px;
      text-align: center;
    }

    .month-name {
      font-size: 13px;
      color: #64748b;
      margin-bottom: 6px;
      font-weight: 500;
    }

    .month-price {
      font-size: 18px;
      font-weight: 700;
      color: #1e293b;
    }

/* Calendar */
    .calendar-widget {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 20px;
      position: relative;
    }

    .calendar-radio {
      position: absolute;
      opacity: 0;
      pointer-events: none;
    }

    .calendar-navigation {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      position: relative;
    }

    .calendar-nav-btn {
      width: 36px;
      height: 36px;
      border: none;
      background: #f1f5f9;
      border-radius: 8px;
      display: none;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      color: #475569;
      position: absolute;
    }

    .calendar-nav-btn.prev-btn {
      left: 0;
    }

    .calendar-nav-btn.next-btn {
      right: 0;
    }

    .calendar-nav-btn svg {
      width: 20px;
      height: 20px;
    }

    /* Show navigation for current month */
    #cal0:checked ~ .calendar-navigation #prev0,
    #cal0:checked ~ .calendar-navigation #next0 { display: flex; }
    
    #cal1:checked ~ .calendar-navigation #prev1,
    #cal1:checked ~ .calendar-navigation #next1 { display: flex; }
    
    #cal2:checked ~ .calendar-navigation #prev2,
    #cal2:checked ~ .calendar-navigation #next2 { display: flex; }
    
    #cal3:checked ~ .calendar-navigation #prev3,
    #cal3:checked ~ .calendar-navigation #next3 { display: flex; }
    
    #cal4:checked ~ .calendar-navigation #prev4,
    #cal4:checked ~ .calendar-navigation #next4 { display: flex; }
    
    #cal5:checked ~ .calendar-navigation #prev5,
    #cal5:checked ~ .calendar-navigation #next5 { display: flex; }

    #cal6:checked ~ .calendar-navigation #prev6,
    #cal6:checked ~ .calendar-navigation #next6 { display: flex; }
    
    #cal7:checked ~ .calendar-navigation #prev7,
    #cal7:checked ~ .calendar-navigation #next7 { display: flex; }
    
    #cal8:checked ~ .calendar-navigation #prev8,
    #cal8:checked ~ .calendar-navigation #next8 { display: flex; }
    
    #cal9:checked ~ .calendar-navigation #prev9,
    #cal9:checked ~ .calendar-navigation #next9 { display: flex; }
    
    #cal10:checked ~ .calendar-navigation #prev10,
    #cal10:checked ~ .calendar-navigation #next10 { display: flex; }
    
    #cal11:checked ~ .calendar-navigation #prev11,
    #cal11:checked ~ .calendar-navigation #next11 { display: flex; }

    .calendar-months-container {
      position: relative;
      min-height: 300px;
    }

    .calendar-month {
      display: none;
    }

    /* Show current month */
    #cal0:checked ~ .calendar-months-container #month0 { display: block; }
    #cal1:checked ~ .calendar-months-container #month1 { display: block; }
    #cal2:checked ~ .calendar-months-container #month2 { display: block; }
    #cal3:checked ~ .calendar-months-container #month3 { display: block; }
    #cal4:checked ~ .calendar-months-container #month4 { display: block; }
    #cal5:checked ~ .calendar-months-container #month5 { display: block; }
    #cal6:checked ~ .calendar-months-container #month6 { display: block; }
    #cal7:checked ~ .calendar-months-container #month7 { display: block; }
    #cal8:checked ~ .calendar-months-container #month8 { display: block; }
    #cal9:checked ~ .calendar-months-container #month9 { display: block; }
    #cal10:checked ~ .calendar-months-container #month10 { display: block; }
    #cal11:checked ~ .calendar-months-container #month11 { display: block; }

    .calendar-month-header {
      text-align: center;
      margin-bottom: 16px;
    }

    .calendar-month-name {
      font-size: 18px;
      font-weight: 700;
      color: #1e293b;
    }

    .calendar-weekdays {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 4px;
      margin-bottom: 8px;
      text-align: center;
      font-size: 12px;
      font-weight: 600;
      color: #64748b;
    }

    .calendar-days {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 4px;
    }

    .calendar-day {
      aspect-ratio: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      border-radius: 8px;
      color: #1e293b;
      font-weight: 500;
    }

    .calendar-day.empty {
      visibility: hidden;
    }

    .calendar-day.blocked {
      background: #fee2e2;
      color: #991b1b;
    }

    .calendar-legend {
      display: flex;
      gap: 16px;
      justify-content: center;
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid #e2e8f0;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: #64748b;
    }

    .legend-box {
      width: 16px;
      height: 16px;
      border-radius: 4px;
    }

    .legend-box.available {
      background: #ffffff;
      border: 1px solid #cbd5e1;
    }

    .legend-box.occupied {
      background: #fee2e2;
    }

    /* Features */
    .features-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
    }

    .feature-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      background: #f8fafc;
      border-radius: 8px;
      font-size: 13px;
      color: #475569;
    }

    .badge-icon {
      width: 16px;
      height: 16px;
      flex-shrink: 0;
    }

    .badge-icon svg {
      width: 100%;
      height: 100%;
    }

    /* Footer */
    .footer {
      padding: 32px 20px;
      text-align: center;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
    }

    .footer-logo {
      margin-bottom: 12px;
    }

    .footer-logo img {
      height: 50px;
      width: auto;
    }

    .footer-text {
      font-size: 13px;
      color: #94a3b8;
    }

    /* Responsive */
    @media (max-width: 640px) {
      .property-title {
        font-size: 24px;
      }

      .main-photo img {
        height: 300px;
      }

      .thumbnails-grid {
        grid-template-columns: repeat(2, 1fr);
      }

      .quick-info {
        grid-template-columns: repeat(2, 1fr);
      }

      .info-card {
        padding: 16px 12px;
      }

      .info-value {
        font-size: 20px;
      }

      .features-grid {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    ${!forAgent ? `
    <!-- Header with Logo -->
    <div class="header-bar">
      <div class="logo">
        <img src="${logoBase64}" alt="NOVA Estate" />
      </div>
    </div>
    ` : ''}

    <div class="property-header">
      <div class="property-title-row">
        <h1 class="property-title">${propertyName}</h1>
        ${propertyNumber ? `<span class="property-number">#${propertyNumber}</span>` : ''}
      </div>
      <div class="property-location">
        ${this.getSVGIcon('location')}
        <span>${region}</span>
      </div>
    </div>

    <div class="gallery-container">
      <div class="main-photo">
        <a href="#photo0">
          <img src="${mainPhoto}" alt="${propertyName}" />
        </a>
      </div>
      ${thumbnailsHTML ? `
        <div class="thumbnails-grid">
          ${thumbnailsHTML}
        </div>
      ` : ''}
      ${property.google_maps_link ? `
        <a href="${property.google_maps_link}" target="_blank" rel="noopener" class="map-button">
          ${this.getSVGIcon('map')}
          ${ui['open_map']}
        </a>
      ` : ''}
    </div>

    <div class="quick-info">
${property.bedrooms ? `
        <div class="info-card">
          ${this.getSVGIcon('bed')}
          <div class="info-value">${Math.round(property.bedrooms)}</div>
          <div class="info-label">${ui['bedrooms']}</div>
        </div>
      ` : ''}
      ${property.bathrooms ? `
        <div class="info-card">
          ${this.getSVGIcon('bath')}
          <div class="info-value">${Math.round(property.bathrooms)}</div>
          <div class="info-label">${ui['bathrooms']}</div>
        </div>
      ` : ''}
      ${property.indoor_area ? `
        <div class="info-card">
          ${this.getSVGIcon('area')}
          <div class="info-value">${Math.round(property.indoor_area)}</div>
          <div class="info-label">${ui['area']}</div>
        </div>
      ` : ''}
    </div>

    <div class="content">
      ${description ? `
        <div class="section">
          <div class="section-header">
            <span class="section-icon">${this.getSVGIcon('home')}</span>
            <span class="section-title">${ui['description']}</span>
          </div>
          <div class="description-text">${description}</div>
        </div>
      ` : ''}

      ${pricesHTML}

<div class="section">
        <div class="section-header">
          <span class="section-icon">${this.getSVGIcon('calendar')}</span>
          <span class="section-title">${ui['calendar']}</span>
        </div>
        <div class="calendar-widget">
           <input type="radio" name="cal" id="cal0" class="calendar-radio" checked />
          <input type="radio" name="cal" id="cal1" class="calendar-radio" />
          <input type="radio" name="cal" id="cal2" class="calendar-radio" />
          <input type="radio" name="cal" id="cal3" class="calendar-radio" />
          <input type="radio" name="cal" id="cal4" class="calendar-radio" />
          <input type="radio" name="cal" id="cal5" class="calendar-radio" />
          <input type="radio" name="cal" id="cal6" class="calendar-radio" />
          <input type="radio" name="cal" id="cal7" class="calendar-radio" />
          <input type="radio" name="cal" id="cal8" class="calendar-radio" />
          <input type="radio" name="cal" id="cal9" class="calendar-radio" />
          <input type="radio" name="cal" id="cal10" class="calendar-radio" />
          <input type="radio" name="cal" id="cal11" class="calendar-radio" />
          
        <div class="calendar-navigation">
          <label for="cal11" id="prev0" class="calendar-nav-btn prev-btn">${this.getSVGIcon('chevronLeft')}</label>
          <label for="cal1" id="next0" class="calendar-nav-btn next-btn">${this.getSVGIcon('chevronRight')}</label>

          <label for="cal0" id="prev1" class="calendar-nav-btn prev-btn">${this.getSVGIcon('chevronLeft')}</label>
          <label for="cal2" id="next1" class="calendar-nav-btn next-btn">${this.getSVGIcon('chevronRight')}</label>

          <label for="cal1" id="prev2" class="calendar-nav-btn prev-btn">${this.getSVGIcon('chevronLeft')}</label>
          <label for="cal3" id="next2" class="calendar-nav-btn next-btn">${this.getSVGIcon('chevronRight')}</label>

          <label for="cal2" id="prev3" class="calendar-nav-btn prev-btn">${this.getSVGIcon('chevronLeft')}</label>
          <label for="cal4" id="next3" class="calendar-nav-btn next-btn">${this.getSVGIcon('chevronRight')}</label>

          <label for="cal3" id="prev4" class="calendar-nav-btn prev-btn">${this.getSVGIcon('chevronLeft')}</label>
          <label for="cal5" id="next4" class="calendar-nav-btn next-btn">${this.getSVGIcon('chevronRight')}</label>

          <label for="cal4" id="prev5" class="calendar-nav-btn prev-btn">${this.getSVGIcon('chevronLeft')}</label>
          <label for="cal6" id="next5" class="calendar-nav-btn next-btn">${this.getSVGIcon('chevronRight')}</label>

          <label for="cal5" id="prev6" class="calendar-nav-btn prev-btn">${this.getSVGIcon('chevronLeft')}</label>
          <label for="cal7" id="next6" class="calendar-nav-btn next-btn">${this.getSVGIcon('chevronRight')}</label>

          <label for="cal6" id="prev7" class="calendar-nav-btn prev-btn">${this.getSVGIcon('chevronLeft')}</label>
          <label for="cal8" id="next7" class="calendar-nav-btn next-btn">${this.getSVGIcon('chevronRight')}</label>

          <label for="cal7" id="prev8" class="calendar-nav-btn prev-btn">${this.getSVGIcon('chevronLeft')}</label>
          <label for="cal9" id="next8" class="calendar-nav-btn next-btn">${this.getSVGIcon('chevronRight')}</label>

          <label for="cal8" id="prev9" class="calendar-nav-btn prev-btn">${this.getSVGIcon('chevronLeft')}</label>
          <label for="cal10" id="next9" class="calendar-nav-btn next-btn">${this.getSVGIcon('chevronRight')}</label>

          <label for="cal9" id="prev10" class="calendar-nav-btn prev-btn">${this.getSVGIcon('chevronLeft')}</label>
          <label for="cal11" id="next10" class="calendar-nav-btn next-btn">${this.getSVGIcon('chevronRight')}</label>

          <label for="cal10" id="prev11" class="calendar-nav-btn prev-btn">${this.getSVGIcon('chevronLeft')}</label>
          <label for="cal0" id="next11" class="calendar-nav-btn next-btn">${this.getSVGIcon('chevronRight')}</label>
        </div>
          
          <div class="calendar-months-container">
            ${calendarsHTML}
          </div>
          
            <div class="calendar-legend">
            <div class="legend-item">
              <div class="legend-box available"></div>
              <span>${ui['available']}</span>
            </div>
            <div class="legend-item">
              <div class="legend-box occupied"></div>
              <span>${ui['occupied']}</span>
            </div>
          </div>
        </div>
      </div>

    ${Object.keys(features).length > 0 ? `
        <div class="section">
          <div class="section-header">
            <span class="section-icon">${this.getSVGIcon('check')}</span>
            <span class="section-title">${ui['features']}</span>
          </div>
          ${generateFeaturesSection('property', 'property_features', 'home', '#3b82f6')}
          ${generateFeaturesSection('outdoor', 'outdoor_amenities', 'pool', '#486bcaff')}
          ${generateFeaturesSection('rental', 'rental_conditions', 'check', '#49259eff')}
          ${generateFeaturesSection('location', 'location_features', 'location', '#21bdd1ff')}
          ${generateFeaturesSection('views', 'views', 'home', '#48ecadff')}
        </div>
      ` : ''}
    </div>

    ${!forAgent ? `
    <div class="footer">
      <div class="footer-logo">
        <img src="${logoBase64}" alt="NOVA Estate" />
      </div>
      <div class="footer-text">&copy; ${new Date().getFullYear()} NOVA Estate. ${ui['all_rights_reserved']}</div>
    </div>
    ` : ''}
  </div>

  ${galleryPhotosHTML}
</body>
</html>
    `;
  }
}

export default new HTMLGeneratorService();