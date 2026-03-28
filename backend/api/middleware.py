from .models import AccessLog

class RequestLoggingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        self.ignored_routes = ['/admin/', '/api/accesslogs/']

    def __call__(self, request):
        response = self.get_response(request)
        
        if any(request.path.startswith(route) for route in self.ignored_routes):
            return response
        # Obtenemos el usuario solo si está autenticado
        # usuario_actual = request.user if request.user.is_authenticated else None
        ip_address = request.META.get('REMOTE_ADDR')

        real_ip = request.META.get('HTTP_X_REAL_IP')
        
        try:
            AccessLog.objects.create(
            endpoint=request.path,
            method=request.method,
            ip_address=real_ip or ip_address
            #usuario=usuario_actual
            #accion=f"{request.method} {request.path}"
        )
        
        except Exception as e:
            print(f"Error guardando AccessLog: {e}")
            
        return response