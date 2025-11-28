// frontend/src/api/ownerAxios.ts
import axios from 'axios';

const ownerApi = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

let isRefreshing = false;
let isRedirecting = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any = null, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

const clearAuthAndRedirect = () => {
  if (isRedirecting) {
    return;
  }
  
  isRedirecting = true;
  isRefreshing = false;
  failedQueue = [];
  
  // Очищаем токены владельца
  localStorage.removeItem('ownerAccessToken');
  localStorage.removeItem('ownerRefreshToken');
  localStorage.removeItem('owner-storage');
  
  setTimeout(() => {
    // Получаем текущий токен из URL
    const pathParts = window.location.pathname.split('/');
    const token = pathParts[2]; // /owner/TOKEN
    
    if (token && token.length === 64) {
      window.location.href = `/owner/${token}`;
    } else {
      window.location.href = '/';
    }
  }, 100);
};

// Request interceptor
ownerApi.interceptors.request.use(
  (config) => {
    if (isRedirecting) {
      const controller = new AbortController();
      controller.abort();
      config.signal = controller.signal;
      return config;
    }
    
    // Используем ownerAccessToken вместо accessToken
    const token = localStorage.getItem('ownerAccessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
ownerApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (axios.isCancel(error) || isRedirecting) {
      return Promise.reject(error);
    }
    
    const originalRequest = error.config;

    // Если это refresh endpoint
    if (originalRequest?.url?.includes('/property-owners/refresh')) {
      console.log('Owner refresh token failed, redirecting to login...');
      clearAuthAndRedirect();
      return Promise.reject(error);
    }

    // Если токен истёк (401)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return ownerApi(originalRequest);
          })
          .catch(err => {
            return Promise.reject(err);
          });
      }

      isRefreshing = true;

      const refreshToken = localStorage.getItem('ownerRefreshToken');
      
      if (!refreshToken) {
        console.log('No owner refresh token available, redirecting to login...');
        clearAuthAndRedirect();
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(
          '/api/property-owners/refresh',
          { refreshToken },
          { 
            timeout: 10000,
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        
        const newAccessToken = data.data.accessToken;
        localStorage.setItem('ownerAccessToken', newAccessToken);
        
        if (data.data.refreshToken) {
          localStorage.setItem('ownerRefreshToken', data.data.refreshToken);
        }
        
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        
        processQueue(null, newAccessToken);
        isRefreshing = false;
        
        return ownerApi(originalRequest);
      } catch (refreshError: any) {
        console.log('Owner token refresh failed:', refreshError?.response?.status || refreshError?.message);
        processQueue(refreshError, null);
        clearAuthAndRedirect();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default ownerApi;