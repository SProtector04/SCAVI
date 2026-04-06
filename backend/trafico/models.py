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
        ('DESCONOCIDO', 'Desconocido'),
    )
    
    vehiculo = models.ForeignKey(Vehiculo, on_delete=models.CASCADE)
    camara = models.ForeignKey('infraestructura.Camara', on_delete=models.SET_NULL, null=True)
    fecha_hora = models.DateTimeField(auto_now_add=True)
    estado_acceso = models.CharField(max_length=20, choices=ESTADO_OPCIONES, default='DENEGADO')

    def __str__(self):
        return f"[{self.estado_acceso}] Vehículo: {self.vehiculo.placa} - {self.fecha_hora.strftime('%Y-%m-%d %H:%M:%S')}"