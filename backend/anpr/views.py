"""
ANPR API Views

Views for plate detection, event listing, and statistics.
"""
import logging
from datetime import datetime, timedelta
from django.utils import timezone
from django.db.models import Count, Avg
from django.db.models.functions import TruncDate

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser

from .models import PlateDetection
from .serializers import (
    PlateDetectionSerializer,
    PlateDetectionCreateSerializer,
    PlateDetectionStatsSerializer,
)
from api.permissions import IsAdmin, IsSupervisorOrAdmin
from trafico.models import Vehiculo, RegistroAcceso, Alerta

logger = logging.getLogger(__name__)


def normalize_plate(text: str) -> str:
    """
    Normaliza una placa: mayúsculas, sin espacios ni guiones.
    Ej: "ABC 123" → "ABC123", "ABC-123" → "ABC123"
    """
    return ''.join(c for c in text.upper().strip() if c.isalnum())


def classify_vehicle_entry(placa_texto: str) -> tuple[str, str, str]:
    """
    Clasifica el tipo de ingreso de un vehículo según su placa.
    Si la placa no existe, la registra automáticamente como VISITANTE.

    Args:
        placa_texto: Texto de la placa detectada

    Returns:
        Tuple de (tipo_alerta, titulo, descripcion)
        - tipo_alerta: VEHICULO_NUEVO | REINGRESO | VEHICULO_NO_REGISTRADO
        - titulo: Título de la alerta
        - descripcion: Descripción del evento
    """
    placa_normalizada = normalize_plate(placa_texto)

    if not placa_normalizada or placa_normalizada in ('UNKNOWN', 'OCRERROR', 'OCRUNAVAILABLE'):
        return ('', '', '')

    vehiculo, created = Vehiculo.objects.get_or_create(
        placa=placa_normalizada,
        defaults={'tipo': 'VISITANTE'}
    )

    if created:
        return (
            'VEHICULO_NUEVO',
            f'Vehículo registrado: {placa_normalizada}',
            f'El vehículo {placa_normalizada} fue registrado automáticamente como visitante.'
        )

    today = timezone.now().date()
    today_start = timezone.make_aware(datetime.combine(today, datetime.min.time()))

    ha_pasado_hoy = RegistroAcceso.objects.filter(
        vehiculo=vehiculo,
        fecha_hora__gte=today_start
    ).exists()

    if ha_pasado_hoy:
        return (
            'REINGRESO',
            f'Reingreso: {placa_normalizada}',
            f'El vehículo {placa_normalizada} ({vehiculo.tipo}) registró un nuevo ingreso.'
        )

    return (
        'VEHICULO_NUEVO',
        f'Vehículo nuevo: {placa_normalizada}',
        f'Primera detección del vehículo {placa_normalizada} ({vehiculo.tipo}) hoy.'
    )


def create_alerta_from_detection(
    placa_texto: str,
    registro_acceso=None,
    confianza: float = 0.0
) -> Alerta:
    """
    Crea una alerta basada en la detección de placa.

    Args:
        placa_texto: Texto de la placa
        registro_acceso: Registro de acceso relacionado (opcional)
        confianza: Nivel de confianza de la detección

    Returns:
        Alerta creada o None si no aplica
    """
    tipo_alerta, titulo, descripcion = classify_vehicle_entry(placa_texto)

    if not tipo_alerta:
        return None

    prioridad = 'ALTA'
    if tipo_alerta == 'VEHICULO_NUEVO':
        prioridad = 'MEDIA'
    elif tipo_alerta == 'REINGRESO':
        prioridad = 'BAJA'

    if confianza < 0.5:
        prioridad = 'CRITICA'

    placa_normalizada = normalize_plate(placa_texto)

    alerta = Alerta.objects.create(
        tipo=tipo_alerta,
        prioridad=prioridad,
        titulo=titulo,
        descripcion=descripcion,
        registro=registro_acceso,
    )

    logger.info(f"Alerta creada: {tipo_alerta} - {placa_normalizada}")
    return alerta


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
    
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated, IsSupervisorOrAdmin])
    def detect(self, request):
        """
        POST /api/anpr/detect/

        Detect plates in an uploaded image.
        Requires ADMIN role.

        Request:
            - image: Image file (multipart/form-data)
            - device_id: (optional) ID of the device sending the image

        Response:
            - detections: List of detected objects with bbox, class_name, confidence
            - event_id: ID of the created detection event
        """
        image_file = request.FILES.get('image')

        if not image_file:
            return Response(
                {'detail': 'No image provided. Send image as multipart/form-data.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        device_id = request.data.get('device_id', '')

        from anpr.services.plate_detector import get_detector
        from anpr.services.ocr_reader import get_reader

        plate_detector = get_detector()
        ocr_reader = get_reader()

        detections = []
        plate_text = 'UNKNOWN'
        confidence = 0.0

        if plate_detector and plate_detector.is_available():
            try:
                from PIL import Image
                import io

                image_data = image_file.read()
                pil_image = Image.open(io.BytesIO(image_data))

                # Detect plates directly using the dedicated plate detector
                plate_detections = plate_detector.detect(pil_image)

                # Process only plate detections (no vehicles, no irrelevant objects)
                for det in plate_detections:
                    det_response = {
                        'bbox': det['bbox'],
                        'class_name': det['class_name'],  # Should be 'plate'
                        'confidence': det['confidence']
                    }

                    # OCR reads the plate crop directly (not vehicle crop)
                    if ocr_reader and ocr_reader.is_available():
                        # Save temp file for OCR processing
                        import tempfile

                        # Save the full image temporarily
                        with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as tmp:
                            pil_image.save(tmp.name)
                            # OCR reader receives image path + bbox for cropping
                            result = ocr_reader.read_plate(tmp.name, det['bbox'])
                            det_response['plate_text'] = result['text']
                            det_response['plate_confidence'] = result['confidence']
                            import os
                            os.unlink(tmp.name)
                    else:
                        # Fallback when OCR is unavailable
                        det_response['plate_text'] = 'OCR_UNAVAILABLE'
                        det_response['plate_confidence'] = 0.0

                    detections.append(det_response)

                # Get primary detection for event
                primary = detections[0] if detections else {}
                plate_text = primary.get('plate_text', 'UNKNOWN')
                confidence = primary.get('confidence', 0.0)

            except Exception as e:
                logger.error(f"Plate detection failed: {e}")
                detections = [{'class_name': 'ERROR', 'confidence': 0.0, 'bbox': []}]
        else:
            logger.warning("Plate detector not available - returning empty response")
            # Return empty detections - no fake plates
            detections = []
            plate_text = 'UNKNOWN'
            confidence = 0.0

        event = PlateDetection.objects.create(
            imagen=image_file,
            placa_texto=plate_text,
            confidence=confidence,
            device_id=device_id,
            is_active=True
        )

        tipo_alerta, titulo_alerta, _ = classify_vehicle_entry(plate_text)

        if tipo_alerta:
            create_alerta_from_detection(plate_text, None, confidence)

        from trafico.models import RegistroAcceso, Vehiculo

        placa_normalizada = normalize_plate(plate_text)
        vehiculo_obj = None
        estado = 'DESCONOCIDO'

        if placa_normalizada and placa_normalizada not in ('UNKNOWN', 'OCRERROR', 'OCRUNAVAILABLE'):
            try:
                vehiculo_obj = Vehiculo.objects.get(placa=placa_normalizada)
                estado = 'AUTORIZADO'
            except Vehiculo.DoesNotExist:
                estado = 'DESCONOCIDO'

        RegistroAcceso.objects.create(
            placa_detectada_ia=plate_text,
            vehiculo=vehiculo_obj,
            estado_acceso=estado,
            confianza_ia=confidence,
        )

        logger.info(f"RegistroAcceso creado: {placa_normalizada} - {estado}")

        try:
            from channels.layers import get_channel_layer
            from asgiref.sync import async_to_sync
            channel_layer = get_channel_layer()
            if channel_layer:
                async_to_sync(channel_layer.group_send)(
                    "scavi_realtime",
                    {
                        "type": "chat_message",
                        "message": {
                            "type": "PLACA_DETECTADA",
                            "data": {
                                "placa": plate_text,
                                "registro_id": event.id,
                                "camara": device_id or "WEB_UPLOAD",
                                "confianza": confidence,
                                "alerta_tipo": tipo_alerta,
                                "alerta_titulo": titulo_alerta,
                                "bbox": primary.get("bbox") if 'primary' in locals() else None
                            }
                        }
                    }
                )
        except Exception as e:
            logger.error(f"WebSocket broadcast failed: {e}")

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