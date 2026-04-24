# AGENTS.md - SCAVI Project

## Running the project

```bash
docker compose up --build
```

Services: `web:5173`, `api:8000`, `db:5432`, `nginx:80`, `redis:6379`, `yolo-engine`.

**Required**: `.env` with `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DEBUG`, `NODE_ENV`

## Key commands

- **Run single test**: `docker compose exec api python manage.py test api.tests.SomeTestCase.test_method --verbosity=2`
- **Backend migrations**: `docker compose exec api python manage.py makemigrations && python manage.py migrate`
- **Backend tests**: `docker compose exec api python manage.py test api.tests trafico.tests infraestructura.tests --verbosity=2`
- **Frontend lint**: `cd frontend && npm run lint`
- **Frontend typecheck**: `cd frontend && npx tsc --noEmit`
- **Frontend build**: `cd frontend && npm run build`
- **Integrity check**: `./verify_stack.sh`

## API structure

- Base URL: `/api/`
- JWT in httpOnly cookies (NOT Authorization headers)
- Custom user model: `api.Usuario`
- REST Framework: closed-by-default (all endpoints require authentication)
- 401 interceptor redirects to `/login` (except `/auth/me/`)

## Architecture

- Nginx: `/` → web, `/api/` + `/admin/` → api, `/ws/` → api
- WebSocket via Channels (InMemoryChannelLayer in dev)
- ANPR: YOLO detection + OCR in `backend/anpr/`, model at `/app/models/license_plate_detector.pt`
- `yolo-engine` service: runs camera stream processor

## Tech stack

- Backend: Django 5.2, DRF, PostgreSQL, Channels
- Frontend: React 19, Vite 7.3.1, TypeScript ~5.9.3, Tailwind CSS 3.4
- Docker multi-stage builds via `NODE_ENV`

## Important notes

- **Redis**: present but unused (dev uses InMemoryChannelLayer)
- **CORS**: requires `X-CSRFToken` header with credentials; CSRF cookie readable by JS
- **Language**: `LANGUAGE_CODE = 'es'`
- **JWT**: access lifetime 15 min, refresh 7 days
- **Dev ports**: `127.0.0.1:8000` (api), `127.0.0.1:5173` (web) - localhost only
- Django serves media at `/media/` (ANPR uploads), static at `/static/`

## Git workflow

- Branch naming: `feature/<name>`, `bugfix/<name>`, `hotfix/<name>`, `release/<version>`
- Base branch: `develop` for features, `main` for hotfixes
- Use Conventional Commits: `feat(area): message`, `fix(area): message`, etc.