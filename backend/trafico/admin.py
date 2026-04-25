from django.contrib import admin
from .models import (
    Vehiculo, RegistroAcceso, TipoVehiculo, 
    ColaProcesamiento, LogDeteccion, Alerta, Estadistica
)

@admin.register(Vehiculo)
class VehiculoAdmin(admin.ModelAdmin):
    list_display = ('placa', 'tipo')
    list_filter = ('tipo',)
    search_fields = ('placa',)

@admin.register(RegistroAcceso)
class RegistroAccesoAdmin(admin.ModelAdmin):
    list_display = ('placa_detectada_ia', 'estado_acceso', 'camara', 'fecha_hora')
    list_filter = ('estado_acceso', 'camara')
    search_fields = ('placa_detectada_ia', 'vehiculo__placa')

@admin.register(TipoVehiculo)
class TipoVehiculoAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'vehiculo', 'es_autorizado')
    list_filter = ('es_autorizado',)
    search_fields = ('nombre', 'vehiculo__placa')

@admin.register(ColaProcesamiento)
class ColaProcesamientoAdmin(admin.ModelAdmin):
    list_display = ('id', 'device_id', 'estado', 'prioridad', 'creado_en')
    list_filter = ('estado',)
    search_fields = ('device_id',)

@admin.register(LogDeteccion)
class LogDeteccionAdmin(admin.ModelAdmin):
    list_display = ('tipo_evento', 'registro_acceso', 'timestamp')
    list_filter = ('tipo_evento',)
    search_fields = ('mensaje',)

@admin.register(Alerta)
class AlertaAdmin(admin.ModelAdmin):
    list_display = ('titulo', 'tipo', 'prioridad', 'esta_resuelta', 'creado_en')
    list_filter = ('tipo', 'prioridad', 'esta_resuelta')
    search_fields = ('titulo', 'descripcion')

@admin.register(Estadistica)
class EstadisticaAdmin(admin.ModelAdmin):
    list_display = ('tipo', 'valor', 'fecha')
    list_filter = ('tipo',)
    search_fields = ('tipo',)
