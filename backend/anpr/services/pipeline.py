"""
ANPR Image Processing Pipeline Service

Handles the complete image processing pipeline:
- Image validation with PIL
- File saving and YOLO detection
- OCR plate reading
- Database persistence
"""
import logging
import tempfile
import os

from django.utils import timezone
from django.conf import settings

logger = logging.getLogger(__name__)


def validate_image(image_file):
    """
    Validate that an uploaded file is a valid image using PIL.
    
    Opens the file in memory and verifies it's a valid image format.
    This prevents malicious file uploads (scripts, executables, etc.)
    
    Args:
        image_file: Django UploadedFile object
        
    Returns:
        bool: True if valid image
        
    Raises:
        ValueError: If file is not a valid image
    """
    from PIL import Image
    
    try:
        # Reset file pointer to beginning
        image_file.seek(0)
        
        # Verify the image - this will validate the header and basic format
        Image.open(image_file).verify()
        
        # Reset for subsequent reads
        image_file.seek(0)
        
        return True
    except Exception as e:
        logger.warning(f"Image validation failed: {e}")
        raise ValueError(f"Invalid image file: {str(e)}")


def process_image_pipeline(image_file, device_id=''):
    """
    Process an uploaded image through the complete ANPR pipeline.
    
    This function handles:
    1. Image validation (security)
    2. Temporary file creation
    3. YOLO vehicle/plate detection
    4. OCR plate text extraction
    5. Database event creation
    
    Args:
        image_file: Django UploadedFile object
        device_id: Optional device identifier
        
    Returns:
        dict: Response with detections, event_id, and timestamp
        
    Raises:
        ValueError: If image validation fails
    """
    from PIL import Image
    
    from anpr.services.plate_detector import get_detector
    from anpr.services.ocr_reader import get_reader
    from anpr.models import PlateDetection
    
    # Validate image before processing
    validate_image(image_file)
    
    # Get services
    plate_detector = get_detector()
    ocr_reader = get_reader()
    
    # Process detections
    detections = []
    
    # Create temp file for plate detection processing
    with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as tmp:
        for chunk in image_file.chunks():
            tmp.write(chunk)
        temp_path = tmp.name
    
    try:
        if plate_detector and plate_detector.is_available():
            # Run plate detection directly
            plate_detections = plate_detector.detect(temp_path)
            
            # For each detected plate, run OCR on the plate crop
            for det in plate_detections:
                bbox = det.get('bbox')
                
                if ocr_reader and ocr_reader.is_available():
                    # OCR reads the cropped plate (not vehicle)
                    result = ocr_reader.read_plate(temp_path, bbox)
                    text = result['text']
                    conf = result['confidence']
                else:
                    # No OCR available -> keep the detection but do not invent a plate
                    text = "UNKNOWN"
                    conf = 0.0
                
                detections.append({
                    'text': text,
                    'confidence': conf,
                    'bbox': bbox,
                    'class': det.get('class_name', 'plate')
                })
        else:
            # Plate detector not available - log and skip DB save
            logger.warning("Plate detector not available - skipping detection")
            detections = []
            temp_path = None
    
    # Skip DB save if no detections
    if not detections:
        logger.warning(f"Skipping DB save - no detections for device {device_id}")
        return {
            'event_id': None,
            'detections': [],
            'timestamp': None
        }
    finally:
        # Cleanup temp file
        if temp_path and os.path.exists(temp_path):
            os.unlink(temp_path)
    
    # Create detection event in database
    # Use first detection result
    primary_detection = detections[0] if detections else {'text': 'UNKNOWN', 'confidence': 0.0}
    
    # Reset file pointer in case it was consumed
    image_file.seek(0)
    
    event = PlateDetection.objects.create(
        imagen=image_file,
        placa_texto=primary_detection.get('text', 'UNKNOWN'),
        confidence=primary_detection.get('confidence', 0.0),
        device_id=device_id,
        is_active=True
    )
    
    return {
        'event_id': event.id,
        'detections': detections,
        'timestamp': event.created_at.isoformat()
    }
