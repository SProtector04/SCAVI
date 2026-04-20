// src/App.tsx
import { useEffect, useState, useCallback, useRef } from "react";
import { Navigate, Routes, Route, useNavigate, useLocation, Outlet } from "react-router-dom";
import api from "./api/axios";
import Footer from "./components/Footer";
import DashboardPage from "./pages/DashboardPage";
import Layout from "./components/layout";
import ProfilePage from "./pages/ProfilePage";
import UsersPage from "./pages/UsersPage";
import UsersMan from "./pages/UsersMan";
import VehicleMan from "./pages/VehicleMan";
import HistoryPage from "./pages/HistoryPage";
import ContactUs from "./pages/ContactUs";
import LoginPage from "./pages/LoginPage";
import Landing from "./pages/Landing";
import SettingsPage from "./pages/SettingsPage";
import AlertsPage from "./pages/AlertsPage";

const PAGE_TITLES: Record<string, string> = {
  "/users": "Usuarios",
  "/users-management": "Gestion de usuarios",
  "/vehicle-management": "Gestion de vehiculos",
  "/history": "Historial",
  "/contact-us": "Contacto",
  "/settings": "Configuracion",
};

// Rutas que requieren autenticación
const PROTECTED_ROUTES = [
  "/dashboard",
  "/users",
  "/users-management",
  "/vehicle-management",
  "/history",
  "/alerts",
  "/contact-us",
  "/perfil",
  "/profile",
  "/settings",
];

// Rutas que solo ADMIN puede acceder
const ADMIN_ONLY_ROUTES = ["/users", "/users-management", "/settings"];

// Hook personalizado para verificar autenticación
function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const checkedRef = useRef(false);

  const checkAuth = useCallback(async () => {
    if (checkedRef.current) return;

    try {
      const response = await api.get("/auth/me/");
      if (response.status === 200) {
        localStorage.setItem("user", JSON.stringify(response.data));
        setIsAuthenticated(true);
        checkedRef.current = true;
        setIsLoading(false);
        return;
      }
    } catch {
      localStorage.removeItem("user");
    }

    setIsAuthenticated(false);
    checkedRef.current = true;
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!checkedRef.current) {
      checkAuth();
    }
  }, [checkAuth]);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout/");
    } catch {}
    localStorage.removeItem("user");
    setIsAuthenticated(false);
    checkedRef.current = false;
    window.location.href = "/login";
  }, []);

  // Función para obtener el rol del usuario
  const getUserRole = useCallback(() => {
    const userStr = localStorage.getItem("user");
    if (!userStr) return null;
    try {
      const user = JSON.parse(userStr);
      return user.rol || null;
    } catch {
      return null;
    }
  }, []);

  return { isAuthenticated, isLoading, logout, getUserRole, checkedAuth: checkedRef.current };
}

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
      <p className="mt-2 text-slate-600">
        Esta seccion esta lista para conectar su contenido definitivo.
      </p>
    </div>
  );
}

// Componente para rutas protegidas
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, getUserRole } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f7f7]">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-800 border-t-transparent"></div>
          <p className="mt-2 text-slate-600">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Verificar si es ruta de admin
  const currentPath = location.pathname;
  if (ADMIN_ONLY_ROUTES.includes(currentPath)) {
    const role = getUserRole();
    if (role !== "ADMIN") {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
}

// Layout envuelto para rutas protegidas
function ProtectedLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  // Exponer logout en window para que la sidebar pueda llamarlo
  useEffect(() => {
    window.logout = logout;
    return () => {
      delete window.logout;
    };
  }, [logout]);

  return (
    <div className="flex flex-col min-h-screen bg-[#f7f7f7]">
      <Layout>
        <Outlet />
      </Layout>
      <Footer />
    </div>
  );
}

function App() {
  const { isAuthenticated, isLoading, logout, getUserRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Exponer logout globalmente
  useEffect(() => {
    window.logout = logout;
    return () => {
      delete window.logout;
    };
  }, [logout]);

  // Manejar redirecciones iniciales basadas en autenticación
  useEffect(() => {
    if (isLoading) return;

    const currentPath = location.pathname;

    // Si está en / y está autenticado, ir a dashboard
    if (currentPath === "/" && isAuthenticated) {
      navigate("/dashboard", { replace: true });
      return;
    }

    // Si está en /login y ya está autenticado, ir a dashboard
    if (currentPath === "/login" && isAuthenticated) {
      navigate("/dashboard", { replace: true });
      return;
    }
  }, [isLoading, isAuthenticated, location.pathname, navigate]);

  // Mostrar loading mientras se verifica autenticación
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f7f7]">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-800 border-t-transparent"></div>
          <p className="mt-2 text-slate-600">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Ruta raíz - muestra Landing si no está autenticado */}
      <Route
        path="/"
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <Landing />
        }
      />

      {/* Ruta de login - sin layout */}
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
        }
      />

      {/* Rutas protegidas con layout */}
      <Route element={<ProtectedLayout />}>
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <UsersPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/users-management"
          element={
            <ProtectedRoute>
              <UsersMan />
            </ProtectedRoute>
          }
        />

        <Route
          path="/vehicle-management"
          element={
            <ProtectedRoute>
              <VehicleMan />
            </ProtectedRoute>
          }
        />

        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <HistoryPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/contact-us"
          element={
            <ProtectedRoute>
              <ContactUs />
            </ProtectedRoute>
          }
        />

        <Route
          path="/perfil"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/alerts"
          element={
            <ProtectedRoute>
              <AlertsPage />
            </ProtectedRoute>
          }
        />

        {/* Rutas con placeholder temporal */}
        {Object.entries(PAGE_TITLES).map(([path, title]) => (
          <Route
            key={path}
            path={path}
            element={
              <ProtectedRoute>
                <PlaceholderPage title={title} />
              </ProtectedRoute>
            }
          />
        ))}
      </Route>

      {/* Ruta por defecto - redirigir a login */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;