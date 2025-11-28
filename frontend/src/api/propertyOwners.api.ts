// frontend/src/api/propertyOwners.api.ts
import ownerApi from './ownerAxios';
import api from './axios';

export interface CreateOwnerAccessRequest {
  owner_name: string;
}

export interface CreateOwnerAccessResponse {
  owner_name: string;
  access_url: string;
  password: string;
  properties_count: number;
}

export interface OwnerLoginRequest {
  access_token: string;
  password: string;
}

export interface OwnerLoginResponse {
  owner: {
    id: number;
    owner_name: string;
    access_token: string;
    properties_count: number;
  };
  accessToken: string;
  refreshToken: string;
}

// ✅ ДОБАВЛЕН интерфейс для детализации заполненности
export interface CompletenessDetails {
  filled: Array<{ name: string; weight: number }>;
  missing: Array<{ name: string; weight: number }>;
}

// ✅ ОБНОВЛЕННЫЙ ИНТЕРФЕЙС с completeness_details
export interface OwnerProperty {
  id: number;
  property_number: string;
  property_name: string | null;
  deal_type: 'sale' | 'rent' | 'both';
  bedrooms: number;
  bathrooms: number;
  cover_photo: string | null;
  photos: Array<{ url: string }>;
  completeness: number;
  completeness_details?: CompletenessDetails; // ✅ ДОБАВЛЕНО
  nearest_blocked_period: {
    start_date: string;
    end_date: string;
  } | null;
  has_blocked_dates: boolean;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export const propertyOwnersApi = {
  // Админские эндпоинты - используют обычный api
  createOwnerAccess: (data: CreateOwnerAccessRequest) =>
    api.post<{ success: boolean; data: CreateOwnerAccessResponse }>('/property-owners/create', data),

  getOwnerInfo: (ownerName: string) =>
    api.get<{ success: boolean; data: any }>(`/property-owners/info/${ownerName}`),

  // Публичные эндпоинты - используют обычный api без токенов
  verifyToken: (token: string) =>
    api.get<{ success: boolean; data: any }>(`/property-owners/verify/${token}`),

  login: (data: OwnerLoginRequest) =>
    api.post<{ success: boolean; data: OwnerLoginResponse }>('/property-owners/login', data),

  // Эндпоинты для авторизованных владельцев - используют ownerApi
  refreshToken: (refreshToken: string) =>
    ownerApi.post<{ success: boolean; data: { accessToken: string; refreshToken: string } }>(
      '/property-owners/refresh',
      { refreshToken }
    ),

  getProperties: () =>
    ownerApi.get<{ success: boolean; data: OwnerProperty[] }>('/property-owners/properties'),

  changePassword: (data: ChangePasswordRequest) =>
    ownerApi.post<{ success: boolean; message: string }>('/property-owners/change-password', data),
};