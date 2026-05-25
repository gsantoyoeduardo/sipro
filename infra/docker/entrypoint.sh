#!/bin/sh
set -e

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
