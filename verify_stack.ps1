<#
.SYNOPSIS
SCAVI Integrity Check Script (Windows / PowerShell)

.DESCRIPTION
Corre las pruebas críticas (unitarias e integración del backend) para validar 
el estado actual de la plataforma antes de cualquier merge en entornos Windows.
#>

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "🛡️ INICIANDO CHEQUEO DE INTEGRIDAD SCAVI..." -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

Write-Host "[1/2] Verificando que Docker esté corriendo..."
try {
    $dockerInfo = docker info 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ ERROR: Docker no está corriendo o no tenés permisos. Levantá Docker y volvé a intentar." -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ ERROR: Docker no está corriendo o no tenés permisos." -ForegroundColor Red
    exit 1
}

Write-Host "[2/2] Ejecutando pruebas unitarias y de integración del Backend (Django)..."
docker compose exec api python manage.py test api.tests trafico.tests infraestructura.tests --verbosity=2

if ($LASTEXITCODE -eq 0) {
    Write-Host "==========================================" -ForegroundColor Green
    Write-Host "✅ ¡INTEGRIDAD APROBADA! Todos los tests pasaron exitosamente." -ForegroundColor Green
    Write-Host "==========================================" -ForegroundColor Green
    exit 0
} else {
    Write-Host "==========================================" -ForegroundColor Red
    Write-Host "❌ FALLÓ LA INTEGRIDAD DEL STACK. Hay pruebas que no están pasando." -ForegroundColor Red
    Write-Host "Por favor, revisá el output arriba, corregí los errores y volvé a correr este script." -ForegroundColor Red
    Write-Host "==========================================" -ForegroundColor Red
    exit 1
}