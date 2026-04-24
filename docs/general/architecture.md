# Arquitectura del Proyecto SCAVI

## Diagrama General

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Navegador                                                                  │
│     │                                                                       │
│     │ HTTP :80                                                              │
│     v                                                                       │
│  Nginx (reverse proxy)                                                     │
│     ├─ /           → web:5173         (React + Vite)                        │
│     ├─ /api/       → api:8000         (Django + DRF)                         │
│     ├─ /admin/     → api:8000         (Django Admin)                       │
│     ├─ /ws/        → api:8000         (WebSockets)                          │
│     └─ /static/    → api:8000         (Static files)                        │
│        │                                                                       │
│        v                                                                       │
│  ┌────────────┬────────────┬────────────────┬──────────────┐                    │
│  │    api    │  trafico   │ infraestructura │     anpr     │                    │
│  │ (usuarios)│ (vehículos)│ (parqueos,     │ (detección    │                    │
│  │  auth)    │ (registros)│  cámaras)     │  OCR placas) │                    │
│  └────────────┴────────────┴────────────────┴──────────────┘                    │
│        │                                                                       │
│        v                                                                       │
│  PostgreSQL :5432                                                            │
│                                                                         │
│  ┌────────────────────────────────────────────────────────────┐             │
│  │ yolo-engine (procesamiento de stream de cámara con YOLO)        │             │
│  └────────────────────────────────────────────────────────────┘             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Servicios Docker

| Servicio | Puertos | Propósito |
|----------|--------|-----------|
| **db** | 5432 (interno) | PostgreSQL 15 |
| **redis** | 6379 (interno) | Redis (presente pero no usado en dev) |
| **api** | 8000 (localhost) | Django REST API + WebSockets |
| **yolo-engine** | - | Procesador de stream con YOLO |
| **web** | 5173 (localhost) | React frontend (Vite) |
| **nginx** | 80, 443 | Reverse proxy |

## Aplicaciones Django

### api - Autenticación y Usuarios
- **Modelos**: `Usuario` (user custom), `Rol`, `ConfiguracionYOLO`, `MetricaRendimiento`
- **Vistas**: CRUD usuarios, roles, configuración YOLO, métricas
- **Auth**: JWT en cookies httpOnly (access: 15min, refresh: 7 días)

### trafico - Gestión de Tráfico
- **Modelos**: `Vehiculo` (placa PK), `RegistroAcceso`, `TipoVehiculo`, `ColaProcesamiento`, `LogDeteccion`, `Alerta`, `Estadistica`
- **Vistas**: CRUD vehículos, registros de acceso, alertas, estadísticas

### infraestructura - Infraestructura
- **Modelos**: `Parqueo`, `Camara`
- **Vistas**: CRUD parqueos, cámaras

### anpr - Reconocimiento de Placas
- **Modelos**: `PlateDetection`
- **Servicios**: `plate_detector.py` (YOLOv8), `ocr_reader.py` (Pytesseract), `pipeline.py`
- **Endpoints**: `/api/anpr/detect/`, `/api/anpr/stats/`

## Modelos de Datos

```
Usuario ──► Rol
Parqueo ──► Camara ──► RegistroAcceso
Vehiculo (placa) ──► RegistroAcceso
RegistroAcceso ──► LogDeteccion
RegistroAcceso ──► Alerta
Alerta ──► Usuario (resuelta_por)
```

## Endpoints Principales

### Auth (`/api/auth/`)
- `POST /api/auth/login/` - Login
- `POST /api/auth/logout/` - Logout
- `POST /api/auth/refresh/` - Refresh token
- `GET /api/auth/me/` - Usuario actual

### Vehículos (`/api/`)
- `GET/POST /api/vehiculos/` - Listar/Crear vehículos
- `GET/POST /api/registros-accesos/` - Registros de acceso
- `GET/POST /api/alertas/` - Alertas
- `GET/POST /api/estadisticas/` - Estadísticas

### ANPR (`/api/anpr/`)
- `POST /api/anpr/detect/` - Detectar placas de imagen
- `GET /api/anpr/stats/` - Estadísticas de detección

### WebSocket
- `ws/` → `RealtimeConsumer`