from django.db import models

class Parqueo(models.Model):
    nombre = models.CharField(max_length=100)
    capacidad_maxima = models.IntegerField()
    plano_svg_url = models.URLField(blank=True, null=True, help_text="Ruta al archivo SVG base")

    def __str__(self):
        return self.nombre

class Camara(models.Model):
    ESTADOS = (
        ('ACTIVA', 'Activa'),
        ('INACTIVA', 'Inactiva'),
        ('MANTENIMIENTO', 'En Mantenimiento'),
    )
    parqueo = models.ForeignKey(Parqueo, related_name='camaras', on_delete=models.CASCADE)
    nombre = models.CharField(max_length=100)
    identificador_svg = models.CharField(max_length=100, unique=True, help_text="ID del elemento en el SVG de React")
    url_stream = models.CharField(max_length=255, help_text="URL HLS, DASH o WebRTC")
    estado = models.CharField(max_length=20, choices=ESTADOS, default='ACTIVA')

    def __str__(self):
        return f"{self.nombre} ({self.identificador_svg})"
