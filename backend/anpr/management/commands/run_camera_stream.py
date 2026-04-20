"""
Django management command for RTSP camera stream processing.

Simulates RTSP streaming with YOLO detection and creates database records
for detected persons and vehicles.
"""
import logging
import time
from io import BytesIO

from django.core.management.base import BaseCommand
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

logger = logging.getLogger(__name__)

try:
    import cv2
    import numpy as np
    from ultralytics import YOLO
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False
    logger.warning("OpenCV or Ultralytics not installed. Stream processing disabled.")


class Command(BaseCommand):
    help = 'Run RTSP camera stream processor with YOLO detection'

    def add_arguments(self, parser):
        parser.add_argument(
            '--url',
            type=str,
            default='0',
            help='RTSP URL or camera index (default: 0 for local webcam)'
        )
        parser.add_argument(
            '--confidence',
            type=float,
            default=0.5,
            help='Minimum confidence threshold (default: 0.5)'
        )
        parser.add_argument(
            '--interval',
            type=int,
            default=30,
            help='Frame processing interval in milliseconds (default: 30)'
        )

    def handle(self, *args, **options):
        if not CV2_AVAILABLE:
            self.stderr.write(self.style.ERROR("OpenCV or Ultralytics not installed."))
            return

        source = options['url']
        confidence_threshold = options['confidence']
        interval = options['interval']

        if source.isdigit():
            source = int(source)
            self.stdout.write(f"Opening local camera index {source}")
        else:
            self.stdout.write(f"Opening RTSP stream: {source}")

        self.stdout.write(self.style.SUCCESS('Starting YOLO stream processor'))
        self._run_stream(source, confidence_threshold, interval)

    def _run_stream(self, source: str, confidence_threshold: float, interval: int):
        """
        Process video stream with YOLO detection.

        Creates LogDeteccion or Alerta records when person or vehicle detected.
        """
        try:
            model = YOLO('/opt/models/yolov8n.pt')
        except Exception as e:
            self.stderr.write(self.style.ERROR(f"Failed to load YOLO model: {e}"))
            return

        cap = cv2.VideoCapture(source)

        if not cap.isOpened():
            self.stderr.write(self.style.ERROR(f"Cannot open video source: {source}"))
            return

        try:
            from trafico.models import LogDeteccion, Alerta, RegistroAcceso
        except Exception as e:
            self.stderr.write(self.style.ERROR(f"Cannot import trafico models: {e}"))
            return

        frame_count = 0
        last_processed = time.time()

        self.stdout.write(self.style.SUCCESS('Streaming started. Press Ctrl+C to stop.'))

        try:
            while True:
                ret, frame = cap.read()

                if not ret:
                    if isinstance(source, int):
                        self.stderr.write(self.style.ERROR("Camera disconnected"))
                    else:
                        self.stdout.write("Stream ended, reconnecting...")
                        time.sleep(1)
                        cap = cv2.VideoCapture(source)
                        if not cap.isOpened():
                            break
                    continue

                frame_count += 1

                now = time.time()
                if (now - last_processed) < (interval / 1000.0):
                    continue

                last_processed = now

                try:
                    results = model(frame, verbose=False, imgsz=1280)

                    for r in results:
                        boxes = r.boxes
                        for box in boxes:
                            conf = float(box.conf[0])
                            if conf < confidence_threshold:
                                continue

                            cls_id = int(box.cls[0])
                            class_name = model.names.get(cls_id, 'unknown')

                            if class_name in ['car', 'motorcycle', 'bus', 'truck']:
                                self.stdout.write(
                                    f"Frame {frame_count}: Detected {class_name} "
                                    f"(conf: {conf:.2f}, cls_id: {cls_id})"
                                )

                                self._create_detection_record(
                                    class_name, conf, box.xyxy[0].cpu().numpy().tolist()
                                )

                except Exception as e:
                    logger.error(f"Detection error: {e}")
                    continue

        except KeyboardInterrupt:
            self.stdout.write(self.style.WARNING('\nStopping stream...'))
        finally:
            cap.release()
            self.stdout.write(self.style.SUCCESS('Stream closed'))

    def _create_detection_record(self, class_name: str, confidence: float, bbox: list):
        """
        Create LogDeteccion or Alerta record in database.

        Args:
            class_name: Detected class (person, car, etc.)
            confidence: Detection confidence
            bbox: Bounding box [x1, y1, x2, y2]
        """
        try:
            from trafico.models import LogDeteccion, Alerta, RegistroAcceso

            registro = None

            try:
                registro = RegistroAcceso.objects.order_by('-creado_en').first()
            except Exception:
                pass

            if registro:
                mensaje = (
                    f"Vehicle detected: {class_name} "
                    f"(conf: {confidence:.2f}, bbox: {bbox})"
                )

                LogDeteccion.objects.create(
                    registro_acceso=registro,
                    tipo_evento='DETECCION_PLACA',
                    mensaje=mensaje,
                    metadata={
                        'class_name': class_name,
                        'confidence': confidence,
                        'bbox': bbox
                    }
                )
                logger.info(f"Created log for vehicle: {class_name}")

                channel_layer = get_channel_layer()
                async_to_sync(channel_layer.group_send)(
                    "scavi_realtime",
                    {
                        "type": "chat_message",
                        "message": {
                            "type": "PLACA_DETECTADA",
                            "data": {
                                "class_name": class_name,
                                "confidence": confidence,
                                "bbox": bbox,
                                "placa": "ABC-123",
                            }
                        }
                    }
                )

        except Exception as e:
            logger.error(f"Failed to create detection record: {e}")