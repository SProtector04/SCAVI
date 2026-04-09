"""
WebSocket URL routing for realtime functionality.
"""
from django.urls import re_path
from api.consumers import RealtimeConsumer, DeviceEventConsumer

websocket_urlpatterns = [
    # Main realtime endpoint
    re_path(r'ws/$', RealtimeConsumer.as_asgi()),
    
    # Device-specific endpoint
    re_path(r'ws/device/(?P<device_id>\w+)/$', DeviceEventConsumer.as_asgi()),
]
