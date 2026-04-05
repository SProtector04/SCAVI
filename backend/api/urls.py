from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UsuarioViewSet, 
    ParqueoViewSet, 
    VehiculoViewSet, 
    CamaraViewSet, 
    AccessLogViewSet
)

# Creamos el router y registramos las rutas según tus modelos
router = DefaultRouter()
router.register(r'usuarios', UsuarioViewSet, basename='usuario')
router.register(r'parqueos', ParqueoViewSet, basename='parqueo')
router.register(r'vehiculos', VehiculoViewSet, basename='vehiculo')
router.register(r'camaras', CamaraViewSet, basename='camara')
router.register(r'access-logs', AccessLogViewSet, basename='access_log')

urlpatterns = [
    path('', include(router.urls)),
]