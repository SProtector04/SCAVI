from rest_framework import serializers
from .models import Usuario, Rol, ConfiguracionYOLO, CacheResultadoYOLO, MetricaRendimiento


class UsuarioSerializer(serializers.ModelSerializer):
    """
    Serializer for Usuario model.
    Excludes sensitive fields like password in reads, but accepts it for writes.
    """
    password = serializers.CharField(write_only=True, required=False, allow_blank=True)
    
    class Meta:
        model = Usuario
        exclude = ('is_superuser', 'is_staff', 'groups', 'user_permissions')
        
    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = super().create(validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user
        
    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        user = super().update(instance, validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user


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
