import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

const VIEW_TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/dashboard": "Dashboard",
  "/users": "Usuarios",
  "/vehicle-management": "Gestion de vehiculos",
  "/history": "Historial",
  "/alerts": "Alertas",
  "/contact-us": "Contacto",
  "/settings": "Configuracion",
  "/perfil": "Perfil",
  "/profile": "Perfil",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  const viewTitle = VIEW_TITLES[window.location.pathname] ?? "Dashboard";

  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar />
      <SidebarInset>
        <div className="p-2 border border-green-800 flex items-center gap-2">
          <SidebarTrigger />
          {/* Nombre de la vista */}
          <h1 className="text-lg font-semibold">{viewTitle}</h1>
        </div>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
