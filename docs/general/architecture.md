# Arquitectura (muy corta)

## Diagrama mental

```text
  Navegador
     |
     | HTTP :80
     v
   Nginx (reverse proxy)
     |\
     | \__ / (frontend)  -> web:5173 (Vite dev server)
     |____ /api/, /admin/ -> api:8000 (Django + DRF)
                         \
                          \-> Postgres (db:5432)
```

Evidencia:

1. Reverse proxy y rutas: `nginx.conf`.
2. Servicios y puertos: `docker-compose.yml` (`web:5173`, `api:8000`, `db:5432`, `nginx:80`).
3. API bajo `/api/`: `backend/core/urls.py`.

## Flujos típicos

1. UI registra vehículo:
   - Frontend: `frontend/src/components/FormLanding.tsx` -> POST `'/vehiculos/'` (base `'/api/'` en `frontend/src/api/axios.ts`).
   - Backend: `backend/api/urls.py` expone `/api/vehiculos/` (ViewSet `trafico.views.VehiculoViewSet`).

2. UI consulta historial:
   - Frontend: `frontend/src/pages/HistoryPage.tsx` -> GET `'/registros-accesos/'`.
   - Backend: `backend/api/urls.py` expone `/api/registros-accesos/`.
