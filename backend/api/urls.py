from django.urls import path, include
from rest_framework.routers import DefaultRouter
from api.views import UsuarioViewSet 
from infraestructura.views import ParqueoViewSet, CamaraViewSet
from trafico.views import VehiculoViewSet, RegistroAccesoViewSet

# Creamos el router y registramos las rutas según tus modelos
router = DefaultRouter()
router.register(r'usuarios', UsuarioViewSet, basename='usuario')
router.register(r'parqueos', ParqueoViewSet, basename='parqueo')
router.register(r'vehiculos', VehiculoViewSet, basename='vehiculo')
router.register(r'camaras', CamaraViewSet, basename='camara')
router.register(r'registros-accesos', RegistroAccesoViewSet, basename='registro_acceso')

urlpatterns = [
    path('', include(router.urls)),
]