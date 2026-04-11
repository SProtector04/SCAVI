from django.db import models


class TipoVehiculo(models.Model):
    """
    Tipo de vehículo asociado a un vehículo específico.
    Se elimina si se elimina el vehículo (CASCADE).
    """
    vehiculo = models.ForeignKey(
        'Vehiculo', 
        on_delete=models.CASCADE, 
        related_name='tipos',
        null=True,
        blank=True,
        default=None
    )
    nombre = models.CharField(max_length=50)
    descripcion = models.TextField(blank=True)
    es_autorizado = models.BooleanField(
        default=False, 
        help_text="Indica si este tipo tiene acceso autorizado"
    )
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Tipo de Vehículo'
        verbose_name_plural = 'Tipos de Vehículos'
        unique_together = ['vehiculo', 'nombre']

    def __str__(self):
        return f"{self.nombre} ({self.vehiculo.placa})"


class Vehiculo(models.Model):
    TIPOS = (
        ('DOCENTE', 'Docente'),
        ('ESTUDIANTE', 'Estudiante'),
        ('VISITANTE', 'Visitante'),
        ('ADMINISTRATIVO', 'Administrativo'),
    )
    placa = models.CharField(max_length=15, primary_key=True)
    tipo = models.CharField(max_length=20, choices=TIPOS)
    
    def __str__(self):
        return self.placa


class RegistroAcceso(models.Model):
    ESTADO_OPCIONES = (
        ('AUTORIZADO', 'Autorizado'),
        ('DENEGADO', 'Denegado'),
        ('DESCONOCIDO', 'Vehículo No Registrado'), # Nuevo estado útil
    )
    
    # Guardamos el string que leyó YOLO, por si se equivoca o la placa no existe.
    placa_detectada_ia = models.CharField(
        max_length=20, 
        blank=True,  # Allow blank for migration
        default='',  # Default value for migration
        help_text="Texto extraído de la cámara por YOLO"
    )
    
    # Si la IA lee una placa que existe en la DB, lo vinculamos. Si no, queda en null.
    vehiculo = models.ForeignKey(Vehiculo, on_delete=models.CASCADE, null=True, blank=True)
    
    camara = models.ForeignKey('infraestructura.Camara', on_delete=models.SET_NULL, null=True)
    fecha_hora = models.DateTimeField(auto_now_add=True)
    estado_acceso = models.CharField(max_length=20, choices=ESTADO_OPCIONES, default='DENEGADO')

    # NUEVO: Datos analíticos propios de la IA
    confianza_ia = models.FloatField(null=True, blank=True, help_text="Porcentaje de certeza de YOLOv8 (0.0 a 1.0)")
    imagen_evidencia = models.ImageField(upload_to='evidencia_placas/', null=True, blank=True, help_text="Recorte de la placa en el momento exacto")

    def __str__(self):
        placa_str = self.vehiculo.placa if self.vehiculo else self.placa_detectada_ia
        return f"[{self.estado_acceso}] Placa: {placa_str} - {self.fecha_hora.strftime('%Y-%m-%d %H:%M:%S')}"


class ColaProcesamiento(models.Model):
    """
    Cola para procesamiento de detecciones YOLO.
    """
    ESTADO_COLA = (
        ('PENDIENTE', 'Pendiente'),
        ('PROCESANDO', 'Procesando'),
        ('COMPLETADO', 'Completado'),
        ('FALLIDO', 'Fallido'),
    )
    
    imagen = models.ImageField(upload_to='cola_procesamiento/')
    device_id = models.CharField(max_length=100)
    estado = models.CharField(
        max_length=20, 
        choices=ESTADO_COLA, 
        default='PENDIENTE'
    )
    
    # Resultados
    resultado_json = models.JSONField(null=True, blank=True)
    error_mensaje = models.TextField(blank=True)
    
    # Metadatos
    prioridad = models.IntegerField(default=0)
    creado_en = models.DateTimeField(auto_now_add=True)
    procesado_en = models.DateTimeField(null=True, blank=True)

    class Meta:
        verbose_name = 'Cola de Procesamiento'
        verbose_name_plural = 'Cola de Procesamiento'
        ordering = ['prioridad', '-creado_en']

    def __str__(self):
        return f"#{self.id} - {self.estado} - {self.device_id}"


class LogDeteccion(models.Model):
    """
    Logs detallados de cada detección YOLOv8.
    """
    TIPO_EVENTO = (
        ('DETECCION_PLACA', 'Detección de placa'),
        ('OCR_TEXTO', 'OCR de texto'),
        ('Coincidencia_DB', 'Coincidencia en base de datos'),
        ('ACCESO_AUTORIZADO', 'Acceso autorizado'),
        ('ACCESO_DENEGADO', 'Acceso denegado'),
    )
    
    registro_acceso = models.ForeignKey(
        RegistroAcceso, 
        on_delete=models.CASCADE,
        related_name='logs_deteccion'
    )
    tipo_evento = models.CharField(max_length=30, choices=TIPO_EVENTO)
    mensaje = models.TextField()
    metadata = models.JSONField(default=dict)
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Log de Detección'
        verbose_name_plural = 'Logs de Detección'
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['tipo_evento', '-timestamp']),
        ]

    def __str__(self):
        return f"{self.tipo_evento} - {self.timestamp.strftime('%H:%M:%S')}"


class Alerta(models.Model):
    """
    Alertas del sistema de detección.
    """
    TIPO_ALERTA = (
        ('ERROR_INFERENCIA', 'Error de inferencia YOLO'),
        ('BAJA_CONFIANZA', 'Baja confianza de detección'),
        ('ACCESO_SOSPECHOSO', 'Acceso sospechoso'),
        ('FALLA_CAMARA', 'Falla de cámara'),
        ('SISTEMA', 'Alerta del sistema'),
    )
    
    PRIORIDAD_ALERTA = (
        ('BAJA', 'Baja'),
        ('MEDIA', 'Media'),
        ('ALTA', 'Alta'),
        ('CRITICA', 'Crítica'),
    )
    
    tipo = models.CharField(max_length=30, choices=TIPO_ALERTA)
    prioridad = models.CharField(
        max_length=10, 
        choices=PRIORIDAD_ALERTA, 
        default='MEDIA'
    )
    titulo = models.CharField(max_length=200)
    descripcion = models.TextField()
    
    # Relación opcional a registro
    registro = models.ForeignKey(
        RegistroAcceso, 
        on_delete=models.SET_NULL,
        null=True, 
        blank=True,
        related_name='alertas'
    )
    
    # Estado
    esta_resuelta = models.BooleanField(default=False)
    resuelta_por = models.ForeignKey(
        'api.Usuario',
        on_delete=models.SET_NULL,
        null=True, 
        blank=True,
        related_name='alertas_resueltas'
    )
    resuelta_en = models.DateTimeField(null=True, blank=True)
    
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Alerta'
        verbose_name_plural = 'Alertas'
        ordering = ['-creado_en']
        indexes = [
            models.Index(fields=['tipo', '-creado_en']),
            models.Index(fields=['esta_resuelta', '-creado_en']),
        ]

    def __str__(self):
        return f"[{self.prioridad}] {self.tipo}: {self.titulo}"


class Estadistica(models.Model):
    """
    Estadísticas agregadas del sistema.
    """
    TIPO_ESTADISTICA = (
        ('ACCESOS_DIARIOS', 'Accesos por día'),
        ('VEHICULOS_UNICOS', 'Vehículos únicos'),
        ('DETECCIONES_POR_HORA', 'Detecciones por hora'),
        ('TASA_AUTORIZACION', 'Tasa de autorización'),
        ('RENDIMIENTO_PROMEDIO', 'Rendimiento promedio'),
    )
    
    tipo = models.CharField(max_length=30, choices=TIPO_ESTADISTICA)
    valor = models.FloatField()
    fecha = models.DateField()
    metadata = models.JSONField(default=dict)
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Estadística'
        verbose_name_plural = 'Estadísticas'
        unique_together = ['tipo', 'fecha']
        indexes = [
            models.Index(fields=['tipo', 'fecha']),
        ]

    def __str__(self):
        return f"{self.tipo}: {self.valor} ({self.fecha})"