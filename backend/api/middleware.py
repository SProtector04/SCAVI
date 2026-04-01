import logging
from .models import AccessLog

logger = logging.getLogger(__name__)

class RequestLoggingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        self.ignored_routes = ['/admin', '/api/access_logs']

    def __call__(self, request):
        response = self.get_response(request)
        
        if any(request.path.startswith(route) for route in self.ignored_routes):
            return response
        
        # usuario_actual = request.user if request.user.is_authenticated else None
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip_address = x_forwarded_for.split(',')[0].strip()
        else:
            ip_address = request.META.get('HTTP_X_REAL_IP') or request.META.get('REMOTE_ADDR')
        
        try:
            AccessLog.objects.create(
                endpoint=request.path,
                method=request.method,
                ip_address=ip_address
                #usuario=usuario_actual
                #accion=f"{request.method} {request.path}"
            )
        
        except Exception:
            logger.exception("Error guardando AccessLog en la base de datos")
            
        return response