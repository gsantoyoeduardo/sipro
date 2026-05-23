from django.utils.deprecation import MiddlewareMixin

class DisableCSRFMiddleware(MiddlewareMixin):
    """
    Desactiva la verificación CSRF para requests que usan JWT (Bearer token).

    Motivo: Las APIs REST con autenticación JWT no usan cookies de sesión,
    por lo que el CSRF de Django no aplica. Este middleware跳过 la verificación
    cuando detecta un header Authorization: Bearer.
    """
    def process_request(self, request):
        if request.META.get('HTTP_AUTHORIZATION', '').startswith('Bearer '):
            setattr(request, '_dont_enforce_csrf_checks', True)
