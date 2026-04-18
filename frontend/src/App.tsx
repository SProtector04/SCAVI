// src/App.tsx
import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
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

// Hook personalizado para verificar autenticación
function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const checkedRef = useRef(false);

  const checkAuth = useCallback(async () => {
    if (checkedRef.current) return;
    
    try {
      const response = await api.get("/auth/me/");
      if (response.status === 200) {
        localStorage.setItem("user", JSON.stringify(response.data));
        setIsAuthenticated(true);
        checkedRef.current = true;
        return;
      }
    } catch {
      localStorage.removeItem("user");
    }
    
    setIsAuthenticated(false);
    checkedRef.current = true;
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

  return { isAuthenticated, logout, getUserRole };
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

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, logout, getUserRole } = useAuth();

  // Exponer logout en window para que la sidebar pueda llamarlo
  useEffect(() => {
    window.logout = logout;
    return () => {
      delete window.logout;
    };
  }, [logout]);

  // Verificar autenticación y redirigir según la ruta actual
  useEffect(() => {
    const currentPath = location.pathname;

    // Rutas que solo ADMIN puede acceder
    const adminOnlyRoutes = ["/users", "/users-management", "/settings"];
    
    // Si está en ruta de admin y no es admin, redirigir a dashboard
    if (adminOnlyRoutes.includes(currentPath)) {
      const role = getUserRole();
      if (role !== "ADMIN") {
        navigate("/dashboard", { replace: true });
        return;
      }
    }

    // Si está en ruta protegida y NO está autenticado, redirigir a login
    if (PROTECTED_ROUTES.includes(currentPath) && isAuthenticated === false) {
      navigate("/login", { replace: true });
      return;
    }
    
    // Mientras verifica (isAuthenticated === null), no hacer nada
    if (isAuthenticated === null) {
      return;
    }

    // Si está en /login y ya está autenticado, redirigir a dashboard
    if (currentPath === "/login" && isAuthenticated) {
      navigate("/dashboard", { replace: true });
      return;
    }
    
    // Si está en / (raíz) y NO está autenticado, mostrar landing
    if (currentPath === "/" && !isAuthenticated) {
      return;
    }

    // Si está en / (raíz) y está autenticado, ir a dashboard
    if (currentPath === "/" && isAuthenticated) {
      navigate("/dashboard", { replace: true });
      return;
    }
  }, [location.pathname, isAuthenticated, navigate, getUserRole]);

  // Mostrar loading mientras se verifica autenticación
  if (isAuthenticated === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f7f7]">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-800 border-t-transparent"></div>
          <p className="mt-2 text-slate-600">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  // Si es ruta de login, solo mostrar el componente de login (sin Layout/Footer)
  if (location.pathname === "/login") {
    return <LoginPage />;
  }

  // Si está en / (raíz) y NO está autenticado, mostrar landing
  if (location.pathname === "/" && !isAuthenticated) {
    return <Landing />;
  }

  // Rutas protegidas necesitan autenticación
  const isProtectedRoute = PROTECTED_ROUTES.includes(location.pathname);

  if (isProtectedRoute && !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f7f7]">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-800 border-t-transparent"></div>
          <p className="mt-2 text-slate-600">Redirigiendo a login...</p>
        </div>
      </div>
    );
  }

  // Renderizar según la ruta
  const resolvePage = (pathname: string) => {
    if (pathname === "/dashboard") {
      return <DashboardPage />;
    }

    if (pathname === "/users") {
      return <UsersPage />;
    }

    if (pathname === "/users-management") {
      return <UsersMan />;
    }

    if (pathname === "/vehicle-management") {
      return <VehicleMan />;
    }

    if (pathname === "/history") {
      return <HistoryPage />;
    }

    if (pathname === "/contact-us") {
      return <ContactUs />;
    }

    if (pathname === "/perfil" || pathname === "/profile") {
      return <ProfilePage />;
    }

    if (pathname === "/settings") {
      return <SettingsPage />;
    }

    if (pathname === "/alerts") {
      return <AlertsPage />;
    }

    if (PAGE_TITLES[pathname]) {
      return <PlaceholderPage title={PAGE_TITLES[pathname]} />;
    }

    // Ruta desconocida - redirigir a login
    return null;
  };

  // Si es ruta protegida, envolver en Layout
  if (isProtectedRoute) {
    const pageContent = resolvePage(location.pathname);
    
    // Si no hay contenido para esta ruta, redirigir a login
    if (!pageContent) {
      if (!isAuthenticated) {
        window.location.href = "/login";
        return null;
      }
    }
    
    return (
      <div className="flex flex-col min-h-screen bg-[#f7f7f7]">
        <Layout>
          {pageContent}
        </Layout>
        <Footer />
      </div>
    );
  }

  // Para otras rutas
  return (
    <div className="flex flex-col min-h-screen bg-[#f7f7f7]">
      <main className="flex-grow">{resolvePage(location.pathname)}</main>
      <Footer />
    </div>
  );
}

export default App;