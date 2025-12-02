// backend/src/routes/maps.routes.ts
import { Router, Request, Response } from 'express';
import axios from 'axios';
import logger from '../utils/logger';

const router = Router();

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || '';

/**
 * Разворачивает короткую ссылку Google Maps и извлекает координаты и адрес
 * POST /api/maps/expand-url
 */
router.post('/expand-url', async (req: Request, res: Response) => {
  try {
    const { url } = req.body;

    logger.info(`Expand URL request: ${url}`);

    if (!url) {
      res.status(400).json({
        success: false,
        message: 'URL is required'
      });
      return;
    }

    let normalizedUrl = normalizeGoogleMapsUrl(url);
    logger.info(`Normalized URL: ${normalizedUrl}`);

    let finalUrl = normalizedUrl;

    if (normalizedUrl.includes('maps.app.goo.gl') || normalizedUrl.includes('goo.gl/maps')) {
      try {
        const response = await axios.get(normalizedUrl, {
          maxRedirects: 10,
          validateStatus: () => true,
          timeout: 10000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });

        finalUrl = response.request?.res?.responseUrl || response.request?.url || normalizedUrl;
        logger.info(`URL expanded to: ${finalUrl}`);
      } catch (error) {
        logger.warn('Failed to expand URL, trying to extract from original:', error);
      }
    }

    let coordinates = extractCoordinates(finalUrl);

    // ✅ МЕТОД 1: Если не удалось извлечь координаты напрямую, пробуем через адрес из параметра q
    if (!coordinates) {
      const addressFromQuery = extractAddressFromQueryParam(finalUrl);
      if (addressFromQuery && GOOGLE_MAPS_API_KEY) {
        logger.info(`Extracted address from query: ${addressFromQuery}, attempting to geocode`);
        coordinates = await getCoordinatesFromAddress(addressFromQuery);
      }
    }

    // ✅ МЕТОД 2: Если все еще нет координат, пробуем через Place ID
    if (!coordinates) {
      const placeId = extractPlaceId(finalUrl);
      if (placeId && GOOGLE_MAPS_API_KEY) {
        logger.info(`Extracted Place ID: ${placeId}, attempting to get coordinates via API`);
        coordinates = await getCoordinatesFromPlaceId(placeId);
      }
    }

    if (coordinates) {
      logger.info(`Extracted coordinates: ${coordinates.lat}, ${coordinates.lng}`);
      
      let address: string | null = null;
      
      if (GOOGLE_MAPS_API_KEY) {
        try {
          address = await getAddressFromCoordinates(coordinates.lat, coordinates.lng);
          if (address) {
            logger.info(`Geocoded address: ${address}`);
          }
        } catch (geocodeError) {
          logger.warn('Failed to geocode address, falling back to URL extraction:', geocodeError);
          address = extractAddress(finalUrl);
        }
      } else {
        logger.warn('Google Maps API key not configured, using URL extraction');
        address = extractAddress(finalUrl);
      }

      res.json({
        success: true,
        data: {
          coordinates: coordinates,
          address: address
        }
      });
    } else {
      logger.warn(`Could not extract coordinates from URL: ${finalUrl}`);
      res.status(400).json({
        success: false,
        message: 'Could not extract coordinates from URL. Please check the link format.'
      });
    }
  } catch (error: any) {
    logger.error('Expand URL error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process URL'
    });
  }
});

/**
 * ✅ НОВАЯ ФУНКЦИЯ: Извлечение адреса из параметра q
 */
function extractAddressFromQueryParam(url: string): string | null {
  try {
    const match = url.match(/[?&]q=([^&]+)/);
    if (match) {
      const encodedAddress = match[1];
      const decodedAddress = decodeURIComponent(encodedAddress)
        .replace(/\+/g, ' ')
        .trim();
      
      // Проверяем, что это не просто координаты
      if (decodedAddress && !decodedAddress.match(/^-?\d+\.?\d*,\s*-?\d+\.?\d*$/)) {
        logger.info(`Extracted address from q parameter: ${decodedAddress}`);
        return decodedAddress;
      }
    }
    return null;
  } catch (error) {
    logger.error('Error extracting address from query param:', error);
    return null;
  }
}

/**
 * ✅ НОВАЯ ФУНКЦИЯ: Получение координат по адресу через Google Geocoding API
 */
async function getCoordinatesFromAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    if (!GOOGLE_MAPS_API_KEY) {
      logger.warn('Google Maps API key is not configured');
      return null;
    }

    const encodedAddress = encodeURIComponent(address);
    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${GOOGLE_MAPS_API_KEY}`;
    
    logger.info(`Geocoding address: ${address}`);

    const response = await axios.get(geocodeUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (response.data.status === 'OK' && response.data.results && response.data.results.length > 0) {
      const location = response.data.results[0].geometry?.location;
      if (location && location.lat && location.lng) {
        logger.info(`Got coordinates from address: ${location.lat}, ${location.lng}`);
        return {
          lat: location.lat,
          lng: location.lng
        };
      }
    }
    
    logger.warn(`Geocoding by address failed: ${response.data.status}`);
    return null;
  } catch (error: any) {
    logger.error('Error geocoding address:', error.message);
    return null;
  }
}

/**
 * Извлечение Place ID из URL
 */
function extractPlaceId(url: string): string | null {
  try {
    // Формат: ftid=0x3050373609bd112b:0xb8e33e9b5c5d1597
    const ftidMatch = url.match(/[?&]ftid=([^&]+)/);
    if (ftidMatch) {
      logger.info(`Extracted ftid: ${ftidMatch[1]}`);
      return ftidMatch[1];
    }

    // Формат: place_id=ChIJ...
    const placeIdMatch = url.match(/[?&]place_id=([^&]+)/);
    if (placeIdMatch) {
      logger.info(`Extracted place_id: ${placeIdMatch[1]}`);
      return placeIdMatch[1];
    }

    return null;
  } catch (error) {
    logger.error('Error extracting Place ID:', error);
    return null;
  }
}

/**
 * Получение координат по Place ID через Google Places API
 */
async function getCoordinatesFromPlaceId(placeId: string): Promise<{ lat: number; lng: number } | null> {
  try {
    if (!GOOGLE_MAPS_API_KEY) {
      logger.warn('Google Maps API key is not configured');
      return null;
    }

    // ✅ ИСПРАВЛЕНО: Для hex Place ID (формат: 0x...:0x...) не используем API
    // так как это внутренний формат Google, который не работает с публичными API
    if (placeId.startsWith('0x')) {
      logger.info(`Place ID is in hex format, skipping API call (not supported)`);
      return null;
    }

    // Для обычного Place ID используем Places API
    const placesUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry&key=${GOOGLE_MAPS_API_KEY}`;
    
    logger.info(`Getting place details for: ${placeId}`);

    const response = await axios.get(placesUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (response.data.status === 'OK' && response.data.result?.geometry?.location) {
      const location = response.data.result.geometry.location;
      logger.info(`Got coordinates from Place ID: ${location.lat}, ${location.lng}`);
      return {
        lat: location.lat,
        lng: location.lng
      };
    }

    logger.warn(`Places API failed: ${response.data.status}`);
    return null;
  } catch (error: any) {
    logger.error('Error getting coordinates from Place ID:', error.message);
    return null;
  }
}

/**
 * Получение адреса по координатам через Google Geocoding API
 */
async function getAddressFromCoordinates(lat: number, lng: number): Promise<string | null> {
  try {
    if (!GOOGLE_MAPS_API_KEY) {
      logger.warn('Google Maps API key is not configured');
      return null;
    }

    const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}&language=en`;
    
    logger.info(`Geocoding request: ${lat}, ${lng}`);

    const response = await axios.get(geocodeUrl, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (response.data.status === 'OK' && response.data.results && response.data.results.length > 0) {
      const result = response.data.results[0];
      
      let address = result.formatted_address;
      
      if (!address && result.address_components) {
        address = buildDetailedAddress(result.address_components);
        logger.info(`Built address from components: ${address}`);
      }
      
      if (address) {
        logger.info(`Geocoding successful: ${address}`);
        return address;
      }
    }
    
    logger.warn(`Geocoding failed: ${response.data.status}`);
    return null;
  } catch (error: any) {
    logger.error('Geocoding error:', error.message);
    return null;
  }
}

/**
 * Построение детального адреса из компонентов Google Geocoding API
 */
function buildDetailedAddress(addressComponents: any[]): string {
  const components: { [key: string]: string } = {};
  
  addressComponents.forEach((component: any) => {
    const types = component.types;
    const longName = component.long_name;
    
    if (types.includes('street_number')) {
      components.street_number = longName;
    }
    if (types.includes('route')) {
      components.route = longName;
    }
    if (types.includes('locality')) {
      components.locality = longName;
    }
    if (types.includes('administrative_area_level_1')) {
      components.admin_area_1 = longName;
    }
    if (types.includes('administrative_area_level_2')) {
      components.admin_area_2 = longName;
    }
    if (types.includes('country')) {
      components.country = longName;
    }
    if (types.includes('postal_code')) {
      components.postal_code = longName;
    }
    if (types.includes('sublocality') || types.includes('neighborhood')) {
      components.neighborhood = longName;
    }
  });
  
  const addressParts: string[] = [];
  
  if (components.street_number && components.route) {
    addressParts.push(`${components.street_number} ${components.route}`);
  } else if (components.route) {
    addressParts.push(components.route);
  }
  
  if (components.neighborhood) {
    addressParts.push(components.neighborhood);
  }
  
  if (components.locality) {
    addressParts.push(components.locality);
  } else if (components.admin_area_2) {
    addressParts.push(components.admin_area_2);
  }
  
  if (components.admin_area_1) {
    addressParts.push(components.admin_area_1);
  }
  
  if (components.postal_code) {
    addressParts.push(components.postal_code);
  }
  
  if (components.country) {
    addressParts.push(components.country);
  }
  
  return addressParts.join(', ');
}

/**
 * Нормализация URL Google Maps
 */
function normalizeGoogleMapsUrl(url: string): string {
  let normalized = url.trim();
  
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = 'https://' + normalized;
  }
  
  if (normalized.includes('maps.app.goo.gl') || normalized.includes('goo.gl/maps')) {
    const questionMarkIndex = normalized.indexOf('?');
    if (questionMarkIndex > -1) {
      const hashIndex = normalized.indexOf('#');
      if (hashIndex > -1 && hashIndex < questionMarkIndex) {
        normalized = normalized.substring(0, hashIndex);
      } else {
        normalized = normalized.substring(0, questionMarkIndex);
      }
    }
  }
  
  return normalized;
}

/**
 * Извлечение адреса из URL (FALLBACK метод)
 */
function extractAddress(url: string): string | null {
  try {
    logger.info(`Attempting to extract address from URL (fallback method)`);

    let match = url.match(/\/place\/([^/@?]+)(?:\/|@)/);
    if (match) {
      const encodedPlace = match[1];
      const decodedPlace = decodeURIComponent(encodedPlace)
        .replace(/\+/g, ' ')
        .trim();
      
      if (decodedPlace && !decodedPlace.match(/^-?\d+\.?\d*,\s*-?\d+\.?\d*$/)) {
        logger.info(`URL extraction successful: ${decodedPlace}`);
        return decodedPlace;
      }
    }

    match = url.match(/\/search\/([^/@?]+)(?:\/|@|\?|$)/);
    if (match) {
      const encodedSearch = match[1];
      const decodedSearch = decodeURIComponent(encodedSearch)
        .replace(/\+/g, ' ')
        .trim();
      
      if (decodedSearch && !decodedSearch.match(/^-?\d+\.?\d*,\s*-?\d+\.?\d*$/)) {
        logger.info(`URL extraction successful: ${decodedSearch}`);
        return decodedSearch;
      }
    }

    match = url.match(/[?&]q=([^&@]+)/);
    if (match) {
      const encodedQuery = match[1];
      const decodedQuery = decodeURIComponent(encodedQuery)
        .replace(/\+/g, ' ')
        .trim();
      
      if (decodedQuery && !decodedQuery.match(/^-?\d+\.?\d*,\s*-?\d+\.?\d*$/)) {
        logger.info(`URL extraction successful: ${decodedQuery}`);
        return decodedQuery;
      }
    }

    logger.info('URL extraction found no address');
    return null;
  } catch (error) {
    logger.error('Error extracting address from URL:', error);
    return null;
  }
}

/**
 * Извлечение координат из URL Google Maps
 */
function extractCoordinates(url: string): { lat: number; lng: number } | null {
  try {
    logger.info(`Attempting to extract coordinates from: ${url}`);

    // ✅ ПАТТЕРН 1: @lat,lng,zoomm (например @7.998158,98.3251492,639m)
    let match = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*),\d+[a-z]/i);
    if (match) {
      logger.info('Pattern matched: @lat,lng,zoomm');
      return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
    }

    // ✅ ПАТТЕРН 2: @lat,lng,zoom (например @7.998158,98.3251492,17z)
    match = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*),[\d.]+z/i);
    if (match) {
      logger.info('Pattern matched: @lat,lng,zoomz');
      return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
    }

    // Существующие паттерны
    match = url.match(/\/search\/(-?\d+\.?\d*),\s*\+?(-?\d+\.?\d*)/);
    if (match) {
      logger.info('Pattern matched: /search/lat,lng');
      return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
    }

    match = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*),/);
    if (match) {
      logger.info('Pattern matched: @lat,lng,zoom');
      return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
    }

    match = url.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)(?:[,?&]|$)/);
    if (match) {
      logger.info('Pattern matched: @lat,lng');
      return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
    }

    match = url.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (match) {
      logger.info('Pattern matched: ?q=lat,lng');
      return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
    }

    match = url.match(/\/place\/[^/]*\/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (match) {
      logger.info('Pattern matched: /place/@lat,lng');
      return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
    }

    match = url.match(/[?&]ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (match) {
      logger.info('Pattern matched: ll=lat,lng');
      return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
    }

    match = url.match(/[?&]center=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (match) {
      logger.info('Pattern matched: center=lat,lng');
      return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
    }

    const lat3dMatch = url.match(/!3d(-?\d+\.?\d*)/);
    const lng4dMatch = url.match(/!4d(-?\d+\.?\d*)/);
    if (lat3dMatch && lng4dMatch) {
      logger.info('Pattern matched: !3d!4d format');
      return { 
        lat: parseFloat(lat3dMatch[1]), 
        lng: parseFloat(lng4dMatch[1]) 
      };
    }

    const dataMatch = url.match(/\/data=[^!]*!3d(-?\d+\.?\d*)[^!]*!4d(-?\d+\.?\d*)/);
    if (dataMatch) {
      logger.info('Pattern matched: /data=...!3d!4d');
      return {
        lat: parseFloat(dataMatch[1]),
        lng: parseFloat(dataMatch[2])
      };
    }

    const lastAtMatch = url.split('@').pop();
    if (lastAtMatch) {
      const coordMatch = lastAtMatch.match(/^(-?\d+\.?\d*),(-?\d+\.?\d*)/);
      if (coordMatch) {
        logger.info('Pattern matched: last @ coordinates');
        return {
          lat: parseFloat(coordMatch[1]),
          lng: parseFloat(coordMatch[2])
        };
      }
    }

    logger.warn('No pattern matched for URL');
    return null;
  } catch (error) {
    logger.error('Error extracting coordinates:', error);
    return null;
  }
}

export default router;