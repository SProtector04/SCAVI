from django.db import models

class AccessLog(models.Model):
    endpoint = models.CharField(max_length=255, help_text="Ruta consultada")
    method = models.CharField(max_length=10)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)

class Usuario(models.Model):
    nombre = models.CharField(max_length=100)
    apellidos = models.CharField(max_length=100)
    telefono = models.CharField(max_length=15)
    fecha_registro = models.DateTimeField(auto_now_add=True)


    def __str__(self):
        return f"{self.nombre} {self.apellidos}"
        return f"[{self.method}] {self.endpoint} - {self.timestamp.strftime('%Y-%m-%d %H:%M:%S')}"
