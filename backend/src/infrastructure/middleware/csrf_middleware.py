from django.utils.deprecation import MiddlewareMixin


class DisableCSRFMiddleware(MiddlewareMixin):
    def process_request(self, request):
        if request.META.get('HTTP_AUTHORIZATION', '').startswith('Bearer '):
            setattr(request, '_dont_enforce_csrf_checks', True)
