from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import Usuario, Rol, ConfiguracionYOLO, CacheResultadoYOLO, MetricaRendimiento


@admin.register(Usuario)
class UsuarioAdmin(UserAdmin):
    list_display = ('username', 'email', 'rol', 'is_active')
    list_filter = ('rol', 'is_active')
    fieldsets = UserAdmin.fieldsets + (
        ('Información SCAVI', {'fields': ('rol',)}),
    )

@admin.register(Rol)
class RolAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'usuario', 'creado_en')
    list_filter = ('nombre',)
    search_fields = ('nombre', 'usuario__username')

@admin.register(ConfiguracionYOLO)
class ConfiguracionYOLOAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'confidence_threshold', 'es_default', 'esta_activo')
    list_filter = ('es_default', 'esta_activo')
    search_fields = ('nombre',)

@admin.register(CacheResultadoYOLO)
class CacheResultadoYOLOAdmin(admin.ModelAdmin):
    list_display = ('placa_detectada', 'confianza', 'hit_count', 'ultima_vez')
    search_fields = ('placa_detectada', 'cache_key')

@admin.register(MetricaRendimiento)
class MetricaRendimientoAdmin(admin.ModelAdmin):
    list_display = ('tipo', 'valor', 'placa', 'timestamp')
    list_filter = ('tipo',)
    search_fields = ('placa', 'dispositivo')
