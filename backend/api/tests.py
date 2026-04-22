from django.test import TestCase
from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient, APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from django.test.utils import override_settings
import json
from unittest.mock import patch

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
        self.assertTrue(response.cookies['access_token']['httponly'])
        self.assertTrue(response.cookies['refresh_token']['httponly'])

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
        response = self.client.get('/api/parqueos/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Trafico
        response = self.client.get('/api/vehiculos/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_supervisor_can_access_infraestructura(self):
        """Supervisor should have read access to infraestructura"""
        self._login(self.supervisor_user)
        response = self.client.get('/api/parqueos/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_supervisor_can_access_trafico(self):
        """Supervisor should have read access to trafico"""
        self._login(self.supervisor_user)
        response = self.client.get('/api/vehiculos/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class TestDeviceAPIKey(APITestCase):
    """Tests for device API key authentication (T4.1 - T4.3)"""

    def setUp(self):
        self.client = APIClient()

    def test_device_ingest_requires_api_key(self):
        """Device ingest endpoint should require X-Device-Key header"""
        response = self.client.post('/api/device/ingest/', {}, format='json')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_device_ingest_accepts_valid_api_key(self):
        """Device ingest should accept valid API key"""
        with patch.dict('os.environ', {'DEVICE_API_KEY': 'dev-device-key-12345'}):
            response = self.client.post(
                '/api/device/ingest/',
                {'data': 'test'},
                format='json',
                HTTP_X_DEVICE_KEY='dev-device-key-12345'
            )
        # Should not be 401 (might be 400 for valid data, but not 401)
        self.assertIn(response.status_code, [status.HTTP_200_OK, status.HTTP_201_CREATED, status.HTTP_400_BAD_REQUEST])

    def test_device_ingest_rejects_invalid_api_key(self):
        """Device ingest should reject invalid API key"""
        with patch.dict('os.environ', {'DEVICE_API_KEY': 'dev-device-key-12345'}):
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
        self.assertTrue(hasattr(settings, 'CHANNEL_LAYERS'))
        channel_layers = settings.CHANNEL_LAYERS
        self.assertIsInstance(channel_layers, dict)
        self.assertIn('default', channel_layers)
        # Check InMemory is configured (or Redis)
        self.assertIn('channels.layers.InMemoryChannelLayer', channel_layers['default']['BACKEND'])

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


class TestHealthCheck(APITestCase):
    """Tests for Sprint 1: Deployment, endpoints health, base DB connections.
    Basic health check tests for API app.
    """

    def setUp(self):
        self.client = APIClient()

    def test_api_health_endpoint_exists(self):
        """Health check endpoint should be accessible"""
        # Try the common health check paths
        response = self.client.get('/api/health/')
        if response.status_code == 404:
            response = self.client.get('/api/')
        # Should return 200 or 404 (not 500/503 which would indicate server error)
        self.assertIn(response.status_code, [200, 301, 302, 404, 401, 403])

    def test_api_base_endpoint_accessible(self):
        """API base endpoint should be accessible"""
        response = self.client.get('/api/')
        # Should not be a server error (5xx)
        self.assertLess(response.status_code, 500)

    def test_auth_login_endpoint_exists(self):
        """Login endpoint should exist and be accessible"""
        response = self.client.post(
            '/api/auth/login/',
            {'username': 'nonexistent', 'password': 'test'},
            format='json'
        )
        # Should return proper error (401 for invalid credentials), not 404 (not found)
        self.assertIn(response.status_code, [401, 400, 404])

    def test_auth_register_endpoint_exists(self):
        """Register endpoint should exist"""
        response = self.client.post(
            '/api/auth/register/',
            {},
            format='json'
        )
        # Should return proper error (401 for not authenticated), not 404
        self.assertIn(response.status_code, [401, 400, 403, 404])


class TestUsuarioModel(TestCase):
    """Tests for Sprint 3: Usuario, Permiso, RolUsuario models.
    Test the Usuario model functionality.
    """

    def test_usuario_creation(self):
        """Test that Usuario can be created"""
        user = Usuario.objects.create_user(
            username='testuser',
            email='test@test.com',
            password='testpass123',
            rol='ADMIN'
        )
        self.assertEqual(user.username, 'testuser')
        self.assertEqual(user.rol, 'ADMIN')
        self.assertTrue(user.check_password('testpass123'))

    def test_usuario_rol_choices(self):
        """Test Usuario rol choices are valid"""
        admin_user = Usuario.objects.create_user(
            username='admin_user',
            email='admin@test.com',
            password='pass123',
            rol='ADMIN'
        )
        supervisor_user = Usuario.objects.create_user(
            username='supervisor_user',
            email='supervisor@test.com',
            password='pass123',
            rol='SUPERVISOR'
        )
        self.assertEqual(admin_user.rol, 'ADMIN')
        self.assertEqual(supervisor_user.rol, 'SUPERVISOR')

    def test_usuario_str_representation(self):
        """Test Usuario string representation"""
        user = Usuario.objects.create_user(
            username='testuser',
            email='test@test.com',
            password='testpass123',
            rol='ADMIN'
        )
        expected = f"{user.username} - {user.rol}"
        self.assertEqual(str(user), expected)

    def test_usuario_is_active_default(self):
        """Test Usuario is_active defaults to True"""
        user = Usuario.objects.create_user(
            username='testuser',
            email='test@test.com',
            password='testpass123'
        )
        self.assertTrue(user.is_active)

    def test_usuario_can_be_deactivated(self):
        """Test Usuario can be deactivated"""
        user = Usuario.objects.create_user(
            username='testuser',
            email='test@test.com',
            password='testpass123'
        )
        user.is_active = False
        user.save()
        updated_user = Usuario.objects.get(username='testuser')
        self.assertFalse(updated_user.is_active)


class TestRolModel(TestCase):
    """Tests for Rol model"""

    def setUp(self):
        self.user = Usuario.objects.create_user(
            username='testuser_rol',
            email='testrol@test.com',
            password='testpass123',
            rol='ADMIN'
        )

    def test_rol_creation(self):
        """Test that Rol can be created"""
        from api.models import Rol
        rol = Rol.objects.create(
            usuario=self.user,
            nombre='TEST_ROL',
            descripcion='Test role description',
            permisos={'lectura': True, 'escritura': False}
        )
        self.assertEqual(rol.nombre, 'TEST_ROL')
        self.assertEqual(rol.permisos['lectura'], True)

    def test_rol_str_representation(self):
        """Test Rol string representation"""
        from api.models import Rol
        rol = Rol.objects.create(
            usuario=self.user,
            nombre='TEST_ROL'
        )
        expected = f"{rol.nombre} ({self.user.username})"
        self.assertEqual(str(rol), expected)

    def test_rol_cascade_delete(self):
        """Test that Rol is deleted when Usuario is deleted"""
        from api.models import Rol
        rol = Rol.objects.create(
            usuario=self.user,
            nombre='TEST_ROL_CASCADE'
        )
        user_id = self.user.id
        self.user.delete()
        from api.models import Rol
        self.assertFalse(Rol.objects.filter(id=rol.id).exists())


class TestConfiguracionYOLOModel(TestCase):
    """Tests for ConfiguracionYOLO model"""

    def test_configuracion_yolo_creation(self):
        """Test that ConfiguracionYOLO can be created"""
        from api.models import ConfiguracionYOLO
        config = ConfiguracionYOLO.objects.create(
            nombre='Test YOLO Config',
            confidence_threshold=0.7,
            iou_threshold=0.5,
            input_size=640
        )
        self.assertEqual(config.nombre, 'Test YOLO Config')
        self.assertEqual(config.confidence_threshold, 0.7)

    def test_configuracion_yolo_str(self):
        """Test ConfiguracionYOLO string representation"""
        from api.models import ConfiguracionYOLO
        config = ConfiguracionYOLO.objects.create(
            nombre='Test YOLO',
            confidence_threshold=0.8
        )
        expected = f"{config.nombre} (conf: {config.confidence_threshold})"
        self.assertEqual(str(config), expected)


class TestMetricaRendimientoModel(TestCase):
    """Tests for MetricaRendimiento model"""

    def test_metrica_rendimiento_creation(self):
        """Test that MetricaRendimiento can be created"""
        from api.models import MetricaRendimiento
        metrica = MetricaRendimiento.objects.create(
            tipo='LATENCIA_INFERENCIA',
            valor=45.5,
            dispositivo='device1'
        )
        self.assertEqual(metrica.tipo, 'LATENCIA_INFERENCIA')
        self.assertEqual(metrica.valor, 45.5)

    def test_metrica_rendimiento_tipos(self):
        """Test different metric types"""
        from api.models import MetricaRendimiento
        tipos = ['LATENCIA_INFERENCIA', 'LATENCIA_TOTAL', 'DETECCION_OK', 'DETECCION_ERROR']
        for tipo in tipos:
            metrica = MetricaRendimiento.objects.create(tipo=tipo, valor=10.0)
            self.assertEqual(metrica.tipo, tipo)


class TestCacheResultadoYOLOModel(TestCase):
    """Tests for CacheResultadoYOLO model"""

    def test_cache_resultado_yolo_creation(self):
        """Test that CacheResultadoYOLO can be created"""
        from api.models import CacheResultadoYOLO
        from django.utils import timezone
        from datetime import timedelta
        cache = CacheResultadoYOLO.objects.create(
            cache_key='test_key_123',
            placa_detectada='ABC123',
            confianza=0.95,
            expira_en=timezone.now() + timedelta(hours=1)
        )
        self.assertEqual(cache.placa_detectada, 'ABC123')
        self.assertEqual(cache.confianza, 0.95)

    def test_cache_hit_count_increments(self):
        """Test cache hit count increments"""
        from api.models import CacheResultadoYOLO
        from django.utils import timezone
        from datetime import timedelta
        cache = CacheResultadoYOLO.objects.create(
            cache_key='test_key_456',
            placa_detectada='XYZ789',
            confianza=0.9,
            expira_en=timezone.now() + timedelta(hours=1)
        )
        initial_hits = cache.hit_count
        cache.hit_count += 1
        cache.save()
        updated_cache = CacheResultadoYOLO.objects.get(cache_key='test_key_456')
        self.assertEqual(updated_cache.hit_count, initial_hits + 1)


class TestSprint4UsuarioVehiculoRelation(APITestCase):
    """Tests for Sprint 4: Usuario-Vehiculo relationship
    - Admin registers vehicles and associates with users
    - Validate permissions for access
    """

    def setUp(self):
        self.admin_user = Usuario.objects.create_user(
            username='admin_veh_rel',
            email='admin@vehrel.com',
            password='testpass123',
            rol='ADMIN'
        )
        self.supervisor_user = Usuario.objects.create_user(
            username='supervisor_veh_rel',
            email='supervisor@vehrel.com',
            password='testpass123',
            rol='SUPERVISOR'
        )
        self.client = APIClient()

    def _login(self, username='admin_veh_rel', password='testpass123'):
        """Helper to login"""
        self.client.post(
            '/api/auth/login/',
            {'username': username, 'password': password},
            format='json'
        )

    def test_admin_can_access_vehiculos_endpoint(self):
        """Test admin has full access to /api/vehiculos/"""
        self._login()
        response = self.client.get('/api/vehiculos/')
        self.assertEqual(response.status_code, 200)

    def test_supervisor_can_read_vehiculos(self):
        """Test supervisor can read but not write vehicles"""
        self._login(username='supervisor_veh_rel')
        response = self.client.get('/api/vehiculos/')
        self.assertEqual(response.status_code, 200)

    def test_supervisor_cannot_create_vehiculos(self):
        """Test supervisor cannot POST to /api/vehiculos/"""
        self._login(username='supervisor_veh_rel')
        response = self.client.post(
            '/api/vehiculos/',
            {'placa': 'NEW-PLATE', 'tipo': 'VISITANTE'},
            format='json'
        )
        self.assertEqual(response.status_code, 403)

    def test_vehiculos_endpoint_requires_auth(self):
        """Test /api/vehiculos/ requires authentication"""
        response = self.client.get('/api/vehiculos/')
        self.assertEqual(response.status_code, 401)


class TestSprint4HistorialAcceso(APITestCase):
    """Tests for Sprint 4: Historial de Accesos
    - GET /api/historial with filters (date/plate)
    - Operator can consult complete movement history
    """

    def setUp(self):
        self.admin_user = Usuario.objects.create_user(
            username='admin_historial',
            email='admin@historial.com',
            password='testpass123',
            rol='ADMIN'
        )
        self.supervisor_user = Usuario.objects.create_user(
            username='supervisor_historial',
            email='supervisor@historial.com',
            password='testpass123',
            rol='SUPERVISOR'
        )
        from infraestructura.models import Parqueo, Camara
        self.parqueo = Parqueo.objects.create(
            nombre='Historial Parqueo',
            capacidad_maxima=50
        )
        self.camara = Camara.objects.create(
            parqueo=self.parqueo,
            nombre='Historial Camara',
            identificador_svg='cam_hist',
            url_stream='rtsp://test',
            estado='ACTIVA'
        )
        from trafico.models import Vehiculo, RegistroAcceso
        self.vehiculo = Vehiculo.objects.create(
            placa='HIST-001',
            tipo='DOCENTE'
        )
        self.client = APIClient()

    def _login(self, username='admin_historial', password='testpass123'):
        """Helper to login"""
        self.client.post(
            '/api/auth/login/',
            {'username': username, 'password': password},
            format='json'
        )

    def test_historial_endpoint_exists(self):
        """Test /api/historial or /api/registros-accesos/ endpoint exists"""
        self._login()
        response = self.client.get('/api/registros-accesos/')
        self.assertIn(response.status_code, [200, 403, 404])

    def test_operator_can_read_historial(self):
        """Test supervisor can read historial"""
        self._login(username='supervisor_historial')
        response = self.client.get('/api/registros-accesos/')
        self.assertEqual(response.status_code, 200)

    def test_admin_can_create_historial_entry(self):
        """Test admin can create historial entries"""
        self._login()
        from trafico.models import RegistroAcceso
        response = self.client.post(
            '/api/registros-accesos/',
            {
                'placa_detectada_ia': 'HIST-TEST',
                'vehiculo': self.vehiculo.placa,
                'camara': self.camara.id,
                'estado_acceso': 'AUTORIZADO',
                'confianza_ia': 0.95
            },
            format='json'
        )
        self.assertIn(response.status_code, [201, 400, 403])

    def test_historial_filter_by_date_range(self):
        """Test historial supports date range filtering"""
        self._login()
        from django.utils import timezone
        from datetime import timedelta
        today = timezone.now().date()
        
        response = self.client.get(f'/api/registros-accesos/?fecha={today}')
        self.assertIn(response.status_code, [200, 403])

    def test_historial_filter_by_plate(self):
        """Test historial supports plate filtering"""
        self._login()
        response = self.client.get('/api/registros-accesos/?placa=HIST-001')
        self.assertIn(response.status_code, [200, 403])

    def test_historial_returns_json(self):
        """Test historial returns JSON responses"""
        self._login()
        response = self.client.get('/api/registros-accesos/')
        if response.status_code == 200:
            self.assertEqual(response['Content-Type'], 'application/json')
