from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import UsuarioViewSet, AccessLogViewSet


# Configuración de las rutas

router = DefaultRouter()
router.register(r'usuarios', UsuarioViewSet, basename='usuario')
router.register(r'access_logs', AccessLogViewSet, basename='access_log')

urlpatterns = [
    path('', include(router.urls)),
]