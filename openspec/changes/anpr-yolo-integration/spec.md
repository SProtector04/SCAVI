# Specification: anpr-yolo-integration

## Requirements

### R1: YOLO Plate Detection
- **R1.1**: Integrar YOLOv8 de Ultralytics para detección de vehículos/placas
- **R1.2**: Soporte para imágenes (JPEG, PNG) y frames de video
- **R1.3**: Retorna bounding boxes de placas detectadas con confidence score
- **R1.4**: Descargar modelo automáticamente en primera ejecución (yolov8n.pt)

### R2: OCR Plate Reading
- **R2.1**: Usar Pytesseract para extraer texto de regiones de placa
- **R2.2**: Pre-procesar imagen (grayscale, contrast) antes de OCR
- **R2.3**: Limpiar resultado (remover espacios, caracteres inválidos)
- **R2.4**: Fallback: retornar "UNKNOWN" si OCR falla

### R3: ANPR API Endpoints
- **R3.1**: POST `/api/anpr/detect/` - Recibe imagen, retorna detecciones
- **R3.2**: GET `/api/anpr/events/` - Lista de eventos con paginación
- **R3.3**: GET `/api/anpr/events/<id>/` - Detalle de un evento
- **R3.4**: GET `/api/anpr/stats/` - Estadísticas (total, por día, por hora)
- **R3.5**: DELETE `/api/anpr/events/<id>/` - Eliminar evento (admin only)

### R4: Event Storage
- **R4.1**: Modelo `PlateDetection` con campos: imagen, placa_texto, confidence, timestamp, device_id
- **R4.2**: Guardar imagen original en media/anpr/
- **R4.3**: Filtrar por fecha, device_id, placa_texto
- **R4.4**: Soft delete (is_active=False) en lugar de hard delete

### R5: Admin Panel
- **R5.1**: Serializers con campos: id, imagen_url, placa_texto, confidence, timestamp, device_id
- **R5.2**: ViewSet con filters: fecha_inicio, fecha_fin, device_id
- **R5.3**: Ordenar por timestamp descendente por defecto
- **R5.4**: Permission class: solo ADMIN puede crear/eliminar, supervisores pueden leer

### R6: Authentication & Authorization
- **R6.1**: Todos los endpoints requieren autenticación JWT
- **R6.2**: Solo rol ADMIN puede acceder a POST /detect/ y DELETE
- **R6.3**: Rol SUPERVISOR puede leer eventos y estadísticas

## Scenarios

### S1: Detect Plate from Image
1. Cliente envía POST a `/api/anpr/detect/` con imagen en form-data
2. Backend carga YOLO, detecta vehículos/placas en imagen
3. Para cada placa: aplica OCR y extrae texto
4. Guarda evento en DB con imagen, texto, confidence, timestamp
5. Retorna lista de detecciones con información

### S2: List Events
1. Cliente envía GET a `/api/anpr/events/`
2. Filtra por query params (fecha_inicio, fecha_fin, device_id)
3. Retorna paginado (20 por página)
4. Incluye URL de imagen

### S3: Get Statistics
1. Cliente envía GET a `/api/anpr/stats/`
2. Calcula: total detections, detections today, detections this week
3. Retorna JSON con contadores

### S4: Admin Delete Event
1. ADMIN envía DELETE a `/api/anpr/events/<id>/`
2. Soft delete (is_active=False)
3. Retorna 204 No Content