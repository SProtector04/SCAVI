# AGENTS.md - SCAVI Project

## Running the project

```bash
docker compose up --build
```

Services: `web:5173` (frontend), `api:8000` (Django), `db:5432` (PostgreSQL), `nginx:80`, `redis:6379`, `yolo-engine`.

**Required env file**: `.env` defines `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DEBUG`, `NODE_ENV`.

## Key commands

- **Backend migrations**: Auto-run on container start. Manual: `docker compose exec api python manage.py makemigrations && python manage.py migrate`
- **Backend tests**: `docker compose exec api python manage.py test api.tests trafico.tests infraestructura.tests --verbosity=2`
- **Integrity check**: `./verify_stack.sh` (Linux/Mac) or PowerShell equivalent
- **Frontend build**: `cd frontend && npm run build`
- **Frontend lint**: `cd frontend && npm run lint`
- **Frontend typecheck**: `cd frontend && npx tsc --noEmit`

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
- Django settings: `backend/core/settings/base.py`

## Tech stack

- Backend: Django 5.2, DRF, PostgreSQL, Channels
- Frontend: React 19, Vite, TypeScript, Tailwind CSS 3
- Docker multi-stage builds (dev/prod targets via `NODE_ENV`)

## Important notes

- **Redis**: Present in compose but unused (dev uses InMemoryChannelLayer)
- **CORS**: Requires `X-CSRFToken` header on requests with credentials; CSRF cookie readable by JS
- **Language**: `LANGUAGE_CODE = 'es'`
- **JWT**: Tokens in httpOnly cookies; access lifetime 15 minutes, refresh 7 days
- **Static/Media**: Django serves media at `/media/` (ANPR uploads); static at `/static/`
- **ANPR model**: Points to `/app/models/license_plate_detector.pt`