from rest_framework import viewsets
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Usuario, AccessLog
from .serializers import UsuarioSerializer, AccessLogSerializer


class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer
    
class AccessLogViewSet(viewsets.ModelViewSet):
    queryset = AccessLog.objects.all()
    serializer_class = AccessLogSerializer
    
@api_view(['GET'])
def test_endpoint(request):
    return Response({
        "message": "¡Hola desde el endpoint de prueba!",
        "status": "success"
    })