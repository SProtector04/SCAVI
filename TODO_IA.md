# Tareas Pendientes: Integración de IA (YOLOv8 + OCR)

## Estado Actual
Se ha integrado exitosamente la rama `feature/YOLOV8` a `prueba-de-integracion`. El entorno de Docker ha sido estabilizado, resolviendo los problemas con dependencias del sistema (`libxcb`, `tesseract-ocr`) usando `opencv-python-headless`.
La conexión por WebSockets (Channels) y el endpoint REST están activos.

## Problema Detectado
Actualmente la IA detecta "personas" y "vehículos", pero **NO lee placas**.
Esto se debe a que el modelo cargado por defecto en `yolo_detector.py` es `yolov8n.pt`. Este es el modelo base de COCO, el cual reconoce clases generales (persona, carro, perro, etc.) pero NO está entrenado para ubicar placas de vehículos de forma específica.

## Siguientes Pasos
1. **Conseguir Modelo Entrenado (Custom YOLO Model):** Reemplazar `yolov8n.pt` por un modelo YOLO entrenado específicamente para detectar placas vehiculares (ej. `license_plate_detector.pt`).
2. **Pipeline de Recorte y OCR:** Una vez que el modelo detecte la bounding box de la placa, recortar esa región (ROI), aplicar filtros de OpenCV (escala de grises, binarización) y pasar ese recorte a Tesseract OCR para extraer el texto.
3. **Manejo de Resultados en UI:** Asegurar que el frontend (CameraPage) reciba el evento por WebSocket con el texto real de la placa y lo registre en la base de datos de manera correcta.
