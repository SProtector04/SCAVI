from django.test import TestCase
from django.conf import settings


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
