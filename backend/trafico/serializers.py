from rest_framework import serializers
from .models import Vehiculo, RegistroAcceso

class VehiculoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vehiculo
        fields = '__all__'

class RegistroAccesoSerializer(serializers.ModelSerializer):
    class Meta:
        model = RegistroAcceso
        fields = '__all__'
        read_only_fields = ('fecha_hora','estado_acceso',)