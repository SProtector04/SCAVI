from rest_framework import serializers
from .models import PlateDetection


class PlateDetectionSerializer(serializers.ModelSerializer):
    """
    Serializer for PlateDetection model.
    Excludes sensitive information and includes image URL.
    """
    
    imagen_url = serializers.SerializerMethodField()
    
    class Meta:
        model = PlateDetection
        fields = [
            'id',
            'imagen',
            'imagen_url',
            'placa_texto',
            'confidence',
            'device_id',
            'is_active',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']
    
    def get_imagen_url(self, obj):
        """Return full URL for the image."""
        if obj.imagen and hasattr(obj.imagen, 'url'):
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.imagen.url)
        return None


class PlateDetectionCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating PlateDetection records.
    """
    
    class Meta:
        model = PlateDetection
        fields = [
            'imagen',
            'placa_texto',
            'confidence',
            'device_id',
        ]


class PlateDetectionStatsSerializer(serializers.Serializer):
    """
    Serializer for ANPR statistics.
    """
    
    total_detections = serializers.IntegerField()
    detections_today = serializers.IntegerField()
    detections_this_week = serializers.IntegerField()
    unique_plates = serializers.IntegerField()
    avg_confidence = serializers.FloatField()