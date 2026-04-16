# --- ETAPA 1: Base (Python y dependencias) ---
FROM python:3.12-slim AS base
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
WORKDIR /app
RUN apt-get update && apt-get install -y curl libpq-dev gcc && rm -rf /var/lib/apt/lists/*
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# --- ETAPA 2: Development (Target: development) ---
FROM base AS development
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]

# --- ETAPA 3: Production (Target: production) ---
FROM base AS production
COPY ./backend .
RUN python manage.py collectstatic --noinput
CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "core.asgi:application"]