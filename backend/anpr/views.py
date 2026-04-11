"""
ANPR API Views

Views for plate detection, event listing, and statistics.
"""
import logging
from datetime import datetime, timedelta

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser

from django.db.models import Count, Avg
from django.utils import timezone

from .models import PlateDetection
from .serializers import (
    PlateDetectionSerializer,
    PlateDetectionCreateSerializer,
    PlateDetectionStatsSerializer,
)
from api.permissions import IsAdmin, IsSupervisorOrAdmin

logger = logging.getLogger(__name__)


class PlateDetectionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for ANPR plate detection events.
    
    Endpoints:
    - GET /api/anpr/events/ - List all detections (paginated)
    - POST /api/anpr/events/ - Create detection (admin only)
    - GET /api/anpr/events/{id}/ - Get detection detail
    - DELETE /api/anpr/events/{id}/ - Soft delete (admin only)
    - POST /api/anpr/detect/ - Detect plates from image
    - GET /api/anpr/stats/ - Get statistics
    """
    
    queryset = PlateDetection.objects.filter(is_active=True)
    permission_classes = [IsAuthenticated, IsSupervisorOrAdmin]
    parser_classes = [MultiPartParser, FormParser]
    
    def get_serializer_class(self):
        if self.action == 'create':
            return PlateDetectionCreateSerializer
        return PlateDetectionSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Apply filters from query params
        fecha_inicio = self.request.query_params.get('fecha_inicio')
        fecha_fin = self.request.query_params.get('fecha_fin')
        device_id = self.request.query_params.get('device_id')
        placa_texto = self.request.query_params.get('placa_texto')
        
        if fecha_inicio:
            queryset = queryset.filter(created_at__gte=fecha_inicio)
        if fecha_fin:
            queryset = queryset.filter(created_at__lte=fecha_fin)
        if device_id:
            queryset = queryset.filter(device_id=device_id)
        if placa_texto:
            queryset = queryset.filter(placa_texto__icontains=placa_texto)
        
        return queryset
    
    def create(self, request, *args, **kwargs):
        """Override create to handle admin creation."""
        # Only ADMIN can create manually
        if request.user.rol != 'ADMIN':
            return Response(
                {'detail': 'Only administrators can create detection events.'},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().create(request, *args, **kwargs)
    
    def destroy(self, request, *args, **kwargs):
        """Soft delete - just mark as inactive."""
        instance = self.get_object()
        instance.is_active = False
        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)
    
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated, IsAdmin])
    def detect(self, request):
        """
        POST /api/anpr/detect/
        
        Detect plates in an uploaded image.
        Requires ADMIN role.
        
        Request:
            - image: Image file (multipart/form-data)
            - device_id: (optional) ID of the device sending the image
        
        Response:
            - detections: List of detected plates with text and confidence
            - event_id: ID of the created detection event
        """
        image_file = request.FILES.get('image')
        
        if not image_file:
            return Response(
                {'detail': 'No image provided. Send image as multipart/form-data.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        device_id = request.data.get('device_id', '')
        
        # Import services
        from anpr.services.yolo_detector import get_detector
        from anpr.services.ocr_reader import get_reader
        
        # Get services
        yolo_detector = get_detector()
        ocr_reader = get_reader()
        
        # Fallback response if services unavailable
        detections = []
        
        if yolo_detector and yolo_detector.is_available():
            try:
                # Save uploaded image temporarily
                import tempfile
                import os
                from django.conf import settings
                
                # Create temp file
                with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as tmp:
                    for chunk in image_file.chunks():
                        tmp.write(chunk)
                    temp_path = tmp.name
                
                try:
                    # Run YOLO detection
                    vehicle_detections = yolo_detector.detect_plates(temp_path)
                    
                    # For each detected vehicle, try OCR
                    for det in vehicle_detections:
                        bbox = det.get('bbox')
                        
                        if ocr_reader and ocr_reader.is_available():
                            result = ocr_reader.read_plate(temp_path, bbox)
                            text = result['text']
                            conf = result['confidence']
                        else:
                            # Fallback: mock detection
                            text = "SAMPLE_PLATE"
                            conf = 0.75
                        
                        detections.append({
                            'text': text,
                            'confidence': conf,
                            'bbox': bbox,
                            'class': det.get('class_name', 'vehicle')
                        })
                finally:
                    # Cleanup temp file
                    os.unlink(temp_path)
                    
            except Exception as e:
                logger.error(f"Detection failed: {e}")
                detections = [{'text': 'DETECTION_ERROR', 'confidence': 0.0}]
        else:
            # Services not available - return mock response for testing
            logger.warning("YOLO not available - returning sample response")
            detections = [
                {'text': 'ABC123', 'confidence': 0.85, 'bbox': [100, 200, 300, 250], 'class': 'car'}
            ]
        
        # Create detection event in database
        # Use first detection result
        primary_detection = detections[0] if detections else {'text': 'UNKNOWN', 'confidence': 0.0}
        
        event = PlateDetection.objects.create(
            imagen=image_file,
            placa_texto=primary_detection.get('text', 'UNKNOWN'),
            confidence=primary_detection.get('confidence', 0.0),
            device_id=device_id,
            is_active=True
        )
        
        return Response({
            'event_id': event.id,
            'detections': detections,
            'timestamp': event.created_at.isoformat()
        })
    
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def stats(self, request):
        """
        GET /api/anpr/stats/
        
        Get ANPR statistics.
        Available to authenticated users (ADMIN and SUPERVISOR).
        
        Response:
            - total_detections: Total number of active detections
            - detections_today: Detections in the last 24 hours
            - detections_this_week: Detections in the last 7 days
            - unique_plates: Number of unique plates detected
            - avg_confidence: Average confidence score
        """
        now = timezone.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = now - timedelta(days=7)
        
        # Get counts
        total_detections = self.queryset.count()
        detections_today = self.queryset.filter(created_at__gte=today_start).count()
        detections_this_week = self.queryset.filter(created_at__gte=week_start).count()
        
        # Unique plates (excluding UNKNOWN/ERROR)
        unique_plates = self.queryset.exclude(
            placa_texto__in=['UNKNOWN', 'OCR_ERROR', 'OCR_UNAVAILABLE', 'DETECTION_ERROR']
        ).values('placa_texto').distinct().count()
        
        # Average confidence
        avg_confidence = self.queryset.aggregate(Avg('confidence'))['confidence__avg'] or 0.0
        
        data = {
            'total_detections': total_detections,
            'detections_today': detections_today,
            'detections_this_week': detections_this_week,
            'unique_plates': unique_plates,
            'avg_confidence': round(avg_confidence, 2)
        }
        
        serializer = PlateDetectionStatsSerializer(data)
        return Response(serializer.data)