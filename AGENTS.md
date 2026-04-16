# AGENTS.md - SCAVI Project

## Running the project

```bash
cd SCAVI
docker compose up --build
```

Services: `web:5173` (frontend), `api:8000` (Django), `db:5432` (PostgreSQL), `nginx:80`.

## Key commands

- **Backend migrations**: Auto-run on container start (in docker-compose command). Manual: `docker exec <container> python manage.py makemigrations && python manage.py migrate`
- **Frontend build**: `cd frontend && npm run build`
- **Frontend lint**: `cd frontend && npm run lint`

## API structure

- Base URL: `/api/`
- JWT in httpOnly cookies (not Authorization headers)
- 401 interceptor redirects to `/login` (except on `/auth/me/`)
- Custom user model: `api.Usuario`
- REST Framework: closed-by-default (all endpoints require authentication)

## Architecture

- Nginx reverse proxy routes `/` to frontend, `/api/` and `/admin/` to Django
- WebSocket via Channels (InMemoryChannelLayer in dev, not Redis)
- ANPR module: YOLO detection + OCR in `backend/anpr/`

## Tech stack

- Backend: Django 5.2, DRF, PostgreSQL, Channels (no Redis in dev)
- Frontend: React 19, Vite, TypeScript, Tailwind CSS 3
- Docker multi-stage builds (dev/prod targets via `NODE_ENV`)

## Important notes

- No Redis in docker-compose - CHANNEL_LAYERS uses InMemoryChannelLayer
- CORS requires `X-CSRFToken` header on requests with credentials
- CSRF cookie is readable by JS (`CSRF_COOKIE_HTTPONLY = False`)
- Language setting: `es-ni` (not standard es/)