from rest_framework import serializers
from .models import Parqueo, Camara

class ParqueoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Parqueo
        fields = '__all__'

class CamaraSerializer(serializers.ModelSerializer):
    class Meta:
        model = Camara
        fields = '__all__'