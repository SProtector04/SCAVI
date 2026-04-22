from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, AuthenticationFailed
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _
import hashlib
import os

User = get_user_model()


class JWTCookieAuthentication(JWTAuthentication):
    """
    Custom JWT authentication that reads tokens from HTTP-only cookies.
    """
    
    def authenticate(self, request):
        import logging
        logger = logging.getLogger(__name__)
        
        # Try to get access token from cookie
        access_token = request.COOKIES.get('access_token')
        
        logger.info(f"[JWTCookieAuth] COOKIES received: {request.COOKIES.keys()}")
        
        if access_token is None:
            logger.info("[JWTCookieAuth] No access_token cookie found.")
            return None  # No token, let other auth methods try
        
        # Validate the token
        try:
            validated_token = self.get_validated_token(access_token)
        except InvalidToken as e:
            logger.warning(f"[JWTCookieAuth] InvalidToken: {e}")
            return None
        except Exception as e:
            logger.error(f"[JWTCookieAuth] Exception validating token: {e}")
            return None
        
        # Get user from token
        try:
            user = self.get_user(validated_token)
            logger.info(f"[JWTCookieAuth] Authenticated user: {user.username}")
        except User.DoesNotExist:
            logger.warning("[JWTCookieAuth] User from token does not exist.")
            return None
        
        return (user, validated_token)
    
    def get_validated_token(self, raw_token):
        """
        Validates the provided token and returns the validated token instance.
        """
        from rest_framework_simplejwt.token_blacklist.models import BlacklistedToken
        from rest_framework_simplejwt.tokens import RefreshToken
        
        # Use SimpleJWT's token validation
        return super().get_validated_token(raw_token)


class DeviceAPIKeyAuthentication:
    """
    Authentication class for device ingestion via API key in header.
    
    Usage:
        Send header X-Device-Key: <api_key>
    
    The API key is validated against a hash stored in the database.
    """
    
    def authenticate(self, request):
        api_key = request.META.get('HTTP_X_DEVICE_KEY')
        
        if not api_key:
            return None
        
        # Hash the provided key
        key_hash = hashlib.sha256(api_key.encode()).hexdigest()
        
        # In production, this would query a Device model
        # For now, we check against an environment variable only
        dev_key = os.environ.get('DEVICE_API_KEY')
        if not dev_key:
            return None

        dev_key_hash = hashlib.sha256(dev_key.encode()).hexdigest()
        
        if key_hash == dev_key_hash:
            # Return a simple user-like object for device
            # In production, this would be a Device model instance
            return (DeviceUser(), None)
        
        return None
    
    def authenticate_header(self, request):
        return 'X-Device-Key'


class DeviceUser:
    """
    Placeholder user object for device authentication.
    In production, this would be replaced by a proper Device model.
    """
    
    def __init__(self):
        self.username = 'device'
        self.is_authenticated = True
        self.rol = 'DEVICE'
    
    def __str__(self):
        return self.username
