from rest_framework import serializers
from .models import (
    Vehiculo, RegistroAcceso, TipoVehiculo, 
    ColaProcesamiento, LogDeteccion, Alerta, Estadistica
)

class TipoVehiculoSerializer(serializers.ModelSerializer):
    """
    Serializer for TipoVehiculo model.
    """
    class Meta:
        model = TipoVehiculo
        fields = '__all__'

class VehiculoSerializer(serializers.ModelSerializer):
    """
    Serializer for Vehiculo model.
    """
    tipos = TipoVehiculoSerializer(many=True, read_only=True)
    
    class Meta:
        model = Vehiculo
        fields = ['placa', 'tipo', 'tipos']


class LogDeteccionSerializer(serializers.ModelSerializer):
    """
    Serializer for LogDeteccion model.
    """
    class Meta:
        model = LogDeteccion
        fields = '__all__'


class RegistroAccesoSerializer(serializers.ModelSerializer):
    """
    Serializer for RegistroAcceso model.
    """
    logs_deteccion = LogDeteccionSerializer(many=True, read_only=True)
    vehiculo_placa = serializers.CharField(source='vehiculo.placa', read_only=True, default='')
    camara_nombre = serializers.CharField(source='camara.nombre', read_only=True, default='')
    
    class Meta:
        model = RegistroAcceso
        fields = [
            'id', 'vehiculo_placa', 'placa_detectada_ia', 'camara_nombre',
            'fecha_hora', 'estado_acceso', 'confianza_ia', 'logs_deteccion'
        ]
        read_only_fields = ('fecha_hora', 'estado_acceso',)


class ColaProcesamientoSerializer(serializers.ModelSerializer):
    """
    Serializer for ColaProcesamiento model.
    """
    class Meta:
        model = ColaProcesamiento
        fields = '__all__'


class AlertaSerializer(serializers.ModelSerializer):
    """
    Serializer for Alerta model.
    """
    resuelta_por_username = serializers.CharField(
        source='resuelta_por.username', 
        read_only=True
    )
    
    class Meta:
        model = Alerta
        fields = '__all__'


class EstadisticaSerializer(serializers.ModelSerializer):
    """
    Serializer for Estadistica model.
    """
    class Meta:
        model = Estadistica
        fields = '__all__'