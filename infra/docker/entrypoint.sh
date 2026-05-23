#!/bin/sh
set -e

echo "==> Creando schema de auditoría..."
python -c "
from django.db import connection
with connection.cursor() as c:
    c.execute('CREATE SCHEMA IF NOT EXISTS auditoria')
" 2>/dev/null || echo "  ⚠ No se pudo crear schema auditoria (continuando...)"

echo "==> Aplicando migraciones..."
python manage.py migrate --noinput

echo "==> Colectando archivos estáticos..."
python manage.py collectstatic --noinput

if [ "$LOAD_DEMO" = "true" ]; then
    echo "==> Cargando datos demo..."
    python manage.py seed_demo
fi

echo "==> Iniciando servidor..."
exec "$@"
