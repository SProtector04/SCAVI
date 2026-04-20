from rest_framework import viewsets
from rest_framework import permissions
from .models import (
    Vehiculo, RegistroAcceso, TipoVehiculo, 
    ColaProcesamiento, LogDeteccion, Alerta, Estadistica
)
from .serializers import (
    VehiculoSerializer, RegistroAccesoSerializer,
    TipoVehiculoSerializer, ColaProcesamientoSerializer,
    LogDeteccionSerializer, AlertaSerializer, EstadisticaSerializer
)
from api.permissions import IsSupervisorOrAdmin


class VehiculoViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Vehiculo model.
    - Read: any authenticated user (ADMIN or SUPERVISOR)
    - Write: only ADMIN
    """
    queryset = Vehiculo.objects.prefetch_related('tipos')
    serializer_class = VehiculoSerializer
    permission_classes = [IsSupervisorOrAdmin]


class RegistroAccesoViewSet(viewsets.ModelViewSet):
    """
    ViewSet for RegistroAcceso model.
    - Read: any authenticated user (ADMIN or SUPERVISOR)
    - Write: only ADMIN
    """
    queryset = RegistroAcceso.objects.select_related('vehiculo', 'camara').prefetch_related('logs_deteccion')
    serializer_class = RegistroAccesoSerializer
    permission_classes = [IsSupervisorOrAdmin]


class TipoVehiculoViewSet(viewsets.ModelViewSet):
    """
    ViewSet for TipoVehiculo model.
    - Read: any authenticated user (ADMIN or SUPERVISOR)
    - Write: only ADMIN
    """
    queryset = TipoVehiculo.objects.all()
    serializer_class = TipoVehiculoSerializer
    permission_classes = [IsSupervisorOrAdmin]


class ColaProcesamientoViewSet(viewsets.ModelViewSet):
    """
    ViewSet for ColaProcesamiento model.
    - Read: any authenticated user (ADMIN or SUPERVISOR)
    - Write: only ADMIN
    """
    queryset = ColaProcesamiento.objects.all()
    serializer_class = ColaProcesamientoSerializer
    permission_classes = [IsSupervisorOrAdmin]


class LogDeteccionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for LogDeteccion model.
    - Read: any authenticated user (ADMIN or SUPERVISOR)
    - Write: only ADMIN
    """
    queryset = LogDeteccion.objects.all()
    serializer_class = LogDeteccionSerializer
    permission_classes = [IsSupervisorOrAdmin]


class AlertaViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Alerta model.
    - Read: any authenticated user (ADMIN or SUPERVISOR)
    - Write: only ADMIN
    """
    queryset = Alerta.objects.all()
    serializer_class = AlertaSerializer
    permission_classes = [IsSupervisorOrAdmin]


class EstadisticaViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Estadistica model.
    - Read: any authenticated user (ADMIN or SUPERVISOR)
    - Write: only ADMIN
    """
    queryset = Estadistica.objects.all()
    serializer_class = EstadisticaSerializer
    permission_classes = [IsSupervisorOrAdmin]
