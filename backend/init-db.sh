#!/bin/bash
# Inicializa PostgreSQL con principio de menor privilegio
# Procesa variables de entorno via envsubst

set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
	-- Crear usuario app dedicado (no superuser)
	DO \$\$
	BEGIN
	  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '${DB_USER}') THEN
	    CREATE USER "${DB_USER}" WITH PASSWORD '${DB_PASSWORD}';
	  END IF;
	END
	\$\$;

	-- Conceder privilegios mínimos necesarios para Django
	GRANT CONNECT ON DATABASE "${DB_NAME}" TO "${DB_USER}";
	GRANT USAGE ON SCHEMA public TO "${DB_USER}";

	-- Permisos estándar para migraciones Django
	GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO "${DB_USER}";
	GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO "${DB_USER}";

	-- Default para futuras tablas
	ALTER DEFAULT PRIVILEGES IN SCHEMA public
	GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO "${DB_USER}";

	ALTER DEFAULT PRIVILEGES IN SCHEMA public
	GRANT USAGE ON SEQUENCES TO "${DB_USER}";
EOSQL

echo "Init DB completed successfully"