from rest_framework import viewsets, views
from rest_framework import permissions
from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator

from .models import Usuario, Rol, ConfiguracionYOLO, CacheResultadoYOLO, MetricaRendimiento
from .serializers import (
    UsuarioSerializer, RolSerializer, ConfiguracionYOLOSerializer,
    CacheResultadoYOLOSerializer, MetricaRendimientoSerializer
)
from .permissions import IsSupervisorOrAdmin


class UsuarioViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Usuario model.
    - Read: any authenticated user (ADMIN or SUPERVISOR)
    - Write: only ADMIN
    """
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer
    permission_classes = [IsSupervisorOrAdmin]


class RolViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Rol model.
    - Read: any authenticated user (ADMIN or SUPERVISOR)
    - Write: only ADMIN
    """
    queryset = Rol.objects.all()
    serializer_class = RolSerializer
    permission_classes = [IsSupervisorOrAdmin]


class ConfiguracionYOLOViewSet(viewsets.ModelViewSet):
    """
    ViewSet for ConfiguracionYOLO model.
    - Read: any authenticated user (ADMIN or SUPERVISOR)
    - Write: only ADMIN
    """
    queryset = ConfiguracionYOLO.objects.all()
    serializer_class = ConfiguracionYOLOSerializer
    permission_classes = [IsSupervisorOrAdmin]


class MetricaRendimientoViewSet(viewsets.ModelViewSet):
    """
    ViewSet for MetricaRendimiento model.
    - Read: any authenticated user (ADMIN or SUPERVISOR)
    - Write: only ADMIN
    """
    queryset = MetricaRendimiento.objects.all()
    serializer_class = MetricaRendimientoSerializer
    permission_classes = [IsSupervisorOrAdmin]


@method_decorator(csrf_exempt, name='dispatch')
class DeviceIngestView(views.APIView):
    """
    POST /api/device/ingest/
    
    Endpoint for device data ingestion.
    Authenticates via X-Device-Key header.
    Exempt from CSRF (uses header, not cookie).
    """
    permission_classes = []  # Custom auth in authenticate method
    
    def post(self, request):
        # Get API key from header
        api_key = request.META.get('HTTP_X_DEVICE_KEY')
        
        if not api_key:
            return Response(
                {'error': 'X-Device-Key header required'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Validate API key - in production, this would check against stored hash
        # For now, we'll implement basic validation
        from .authentication import DeviceAPIKeyAuthentication
        
        auth = DeviceAPIKeyAuthentication()
        result = auth.authenticate(request)
        
        if result is None:
            return Response(
                {'error': 'Invalid API key'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        device, _ = result
        
        # Process device data
        data = request.data
        
        # Here you would process the device data
        # This is a placeholder for actual device ingestion logic
        return Response({
            'status': 'received',
            'device': device.username if hasattr(device, 'username') else str(device),
        }, status=status.HTTP_201_CREATED)
