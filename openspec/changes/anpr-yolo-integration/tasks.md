# Tasks: anpr-yolo-integration

## Phase 1: Dependencies & Setup

- [ ] T1.1 Agregar dependencias (ultralytics, opencv-python, pytesseract, Pillow) a requirements.txt
- [ ] T1.2 Crear app Django `anpr` con `python manage.py startapp anpr`
- [ ] T1.3 Agregar `'anpr'` a INSTALLED_APPS en settings
- [ ] T1.4 Configurar MEDIA_URL y MEDIA_ROOT para guardar imágenes

## Phase 2: Models

- [ ] T2.1 Crear modelo `PlateDetection` en `anpr/models.py`
- [ ] T2.2 Agregar `is_active` para soft delete
- [ ] T2.3 Crear migración inicial

## Phase 3: YOLO Detection Service

- [ ] T3.1 Crear directorio `anpr/services/`
- [ ] T3.2 Crear `yolo_detector.py` con clase `YOLODetector`
- [ ] T3.3 Implementar método `detect_plates(image_path)`
- [ ] T3.4 Agregar fallback si no hay modelo

## Phase 4: OCR Service

- [ ] T4.1 Crear `ocr_reader.py` con clase `OCRReader`
- [ ] T4.2 Implementar pre-procesamiento de imagen (grayscale, threshold)
- [ ] T4.3 Implementar lectura de texto con pytesseract
- [ ] T4.4 Agregar manejo de errores y fallback "UNKNOWN"

## Phase 5: API Endpoints

- [ ] T5.1 Crear serializers en `anpr/serializers.py`
- [ ] T5.2 Crear views con ViewSet en `anpr/views.py`
- [ ] T5.3 Configurar URL routing en `anpr/urls.py`
- [ ] T5.4 Incluir en `api/urls.py` con prefijo `/api/anpr/`

## Phase 6: Permissions & Auth

- [ ] T6.1 Crear permission class `IsAdminOrReadOnly`
- [ ] T6.2 Aplicar permission_classes a views
- [ ] T6.3 Proteger todos los endpoints con JWT auth

## Phase 7: Admin Panel

- [ ] T7.1 Configurar Django admin para PlateDetection
- [ ] T7.2 Agregar filtros por fecha y device_id
- [ ] T7.3 Crear endpoint de estadísticas `/api/anpr/stats/`

## Phase 8: Testing & Integration

- [ ] T8.1 Probar endpoint de detección con imagen de prueba
- [ ] T8.2 Verificar que las imágenes se guardan en media/anpr/
- [ ] T8.3 Verificar que el listado muestra las detecciones