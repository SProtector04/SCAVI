// src/App.tsx
import Footer from "./components/Footer";
import DashboardPage from "./pages/DashboardPage";
import ProfilePage from "./pages/ProfilePage";
import UsersPage from "./pages/UsersPage";
import UsersMan from "./pages/UsersMan";
import VehicleMan from "./pages/VehicleMan";
import History from "./pages/History";
import ContactUs from "./pages/ContactUs";

function resolvePage(pathname: string) {
  if (pathname === "/" || pathname === "/dashboard") {
    return <DashboardPage />;
  }

  if (pathname === "/perfil" || pathname === "/profile") {
    return <ProfilePage />;
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
    return <History />;
  }

  if (pathname === "/contact-us") {
    return <ContactUs />;
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
