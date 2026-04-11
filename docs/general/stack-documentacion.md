# Documentación del stack: Base de datos, Lógica de negocio y Permisos

Ruta del archivo: `docs/general/stack-documentacion.md`

---

## 1) BASE DE DATOS

Resumen de los modelos encontrados y sus campos/relaciones.

- `backend/api/models.py`
  - Modelo: `Usuario` (extiende `AbstractUser`)
    - Campos relevantes:
      - `rol` : CharField(max_length=20, choices=(('ADMIN','Administrador'),('SUPERVISOR','Supervisor')), default='SUPERVISOR')
    - Código relevante:

```py
class Usuario(AbstractUser):
    ROLES = (
        ('ADMIN', 'Administrador'),
        ('SUPERVISOR', 'Supervisor'),
    )
    rol = models.CharField(max_length=20, choices=ROLES, default='SUPERVISOR')

    def __str__(self):
        return f"{self.username} - {self.rol}"
```

- `backend/infraestructura/models.py`
  - Modelo: `Parqueo`
    - `nombre`: CharField(max_length=100)
    - `capacidad_maxima`: IntegerField()
    - `plano_svg_url`: URLField(blank=True, null=True)
  - Modelo: `Camara`
    - `parqueo`: ForeignKey(Parqueo, related_name='camaras', on_delete=CASCADE)
    - `nombre`: CharField(max_length=100)
    - `identificador_svg`: CharField(max_length=100, unique=True)
    - `url_stream`: CharField(max_length=255)
    - `estado`: CharField(choices=..., default='ACTIVA')
  - Código relevante (extracto):

```py
class Camara(models.Model):
    parqueo = models.ForeignKey(Parqueo, related_name='camaras', on_delete=models.CASCADE)
    identificador_svg = models.CharField(max_length=100, unique=True, help_text="ID del elemento en el SVG de React")
    url_stream = models.CharField(max_length=255, help_text="URL HLS, DASH o WebRTC")
```

- `backend/trafico/models.py`
  - Modelo: `Vehiculo`
    - `placa`: CharField(max_length=15, primary_key=True)
    - `tipo`: CharField(choices=..., max_length=20)
  - Modelo: `RegistroAcceso`
    - `placa_detectada_ia`: CharField(max_length=20)
    - `vehiculo`: ForeignKey(Vehiculo, on_delete=CASCADE, null=True, blank=True)
    - `camara`: ForeignKey('infraestructura.Camara', on_delete=SET_NULL, null=True)
    - `fecha_hora`: DateTimeField(auto_now_add=True)
    - `estado_acceso`: CharField(choices=..., default='DENEGADO')
    - `confianza_ia`: FloatField(null=True, blank=True)
    - `imagen_evidencia`: ImageField(upload_to='evidencia_placas/', null=True, blank=True)

  - Código relevante (extracto):

```py
class Vehiculo(models.Model):
    placa = models.CharField(max_length=15, primary_key=True)

class RegistroAcceso(models.Model):
    placa_detectada_ia = models.CharField(max_length=20)
    vehiculo = models.ForeignKey(Vehiculo, on_delete=models.CASCADE, null=True, blank=True)
    camara = models.ForeignKey('infraestructura.Camara', on_delete=models.SET_NULL, null=True)
    imagen_evidencia = models.ImageField(upload_to='evidencia_placas/', null=True, blank=True)
```

- `backend/anpr/models.py`
  - Modelo: `PlateDetection`
    - `imagen`: ImageField(upload_to='anpr/%Y/%m/%d/', blank=True, null=True)
    - `placa_texto`: CharField(max_length=20, blank=True)
    - `confidence`: FloatField(default=0.0)
    - `device_id`: CharField(max_length=100, blank=True)
    - `is_active`: BooleanField(default=True)
    - `created_at`: DateTimeField(auto_now_add=True)

### Restricciones y reglas encontradas

- Claves primarias
  - `Vehiculo.placa` está definido como primary_key (no id auto).

- Unicidades
  - `Camara.identificador_svg` tiene `unique=True`.

- Relaciones y `on_delete`
  - `Camara.parqueo` → CASCADE (si se borra un Parqueo, se borran sus Camaras).
  - `RegistroAcceso.vehiculo` → CASCADE (si se borra un Vehiculo, se borran registros asociados).
  - `RegistroAcceso.camara` → SET_NULL (si se borra la Camara, se mantiene el registro con `camara=null`).

### Estado de migraciones (archivos en el repo)

- `backend/infraestructura/migrations/0001_initial.py` — crea `Parqueo` y `Camara` (initial)
- `backend/trafico/migrations/0001_initial.py` — crea `Vehiculo` y `RegistroAcceso` (initial)
- `backend/api/migrations/__init__.py` — presente pero sin migraciones generadas en repo

Nota: Desde el repositorio puedo listar los archivos de migraciones, pero NO puedo saber si están aplicadas en la base de datos (no ejecutar comandos). Para chequear estado real ejecutar en entorno:

  - `python manage.py showmigrations`  (o `python manage.py migrate --plan`)

---

## 2) LÓGICA DE NEGOCIOS (Endpoints, Serializers, Consumers, Routes)

Rutas y mapeos principales (archivo: `backend/api/urls.py`)

Extracto del router y endpoints registrados:

```py
router.register(r'usuarios', UsuarioViewSet, basename='usuario')
router.register(r'parqueos', ParqueoViewSet, basename='parqueo')
router.register(r'vehiculos', VehiculoViewSet, basename='vehiculo')
router.register(r'camaras', CamaraViewSet, basename='camara')
router.register(r'registros-accesos', RegistroAccesoViewSet, basename='registro_acceso')

path('auth/', include(auth_patterns)),
path('device/', include(device_patterns)),
path('anpr/', include(anpr_patterns)),
```

- Endpoints de autenticación (`backend/api/auth_views.py`)
  - `POST /api/auth/login/` → `LoginView` : valida username/password con `authenticate()` y setea cookies httpOnly (`access_token`, `refresh_token`) usando `rest_framework_simplejwt.tokens.RefreshToken`.
  - `POST /api/auth/logout/` → `LogoutView` : borra las cookies JWT.
  - `POST /api/auth/refresh/` → `RefreshView` : toma `refresh_token` desde la cookie y emite nuevo access token en cookie.
  - `GET /api/auth/me/` → `CurrentUserView` : devuelve datos básicos del usuario autenticado (id, username, email, first_name, last_name, rol, is_active).

  Fragmentos clave (cfg de cookies):

```py
def set_jwt_cookies(response, access_token, refresh_token):
    is_prod = os.environ.get('DEBUG', 'True') == 'False'
    cookie_settings = {
        'httponly': True,
        'secure': is_prod,
        'samesite': 'None' if is_prod else 'Lax',
        'path': '/',
    }
    response.set_cookie('access_token', str(access_token), **cookie_settings)
    response.set_cookie('refresh_token', str(refresh_token), **cookie_settings)
```

- Endpoints específicos
  - `POST /api/device/ingest/` → `DeviceIngestView` en `backend/api/views.py`.
    - Usa autenticación por header `X-Device-Key` (validación delegada a `DeviceAPIKeyAuthentication`).
    - Está decorado con `@csrf_exempt` ya que usa header en vez de cookie.
    - Código relevante (extracto):

```py
class DeviceIngestView(views.APIView):
    permission_classes = []  # Custom auth in authenticate method
    def post(self, request):
        api_key = request.META.get('HTTP_X_DEVICE_KEY')
        from .authentication import DeviceAPIKeyAuthentication
        auth = DeviceAPIKeyAuthentication()
        result = auth.authenticate(request)
        if result is None:
            return Response({'error': 'Invalid API key'}, status=status.HTTP_401_UNAUTHORIZED)

        device, _ = result
        data = request.data
        return Response({'status': 'received', 'device': device.username}, status=status.HTTP_201_CREATED)
```

- Serializers (`backend/api/serializers.py`)
  - `UsuarioSerializer` (ModelSerializer)
    - Excluye campos sensibles: `password`, `is_superuser`, `is_staff`, `groups`, `user_permissions`.
    - Código relevante:

```py
class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        exclude = ('password', 'is_superuser', 'is_staff', 'groups', 'user_permissions')
```

- Consumers (WebSocket) (`backend/api/consumers.py`) y routing (`backend/api/routing.py`)
  - `RealtimeConsumer` (grupo `scavi_realtime`)
    - Autenticación: menciona "Auth via JWT cookie" en docstring, pero el código mostrado no ejecuta validación explícita en `connect()` — se acepta la conexión y se une al grupo.
    - Permite recibir mensajes WebSocket y los reenvía al grupo.
  - `DeviceEventConsumer` (grupo por `device_{device_id}`)
    - `device_id` extraído de la URL (`scope['url_route']['kwargs']`).
  - Rutas WebSocket (`backend/api/routing.py`):

```py
re_path(r'ws/$', RealtimeConsumer.as_asgi()),
re_path(r'ws/device/(?P<device_id>\w+)/$', DeviceEventConsumer.as_asgi()),
```

---

## 3) PERMISOS Y USUARIOS

- Autenticación (`backend/api/authentication.py`)
  - `JWTCookieAuthentication` (extiende `rest_framework_simplejwt.authentication.JWTAuthentication`)
    - Lee `access_token` desde `request.COOKIES['access_token']` y valida usando SimpleJWT.
    - Devuelve `(user, validated_token)`.
  - `DeviceAPIKeyAuthentication`
    - Lee header `X-Device-Key` (`HTTP_X_DEVICE_KEY`) y compara el hash SHA256 con un `dev_key` embebido (`'dev-device-key-12345'`) — si coincide devuelve un objeto `DeviceUser()` placeholder.
    - `DeviceUser` tiene atributos: `username='device'`, `is_authenticated=True`, `rol='DEVICE'`.

  - Código relevante (extracto):

```py
class DeviceAPIKeyAuthentication:
    def authenticate(self, request):
        api_key = request.META.get('HTTP_X_DEVICE_KEY')
        key_hash = hashlib.sha256(api_key.encode()).hexdigest()
        dev_key = 'dev-device-key-12345'
        dev_key_hash = hashlib.sha256(dev_key.encode()).hexdigest()
        if key_hash == dev_key_hash:
            return (DeviceUser(), None)
        return None

class DeviceUser:
    def __init__(self):
        self.username = 'device'
        self.is_authenticated = True
        self.rol = 'DEVICE'
```

- Permisos personalizados (`backend/api/permissions.py`)
  - `IsAdmin`: permite solo a usuarios con `rol == 'ADMIN'`.
  - `IsSupervisorOrAdmin`:
    - Si el usuario no está autenticado → False.
    - Si el request.method es `SAFE_METHODS` (GET/HEAD/OPTIONS) → True para cualquier usuario autenticado.
    - Para métodos no seguros (POST/PUT/PATCH/DELETE) solo retorna True si `request.user.rol == 'ADMIN'`.

  - Código relevante (extracto):

```py
class IsSupervisorOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in permissions.SAFE_METHODS:
            return True
        return request.user.rol == 'ADMIN'
```

- Modelo de Usuario y roles
  - `Usuario` extiende `AbstractUser` y añade `rol` con valores `ADMIN` y `SUPERVISOR`.
  - Default: `rol='SUPERVISOR'`.
  - Mapeo de acceso (por convención en el código):
    - ADMIN: puede leer y escribir (operaciones CRUD completas donde el permiso se use).
    - SUPERVISOR: puede leer (SAFE_METHODS), no puede realizar operaciones de escritura protegidas.
    - DEVICE: rol usado en autenticación de dispositivos (placeholder).

---

## Observaciones y recomendaciones (rápidas)

- Seguridad / producción:
  - Hay una clave de desarrollo (`dev-device-key-12345`) embebida en `DeviceAPIKeyAuthentication` — debe eliminarse o moverse a variables de entorno en producción.
  - La lógica para decidir `is_prod` en `set_jwt_cookies` usa `os.environ.get('DEBUG', 'True') == 'False'` — es frágil/confusa y puede invertirse accidentalmente; recomiendo usar una variable explícita `ENV` o `DJANGO_SETTINGS_MODULE` o `DEBUG` convertido a boolean.
  - `JWTCookieAuthentication` depende de `access_token` en cookie; verificar que `channels`/WebSocket autentiquen el usuario en `scope` antes de confiar en `request.user` dentro de `connect()`.

- Integridad y migraciones:
  - Hay migraciones iniciales para `infraestructura` y `trafico` (0001_initial.py). `api` no tiene migraciones versionadas en repo (solo `__init__.py`). Asegurarse de generar/aplicar migraciones para `api` si el modelo `Usuario` no fue sincronizado.

- Revisión de WebSocket auth:
  - Los consumers declaran autenticación por JWT en docstring pero no implementan la verificación en `connect()`; si se requiere control de acceso por usuario, hay que extraer y validar cookie JWT en `scope`/`connect()` (o usar un middleware de autenticación para Channels).

---

## Rutas y archivos clave (resumen con paths completos)

- Modelos:
  - `backend/api/models.py` — Modelo Usuario
  - `backend/infraestructura/models.py` — Parqueo, Camara
  - `backend/trafico/models.py` — Vehiculo, RegistroAcceso
  - `backend/anpr/models.py` — PlateDetection

- Migraciones encontradas:
  - `backend/infraestructura/migrations/0001_initial.py`
  - `backend/trafico/migrations/0001_initial.py`
  - `backend/api/migrations/__init__.py`

- Lógica y API:
  - `backend/api/views.py` — `UsuarioViewSet`, `DeviceIngestView` (ingest de dispositivos)
  - `backend/api/auth_views.py` — `LoginView`, `LogoutView`, `RefreshView`, `CurrentUserView`
  - `backend/api/serializers.py` — `UsuarioSerializer`
  - `backend/api/consumers.py` — `RealtimeConsumer`, `DeviceEventConsumer`
  - `backend/api/urls.py` — router de API REST + auth + device + anpr
  - `backend/api/routing.py` — `websocket_urlpatterns`
  - `backend/api/authentication.py` — `JWTCookieAuthentication`, `DeviceAPIKeyAuthentication`, `DeviceUser`
  - `backend/api/permissions.py` — `IsAdmin`, `IsSupervisorOrAdmin`

---

Si querés, puedo:
- generar un diagrama simple de llamadas entre endpoints y consumers, o
- preparar una checklist de seguridad/producción (migraciones, claves, cookies, CORS y CSRF), o
- extraer fragmentos de código para un README técnico.

¿Qué preferís que haga ahora? (no toco archivos del código, solo documentaciones/PRs si me lo pedís)
