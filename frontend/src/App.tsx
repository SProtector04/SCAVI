// src/App.tsx
import Footer from "./components/Footer";
import DashboardPage from "./pages/DashboardPage";
import Layout from "./components/layout";
import ProfilePage from "./pages/ProfilePage";

const PAGE_TITLES: Record<string, string> = {
  "/users": "Usuarios",
  "/users-management": "Gestion de usuarios",
  "/vehicle-management": "Gestion de vehiculos",
  "/history": "Historial",
  "/contact-us": "Contacto",
  "/settings": "Configuracion",
};

function PlaceholderPage({ title }: { title: string }) {
  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-2xl font-bold text-slate-800">{title}</h1>
        <p className="mt-2 text-slate-600">
          Esta seccion esta lista para conectar su contenido definitivo.
        </p>
      </div>
    </Layout>
  );
}

function resolvePage(pathname: string) {
  if (pathname === "/" || pathname === "/dashboard") {
    return <DashboardPage />;
  }

  if (pathname === "/perfil" || pathname === "/profile") {
    return <ProfilePage />;
  }

  if (PAGE_TITLES[pathname]) {
    return <PlaceholderPage title={PAGE_TITLES[pathname]} />;
  }

  return <DashboardPage />;
}

function App() {
  const currentPath = window.location.pathname;

  return (
    <div className="flex flex-col min-h-screen bg-[#f7f7f7]">
      <main className="flex-grow">{resolvePage(currentPath)}</main>
      <Footer />
    </div>
  );
}

export default App;
