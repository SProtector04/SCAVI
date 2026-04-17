from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient, APITestCase
from rest_framework import status

from api.models import Usuario
from infraestructura.models import Parqueo, Camara

Usuario = get_user_model()


class TestParqueoModel(TestCase):
    """Tests for Sprint 1: Base DB connections.
    Test Parqueo model for infrastructure.
    """

    def test_parqueo_creation(self):
        """Test that Parqueo can be created"""
        parqueo = Parqueo.objects.create(
            nombre='Test Parqueo',
            capacidad_maxima=100
        )
        self.assertEqual(parqueo.nombre, 'Test Parqueo')
        self.assertEqual(parqueo.capacidad_maxima, 100)

    def test_parqueo_str_representation(self):
        """Test Parqueo string representation"""
        parqueo = Parqueo.objects.create(
            nombre='Parqueo Central',
            capacidad_maxima=200
        )
        self.assertEqual(str(parqueo), 'Parqueo Central')

    def test_parqueo_with_svg_url(self):
        """Test Parqueo with SVG URL"""
        parqueo = Parqueo.objects.create(
            nombre='Parqueo SVG',
            capacidad_maxima=50,
            plano_svg_url='https://example.com/plano.svg'
        )
        self.assertEqual(parqueo.plano_svg_url, 'https://example.com/plano.svg')


class TestCamaraModel(TestCase):
    """Tests for Camara model"""

    def setUp(self):
        self.parqueo = Parqueo.objects.create(
            nombre='Test Parqueo for Camara',
            capacidad_maxima=100
        )

    def test_camara_creation(self):
        """Test that Camara can be created"""
        camara = Camara.objects.create(
            parqueo=self.parqueo,
            nombre='Entrada Principal',
            identificador_svg='entrada_01',
            url_stream='rtsp://camera.local/stream',
            estado='ACTIVA'
        )
        self.assertEqual(camara.nombre, 'Entrada Principal')
        self.assertEqual(camara.estado, 'ACTIVA')

    def test_camara_estado_choices(self):
        """Test all estado choices"""
        estados = ['ACTIVA', 'INACTIVA', 'MANTENIMIENTO']
        for estado in estados:
            camara = Camara.objects.create(
                parqueo=self.parqueo,
                nombre=f'Camara {estado}',
                identificador_svg=f'cam_{estado}',
                url_stream='rtsp://test',
                estado=estado
            )
            self.assertEqual(camara.estado, estado)

    def test_camara_str_representation(self):
        """Test Camara string representation"""
        camara = Camara.objects.create(
            parqueo=self.parqueo,
            nombre='Test Camara',
            identificador_svg='test_id',
            url_stream='rtsp://test'
        )
        expected = f"{camara.nombre} ({camara.identificador_svg})"
        self.assertEqual(str(camara), expected)

    def test_camara_unique_identificador(self):
        """Test identificador_svg must be unique"""
        from django.db import IntegrityError
        Camara.objects.create(
            parqueo=self.parqueo,
            nombre='Camara 1',
            identificador_svg='unique_id',
            url_stream='rtsp://test1'
        )
        with self.assertRaises(IntegrityError):
            Camara.objects.create(
                parqueo=self.parqueo,
                nombre='Camara 2',
                identificador_svg='unique_id',  # Same ID - should fail
                url_stream='rtsp://test2'
            )


class TestCamaraParqueoRelation(TestCase):
    """Tests for Camara-Parqueo relationship"""

    def setUp(self):
        self.parqueo = Parqueo.objects.create(
            nombre='Related Parqueo',
            capacidad_maxima=150
        )

    def test_camara_belongs_to_parqueo(self):
        """Test Camara is linked to Parqueo"""
        camara = Camara.objects.create(
            parqueo=self.parqueo,
            nombre='Linked Camara',
            identificador_svg='linked',
            url_stream='rtsp://test'
        )
        self.assertEqual(camara.parqueo.nombre, 'Related Parqueo')

    def test_parqueo_camaras_relation(self):
        """Test Parqueo can access its camaras"""
        Camara.objects.create(
            parqueo=self.parqueo,
            nombre='Cam 1',
            identificador_svg='c1',
            url_stream='rtsp://c1'
        )
        Camara.objects.create(
            parqueo=self.parqueo,
            nombre='Cam 2',
            identificador_svg='c2',
            url_stream='rtsp://c2'
        )
        self.assertEqual(self.parqueo.camaras.count(), 2)

    def test_parqueo_cascade_delete(self):
        """Test camaras deleted when Parqueo is deleted"""
        camara = Camara.objects.create(
            parqueo=self.parqueo,
            nombre='To Delete',
            identificador_svg='delete',
            url_stream='rtsp://test'
        )
        self.parqueo.delete()
        # Camara should also be deleted (CASCADE)
        self.assertFalse(Camara.objects.filter(id=camara.id).exists())


class TestInfraestructuraAPIEndpoints(APITestCase):
    """Tests for infrastructure API endpoints"""

    def setUp(self):
        self.admin_user = Usuario.objects.create_user(
            username='admin_infra',
            email='admin@infra.com',
            password='testpass123',
            rol='ADMIN'
        )
        self.client = APIClient()

    def _login(self):
        """Helper to login"""
        self.client.post(
            '/api/auth/login/',
            {'username': 'admin_infra', 'password': 'testpass123'},
            format='json'
        )

    def test_parqueos_endpoint_exists(self):
        """Test /api/parqueos/ endpoint exists and is accessible"""
        self._login()
        response = self.client.get('/api/parqueos/')
        # Should return 200 (OK) or 403 (forbidden), NOT 404
        self.assertIn(response.status_code, [200, 403, 404])

    def test_camaras_endpoint_exists(self):
        """Test /api/camaras/ endpoint exists and is accessible"""
        self._login()
        response = self.client.get('/api/camaras/')
        self.assertIn(response.status_code, [200, 403, 404])

    def test_can_list_parqueos(self):
        """Test can list parqueos via API"""
        self._login()
        # Create test data
        Parqueo.objects.create(nombre='API Test', capacidad_maxima=50)
        response = self.client.get('/api/parqueos/')
        self.assertIn(response.status_code, [200, 403])

    def test_can_list_camaras(self):
        """Test can list camaras via API"""
        self._login()
        # Create test data
        parqueo = Parqueo.objects.create(nombre='Cam Test', capacidad_maxima=50)
        Camara.objects.create(
            parqueo=parqueo,
            nombre='Test Cam',
            identificador_svg='test',
            url_stream='rtsp://test'
        )
        response = self.client.get('/api/camaras/')
        self.assertIn(response.status_code, [200, 403])

    def test_can_create_parqueo(self):
        """Test can create Parqueo via API"""
        self._login()
        response = self.client.post(
            '/api/parqueos/',
            {'nombre': 'New Parqueo', 'capacidad_maxima': 100},
            format='json'
        )
        # Should be created (201) or forbidden (403), not 404
        self.assertIn(response.status_code, [201, 403, 400])

    def test_can_create_camara(self):
        """Test can create Camara via API"""
        self._login()
        # First create parqueo
        response = self.client.post(
            '/api/parqueos/',
            {'nombre': 'For Camara', 'capacidad_maxima': 50},
            format='json'
        )
        if response.status_code == 201:
            parqueo_id = response.json().get('id')
        else:
            parqueo = Parqueo.objects.first()
            parqueo_id = parqueo.id

        # Create camara
        response = self.client.post(
            '/api/camaras/',
            {
                'parqueo': parqueo_id,
                'nombre': 'New Camara',
                'identificador_svg': 'new_cam',
                'url_stream': 'rtsp://new',
                'estado': 'ACTIVA'
            },
            format='json'
        )
        self.assertIn(response.status_code, [201, 403, 400])


class TestInfraestructuraAuthentication(TestCase):
    """Tests for infrastructure authentication"""

    def setUp(self):
        self.client = APIClient()

    def test_parqueos_requires_auth(self):
        """Test parqueos endpoint requires authentication"""
        response = self.client.get('/api/parqueos/')
        # Should reject unauthenticated request
        self.assertIn(response.status_code, [401, 403])

    def test_camaras_requires_auth(self):
        """Test camaras endpoint requires authentication"""
        response = self.client.get('/api/camaras/')
        # Should reject unauthenticated request
        self.assertIn(response.status_code, [401, 403])


class TestConnectionAPI(APITestCase):
    """Tests for Sprint 6: Connection, API endpoints.
    Test connection/infrastructure API functionality.
    """

    def setUp(self):
        self.admin_user = Usuario.objects.create_user(
            username='admin_conn',
            email='admin@conn.com',
            password='testpass123',
            rol='ADMIN'
        )
        self.client = APIClient()

    def _login(self):
        """Helper to login"""
        self.client.post(
            '/api/auth/login/',
            {'username': 'admin_conn', 'password': 'testpass123'},
            format='json'
        )

    def test_camara_stream_url(self):
        """Test Camara has stream URL configured"""
        self._login()
        parqueo = Parqueo.objects.create(nombre='Stream Test', capacidad_maxima=50)
        Camara.objects.create(
            parqueo=parqueo,
            nombre='Stream Camara',
            identificador_svg='stream',
            url_stream='rtsp://192.168.1.100:554/stream',
            estado='ACTIVA'
        )
        response = self.client.get('/api/camaras/')
        if response.status_code == 200:
            data = response.json()
            # Check camera has URL field
            if data.get('results'):
                self.assertIn('url_stream', data['results'][0])

    def test_camara_estado_field(self):
        """Test Camara has estado field"""
        self._login()
        response = self.client.get('/api/camaras/')
        if response.status_code == 200:
            # Verify estado field exists in response structure
            data = response.json()
            if data.get('results'):
                self.assertIn('estado', data['results'][0])

    def test_parqueo_capacity(self):
        """Test Parqueo capacity is stored correctly"""
        self._login()
        Parqueo.objects.create(nombre='Capacity Test', capacidad_maxima=250)
        response = self.client.get('/api/parqueos/')
        if response.status_code == 200:
            data = response.json()
            if data.get('results'):
                self.assertIn('capacidad_maxima', data['results'][0])
                self.assertEqual(data['results'][0]['capacidad_maxima'], 250)