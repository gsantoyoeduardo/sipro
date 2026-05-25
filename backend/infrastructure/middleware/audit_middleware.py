import threading


class AuditMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        threading.current_thread().current_request = request
        response = self.get_response(request)
        threading.current_thread().current_request = None
        return response
