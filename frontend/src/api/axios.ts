// frontend/src/api/axios.ts
import axios from 'axios';

// Используем относительный URL - он автоматически будет HTTPS если сайт на HTTPS
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Глобальные переменные для предотвращения race condition
let isRefreshing = false;
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

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor с защитой от race condition
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Игнорируем ошибки на самом refresh endpoint
    if (originalRequest.url === '/api/auth/refresh') {
      isRefreshing = false;
      processQueue(error, null);
      
      // Очищаем токены и редиректим на логин
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
      
      return Promise.reject(error);
    }

    // Если токен истёк
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        // Если refresh уже идет, добавляем запрос в очередь
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch(err => {
            return Promise.reject(err);
          });
      }

      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');
      
      if (!refreshToken) {
        isRefreshing = false;
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        // Добавляем таймаут для refresh запроса
        const { data } = await axios.post(
          '/api/auth/refresh',
          { refreshToken },
          { timeout: 10000 } // 10 секунд таймаут
        );
        
        const newAccessToken = data.data.accessToken;
        localStorage.setItem('accessToken', newAccessToken);
        
        // Обновляем токен в оригинальном запросе
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        
        // Обрабатываем очередь
        processQueue(null, newAccessToken);
        isRefreshing = false;
        
        return api(originalRequest);
      } catch (refreshError) {
        // Если обновление токена не удалось
        processQueue(refreshError, null);
        isRefreshing = false;
        
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;