"""
Plate Detection Service

Wrapper around Ultralytics YOLOv8 for detecting license plates directly.
Uses the dedicated fine-tuned model `license_plate_detector.pt`.
"""
import logging
import os
from pathlib import Path
from typing import Union

logger = logging.getLogger(__name__)

# Try to import ultralytics, handle gracefully if not available
try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
except ImportError:
    YOLO_AVAILABLE = False
    logger.warning("Ultralytics not installed. Plate detection will be disabled.")

# Default confidence threshold for secure filtering
DEFAULT_CONFIDENCE_THRESHOLD = 0.25

# Default plate classes (custom model may return different class IDs)
DEFAULT_PLATE_CLASS_NAMES = ['plate', 'license_plate', 'licence_plate', 'LP']


def get_plate_model_path() -> str:
    """
    Get the path to the plate detector model.
    
    Resolves the path in order:
    1. Django setting ANPR_PLATE_MODEL_PATH
    2. Environment variable SCAVI_PLATE_MODEL_PATH
    3. Project root / license_plate_detector.pt
    4. /opt/models/license_plate_detector.pt (Docker)
    
    Returns:
        str: Path to the model file
    """
    # Check Django settings first
    try:
        from django.conf import settings
        if hasattr(settings, 'ANPR_PLATE_MODEL_PATH') and settings.ANPR_PLATE_MODEL_PATH:
            return settings.ANPR_PLATE_MODEL_PATH
    except Exception:
        pass
    
    # Check environment variable
    env_path = os.environ.get('SCAVI_PLATE_MODEL_PATH')
    if env_path:
        return env_path
    
    # Try project root
    project_root = Path(__file__).resolve().parent.parent.parent.parent
    model_path = project_root / 'license_plate_detector.pt'
    if model_path.exists():
        return str(model_path)
    
    # Try Docker path
    docker_path = '/opt/models/license_plate_detector.pt'
    if Path(docker_path).exists():
        return docker_path
    
    # Fallback to project root path
    return str(project_root / 'license_plate_detector.pt')


class PlateDetector:
    """
    YOLOv8-based dedicated plate detector.

    Uses the fine-tuned model for license plates only.
    Returns normalized plate detections with bbox, confidence, and class_name.
    """

    def __init__(self, model_path: str = None, confidence_threshold: float = None):
        """
        Initialize plate detector.

        Args:
            model_path: Path to the plate model. If None, uses default resolution.
            confidence_threshold: Minimum confidence for detections (default: 0.25)
        """
        if not YOLO_AVAILABLE:
            raise RuntimeError("Ultralytics not installed. Install with: pip install ultralytics")

        self.model_path = model_path or get_plate_model_path()
        self.model = None
        self.confidence_threshold = confidence_threshold or DEFAULT_CONFIDENCE_THRESHOLD
        self._load_model()
    
    def _load_model(self):
        """Load YOLO plate detection model."""
        try:
            self.model = YOLO(self.model_path)
            logger.info(f"Plate detector model {self.model_path} loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load plate detector model: {e}")
            raise
    
    def detect(self, image: Union[str, 'PIL.Image.Image', bytes], confidence_threshold: float = None) -> list:
        """
        Detect license plates in an image.

        Accepts file path, PIL Image, or bytes.

        Args:
            image: Image source - file path (str), PIL Image, or bytes
            confidence_threshold: Override default threshold for this detection

        Returns:
            List of plate detections with:
            - bbox: [x1, y1, x2, y2]
            - confidence: float
            - class_name: 'plate'
        """
        if self.model is None:
            raise RuntimeError("Plate detector model not loaded")

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
                    class_name = self.model.names.get(cls_id, 'plate')
                    
                    # Normalize class name to 'plate' for consistency
                    if class_name.lower() in ['lp', 'license', 'licence_plate', 'licence']:
                        class_name = 'plate'

                    detections.append({
                        'class_id': cls_id,
                        'class_name': class_name,
                        'bbox': box.xyxy[0].cpu().numpy().tolist(),  # [x1, y1, x2, y2]
                        'confidence': conf
                    })

            return detections

        except Exception as e:
            logger.error(f"Plate detection failed: {e}")
            return []
    
    def detect_plates(self, image: Union[str, 'PIL.Image.Image', bytes], confidence_threshold: float = None) -> list:
        """
        Alias for detect() - returns plate detections.

        This method exists for API compatibility with the old YOLODetector interface.

        Args:
            image: Image source - file path (str), PIL Image, or bytes
            confidence_threshold: Override default threshold

        Returns:
            List of plate detections
        """
        return self.detect(image, confidence_threshold)
    
    def is_available(self) -> bool:
        """Check if plate detector is available."""
        return YOLO_AVAILABLE and self.model is not None


# Singleton instance for reuse
_detector_instance = None


def get_detector() -> PlateDetector:
    """Get or create plate detector instance."""
    global _detector_instance
    if _detector_instance is None:
        try:
            _detector_instance = PlateDetector()
        except Exception as e:
            logger.error(f"Failed to create plate detector: {e}")
            return None
    return _detector_instance


def reset_detector():
    """Reset the singleton detector instance. Useful for testing."""
    global _detector_instance
    _detector_instance = None