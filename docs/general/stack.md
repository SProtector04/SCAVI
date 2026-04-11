# Stack de SCAVI

Documento orientado a agentes/IA: describe el stack real del repo con evidencia (paths/strings) y cómo ubicar cambios típicos.

## Resumen del producto (qué hace SCAVI)

SCAVI es un **Sistema de Control de Acceso Vehicular Institucional** con foco en:

1. Registro y gestión de vehículos autorizados.
2. Monitoreo/historial de accesos (autorizado/denegado/desconocido).
3. Gestión de infraestructura (parqueos y cámaras) y usuarios.
4. Integración conceptual con reconocimiento de placas (mencionado como “YOLO/YOLOv8” en modelos).

Evidencia en el frontend:

1. Landing con el nombre y descripción del producto: `frontend/src/pages/Landing.tsx` contiene el header `SCAVI` y el título `Sistema de Control de Acceso Vehicular Institucional`, y menciona “reconocimiento de placas, monitoreo en tiempo real y gestión centralizada de usuarios.”
2. UI de historial consultando registros: `frontend/src/pages/HistoryPage.tsx` hace `api.get("/registros-accesos/")` y muestra estados `AUTORIZADO/DENEGADO/DESCONOCIDO`.
3. Registro de vehículos desde UI: `frontend/src/components/FormLanding.tsx` hace `api.post('/vehiculos/', payload)`.

Evidencia en el backend:

1. Endpoints REST por ViewSets (Django REST Framework): `backend/api/urls.py` registra `usuarios`, `parqueos`, `vehiculos`, `camaras`, `registros-accesos`.
2. Modelo de tráfico con campos de IA: `backend/trafico/models.py` incluye `placa_detectada_ia` (texto extraído por “YOLO”), `confianza_ia` (“YOLOv8”) e `imagen_evidencia`.

## Stack por capa

### Frontend (UI)

1. Framework: React + TypeScript + Vite.
   Evidencia: `frontend/package.json` (`react`, `react-dom`, `typescript`, `vite`) y `frontend/README.md`.
2. Styling: TailwindCSS.
   Evidencia: `frontend/package.json` (`tailwindcss`) y configs `frontend/tailwind.config.js`, `frontend/postcss.config.js`.
3. UI libs: Radix (vía `radix-ui`), shadcn, lucide-react.
   Evidencia: `frontend/package.json`.
4. HTTP client: Axios.
   Evidencia: `frontend/package.json` y `frontend/src/api/axios.ts`.
5. Config dev-proxy: Vite proxy de `/api` hacia el backend local.
   Evidencia: `frontend/vite.config.ts` (target `http://127.0.0.1:8000`).

Versiones (según `frontend/package.json`):

1. Node base image en Docker: `node:20-alpine` (`frontend/Dockerfile`).
2. React: `^19.2.0`.
3. Vite: `^7.3.1`.
4. TypeScript: `~5.9.3`.

### Backend (API)

1. Framework: Django + Django REST Framework.
   Evidencia: `backend/core/settings/base.py` incluye `rest_framework` en `INSTALLED_APPS` y `backend/api/views.py` usa `rest_framework.viewsets`.
2. CORS: `django-cors-headers`.
   Evidencia: `backend/core/settings/base.py` incluye `corsheaders` en `INSTALLED_APPS` y `corsheaders.middleware.CorsMiddleware`.
3. WSGI/ASGI:
   Evidencia: `backend/core/wsgi.py`, `backend/core/asgi.py`.

Versiones (según `backend/requirements.txt` y Dockerfiles):

1. Python base image: `python:3.11-slim` (`backend/Dockerfile`).
2. Dependencias relevantes (pinneadas):
   - `Django==6.0.3`
   - `djangorestframework==3.17.1`
   - `django-cors-headers==4.9.0`
   - `django-extensions==4.1`
   - `psycopg2-binary==2.9.11`
   Evidencia: `backend/requirements.txt`.

Nota: `backend/core/settings/base.py` y `production.py` declaran en el encabezado “Generated … using Django 5.2.11.” Esto NO coincide con `Django==6.0.3` en `requirements.txt`. Ver “Notas/Deuda”.

### DB (persistencia)

1. Motor: PostgreSQL.
   Evidencia: `docker-compose.yml` usa `postgres:15-alpine` y Django settings usan `django.db.backends.postgresql`.
2. Persistencia: volumen Docker `db_data`.
   Evidencia: `docker-compose.yml`.

### Reverse proxy

1. Nginx como reverse proxy.
   Evidencia: servicio `nginx` en `docker-compose.yml` y config en `nginx.conf`.
2. Rutas proxy:
   - `/` -> `http://web:5173`
   - `/api/` -> `http://api:8000`
   - `/admin/` -> `http://api:8000`
   Evidencia: `nginx.conf`.

### Orchestration

1. Docker Compose.
   Evidencia: `docker-compose.yml`.
2. Redes:
   - `frontend` (bridge)
   - `backend` (internal: true)
   Evidencia: `docker-compose.yml`.

## Estructura de carpetas (alto nivel)

1. `backend/`: proyecto Django.
   - `backend/core/`: proyecto Django (settings/urls/wsgi/asgi).
   - `backend/api/`: app de usuarios (modelo `Usuario` extendiendo `AbstractUser`).
   - `backend/infraestructura/`: app de infraestructura (parqueos y cámaras).
   - `backend/trafico/`: app de tráfico (vehículos y registros de acceso).
2. `frontend/`: SPA React + Vite.
   - `frontend/src/pages/`: páginas (Landing, Dashboard, Historial, etc.).
   - `frontend/src/components/`: componentes reutilizables y layout.
   - `frontend/src/api/`: client HTTP (`axios.ts`).
3. `docs/`:
   - `docs/backend/`: diagramas (`diagrama_api.png`, `diagrama_db.png`, etc.).
   - `docs/general/`: docs generales (este archivo, `conventions.md`, etc.).
4. `nginx.conf`: reverse proxy para el stack local en Compose.
5. `docker-compose.yml`: orquestación local.

## Docker Compose: servicios, puertos, redes, volúmenes, arranque

Fuente: `docker-compose.yml`.

### `api`

1. Build: `backend/Dockerfile`, target `${NODE_ENV:-development}`.
2. Imagen: `proweb-api:${APP_VERSION:-latest}`.
3. Puertos: `127.0.0.1:8000:8000`.
4. Volúmenes:
   - `./backend:/app`.
5. Redes: `frontend`, `backend`.
6. Dependencia: `db` (healthcheck).
7. Comando (dev): corre migraciones en cada arranque y levanta `runserver`:
   - `python manage.py makemigrations`
   - `python manage.py migrate`
   - `python manage.py runserver 0.0.0.0:8000`

### `web`

1. Build: `frontend/Dockerfile`, target `${NODE_ENV:-development}`.
2. Imagen: `proweb-web:${APP_VERSION:-latest}`.
3. Puertos: `127.0.0.1:5173:5173`.
4. Volúmenes:
   - `./frontend:/app`
   - `/app/node_modules` (volume anónimo para no pisar `node_modules`).
5. Redes: `frontend`.
6. Depends on: `api`.

### `db`

1. Imagen: `postgres:15-alpine`.
2. Volúmenes:
   - `db_data:/var/lib/postgresql/data`.
3. Redes: `backend`.
4. Variables (desde `.env`):
   - `POSTGRES_USER: ${DB_USER}`
   - `POSTGRES_PASSWORD: ${DB_PASSWORD}`
   - `POSTGRES_DB: ${DB_NAME}`

### `nginx`

1. Imagen: `nginx:alpine`.
2. Puertos: `80:80` (host -> contenedor).
3. Volúmenes:
   - `./nginx.conf:/etc/nginx/conf.d/default.conf:ro`.
4. Redes: `frontend`.

## Config clave

### Nginx

1. Proxy de frontend y API: `nginx.conf`.
2. Static: `nginx.conf` tiene `location /static/ { alias /app/static/; }`.
   - En Compose no hay un volumen montado que exponga `/app/static/` dentro del contenedor `nginx`. Esto probablemente NO funcione tal cual (ver “Notas/Deuda”).

### Django settings

1. Módulo de settings por defecto:
   - `DJANGO_SETTINGS_MODULE` default: `core.settings.base`.
   Evidencia: `backend/manage.py`, `backend/core/wsgi.py`, `backend/core/asgi.py`.
2. Apps instaladas:
   - `rest_framework`, `corsheaders`, `django_extensions`, `api`, `infraestructura`, `trafico`.
   Evidencia: `backend/core/settings/base.py`.
3. DB settings (Postgres en Compose):
   - `DB_NAME`, `DB_USER`, `DB_PASSWORD` desde env.
   - `HOST` fijo: `db`.
   Evidencia: `backend/core/settings/base.py`.

### Endpoints principales (API)

Base URL:

1. En backend: `backend/core/urls.py` monta la API bajo `/api/`.
2. En frontend: `frontend/src/api/axios.ts` usa `VITE_API_URL || '/api/'`.

Rutas DRF (todas bajo `/api/`):

1. `/api/usuarios/` (ViewSet `UsuarioViewSet`).
2. `/api/parqueos/` (ViewSet `ParqueoViewSet`).
3. `/api/vehiculos/` (ViewSet `VehiculoViewSet`).
4. `/api/camaras/` (ViewSet `CamaraViewSet`).
5. `/api/registros-accesos/` (ViewSet `RegistroAccesoViewSet`).

Evidencia: `backend/api/urls.py`.

Admin:

1. `/admin/` (y también proxied por Nginx).
   Evidencia: `backend/core/urls.py`, `nginx.conf`.

## Cómo correr local

### Con Docker Compose (recomendado por el repo)

1. Crear `.env` en la raíz (ver “Variables de entorno esperadas”).
2. Levantar:

```bash
docker compose up --build
```

URLs típicas (según `docker-compose.yml` y `nginx.conf`):

1. Reverse proxy: `http://localhost/` (frontend) y `http://localhost/api/` (API), `http://localhost/admin/`.
2. Acceso directo (dev): `http://127.0.0.1:5173` (Vite) y `http://127.0.0.1:8000` (Django).

### Sin Docker (pistas)

Backend (Django):

```bash
python -m venv .venv
pip install -r backend/requirements.txt
set DJANGO_SETTINGS_MODULE=core.settings.base
python backend/manage.py migrate
python backend/manage.py runserver 127.0.0.1:8000
```

Notas:

1. La DB por defecto en settings apunta a `HOST='db'` (servicio de Compose). Fuera de Compose, habría que ajustar `DB_HOST` (no existe en settings actuales) o modificar `HOST` a `localhost` temporalmente.

Frontend (Vite):

```bash
cd frontend
npm install
npm run dev
```

Notas:

1. `frontend/vite.config.ts` proxya `/api` a `http://127.0.0.1:8000`.
2. `frontend/src/api/axios.ts` permite configurar `VITE_API_URL` para apuntar a otro backend.

## Variables de entorno esperadas (inferidas)

No hay `.env` versionado (está ignorado por `.gitignore`), pero se infieren nombres por uso en Compose/settings.

Backend/DB (usadas en Compose y Django settings):

1. `DB_USER` (también `POSTGRES_USER`).
2. `DB_PASSWORD` (también `POSTGRES_PASSWORD`).
3. `DB_NAME` (también `POSTGRES_DB`).
4. `SECRET_KEY` (Django).
5. `DEBUG` (Django; se usa como string en settings).

Frontend:

1. `VITE_API_URL` (baseURL de Axios: `frontend/src/api/axios.ts`).

Compose/build:

1. `NODE_ENV` (selecciona target de build en `backend/Dockerfile` y `frontend/Dockerfile` vía `docker-compose.yml`).
2. `APP_VERSION` (tag de imagen: `docker-compose.yml`).

## Para agentes/IA: checklist de cambios típicos

UI (pantallas/componentes):

1. Páginas: `frontend/src/pages/*`.
2. Layout y navegación: `frontend/src/components/layout.tsx`, `frontend/src/components/app-sidebar.tsx`.
3. Client API y endpoints usados por la UI: `frontend/src/api/axios.ts` y los `api.get/post` en `frontend/src/**/*`.
4. Estilos: Tailwind config (`frontend/tailwind.config.js`) y clases en componentes.

API (endpoints/serialización):

1. Ruteo principal: `backend/core/urls.py` y `backend/api/urls.py`.
2. ViewSets: `backend/*/views.py`.
3. Serializers: `backend/*/serializers.py`.

Modelos y DB:

1. Modelos: `backend/*/models.py`.
2. Migraciones: `backend/*/migrations/*.py`.
3. Admin Django: `backend/*/admin.py`.

Infra/Compose/Nginx:

1. Servicios/puertos/volúmenes: `docker-compose.yml`.
2. Reverse proxy: `nginx.conf`.
3. Imágenes/build targets: `backend/Dockerfile`, `frontend/Dockerfile`.

## Notas/Deuda (incongruencias y puntos a verificar)

1. Nombre del proyecto en Compose: `docker-compose.yml` declara `name: Proyecto Final ProWeb`, pero el producto se presenta como `SCAVI` en UI (`frontend/src/pages/Landing.tsx`).
2. Documentación incongruente en el repo: `docs/general/conventions.md` habla de “Ambrossia” y menciona “Next.js”, pero el frontend real es Vite/React (`frontend/package.json`) y el producto se presenta como SCAVI.
3. Inconsistencia de versión de Django:
   - Settings dicen “Generated … using Django 5.2.11” (`backend/core/settings/base.py`).
   - `backend/requirements.txt` pinnea `Django==6.0.3`.
4. `backend/requirements.txt` parece estar en un encoding inusual (UTF-16 LE con BOM `0xFF 0xFE`, se ven caracteres NUL al imprimirlo). Esto puede romper tooling en Windows/CI si asume UTF-8.
5. Seguridad: `SECRET_KEY` tiene un valor default hardcodeado en settings (`backend/core/settings/base.py`). En producción esto debería venir por env sí o sí.
6. `DEBUG` se lee como string (`os.environ.get('DEBUG', 'True')`) sin parsear a boolean; puede haber comportamiento inesperado según cómo se setee.
7. `ALLOWED_HOSTS` en `production.py` incluye un string que parece un URL (YouTube). Probablemente es placeholder.
8. Static con Nginx: `nginx.conf` hace `alias /app/static/`, pero el contenedor `nginx` no monta `/app` desde el backend. Además `backend/core/settings/base.py` no define `STATIC_ROOT` y `backend/Dockerfile` (target `production`) ejecuta `collectstatic`, que típicamente requiere `STATIC_ROOT`. Si se quiere servir `static/`, hay que:
   - Montar un volumen compartido con `collectstatic`, o
   - Servir static desde Django/Gunicorn (no recomendado), o
   - Usar otro approach (CDN / object storage).
9. `package.json` en raíz contiene deps (`react-router-dom`, `tailwindcss`, etc.) pero el build real del frontend usa `frontend/package.json`. Puede ser un remanente.
10. Frontend routing: hay `react-router-dom` en `package.json` raíz, pero el `frontend/src/App.tsx` resuelve páginas con `window.location.pathname` (no se ve uso de React Router). Si se quiere routing real, habrá que decidir estrategia.
11. Compose arranca el backend con `makemigrations` en cada `up` (`docker-compose.yml`). Eso puede generar migraciones “accidentales” en entornos compartidos si alguien cambió modelos localmente.
12. Usuario custom: existe `backend/api/models.py` con `Usuario(AbstractUser)`, pero no se ve `AUTH_USER_MODEL` en settings (no está en `backend/core/settings/base.py`). Si se usa este modelo, Django debería configurarlo antes de migrar.
