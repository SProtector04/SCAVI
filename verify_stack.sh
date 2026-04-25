#!/bin/bash
# ==============================================================================
# SCAVI Integrity Check Script (Linux/Mac/WSL)
# ------------------------------------------------------------------------------
# Corre las pruebas críticas (unitarias e integración del backend) para validar 
# el estado actual de la plataforma antes de cualquier merge.
# ==============================================================================

echo "=========================================="
echo "🛡️ INICIANDO CHEQUEO DE INTEGRIDAD SCAVI..."
echo "=========================================="

echo "[1/2] Verificando que Docker esté corriendo..."
if ! docker info > /dev/null 2>&1; then
  echo "❌ ERROR: Docker no está corriendo o no tenés permisos. Levantá Docker y volvé a intentar."
  exit 1
fi

echo "[2/2] Ejecutando pruebas unitarias y de integración del Backend (Django)..."
docker compose exec api python manage.py test api.tests trafico.tests infraestructura.tests --verbosity=2

TEST_EXIT_CODE=$?

if [ $TEST_EXIT_CODE -eq 0 ]; then
  echo "=========================================="
  echo "✅ ¡INTEGRIDAD APROBADA! Todos los tests pasaron exitosamente."
  echo "=========================================="
  exit 0
else
  echo "=========================================="
  echo "❌ FALLÓ LA INTEGRIDAD DEL STACK. Hay pruebas que no están pasando."
  echo "Por favor, revisá el output arriba, corregí los errores y volvé a correr este script."
  echo "=========================================="
  exit 1
fi