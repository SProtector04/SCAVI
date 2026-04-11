from rest_framework import serializers
from .models import Usuario, Rol, ConfiguracionYOLO, CacheResultadoYOLO, MetricaRendimiento


class UsuarioSerializer(serializers.ModelSerializer):
    """
    Serializer for Usuario model.
    Excludes sensitive fields like password, is_superuser, etc.
    """
    
    class Meta:
        model = Usuario
        exclude = ('password', 'is_superuser', 'is_staff', 'groups', 'user_permissions')
        # Alternative: use fields instead of exclude for explicitness
        # fields = ('id', 'username', 'email', 'first_name', 'last_name', 'rol', 'is_active', 'date_joined')


class RolSerializer(serializers.ModelSerializer):
    """
    Serializer for Rol model.
    """
    usuario_username = serializers.CharField(source='usuario.username', read_only=True)
    
    class Meta:
        model = Rol
        fields = '__all__'
        read_only_fields = ('creado_en', 'actualizado_en')


class ConfiguracionYOLOSerializer(serializers.ModelSerializer):
    """
    Serializer for ConfiguracionYOLO model.
    """
    
    class Meta:
        model = ConfiguracionYOLO
        fields = '__all__'
        read_only_fields = ('creado_en', 'actualizado_en')


class CacheResultadoYOLOSerializer(serializers.ModelSerializer):
    """
    Serializer for CacheResultadoYOLO model.
    """
    
    class Meta:
        model = CacheResultadoYOLO
        fields = '__all__'


class MetricaRendimientoSerializer(serializers.ModelSerializer):
    """
    Serializer for MetricaRendimiento model.
    """
    
    class Meta:
        model = MetricaRendimiento
        fields = '__all__'
