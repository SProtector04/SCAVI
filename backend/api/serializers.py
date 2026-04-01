from rest_framework import serializers
from .models import Usuario
from .models import AccessLog


class UsuarioSerializer(serializers.ModelSerializer):
    class Meta:
        model = Usuario
        fields = '__all__'

class AccessLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AccessLog
        fields = '__all__'
        read_only_fields = ('timestamp',)