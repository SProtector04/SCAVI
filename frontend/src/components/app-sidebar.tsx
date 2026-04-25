import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  Users,
  Car,
  History as HistoryIcon,
  LogOut,
  User,
  Bell,
  Camera,
} from "lucide-react";

const navigationItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Usuarios",
    url: "/users",
    icon: Users,
  },
  {
    title: "Gestion de vehiculos",
    url: "/vehicle-management",
    icon: Car,
  },
  {
    title: "Historial",
    url: "/history",
    icon: HistoryIcon,
  },
  {
    title: "Alertas",
    url: "/alerts",
    icon: Bell,
  },
  {
    title: "Cámara ANPR",
    url: "/camera",
    icon: Camera,
  },
];

export function AppSidebar() {
  const { setOpen, setOpenMobile } = useSidebar();

  const handleNavigate = () => {
    setOpen(false);
    setOpenMobile(false);
  };

  // Leer usuario desde localStorage en cada renderizado (react-friendly)
  let userRol: string | null = null;
  try {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      userRol = user.rol || null;
    }
  } catch {
    userRol = null;
  }

  // Filtrar items según el rol dinámicamente
  const filteredNavigationItems =
    userRol === "ADMIN" ? navigationItems : navigationItems.filter((item) => item.title !== "Usuarios");

  return (
    <Sidebar className="bg-white">
      <SidebarHeader className="border-b pb-4">
        <div className="flex items-center gap-2 px-2">
          <div className=" flex h-8 w-8 items-center justify-center rounded-lg bg-green-800 text-primary-foreground font-bold">
            <Car className="h-5 w-5 inline-block " />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">SCAVI</span>
            <span className="text-xs text-muted-foreground">
              Team DigitalOne
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navegacion</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Tarea 1.3: Mapear filteredNavigationItems en lugar de navigationItems */}
              {filteredNavigationItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild>
                    <a
                      href={item.url}
                      className="flex items-center gap-3"
                      onClick={handleNavigate}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        
      </SidebarContent>

      <SidebarFooter className="border-t pt-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <a
                href="/perfil"
                className="flex items-center gap-3 w-full justify-start"
                onClick={handleNavigate}
              >
                <User className="h-4 w-4" />
                <span>Perfil</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild>
              <button 
                onClick={() => window.logout?.()}
                className="flex items-center gap-3 w-full justify-start text-red-600 hover:text-red-700"
              >
                <LogOut className="h-4 w-4" />
                <span>Cerrar sesion</span>
              </button>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
