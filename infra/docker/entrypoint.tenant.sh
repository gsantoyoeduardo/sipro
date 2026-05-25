#!/bin/sh
set -e

echo "==> Colectando archivos estáticos..."
python manage.py collectstatic --noinput

echo "==> Iniciando servidor (tenant-api)..."
exec "$@"
