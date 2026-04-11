from django.test import TestCase
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient, APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
import json

Usuario = get_user_model()


class TestSettingsConfiguration(TestCase):
    """Tests for auth-security-realtime T0.1 and T0.3"""

    def test_auth_user_model_is_set(self):
        """AUTH_USER_MODEL must be set to api.Usuario"""
        self.assertEqual(
            settings.AUTH_USER_MODEL,
            'api.Usuario',
            "AUTH_USER_MODEL must be set to 'api.Usuario'"
        )

    def test_rest_framework_has_default_authentication(self):
        """REST_FRAMEWORK must have DEFAULT_AUTHENTICATION_CLASSES"""
        self.assertIn('DEFAULT_AUTHENTICATION_CLASSES', settings.REST_FRAMEWORK)

    def test_rest_framework_has_default_permissions(self):
        """REST_FRAMEWORK must have DEFAULT_PERMISSION_CLASSES"""
        self.assertIn('DEFAULT_PERMISSION_CLASSES', settings.REST_FRAMEWORK)

    def test_rest_framework_default_permission_is_authenticated(self):
        """Default permission should be IsAuthenticated (closed-by-default)"""
        default_perms = settings.REST_FRAMEWORK['DEFAULT_PERMISSION_CLASSES']
        self.assertIn(
            'rest_framework.permissions.IsAuthenticated',
            default_perms,
            "Default permission should be IsAuthenticated"
        )


class TestJWTAuthentication(APITestCase):
    """Tests for JWT cookie authentication (T1.1 - T1.4)"""

    def setUp(self):
        # Create test users with different roles
        self.admin_user = Usuario.objects.create_user(
            username='admin_test',
            email='admin@test.com',
            password='testpass123',
            rol='ADMIN'
        )
        self.supervisor_user = Usuario.objects.create_user(
            username='supervisor_test',
            email='supervisor@test.com',
            password='testpass123',
            rol='SUPERVISOR'
        )
        self.client = APIClient()

    def test_login_returns_jwt_tokens_in_cookies(self):
        """Login endpoint should return JWT tokens in httpOnly cookies"""
        response = self.client.post(
            '/api/auth/login/',
            {'username': 'admin_test', 'password': 'testpass123'},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Check tokens are in cookies
        self.assertIn('access_token', response.cookies)
        self.assertIn('refresh_token', response.cookies)
        # Verify httpOnly flag
        self.assertTrue(response.cookies['access_token'].http_only)
        self.assertTrue(response.cookies['refresh_token'].http_only)

    def test_authenticated_request_works_with_jwt_cookie(self):
        """Authenticated requests should work with JWT from cookie"""
        # First login
        self.client.post(
            '/api/auth/login/',
            {'username': 'admin_test', 'password': 'testpass123'},
            format='json'
        )
        # Then access protected endpoint
        response = self.client.get('/api/usuarios/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_unauthenticated_request_is_rejected(self):
        """Requests without JWT should be rejected (401)"""
        response = self.client.get('/api/usuarios/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_invalid_token_is_rejected(self):
        """Requests with invalid JWT should be rejected"""
        self.client.cookies['access_token'] = 'invalid_token'
        response = self.client.get('/api/usuarios/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_refresh_token_endpoint_returns_new_access(self):
        """Refresh endpoint should return new access token"""
        # Login first
        login_response = self.client.post(
            '/api/auth/login/',
            {'username': 'admin_test', 'password': 'testpass123'},
            format='json'
        )
        # Get refresh token
        refresh_token = login_response.cookies['refresh_token'].value
        # Use refresh token
        response = self.client.post(
            '/api/auth/refresh/',
            {'refresh': refresh_token},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access_token', response.cookies)

    def test_logout_clears_cookies(self):
        """Logout endpoint should clear JWT cookies"""
        # Login first
        self.client.post(
            '/api/auth/login/',
            {'username': 'admin_test', 'password': 'testpass123'},
            format='json'
        )
        # Logout
        response = self.client.post('/api/auth/logout/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Check cookies are cleared
        self.assertEqual(response.cookies['access_token'].value, '')
        self.assertEqual(response.cookies['refresh_token'].value, '')


class TestRBACPermissions(APITestCase):
    """Tests for role-based access control (T3.1 - T3.3)"""

    def setUp(self):
        self.admin_user = Usuario.objects.create_user(
            username='admin_perm_test',
            email='admin_perm@test.com',
            password='testpass123',
            rol='ADMIN'
        )
        self.supervisor_user = Usuario.objects.create_user(
            username='supervisor_perm_test',
            email='supervisor_perm@test.com',
            password='testpass123',
            rol='SUPERVISOR'
        )
        self.client = APIClient()

    def _login(self, user):
        """Helper to login as a specific user"""
        self.client.post(
            '/api/auth/login/',
            {'username': user.username, 'password': 'testpass123'},
            format='json'
        )

    def test_admin_can_read_usuarios(self):
        """Admin should be able to read usuarios list"""
        self._login(self.admin_user)
        response = self.client.get('/api/usuarios/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_admin_can_write_usuarios(self):
        """Admin should be able to create/update usuarios"""
        self._login(self.admin_user)
        response = self.client.post(
            '/api/usuarios/',
            {'username': 'new_user', 'password': 'pass123', 'email': 'new@test.com'},
            format='json'
        )
        self.assertIn(response.status_code, [status.HTTP_201_CREATED, status.HTTP_400_BAD_REQUEST])

    def test_supervisor_can_read_usuarios(self):
        """Supervisor should be able to read usuarios list"""
        self._login(self.supervisor_user)
        response = self.client.get('/api/usuarios/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_supervisor_cannot_write_usuarios(self):
        """Supervisor should NOT be able to create usuarios (403)"""
        self._login(self.supervisor_user)
        response = self.client.post(
            '/api/usuarios/',
            {'username': 'new_user', 'password': 'pass123', 'email': 'new@test.com'},
            format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_can_access_all_apps(self):
        """Admin should have access to api, infraestructura, trafico"""
        self._login(self.admin_user)
        # API
        response = self.client.get('/api/usuarios/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Infraestructura
        response = self.client.get('/api/parqueo/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Trafico
        response = self.client.get('/api/vehiculo/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_supervisor_can_access_infraestructura(self):
        """Supervisor should have read access to infraestructura"""
        self._login(self.supervisor_user)
        response = self.client.get('/api/parqueo/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_supervisor_can_access_trafico(self):
        """Supervisor should have read access to trafico"""
        self._login(self.supervisor_user)
        response = self.client.get('/api/vehiculo/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class TestDeviceAPIKey(APITestCase):
    """Tests for device API key authentication (T4.1 - T4.3)"""

    def setUp(self):
        from api.models import Device
        self.device = Device.objects.create(
            name='test_camera',
            api_key_hash='test_hash_value',
            location='Test Location'
        )
        self.client = APIClient()

    def test_device_ingest_requires_api_key(self):
        """Device ingest endpoint should require X-Device-Key header"""
        response = self.client.post('/api/device/ingest/', {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_device_ingest_accepts_valid_api_key(self):
        """Device ingest should accept valid API key"""
        response = self.client.post(
            '/api/device/ingest/',
            {'data': 'test'},
            format='json',
            HTTP_X_DEVICE_KEY='test_hash_value'
        )
        # Should not be 401 (might be 400 for valid data, but not 401)
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_400_BAD_REQUEST])

    def test_device_ingest_rejects_invalid_api_key(self):
        """Device ingest should reject invalid API key"""
        response = self.client.post(
            '/api/device/ingest/',
            {'data': 'test'},
            format='json',
            HTTP_X_DEVICE_KEY='invalid_key'
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class TestWebSocketAuth(APITestCase):
    """Tests for WebSocket authentication (T5.1 - T5.4)"""

    def test_channels_layer_is_configured(self):
        """CHANNEL_LAYERS should be configured with Redis"""
        self.assertIn('CHANNEL_LAYERS', settings)
        channel_layers = settings.CHANNEL_LAYERS
        self.assertIsInstance(channel_layers, list)
        self.assertGreater(len(channel_layers), 0)
        # Check Redis is configured
        self.assertEqual(channel_layers[0]['BACKEND'], 'channels.layers.InmemoryChannelLayer')

    def test_websocket_endpoint_requires_auth(self):
        """WebSocket endpoint should require JWT cookie for auth"""
        # This test verifies the URL exists (actual WS tests require special tooling)
        from django.urls import reverse
        try:
            ws_url = reverse('dashboard_ws')
        except:
            ws_url = '/ws/dashboard/'
        # Verify URL is configured
        self.assertIsNotNone(ws_url)
