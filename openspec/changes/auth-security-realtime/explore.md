# Explore: auth-security-realtime

## Alcance de esta exploracion

- Auth actual (model usuario, endpoints DRF, settings)
- URLs / rutas expuestas
- ASGI/WSGI y despliegue (gunicorn/nginx)
- Campos de roles / permisos
- Estado de Channels/Redis/WebSockets

## Evidencia (paths y snippets)

### User model / roles

- `backend/api/models.py`:

```py
class Usuario(AbstractUser):
    ROLES = (
        ('ADMIN', 'Administrador'),
        ('SUPERVISOR', 'Supervisor'),
    )
    rol = models.CharField(max_length=20, choices=ROLES, default='SUPERVISOR')
```

Observaciones:

- Los roles existen como campo `rol` con choices `ADMIN` / `SUPERVISOR`. No coincide con los nombres de negocio mencionados ("Administrador de Servicios Generales", "Supervisor").
- No se encontro `AUTH_USER_MODEL = ...` en settings (ver busqueda global `AUTH_USER_MODEL` sin matches en `backend/`). Esto implica que Django seguiria usando el `auth.User` por default, y el modelo `api.Usuario` no estaria activo como user model para login/auth.

### Migraciones del app `api` (inconsistencia con el modelo actual)

- `backend/api/migrations/0001_initial.py` crea un `Usuario` NO-auth:

```py
migrations.CreateModel(
    name='Usuario',
    fields=[
        ('id', ...),
        ('nombre', models.CharField(max_length=100)),
        ('apellidos', models.CharField(max_length=100)),
        ('telefono', models.CharField(max_length=15)),
        ('fecha_registro', models.DateTimeField(auto_now_add=True)),
    ],
)
```

- El `backend/api/models.py` actual define `Usuario(AbstractUser)` con `username/password/...` heredados, no con esos campos.

Riesgo:

- Hay un desfasaje fuerte entre migraciones y el codigo actual del modelo. Si la DB se migro desde esas migraciones, el schema real puede no soportar el modelo actual; o bien hubo cambios fuera de migraciones.

### DRF / permisos / autenticacion

- No se encontraron settings DRF (`REST_FRAMEWORK`, `DEFAULT_AUTHENTICATION_CLASSES`, `DEFAULT_PERMISSION_CLASSES`) en `backend/` (busqueda global sin matches).

- ViewSets no definen `permission_classes` ni `authentication_classes`.

Ejemplo `backend/api/views.py`:

```py
class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer
    #permission_classes = [permissions.AllowAny]
```

Ejemplo `backend/trafico/views.py` / `backend/infraestructura/views.py`:

```py
class VehiculoViewSet(viewsets.ModelViewSet):
    queryset = Vehiculo.objects.all()
    serializer_class = VehiculoSerializer
```

Impacto:

- Si no hay `DEFAULT_PERMISSION_CLASSES`, DRF usa `AllowAny` por default: la API queda abierta.

### Serializers (exposicion de campos sensibles)

- `backend/api/serializers.py`:

```py
class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = '__all__'
```

Riesgo:

- `fields='__all__'` en un `AbstractUser` tiende a exponer campos sensibles (p.ej. `password`, `is_superuser`, `is_staff`, `groups`, `user_permissions`, etc.) si el modelo realmente se usa.

### URLs expuestas

- `backend/core/urls.py` expone `/api/`:

```py
urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
]
```

- `backend/api/urls.py` registra routers CRUD publicos:

```py
router.register(r'usuarios', UsuarioViewSet, basename='usuario')
router.register(r'parqueos', ParqueoViewSet, basename='parqueo')
router.register(r'vehiculos', VehiculoViewSet, basename='vehiculo')
router.register(r'camaras', CamaraViewSet, basename='camara')
router.register(r'registros-accesos', RegistroAccesoViewSet, basename='registro_acceso')
```

Impacto:

- Hay endpoints CRUD para usuarios y dominios; sin auth/perms configurados, quedan accesibles.

### ASGI/WSGI y estado de WebSockets

- `backend/core/asgi.py` es el ASGI default de Django, sin `channels`:

```py
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.base')
application = get_asgi_application()
```

- `backend/core/wsgi.py` idem.

- No se encontraron referencias a `channels`, `CHANNEL_LAYERS`, `ASGI_APPLICATION`, `ProtocolTypeRouter`, `AuthMiddlewareStack`, `URLRouter` en `backend/` (busquedas globales sin matches).

Conclusiones:

- No hay soporte actual para WebSockets (Django Channels) en el backend.
- El `backend/Dockerfile` corre `gunicorn ... core.wsgi:application` (WSGI), lo cual NO soporta WebSockets.

### Nginx proxy (sin upgrade websocket)

- `nginx.conf` proxyea `/` y `/api/` pero no tiene headers de websocket (`Upgrade`/`Connection`) ni location WS dedicado:

```nginx
location /api/ {
    proxy_pass http://api:8000;
}
```

Riesgo:

- Aunque se agregue Channels, el proxy actual no esta preparado para WebSockets.

### CORS/CSRF y cookies

- `backend/core/settings/base.py` define CORS basico:

```py
CORS_ALLOWED_ORIGINS = [
    "http://localhost:5173",
]
...
'corsheaders.middleware.CorsMiddleware',
'django.middleware.csrf.CsrfViewMiddleware',
```

- No se encontraron settings como `CORS_ALLOW_CREDENTIALS`, `CSRF_TRUSTED_ORIGINS`, `CSRF_COOKIE_SAMESITE`, `SESSION_COOKIE_SAMESITE`, `CSRF_COOKIE_SECURE`, `SESSION_COOKIE_SECURE`.

Gotcha:

- JWT en cookie `httpOnly` normalmente requiere `CORS_ALLOW_CREDENTIALS=True` (si el frontend esta en otro origin) y politica coherente de `SameSite`/`Secure`. Si se combina con CSRF, hay que definir estrategia (double submit, CSRF token, etc.).

### Dependencias (Channels/Redis ausentes)

- `backend/requirements.txt` (contenido visible via lectura, pero el archivo parece estar en encoding tipo UTF-16/"binary" por los null-bytes): contiene `Django==6.0.3`, `djangorestframework==3.17.1`, `django-cors-headers==4.9.0`.
- No aparecen `channels`, `channels-redis`, `redis`.

Riesgo:

- El encoding actual de `backend/requirements.txt` es un posible problema (lecturas fallan como binario; al imprimir aparecen caracteres NUL intercalados). Esto puede romper tooling y/o `pip install -r` segun el entorno.

## Gaps contra el change solicitado

- No hay JWT (ni SimpleJWT) ni endpoints de login/refresh/logout.
- No hay “closed by default”: por default la API DRF parece abierta.
- Hay un CRUD de `/api/usuarios/` expuesto sin permisos (equivale a registro/administracion abierta).
- Roles existen como campo, pero no hay permisos/guards basados en `rol`.
- No hay Channels/Redis/ASGI routing para realtime.
- No existe endpoint de ingestion autenticado (API key o system user) identificado en el codebase actual.

## Riesgos/Gotchas a tener en cuenta (para implementacion posterior)

- Cookie JWT + CORS/CSRF: definir `SameSite` (Lax/None), `Secure` (prod), `CORS_ALLOW_CREDENTIALS`, `CSRF_TRUSTED_ORIGINS`.
- Si se usa refresh token en cookie: invalidacion/rotacion y logout.
- Channels requiere ASGI server (daphne/uvicorn) y `CHANNEL_LAYERS` con Redis; gunicorn WSGI no sirve.
- Nginx requiere proxy websocket (`proxy_http_version 1.1`, `Upgrade`, `Connection`, timeouts).
- Inconsistencia modelo/migraciones: antes de construir auth fuerte, hay que alinear `AUTH_USER_MODEL`, migraciones y DB real.
