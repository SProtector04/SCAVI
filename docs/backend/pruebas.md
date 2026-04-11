# Documentación de Pruebas - SCAVI Backend

## Resumen Ejecutivo

Este documento detalla el suite de pruebas automáticas para el módulo de autenticación y seguridad del proyecto SCAVI. Cubrimos JWT Authentication, Role-Based Access Control (RBAC), Device API Key Authentication y WebSocket Authentication.

## KPIs y Métricas de Pruebas

| KPI | Descripción | Target | Actual |
|-----|-------------|--------|--------|
| **Coverage** | Porcentaje de código cubierto por tests | ≥ 70% | TBD |
| **Pass Rate** | Porcentaje de tests que pasan | 100% | TBD |
| **Execution Time** | Tiempo de ejecución del suite | < 30s | TBD |
| **Flakiness** | Tasa de tests flaky (re-instabiles) | < 5% | TBD |

## Indicadores por Módulo

### 1. JWT Authentication (T1.x)

| Indicador | Descripción | Código |
|----------|------------|--------|
| `JWT-01` | Login retorna tokens en cookies httpOnly | `test_login_returns_jwt_tokens_in_cookies` |
| `JWT-02` | Request autenticada funciona con cookie JWT | `test_authenticated_request_works_with_jwt_cookie` |
| `JWT-03` | Request sin autenticar es rechazada (401) | `test_unauthenticated_request_is_rejected` |
| `JWT-04` | Token inválido es rechazado | `test_invalid_token_is_rejected` |
| `JWT-05` | Refresh token retorna nuevo access | `test_refresh_token_endpoint_returns_new_access` |
| `JWT-06` | Logout limpia cookies | `test_logout_clears_cookies` |

**Criterio de Éxito**: ≥ 6/6 tests pasando (100%)

### 2. RBAC Permissions (T3.x)

| Indicador | Descripción | Código |
|----------|------------|--------|
| `RBAC-01` | Admin puede leer usuarios | `test_admin_can_read_usuarios` |
| `RBAC-02` | Admin puede escribir usuarios | `test_admin_can_write_usuarios` |
| `RBAC-03` | Supervisor puede leer usuarios | `test_supervisor_can_read_usuarios` |
| `RBAC-04` | Supervisor NO puede escribir usuarios (403) | `test_supervisor_cannot_write_usuarios` |
| `RBAC-05` | Admin tiene acceso a todas las apps | `test_admin_can_access_all_apps` |
| `RBAC-06` | Supervisor tiene acceso a infraestructura | `test_supervisor_can_access_infraestructura` |
| `RBAC-07` | Supervisor tiene acceso a tráfico | `test_supervisor_can_access_trafico` |

**Criterio de Éxito**: ≥ 7/7 tests pasando (100%)

### 3. Device API Key (T4.x)

| Indicador | Descripción | Código |
|----------|------------|--------|
| `DEV-01` | Endpoint requiere X-Device-Key header | `test_device_ingest_requires_api_key` |
| `DEV-02` | API key válida es aceptada | `test_device_ingest_accepts_valid_api_key` |
| `DEV-03` | API key inválida es rechazada (401) | `test_device_ingest_rejects_invalid_api_key` |

**Criterio de Éxito**: ≥ 3/3 tests pasando (100%)

### 4. WebSocket Auth (T5.x)

| Indicador | Descripción | Código |
|----------|------------|--------|
| `WS-01` | CHANNEL_LAYERS configurado | `test_channels_layer_is_configured` |
| `WS-02` | WebSocket endpoint requiere auth | `test_websocket_endpoint_requires_auth` |

**Criterio de Éxito**: ≥ 2/2 tests pasando (100%)

### 5. Configuration (T0.x)

| Indicador | Descripción | Código |
|----------|------------|--------|
| `CFG-01` | AUTH_USER_MODEL = 'api.Usuario' | `test_auth_user_model_is_set` |
| `CFG-02` | DEFAULT_AUTHENTICATION_CLASSES configurado | `test_rest_framework_has_default_authentication` |
| `CFG-03` | DEFAULT_PERMISSION_CLASSES configurado | `test_rest_framework_has_default_permissions` |
| `CFG-04` | Default permission = IsAuthenticated | `test_rest_framework_default_permission_is_authenticated` |

**Criterio de Éxito**: ≥ 4/4 tests pasando (100%)

## Matriz de Cobertura

| Módulo | Archivos Cubiertos | Tests |
|--------|-------------------|-------|
| `api/authentication.py` | JWTCookieAuthentication, DeviceAPIKeyAuthentication | JWT: 6, DEV: 3 |
| `api/permissions.py` | IsSupervisorOrAdmin | RBAC: 7 |
| `api/views.py` | UsuarioViewSet, DeviceIngestView | JWT: 2, DEV: 2 |
| `api/auth_views.py` | login, logout, refresh | JWT: 4 |
| `core/settings/base.py` | CHANNEL_LAYERS, REST_FRAMEWORK | CFG: 4, WS: 1 |

## Ejecución de Pruebas

### Comando Local
```bash
cd backend
python manage.py test api.tests --verbosity=2
```

### Dentro de Docker
```bash
docker compose exec web python manage.py test api.tests --verbosity=2
```

### Generar Coverage
```bash
cd backend
coverage run --source='.' manage.py test api.tests
coverage report -m
```

## Interpretación de Resultados

### Verde (✅)
- Pass Rate ≥ 95%
- Todos los tests críticos pasando
- Execution Time < 30s

### Amarillo (⚠️)
- Pass Rate 80-94%
- Algún test no crítico fallando
- Execution Time 30-60s

### Rojo (❌)
- Pass Rate < 80%
- Tests críticos fallando
- Execution Time > 60s

## Plan de Mejora

1. **Corto plazo** (Sprint actual)
   - Agregar tests para edge cases de JWT
   - Agregar tests de integración con Docker

2. **Mediano plazo** (Próximos sprints)
   - Coverage ≥ 80%
   - Tests de stress para WebSockets
   - Tests de rate limiting

3. **Largo plazo** (Q3-Q4 2026)
   - QA automatizado en CI/CD
   - Performance benchmarks
   - Security penetration tests

## Dependencias de Testing

```
django>=4.2
djangorestframework>=3.14
djangorestframework-simplejwt>=5.3
channels>=4.0
channels-redis>=4.0
```

## Notas

- Los tests de WebSocket requieren herramientas especiales (pytest-asyncio, pytest-django)
- Los tests de Device API Key asumen que el modelo Device existe
- Los tests de JWT requieren que las URLs de auth estén configuradas en `api/urls.py`

## Historial de Ejecuciones

| Fecha | Pass Rate | Coverage | Execution Time | Status |
|-------|-----------|----------|----------------|--------|
| 2026-04-10 | TBD | TBD | TBD | ⏳ Pendiente |

---

*Documento generado automáticamente para auth-security-realtime change*
*Última actualización: 2026-04-10*