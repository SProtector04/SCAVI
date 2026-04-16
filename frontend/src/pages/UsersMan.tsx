import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';

interface RegisterFormData {
  username: string;
  password: string;
  confirmPassword: string;
  rol: 'ADMIN' | 'SUPERVISOR';
  email: string;
}

const UsersMan = () => {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [showRegister, setShowRegister] = useState(false);
  const [formData, setFormData] = useState<RegisterFormData>({
    username: '',
    password: '',
    confirmPassword: '',
    rol: 'SUPERVISOR',
    email: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        setUserRole(user.rol || null);
      } catch {
        setUserRole(null);
      }
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await api.post('/auth/register/', {
        username: formData.username,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        rol: formData.rol,
        email: formData.email,
      });

      setSuccess(`Usuario "${response.data.user.username}" creado exitosamente`);
      setFormData({
        username: '',
        password: '',
        confirmPassword: '',
        rol: 'SUPERVISOR',
        email: '',
      });
      setShowRegister(false);
    } catch (err: any) {
      const message = err.response?.data?.error || 'Error al crear usuario';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Si no es admin, mostrar mensaje de acceso denegado
  if (userRole !== 'ADMIN') {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
          <h2 className="text-xl font-bold text-red-800">Acceso Denegado</h2>
          <p className="text-red-600 mt-2">
            No tienes permisos para acceder a esta sección.
            Solo los administradores pueden gestionar usuarios.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Gestion de usuarios
          </h1>
          <p className="mt-2 text-slate-600">
            Administracion de altas, cambios y estado de cuentas.
          </p>
        </div>
        <Button
          onClick={() => setShowRegister(!showRegister)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {showRegister ? 'Cancelar' : 'Nuevo Usuario'}
        </Button>
      </div>

      {/* Formulario de registro */}
      {showRegister && (
        <div className="mt-6 p-6 bg-white border rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Crear nuevo usuario</h2>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 border border-red-200 rounded">
              {error}
            </div>
          )}
          
          {success && (
            <div className="mb-4 p-3 bg-green-50 text-green-700 border border-green-200 rounded">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Username *
              </label>
              <Input
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="Ingrese username"
                required
                minLength={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Password *
              </label>
              <Input
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Ingrese password"
                required
                minLength={6}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Confirmar Password *
              </label>
              <Input
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirme password"
                required
                minLength={6}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Rol *
              </label>
              <select
                name="rol"
                value={formData.rol}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="SUPERVISOR">Supervisor</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email (opcional)
              </label>
              <Input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="email@ejemplo.com"
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
              >
                {loading ? 'Creando...' : 'Crear Usuario'}
              </Button>
              <Button
                type="button"
                onClick={() => setShowRegister(false)}
                className="bg-gray-500 hover:bg-gray-600"
              >
                Cancelar
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default UsersMan;