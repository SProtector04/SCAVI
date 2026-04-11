"""
OCR Plate Reading Service

Wrapper around Pytesseract for reading license plate text from images.
"""
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

# Try to import pytesseract, handle gracefully if not available
try:
    import pytesseract
    PYTESSERACT_AVAILABLE = True
except ImportError:
    PYTESSERACT_AVAILABLE = False
    logger.warning("Pytesseract not installed. OCR will be disabled.")

# Try to import opencv
try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False
    logger.warning("OpenCV not installed. Image preprocessing will be limited.")


class OCRReader:
    """
    OCR reader for license plates using Pytesseract.
    
    Includes image preprocessing for better recognition:
    - Grayscale conversion
    - Contrast enhancement
    - Thresholding
    """
    
    def __init__(self, tesseract_cmd: str = None):
        """
        Initialize OCR reader.
        
        Args:
            tesseract_cmd: Path to tesseract executable (optional)
        """
        if not PYTESSERACT_AVAILABLE:
            raise RuntimeError("Pytesseract not installed. Install with: pip install pytesseract")
        
        if tesseract_cmd:
            pytesseract.pytesseract.tesseract_cmd = tesseract_cmd
        
        self._check_tesseract()
    
    def _check_tesseract(self):
        """Check if tesseract is available."""
        try:
            version = pytesseract.get_tesseract_version()
            logger.info(f"Tesseract version: {version}")
        except Exception as e:
            logger.error(f"Tesseract not found: {e}")
            logger.warning("Install Tesseract: apt-get install tesseract-ocr (Linux) or download from UB-Mannheim")
    
    def preprocess_image(self, image_path: str, bbox: list = None) -> 'numpy.ndarray':
        """
        Preprocess image for better OCR results.
        
        Args:
            image_path: Path to image file
            bbox: Optional [x1, y1, x2, y2] to crop region first
            
        Returns:
            Preprocessed image as numpy array
        """
        if not CV2_AVAILABLE:
            raise RuntimeError("OpenCV not installed")
        
        # Read image
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError(f"Could not read image: {image_path}")
        
        # Crop to bbox if provided
        if bbox:
            x1, y1, x2, y2 = map(int, bbox)
            img = img[max(0, y1):y2, max(0, x1):x2]
        
        # Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Apply CLAHE for contrast enhancement
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        gray = clahe.apply(gray)
        
        # Apply thresholding (Otsu's method)
        _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)
        
        # Denoise
        thresh = cv2.medianBlur(thresh, 3)
        
        return thresh
    
    def read_text(self, image_path: str, bbox: list = None) -> str:
        """
        Read text from an image (or region).
        
        Args:
            image_path: Path to image file
            bbox: Optional [x1, y1, x2, y2] to crop region first
            
        Returns:
            Extracted text, cleaned and uppercased
        """
        if not PYTESSERACT_AVAILABLE:
            return "OCR_UNAVAILABLE"
        
        try:
            # Preprocess
            processed = self.preprocess_image(image_path, bbox)
            
            # Configure pytesseract for license plates
            # PSM 8: Treat image as single line of text
            config = '--psm 8 --oem 3 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
            
            # Run OCR
            text = pytesseract.image_to_string(processed, config=config)
            
            # Clean result
            text = text.strip().upper()
            text = ''.join(c for c in text if c.isalnum())  # Remove non-alphanumeric
            
            # Fallback if empty
            if not text:
                text = "UNKNOWN"
            
            return text
            
        except Exception as e:
            logger.error(f"OCR failed: {e}")
            return "OCR_ERROR"
    
    def read_plate(self, image_path: str, bbox: list = None) -> dict:
        """
        Read plate from image with confidence estimation.
        
        Args:
            image_path: Path to image file
            bbox: Optional [x1, y1, x2, y2] bounding box of plate
            
        Returns:
            Dict with 'text' and 'confidence' keys
        """
        text = self.read_text(image_path, bbox)
        
        # Estimate confidence based on text quality
        # Length check and character variety
        confidence = 0.5  # Base confidence
        
        if text != "UNKNOWN" and text != "OCR_ERROR" and text != "OCR_UNAVAILABLE":
            # Higher confidence for reasonable length plates (4-10 chars)
            if 4 <= len(text) <= 10:
                confidence += 0.3
            # Lower for very short or long
            elif len(text) < 4 or len(text) > 10:
                confidence -= 0.2
            
            # Boost if contains both letters and numbers
            has_letters = any(c.isalpha() for c in text)
            has_numbers = any(c.isdigit() for c in text)
            if has_letters and has_numbers:
                confidence += 0.1
        
        return {
            'text': text,
            'confidence': min(1.0, max(0.0, confidence))
        }
    
    def is_available(self) -> bool:
        """Check if OCR is available."""
        return PYTESSERACT_AVAILABLE


# Singleton instance
_reader_instance = None


def get_reader() -> OCRReader:
    """Get or create OCR reader instance."""
    global _reader_instance
    if _reader_instance is None:
        try:
            _reader_instance = OCRReader()
        except Exception as e:
            logger.error(f"Failed to create OCR reader: {e}")
            return None
    return _reader_instance