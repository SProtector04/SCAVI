from rest_framework import viewsets
from rest_framework import permissions
from .models import Parqueo, Camara
from .serializers import ParqueoSerializer, CamaraSerializer
from api.permissions import IsSupervisorOrAdmin


class ParqueoViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Parqueo model.
    - Read: any authenticated user (ADMIN or SUPERVISOR)
    - Write: only ADMIN
    """
    queryset = Parqueo.objects.all()
    serializer_class = ParqueoSerializer
    permission_classes = [IsSupervisorOrAdmin]


class CamaraViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Camara model.
    - Read: any authenticated user (ADMIN or SUPERVISOR)
    - Write: only ADMIN
    """
    queryset = Camara.objects.all()
    serializer_class = CamaraSerializer
    permission_classes = [IsSupervisorOrAdmin]
