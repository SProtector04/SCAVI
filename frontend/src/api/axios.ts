import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Interceptor para agregar CSRF token a las requests
api.interceptors.request.use(
  (config) => {
    // Obtener CSRF token de la cookie
    const cookies = document.cookie.split('; ');
    const csrfToken = cookies.find(row => row.startsWith('csrftoken='))?.split('=')[1];
    
    if (csrfToken) {
      config.headers['X-CSRFToken'] = csrfToken;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejar respuestas 401 (no autorizado)
// EXCEPTO para /auth/me/ que se usa para verificar autenticación
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const url = originalRequest?.url || '';
    
    // No redirigir a login cuando estamos verificando auth
    if (url.includes('/auth/me/') || url.includes('/auth/login/') || url.includes('/auth/refresh/')) {
      return Promise.reject(error);
    }
    
    // Si es 401 y no hemos reintentado ya
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(() => {
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Intentar refrescar el token
        await api.post('/auth/refresh/');
        processQueue(null, 'refreshed');
        
        // Reintentar la petición original
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Si falla el refresh, desloguear
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
