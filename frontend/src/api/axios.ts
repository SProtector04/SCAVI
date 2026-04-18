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
    
    console.log('Cookies:', document.cookie);
    console.log('CSRF Token:', csrfToken);
    
    if (csrfToken) {
      config.headers['X-CSRFToken'] = csrfToken;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para manejar respuestas 401 (no autorizado)
// EXCEPTO para /auth/me/ que se usa para verificar autenticación
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    
    // No redirigir a login cuando estamos verificando auth (soporta /auth/me/ y /api/auth/me/)
    if (url.includes('/auth/me/')) {
      return Promise.reject(error);
    }
    
    if (error.response?.status === 401) {
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
