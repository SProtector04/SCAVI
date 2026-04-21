from rest_framework import status, views
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate, get_user_model
from django.conf import settings
import os


User = get_user_model()


def set_jwt_cookies(response, access_token, refresh_token):
    """Helper to set JWT tokens in httpOnly cookies."""
    
    # Determine cookie settings based on DEBUG/environment
    is_prod = os.environ.get('DEBUG', 'True') == 'False'
    
    cookie_settings = {
        'httponly': True,
        'secure': is_prod,
        'samesite': 'None' if is_prod else 'Lax',
        'path': '/',
    }
    
    # Set cookies
    response.set_cookie('access_token', str(access_token), **cookie_settings)
    response.set_cookie('refresh_token', str(refresh_token), **cookie_settings)
    
    return response


def clear_jwt_cookies(response):
    """Helper to clear JWT cookies."""
    
    cookie_settings = {
        'path': '/',
    }
    
    response.delete_cookie('access_token', **cookie_settings)
    response.delete_cookie('refresh_token', **cookie_settings)
    
    return response


class LoginView(views.APIView):
    """
    POST /api/auth/login/
    Authenticates user and returns JWT in httpOnly cookies.
    """
    authentication_classes = []
    permission_classes = [AllowAny]
    
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        
        if not username or not password:
            return Response(
                {'error': 'Username and password required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user = authenticate(username=username, password=password)
        
        if user is None:
            return Response(
                {'error': 'Invalid credentials'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        if not user.is_active:
            return Response(
                {'error': 'User account is disabled'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Generate tokens
        refresh = RefreshToken.for_user(user)
        access_token = refresh.access_token
        
        response = Response({
            'message': 'Login successful',
            'user': {
                'id': user.id,
                'username': user.username,
                'rol': user.rol,
            }
        })
        
        return set_jwt_cookies(response, access_token, refresh)


class LogoutView(views.APIView):
    """
    POST /api/auth/logout/
    Clears JWT cookies.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        response = Response({'message': 'Logout successful'})
        return clear_jwt_cookies(response)


class RefreshView(views.APIView):
    """
    POST /api/auth/refresh/
    Refreshes access token using refresh token from cookie.
    """
    authentication_classes = []
    permission_classes = [AllowAny]
    
    def post(self, request):
        refresh_token = request.COOKIES.get('refresh_token')
        
        if not refresh_token:
            return Response(
                {'error': 'Refresh token not found'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        try:
            refresh = RefreshToken(refresh_token)
            access_token = refresh.access_token
            
            response = Response({'message': 'Token refreshed'})
            return set_jwt_cookies(response, access_token, refresh)
            
        except Exception as e:
            return Response(
                {'error': f'Invalid refresh token: {str(e)}'},
                status=status.HTTP_401_UNAUTHORIZED
            )


class RegisterView(views.APIView):
    """
    POST /api/auth/register/
    Creates a new user with rol ADMIN or SUPERVISOR.
    Only accessible to users with rol ADMIN.
    """
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        # Verificar que el usuario actual es ADMIN
        if request.user.rol != 'ADMIN':
            return Response(
                {'error': 'Solo administradores pueden crear usuarios'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Obtener datos del request
        username = request.data.get('username')
        password = request.data.get('password')
        confirmed_password = request.data.get('confirmPassword')
        rol = request.data.get('rol', 'SUPERVISOR')  # Default a SUPERVISOR
        email = request.data.get('email', '')
        
        # Validaciones
        if not username or not password:
            return Response(
                {'error': 'Username y password son requeridos'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if len(username) < 3:
            return Response(
                {'error': 'El username debe tener al menos 3 caracteres'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if len(password) < 6:
            return Response(
                {'error': 'El password debe tener al menos 6 caracteres'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if password != confirmed_password:
            return Response(
                {'error': 'Los passwords no coinciden'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if rol not in ['ADMIN', 'SUPERVISOR']:
            return Response(
                {'error': 'Rol inválido. Debe ser ADMIN o SUPERVISOR'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verificar que el username no exista
        if User.objects.filter(username=username).exists():
            return Response(
                {'error': 'El username ya existe'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Crear el usuario
        try:
            new_user = User.objects.create_user(
                username=username,
                password=password,
                email=email,
                rol=rol,
            )
            
            return Response({
                'message': 'Usuario creado exitosamente',
                'user': {
                    'id': new_user.id,
                    'username': new_user.username,
                    'email': new_user.email,
                    'rol': new_user.rol,
                }
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {'error': f'Error al crear usuario: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )


class CurrentUserView(views.APIView):
    """
    GET /api/auth/me/
    Returns current authenticated user info.
    PATCH /api/auth/me/
    Update current user profile.
    """
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'rol': user.rol,
            'is_active': user.is_active,
        })
    
    def patch(self, request):
        user = request.user
        data = request.data
        
        # Update allowed fields
        if 'first_name' in data:
            user.first_name = data['first_name']
        if 'last_name' in data:
            user.last_name = data['last_name']
        if 'email' in data:
            user.email = data['email']
        
        user.save()
        
        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'rol': user.rol,
            'is_active': user.is_active,
        })
