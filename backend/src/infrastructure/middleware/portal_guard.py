from django.http import JsonResponse


class PortalGuardMiddleware:
    """
    Bloquea el acceso a rutas /portal/* a cualquier usuario que no sea admin_sistema.
    """

    PORTAL_PREFIXES = ('/portal/',)
    AUTH_PATHS = ('/portal/auth/',)

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        path = request.path

        if any(path.startswith(auth_path) for auth_path in self.AUTH_PATHS):
            return self.get_response(request)

        if not any(path.startswith(prefix) for prefix in self.PORTAL_PREFIXES):
            return self.get_response(request)

        if not hasattr(request, 'user') or not request.user.is_authenticated:
            return JsonResponse(
                {'error': 'Autenticación requerida para el portal'},
                status=401,
            )

        if request.user.tipo_usuario != 'admin_sistema':
            return JsonResponse(
                {'error': 'Acceso denegado. Solo administradores del sistema pueden acceder al portal.'},
                status=403,
            )

        return self.get_response(request)
