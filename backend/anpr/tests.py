import tempfile
from io import BytesIO
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from rest_framework import status
from rest_framework.test import APIClient
from PIL import Image
from anpr.services.ocr_reader import OCRReader


User = get_user_model()


@override_settings(MEDIA_ROOT=tempfile.gettempdir())
class PlateDetectionApiTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='anpr_user',
            password='testpass123',
            rol='ADMIN'
        )
        self.client.post('/api/auth/login/', {'username': 'anpr_user', 'password': 'testpass123'}, format='json')
        buffer = BytesIO()
        Image.new('RGB', (64, 64), color='white').save(buffer, format='JPEG')
        self.image_bytes = buffer.getvalue()

    @patch('anpr.services.plate_detector.get_detector')
    @patch('anpr.services.ocr_reader.get_reader')
    def test_detect_returns_plate_when_plate_visible(self, mock_get_reader, mock_get_detector):
        mock_detector = mock_get_detector.return_value
        mock_detector.is_available.return_value = True
        mock_detector.detect.return_value = [
            {
                'class_id': 0,
                'class_name': 'plate',
                'bbox': [10, 20, 110, 60],
                'confidence': 0.98,
            }
        ]

        mock_reader = mock_get_reader.return_value
        mock_reader.is_available.return_value = True
        mock_reader.read_plate.return_value = {
            'text': 'ABC1234',
            'confidence': 0.94,
        }

        image = SimpleUploadedFile('plate.jpg', self.image_bytes, content_type='image/jpeg')
        response = self.client.post('/api/anpr/events/detect/', {'image': image}, format='multipart')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['detections']), 1)
        self.assertEqual(response.data['detections'][0]['plate_text'], 'ABC1234')
        self.assertEqual(response.data['detections'][0]['class_name'], 'plate')

    @patch('anpr.services.plate_detector.get_detector')
    @patch('anpr.services.ocr_reader.get_reader')
    def test_detect_returns_no_detections_when_no_plate_visible(self, mock_get_reader, mock_get_detector):
        mock_detector = mock_get_detector.return_value
        mock_detector.is_available.return_value = True
        mock_detector.detect.return_value = []

        mock_reader = mock_get_reader.return_value
        mock_reader.is_available.return_value = True

        image = SimpleUploadedFile('empty.jpg', self.image_bytes, content_type='image/jpeg')
        response = self.client.post('/api/anpr/events/detect/', {'image': image}, format='multipart')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['detections'], [])

    def test_ocr_requires_plate_like_format(self):
        reader = OCRReader.__new__(OCRReader)
        self.assertEqual(
            reader._extract_best_plate_candidate(['123ABC', 'WHEEL42', 'A1234']),
            'WHEEL42'
        )
        self.assertEqual(
            reader._extract_best_plate_candidate(['12345', 'WHEELS']),
            'UNKNOWN'
        )
