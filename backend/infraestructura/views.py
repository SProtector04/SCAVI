from rest_framework import viewsets
from .models import Parqueo, Camara
from .serializers import ParqueoSerializer, CamaraSerializer

class ParqueoViewSet(viewsets.ModelViewSet):
    queryset = Parqueo.objects.all()
    serializer_class = ParqueoSerializer

class CamaraViewSet(viewsets.ModelViewSet):
    queryset = Camara.objects.all()
    serializer_class = CamaraSerializer