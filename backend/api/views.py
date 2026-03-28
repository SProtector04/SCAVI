from rest_framework import viewsets, views, permissions, status
from rest_framework.response import Response
from .models import Usuario, AccessLog
from .serializers import UsuarioSerializer, AccessLogSerializer


class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer
    permission_classes = [permissions.AllowAny]
class AccessLogViewSet(viewsets.ReadOnlyModelViewSet):
    
    queryset = AccessLog.objects.all().order_by('-id') 
    serializer_class = AccessLogSerializer
    permission_classes = [permissions.AllowAny]
    
class HealthCheckView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({
            "message": "¡API funcionando correctamente!",
            "status": "success",
            "project": "ProWeb"
        }, status=status.HTTP_200_OK)