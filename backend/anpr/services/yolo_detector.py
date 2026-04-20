"""
YOLO Plate Detection Service

Wrapper around Ultralytics YOLOv8 for detecting vehicles and license plates.
"""
import logging
from pathlib import Path
from typing import Union

logger = logging.getLogger(__name__)

# Try to import ultralytics, handle gracefully if not available
try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
except ImportError:
    YOLO_AVAILABLE = False
    logger.warning("Ultralytics not installed. YOLO detection will be disabled.")


class YOLODetector:
    """
    YOLOv8-based plate detector.

    Uses YOLOv8 nano model for fast detection of vehicles and license plates.
    Model is downloaded automatically on first use.
    """

    # COCO classes relevant for vehicles
    VEHICLE_CLASSES = [2, 3, 5, 7]  # car, motorcycle, bus, truck

    # Default confidence threshold for secure filtering
    DEFAULT_CONFIDENCE_THRESHOLD = 0.25

    def __init__(self, model_name: str = 'yolov8n.pt', confidence_threshold: float = None):
        """
        Initialize YOLO detector.

        Args:
            model_name: YOLO model to use. Default: yolov8n.pt (nano, fastest)
            confidence_threshold: Minimum confidence for detections (default: 0.25)
        """
        if not YOLO_AVAILABLE:
            raise RuntimeError("Ultralytics not installed. Install with: pip install ultralytics")

        self.model_name = model_name
        self.model = None
        self.confidence_threshold = confidence_threshold or self.DEFAULT_CONFIDENCE_THRESHOLD
        self._load_model()
    
    def _load_model(self):
        """Load YOLO model."""
        try:
            self.model = YOLO(self.model_name)
            logger.info(f"YOLO model {self.model_name} loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load YOLO model: {e}")
            raise
    
    def detect(self, image: Union[str, 'PIL.Image.Image', bytes], confidence_threshold: float = None) -> list:
        """
        Detect objects in an image.

        Accepts file path, PIL Image, or bytes.

        Args:
            image: Image source - file path (str), PIL Image, or bytes
            confidence_threshold: Override default threshold for this detection

        Returns:
            List of detections with bounding boxes and confidence
        """
        if self.model is None:
            raise RuntimeError("YOLO model not loaded")

        threshold = confidence_threshold or self.confidence_threshold

        try:
            results = self.model(image, verbose=False, imgsz=1280)

            detections = []
            for r in results:
                boxes = r.boxes
                for box in boxes:
                    conf = float(box.conf[0])

                    # Secure filtering: only return detections above threshold
                    if conf < threshold:
                        continue

                    cls_id = int(box.cls[0])
                    detections.append({
                        'class_id': cls_id,
                        'class_name': self.model.names.get(cls_id, 'unknown'),
                        'bbox': box.xyxy[0].cpu().numpy().tolist(),  # [x1, y1, x2, y2]
                        'confidence': conf
                    })

            return detections

        except Exception as e:
            logger.error(f"YOLO detection failed: {e}")
            return []
    
    def detect_plates(self, image: Union[str, 'PIL.Image.Image', bytes], confidence_threshold: float = None) -> list:
        """
        Detect license plates specifically.

        Note: YOLOv8 base model doesn't have plate class.
        This returns vehicle detections - plates would need custom trained model.

        For now, returns all detections. In production, use a custom plate model.

        Args:
            image: Image source - file path (str), PIL Image, or bytes
            confidence_threshold: Override default threshold

        Returns:
            List of plate detections (filtered to vehicles only)
        """
        # Get all detections
        all_detections = self.detect(image, confidence_threshold)

        # Filter for vehicles (can be used to locate potential plate areas)
        vehicle_detections = [
            d for d in all_detections
            if d['class_id'] in self.VEHICLE_CLASSES
        ]

        return vehicle_detections
    
    def is_available(self) -> bool:
        """Check if YOLO is available."""
        return YOLO_AVAILABLE and self.model is not None


# Singleton instance for reuse
_detector_instance = None


def get_detector() -> YOLODetector:
    """Get or create YOLO detector instance."""
    global _detector_instance
    if _detector_instance is None:
        try:
            _detector_instance = YOLODetector()
        except Exception as e:
            logger.error(f"Failed to create detector: {e}")
            return None
    return _detector_instance