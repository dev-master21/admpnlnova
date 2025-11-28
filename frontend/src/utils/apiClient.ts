// frontend/src/utils/apiClient.ts
import api from '@/api/axios';
import ownerApi from '@/api/ownerAxios';

export const getApiClient = () => {
  const ownerToken = localStorage.getItem('ownerAccessToken');
  return ownerToken ? ownerApi : api;
};

export const isOwnerUser = (): boolean => {
  return !!localStorage.getItem('ownerAccessToken');
};

export const isAdminUser = (): boolean => {
  return !!localStorage.getItem('accessToken');
};