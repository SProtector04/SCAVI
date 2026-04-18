# SCAVI Frontend

Sistema de Control de Acceso Vehicular Institucional - Frontend

## Tech Stack

- **Framework**: React 19 + Vite
- **Lenguaje**: TypeScript
- **Styling**: Tailwind CSS 3 + shadcn/ui
- **Icons**: Lucide React
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod

## Estructura de Proyecto

```
frontend/
├── src/
│   ├── api/            # Configuración de axios
│   ├── components/
│   │   ├── ui/         # Componentes shadcn/ui
│   │   ├── app-sidebar.tsx
│   │   ├── Footer.tsx
│   │   ├── InfoCard.tsx
│   │   └── FormLanding.tsx
│   ├── hooks/
│   ├── pages/
│   │   ├── DashboardPage.tsx
│   │   ├── HistoryPage.tsx
│   │   ├── UsersPage.tsx
│   │   ├── UsersMan.tsx
│   │   ├── VehicleMan.tsx
│   │   ├── SettingsPage.tsx
│   │   ├── AlertsPage.tsx
│   │   ├── ContactUs.tsx
│   │   ├── ProfilePage.tsx
│   │   └── Landing.tsx
│   ├── App.tsx         # Router principal
│   ├── main.tsx        # Entry point
│   └── index.css       # Tokens de diseño
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

## Rutas

| Ruta | Descripción |
|------|-------------|
| `/` | Landing page (público) |
| `/login` | Login de usuario |
| `/dashboard` | Dashboard con métricas |
| `/users` | Vista de usuarios |
| `/users-management` | CRUD usuarios (admin) |
| `/vehicle-management` | CRUD vehículos |
| `/history` | Historial de accesos |
| `/alerts` | Alertas del sistema |
| `/contact-us` | Contacto |
| `/settings` | Configuración (admin) |
| `/profile` | Perfil de usuario |

## Comandos

```bash
# Desarrollo
npm run dev

# Build producción
npm run build

# Lint
npm run lint

# TypeScript check
npx tsc --noEmit
```

## Integración con Backend

- API Base URL configurada en `vite.config.ts` via proxy `/api`
- Autenticación via JWT cookies (httpOnly)
- CSRFToken requerido en headers para requests con credenciales

## Dependencias Principales

- react-router-dom: Routing
- @radix-ui/*: Componentes base (select, switch, dialog, etc.)
- recharts: Gráficos
- react-hook-form + zod: Formularios
- lucide-react: Iconos