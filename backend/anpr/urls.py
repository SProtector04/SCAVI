"""
ANPR URL Configuration

Routes for ANPR API endpoints.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PlateDetectionViewSet

router = DefaultRouter()
router.register(r'events', PlateDetectionViewSet, basename='plate-detection')

urlpatterns = [
    path('', include(router.urls)),
]