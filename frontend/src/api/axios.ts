import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// No usamos interceptor de request porque el JWT está en cookies httpOnly

// Interceptor para manejar respuestas 401 (no autorizado)
// EXCEPTO para /auth/me/ que se usa para verificar autenticación
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    
    // No redirigir a login cuando estamos verificando auth
    if (url === '/auth/me/') {
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
