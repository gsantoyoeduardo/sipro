import uuid
import threading
from django.db import connection

_local = threading.local()

VALID_UUID_RE = None

def _valid_uuid(value):
    try:
        uuid.UUID(str(value))
        return True
    except (ValueError, AttributeError):
        return False

class TenantMiddleware:
    """
    Middleware que aísla cada empresa en su propio schema de PostgreSQL.

    ¿Cómo funciona?
    1. Antes de cada request, lee el idempresa del usuario autenticado
    2. Ejecuta SET search_path = 'empresa_{id}', public, auditoria
    3. Todas las queries de Django durante este request van al schema correcto
    4. Al finalizar, restaura: SET search_path = public, auditoria

    Esto permite que múltiples empresas compartan la misma base de datos
    sin que sus datos se mezclen (multi-tenant schema-based).
    """
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        schema = 'public'
        idempresa = None

        if hasattr(request, 'user') and request.user.is_authenticated:
            idempresa = getattr(request.user, 'idempresa_id', None) or getattr(request.user, 'idempresa', None)
            if idempresa and _valid_uuid(idempresa):
                schema = f'empresa_{idempresa}'
                request.idempresa = idempresa
            else:
                request.idempresa = None
        else:
            request.idempresa = None

        with connection.cursor() as cursor:
            cursor.execute(f'SET search_path = "{schema}", public, auditoria')

        _local.current_tenant = schema

        try:
            response = self.get_response(request)
        finally:
            with connection.cursor() as cursor:
                cursor.execute('SET search_path = public, auditoria')
            _local.current_tenant = 'public'

        return response

def get_current_tenant():
    return getattr(_local, 'current_tenant', 'public')

def set_tenant_schema(schema_name):
    with connection.cursor() as cursor:
        cursor.execute(f'SET search_path = "{schema_name}", public, auditoria')
    _local.current_tenant = schema_name

def reset_tenant_schema():
    with connection.cursor() as cursor:
        cursor.execute('SET search_path = public, auditoria')
    _local.current_tenant = 'public'
