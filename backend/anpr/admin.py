"""
Django Admin Configuration for ANPR
"""
from django.contrib import admin
from .models import PlateDetection


@admin.register(PlateDetection)
class PlateDetectionAdmin(admin.ModelAdmin):
    """Admin configuration for PlateDetection model."""
    
    list_display = ['id', 'placa_texto', 'confidence', 'device_id', 'created_at']
    list_filter = ['created_at', 'device_id', 'is_active']
    search_fields = ['placa_texto', 'device_id']
    ordering = ['-created_at']
    date_hierarchy = 'created_at'
    
    readonly_fields = ['created_at']
    
    fieldsets = (
        ('Información de Imagen', {
            'fields': ('imagen',)
        }),
        ('Detección', {
            'fields': ('placa_texto', 'confidence', 'device_id')
        }),
        ('Metadatos', {
            'fields': ('is_active', 'created_at'),
            'classes': ('collapse',)
        }),
    )
    
    list_per_page = 50