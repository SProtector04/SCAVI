"""
YOLO Plate Detection Service

Wrapper around Ultralytics YOLOv8 for detecting vehicles and license plates.
"""
import logging
from pathlib import Path

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
    
    def __init__(self, model_name: str = 'yolov8n.pt'):
        """
        Initialize YOLO detector.
        
        Args:
            model_name: YOLO model to use. Default: yolov8n.pt (nano, fastest)
        """
        if not YOLO_AVAILABLE:
            raise RuntimeError("Ultralytics not installed. Install with: pip install ultralytics")
        
        self.model_name = model_name
        self.model = None
        self._load_model()
    
    def _load_model(self):
        """Load YOLO model."""
        try:
            self.model = YOLO(self.model_name)
            logger.info(f"YOLO model {self.model_name} loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load YOLO model: {e}")
            raise
    
    def detect(self, image_path: str) -> list:
        """
        Detect objects in an image.
        
        Args:
            image_path: Path to the image file
            
        Returns:
            List of detections with bounding boxes and confidence
        """
        if self.model is None:
            raise RuntimeError("YOLO model not loaded")
        
        try:
            results = self.model(image_path, verbose=False, imgsz=1280)
            
            detections = []
            for r in results:
                boxes = r.boxes
                for box in boxes:
                    cls_id = int(box.cls[0])
                    # Filter for vehicles (optional - detect all and filter later)
                    detections.append({
                        'class_id': cls_id,
                        'class_name': self.model.names.get(cls_id, 'unknown'),
                        'bbox': box.xyxy[0].cpu().numpy().tolist(),  # [x1, y1, x2, y2]
                        'confidence': float(box.conf[0])
                    })
            
            return detections
            
        except Exception as e:
            logger.error(f"YOLO detection failed: {e}")
            return []
    
    def detect_plates(self, image_path: str) -> list:
        """
        Detect license plates specifically.
        
        Note: YOLOv8 base model doesn't have plate class. 
        This returns vehicle detections - plates would need custom trained model.
        
        For now, returns all detections. In production, use a custom plate model.
        
        Args:
            image_path: Path to the image file
            
        Returns:
            List of plate detections
        """
        # Get all detections
        all_detections = self.detect(image_path)
        
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