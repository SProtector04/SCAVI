# --- ETAPA 1: Base (Python y dependencias) ---
FROM python:3.12-slim AS base
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV YOLO_CONFIG_DIR=/tmp/Ultralytics
WORKDIR /app
RUN apt-get update && apt-get install -y curl libpq-dev gcc libgl1 libglib2.0-0 tesseract-ocr && rm -rf /var/lib/apt/lists/*
COPY backend/requirements.txt .
RUN pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cpu
RUN pip install --no-cache-dir -r requirements.txt
RUN mkdir -p /opt/models && curl -L https://github.com/ultralytics/assets/releases/download/v8.4.0/yolov8n.pt -o /opt/models/yolov8n.pt

# Crear usuario no-root para producción
RUN userapp --gid 1000 --uid 1000 || useradd -r -g 1000 -u 1000 appuser

# --- ETAPA 2: Development (Target: development) ---
FROM base AS development
USER root
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]

# --- ETAPA 3: Production (Target: production) ---
FROM base AS production
COPY ./backend .
RUN python manage.py collectstatic --noinput
# Cambiar a usuario no-root ( security: NIST guideline )
RUN chown -R 1000:1000 /app
USER 1000
CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "core.asgi:application"]