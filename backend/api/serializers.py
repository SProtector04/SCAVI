from rest_framework import serializers
from .models import Usuario


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
