from django.db import models

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
    placa_detectada_ia = models.CharField(max_length=20, help_text="Texto extraído de la cámara por YOLO")
    
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