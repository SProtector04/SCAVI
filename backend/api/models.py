from django.db import models
from django.contrib.auth.models import AbstractUser, UserManager

class UsuarioManager(UserManager):
    def create_superuser(self, username, email=None, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('rol', 'ADMIN')

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self._create_user(username, email, password, **extra_fields)

class Usuario(AbstractUser):
    ROLES = (
        ('ADMIN', 'Administrador'),
        ('SUPERVISOR', 'Supervisor'),
    )
    rol = models.CharField(max_length=20, choices=ROLES, default='SUPERVISOR')

    objects = UsuarioManager()

    def __str__(self):
        return f"{self.username} - {self.rol}"


class Rol(models.Model):
    """
    Modelo de Rol relacionado con Usuario.
    Se elimina automáticamente si se elimina el usuario (CASCADE).
    """
    usuario = models.ForeignKey(
        Usuario, 
        on_delete=models.CASCADE, 
        related_name='roles',
        null=True,
        blank=True,
        default=None
    )
    nombre = models.CharField(max_length=50, unique=True)
    descripcion = models.TextField(blank=True)
    permisos = models.JSONField(
        default=dict, 
        help_text="Diccionario de permisos: {'lectura': True, 'escritura': False, ...}"
    )
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Rol'
        verbose_name_plural = 'Roles'
        ordering = ['nombre']

    def __str__(self):
        return f"{self.nombre} ({self.usuario.username})"


class ConfiguracionYOLO(models.Model):
    """
    Configuraciones de inferencia YOLOv8.
    Permite ajustar parámetros de detección por contexto.
    """
    nombre = models.CharField(max_length=100, unique=True)
    descripcion = models.TextField(blank=True)
    
    # Parámetros de inferencia
    confidence_threshold = models.FloatField(
        default=0.5,
        help_text="Umbral de confianza (0.0 a 1.0)"
    )
    iou_threshold = models.FloatField(
        default=0.45,
        help_text="Threshold para NMS (Non-Maximum Suppression)"
    )
    input_size = models.IntegerField(
        default=640,
        help_text="Tamaño de entrada del modelo (ej: 416, 640, 1280)"
    )
    
    # Clases detectadas (JSON array de IDs de clases COCO)
    clases_permitidas = models.JSONField(
        default=list,
        help_text="Lista de IDs de clases a detectar. Vacío = todas."
    )
    
    # Metadatos
    es_default = models.BooleanField(default=False)
    esta_activo = models.BooleanField(default=True)
    creado_en = models.DateTimeField(auto_now_add=True)
    actualizado_en = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Configuración YOLO'
        verbose_name_plural = 'Configuraciones YOLO'
        ordering = ['nombre']

    def __str__(self):
        return f"{self.nombre} (conf: {self.confidence_threshold})"


class CacheResultadoYOLO(models.Model):
    """
    Cache de resultados de detección YOLO para mejorar rendimiento.
    """
    cache_key = models.CharField(
        max_length=128, 
        unique=True,
        help_text="Hash único basado en imagen + configuración"
    )
    placa_detectada = models.CharField(max_length=20)
    confianza = models.FloatField()
    
    # Metadata del cache
    hit_count = models.IntegerField(default=1)
    primera_vez = models.DateTimeField(auto_now_add=True)
    ultima_vez = models.DateTimeField(auto_now=True)
    expira_en = models.DateTimeField(
        help_text="Cuándo expira este cache"
    )
    
    class Meta:
        verbose_name = 'Cache Resultado YOLO'
        verbose_name_plural = 'Cache Resultados YOLO'
        ordering = ['-hit_count', '-ultima_vez']
        indexes = [
            models.Index(fields=['cache_key']),
            models.Index(fields=['placa_detectada']),
            models.Index(fields=['expira_en']),
        ]

    def __str__(self):
        return f"{self.placa_detectada} (hits: {self.hit_count})"


class MetricaRendimiento(models.Model):
    """
    Métricas de QoS y rendimiento del sistema de detección.
    """
    TIPO_METRICA = (
        ('LATENCIA_INFERENCIA', 'Latencia de inferencia'),
        ('LATENCIA_TOTAL', 'Latencia total (captura a respuesta)'),
        ('DETECCION_OK', 'Detección exitosa'),
        ('DETECCION_ERROR', 'Error en detección'),
        ('OCR_ACERTADO', 'OCR acertado'),
        ('OCR_FALLIDO', 'OCR fallido'),
    )
    
    tipo = models.CharField(max_length=30, choices=TIPO_METRICA)
    valor = models.FloatField(help_text="Valor de la métrica (ms para latencias)")
    placa = models.CharField(max_length=20, blank=True, null=True)
    dispositivo = models.CharField(max_length=100, blank=True)
    metadata = models.JSONField(default=dict)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Métrica de Rendimiento'
        verbose_name_plural = 'Métricas de Rendimiento'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['tipo', '-timestamp']),
            models.Index(fields=['placa', '-timestamp']),
        ]

    def __str__(self):
        return f"{self.tipo}: {self.valor} - {self.timestamp.strftime('%H:%M:%S')}"