# Design: anpr-yolo-integration

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      React Frontend                          │
│  - Admin panel: lista de eventos, estadísticas             │
│  - Upload de imágenes para testing                          │
└─────────────────────────────────────────────────────────────┘
                               │
                               │ JWT Auth
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                     Django + DRF + ANPR                      │
├─────────────────────────────────────────────────────────────┤
│  ANPR App (backend/anpr/)                                   │
│  ├── models.py: PlateDetection                              │
│  ├── serializers.py: PlateDetectionSerializer              │
│  ├── views.py: PlateDetectionViewSet                        │
│  ├── urls.py: /api/anpr/ routes                             │
│  └── services/                                             │
│      ├── yolo_detector.py: YOLO detection wrapper          │
│      └── ocr_reader.py: Pytesseract wrapper                 │
├─────────────────────────────────────────────────────────────┤
│  ML Pipeline                                                │
│  ├── YOLOv8: detección de placas (bounding boxes)         │
│  ├── Image preprocessing: crop, grayscale, contrast        │
│  └── Pytesseract: OCR para lectura de texto               │
└─────────────────────────────────────────────────────────────┘
```

## App Structure

```
backend/anpr/
├── __init__.py
├── apps.py
├── models.py          # PlateDetection
├── serializers.py    # PlateDetectionSerializer
├── views.py          # ViewSet
├── urls.py           # Router
├── admin.py          # Django admin
└── services/
    ├── __init__.py
    ├── yolo_detector.py  # YOLO wrapper
    └── ocr_reader.py    # OCR wrapper
```

## Model Definition

```python
# backend/anpr/models.py
class PlateDetection(models.Model):
    imagen = models.ImageField(upload_to='anpr/%Y/%m/%d/')
    placa_texto = models.CharField(max_length=20)
    confidence = models.FloatField()  # 0.0 - 1.0
    device_id = models.CharField(max_length=100, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
```

## API Endpoints

| Method | Endpoint | Permission | Description |
|--------|----------|------------|-------------|
| POST | /api/anpr/detect/ | ADMIN | Enviar imagen, obtener detecciones |
| GET | /api/anpr/events/ | AUTH | Lista de eventos (paginado) |
| GET | /api/anpr/events/{id}/ | AUTH | Detalle de evento |
| DELETE | /api/anpr/events/{id}/ | ADMIN | Soft delete |
| GET | /api/anpr/stats/ | AUTH | Estadísticas |

## YOLO Integration

```python
# services/yolo_detector.py
from ultralytics import YOLO

class YOLODetector:
    def __init__(self, model_name='yolov8n.pt'):
        self.model = YOLO(model_name)
    
    def detect_plates(self, image_path):
        # Run inference
        results = self.model(image_path, verbose=False)
        
        # Extract plate detections
        detections = []
        for r in results:
            boxes = r.boxes
            for box in boxes:
                if box.cls == plate_class:  # license plate class
                    detections.append({
                        'bbox': box.xyxy[0].tolist(),
                        'confidence': float(box.conf[0])
                    })
        return detections
```

## OCR Integration

```python
# services/ocr_reader.py
import cv2
import pytesseract

class OCRReader:
    def read_plate(self, image_path, bbox):
        # Crop region
        img = cv2.imread(image_path)
        x1, y1, x2, y2 = map(int, bbox)
        cropped = img[y1:y2, x1:x2]
        
        # Preprocess
        gray = cv2.cvtColor(cropped, cv2.COLOR_BGR2GRAY)
        gray = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)[1]
        
        # OCR
        text = pytesseract.image_to_string(gray, config='--psm 8')
        return text.strip().upper()
```

## Permissions

```python
# Permisos para ANPR
class IsAdminOrReadOnly(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return request.user.is_authenticated
        return request.user.is_authenticated and request.user.rol == 'ADMIN'
```

## Dependencies

```
# requirements.txt additions
ultralytics>=8.0.0
opencv-python>=4.8.0
pytesseract>=0.3.10
Pillow>=10.0.0
```

## Alternatives Considered

### YOLO Model Size
- **Elegido**: yolov8n.pt (nano) - más rápido, menor RAM
- **Alternativa**: yolov8s.pt (small) - más preciso pero más lento

### OCR Library
- **Elegido**: Pytesseract - gratuito, bueno para matrículas latinas
- **Alternativa**: EasyOCR (más lento pero mejor para imágenes complejas)

### Storage
- **Elegido**: Local filesystem (media/anpr/)
- **Alternativa**: S3/Cloud storage (futuro, cuando tenga más tráfico)

## Gotchas

1. **Tesseract**: Requiere instalación del binario en el sistema (apt-get install tesseract-ocr)
2. **Model download**: Primera ejecución descarga ~6MB
3. **GPU**: Sin GPU, la detección es ~10x más lenta
4. **Image size**: Limitar a 1920x1080 máximo para performance