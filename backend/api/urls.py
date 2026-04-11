from django.urls import path, include
from rest_framework.routers import DefaultRouter
from api.views import UsuarioViewSet, DeviceIngestView, RolViewSet, ConfiguracionYOLOViewSet, MetricaRendimientoViewSet
from api import auth_views
from infraestructura.views import ParqueoViewSet, CamaraViewSet
from trafico.views import (
    VehiculoViewSet, RegistroAccesoViewSet, 
    TipoVehiculoViewSet, ColaProcesamientoViewSet,
    LogDeteccionViewSet, AlertaViewSet, EstadisticaViewSet
)

# Creamos el router y registramos las rutas según tus modelos
router = DefaultRouter()

# API models
router.register(r'usuarios', UsuarioViewSet, basename='usuario')
router.register(r'roles', RolViewSet, basename='rol')

# YOLO configs & metrics
router.register(r'config-yolo', ConfiguracionYOLOViewSet, basename='config-yolo')
router.register(r'metricas-rendimiento', MetricaRendimientoViewSet, basename='metrica-rendimiento')

# Infraestructura
router.register(r'parqueos', ParqueoViewSet, basename='parqueo')
router.register(r'camaras', CamaraViewSet, basename='camara')

# Tráfico
router.register(r'vehiculos', VehiculoViewSet, basename='vehiculo')
router.register(r'tipos-vehiculo', TipoVehiculoViewSet, basename='tipo-vehiculo')
router.register(r'registros-accesos', RegistroAccesoViewSet, basename='registro_acceso')
router.register(r'cola-procesamiento', ColaProcesamientoViewSet, basename='cola-procesamiento')
router.register(r'logs-deteccion', LogDeteccionViewSet, basename='log-deteccion')
router.register(r'alertas', AlertaViewSet, basename='alerta')
router.register(r'estadisticas', EstadisticaViewSet, basename='estadistica')

# Auth endpoints
auth_patterns = [
    path('login/', auth_views.LoginView.as_view(), name='login'),
    path('logout/', auth_views.LogoutView.as_view(), name='logout'),
    path('refresh/', auth_views.RefreshView.as_view(), name='refresh'),
    path('me/', auth_views.CurrentUserView.as_view(), name='current_user'),
]

# Device ingestion endpoint
device_patterns = [
    path('ingest/', DeviceIngestView.as_view(), name='device_ingest'),
]

# ANPR endpoints
anpr_patterns = [
    path('', include('anpr.urls')),
]

urlpatterns = [
    path('', include(router.urls)),
    path('auth/', include(auth_patterns)),
    path('device/', include(device_patterns)),
    path('anpr/', include(anpr_patterns)),
]
