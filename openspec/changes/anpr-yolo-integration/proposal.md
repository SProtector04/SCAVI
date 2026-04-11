# Proposal: anpr-yolo-integration

## Intent

Integrar un sistema de ANPR (Automatic Number Plate Recognition) basado en YOLO para detección y reconocimiento de placas vehiculares en tiempo real, con almacenamiento de eventos y panel administrativo.

## Scope

### Included
1. **Detección de placas**: Modelo YOLOv8 para detección de vehículos y placas en imágenes/video
2. **OCR de placas**: Pytesseract para lectura de texto de matrículas
3. **API de procesamiento**: Endpoint para recibir imágenes y retornar placas detectadas
4. **Registro de eventos**: Modelo para almacenar detección con marca temporal
5. **Panel administrativo**: Views para visualizar registros, estadísticas y actividad en tiempo real
6. **Autenticación**: Solo usuarios autenticados con permisos pueden acceder

### Excluded
- UI móvil nativa (solo API REST)
- Notificaciones push
- Integración con sistemas externos (base de datos de vehículos)
- Hardware de cámaras (solo integración por API)

## Risks

- **Riesgo medio**: Modelos YOLO requieren GPU para inferencia rápida (CPU posible pero lento)
- **Riesgo bajo**: OCR puede fallar con imágenes de baja calidad
- **Riesgo bajo**: Almacenamiento de imágenes puede crecer rápido (necesita limpieza)

## Acceptance Criteria

| Criterio | Definición |
|----------|------------|
| AC1 | Endpoint `/api/anpr/detect/` acepta imagen y retorna placas detectadas |
| AC2 | Cada detección se almacena con timestamp, imagen y resultado OCR |
| AC3 | Panel admin muestra lista de detecciones con filtros por fecha |
| AC4 | Solo usuarios con rol ADMIN pueden acceder a endpoints de detección |
| AC5 | Endpoint `/api/anpr/stats/` retorna estadísticas de detecciones |

## Approach

1. Crear app Django `anpr` para aislar lógica de reconocimiento
2. Usar YOLOv8 de Ultralytics para detección
3. Usar Pytesseract para OCR (requiere instalar tesseract-ocr)
4. Serializers y views para CRUD de eventos
5. Integrar con sistema de auth existente (JWT cookies)