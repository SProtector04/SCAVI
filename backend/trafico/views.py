from rest_framework import viewsets
from rest_framework import permissions
from .models import Vehiculo, RegistroAcceso
from .serializers import VehiculoSerializer, RegistroAccesoSerializer
from api.permissions import IsSupervisorOrAdmin


class VehiculoViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Vehiculo model.
    - Read: any authenticated user (ADMIN or SUPERVISOR)
    - Write: only ADMIN
    """
    queryset = Vehiculo.objects.all()
    serializer_class = VehiculoSerializer
    permission_classes = [IsSupervisorOrAdmin]


class RegistroAccesoViewSet(viewsets.ModelViewSet):
    """
    ViewSet for RegistroAcceso model.
    - Read: any authenticated user (ADMIN or SUPERVISOR)
    - Write: only ADMIN
    """
    queryset = RegistroAcceso.objects.all()
    serializer_class = RegistroAccesoSerializer
    permission_classes = [IsSupervisorOrAdmin]
