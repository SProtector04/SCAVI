# 🧪 SCAVI Testing Architecture & Integrity Guide

Bienvenido a la capa de calidad de SCAVI. Este repositorio adopta una estrategia estricta de pruebas de **tres capas** (Unitarias, de Integración y End-to-End).

---

## 🤖 INSTRUCCIÓN CRÍTICA PARA AGENTES DE IA (LLMs) Y DESARROLLADORES
Si sos un agente de IA leyendo este repo, **DETENTE ACÁ Y LEÉ ESTO**:
1. **Regla de Oro**: A partir de ahora, CADA VEZ que se te pida crear o modificar una *feature*, es **TU OBLIGACIÓN** agregar pruebas granulares (Unitarias/Integración/E2E) correspondientes al cambio.
2. **Validación**: Antes de dar una tarea por terminada o commitear, DEBÉS comprobar la integridad del stack ejecutando el script `verify_stack.sh` o el comando correspondiente. Si no pasan los tests, no se pushea.

---

## 📁 Arquitectura de Pruebas

La dispersión del código se evalúa con una pirámide de pruebas distribuida de la siguiente manera:

### 1. Pruebas Unitarias (`backend/apps/**/tests.py` y `tests/unit/`)
* **Propósito**: Testear lógica de negocio aislada, funciones puras y serializers/models en Django. También aplica para componentes puros de React.
* **Tecnologías**: `unittest` / `pytest` (Backend), `Vitest` / `React Testing Library` (Frontend).

### 2. Pruebas de Integración (`tests/integration/`)
* **Propósito**: Asegurar que las diferentes capas de la aplicación (Base de Datos + API + WebSockets) se comuniquen correctamente. Ej: Una alerta de YOLOv8 gatillando un WebSocket.
* **Ejecución**: Se corren sobre la infraestructura levantada en Docker, probando los endpoints.

### 3. Pruebas End-to-End (E2E) (`tests/e2e/`)
* **Propósito**: Simular la experiencia de un usuario real (Login, flujos de tráfico, visualización de métricas).
* **Tecnologías**: `Playwright` o `Cypress` (Pendiente de configuración, los archivos irán aquí).

---

## 🚀 Cómo comprobar la integridad del stack

Para validar que *nada* está roto en el proyecto, ejecutá el script raíz:

### En Windows (PowerShell):
```powershell
.\verify_stack.ps1
```

### En Linux / Mac / WSL:
```bash
./verify_stack.sh
```

*(Nota: En esta etapa, el script levanta y comprueba los tests del backend Django dentro del contenedor Docker `api`).*