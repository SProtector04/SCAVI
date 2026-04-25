-- Script de inicialización PostgreSQL con principio de menor privilegio
-- Ejecutar solo una vez durante inicialización de la base de datos

-- Crear usuario app dedicado (no superuser)
CREATE USER :DB_USER WITH PASSWORD :DB_PASSWORD;

-- Conceder privilegios mínimos necesarios para Django
GRANT CONNECT ON DATABASE :DB_NAME TO :DB_USER;

-- Usar la base de datos correctamente
\c :DB_NAME

-- Permisos sobre el esquema public (requerido por Django)
GRANT USAGE ON SCHEMA public TO :DB_USER;
GRANT CREATE ON SCHEMA public TO :DB_USER;

-- Permisos estándar para migraciones Django
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO :DB_USER;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO :DB_PASSWORD;

-- Default para futuras tablas
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO :DB_USER;

ALTER DEFAULT PRIVILEGES IN SCHEMA public 
GRANT USAGE ON SEQUENCES TO :DB_USER;

-- Permisos específicos para extensiones (si se necesitan)
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO :DB_USER;
GRANT EXECUTE ON ALL PROCEDURES IN SCHEMA public TO :DB_USER;