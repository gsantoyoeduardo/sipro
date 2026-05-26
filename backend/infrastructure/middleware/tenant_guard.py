from django.http import JsonResponse


class TenantGuardMiddleware:

    TENANT_PREFIXES = ('/tenant/',)
    AUTH_PATHS = ('/tenant/auth/', '/tenant/swagger/', '/tenant/redoc/', '/tenant/schema/')

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        path = request.path

        if any(path.startswith(auth_path) for auth_path in self.AUTH_PATHS):
            return self.get_response(request)

        if not any(path.startswith(prefix) for prefix in self.TENANT_PREFIXES):
            return self.get_response(request)

        if request.META.get('HTTP_AUTHORIZATION', '').startswith('Bearer '):
            return self.get_response(request)

        if not hasattr(request, 'user') or not request.user.is_authenticated:
            return JsonResponse(
                {'error': 'Autenticación requerida para el tenant'},
                status=401,
            )

        if request.user.tipo_usuario not in ('admin_empresa', 'operador'):
            return JsonResponse(
                {'error': 'Acceso denegado. Solo usuarios de empresa pueden acceder a este recurso.'},
                status=403,
            )

        idempresa_token = getattr(request.user, 'idempresa_id', None) or getattr(request.user, 'idempresa', None)
        tenant_header = request.headers.get('X-Tenant-ID') or request.GET.get('tenant_id')

        if idempresa_token and tenant_header:
            if str(idempresa_token) != str(tenant_header):
                return JsonResponse(
                    {'error': 'El tenant solicitado no corresponde a su empresa.'},
                    status=403,
                )

        return self.get_response(request)
