from django.db import models


class PlateDetection(models.Model):
    """
    Modelo para almacenar detecciones de placas vehiculares.
    Cada registro representa una detección automática con OCR.
    """
    
    imagen = models.ImageField(upload_to='anpr/%Y/%m/%d/', blank=True, null=True)
    placa_texto = models.CharField(max_length=20, blank=True)
    confidence = models.FloatField(default=0.0)  # 0.0 - 1.0
    device_id = models.CharField(max_length=100, blank=True, help_text="ID del dispositivo que generó la detección")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Detección de Placa'
        verbose_name_plural = 'Detecciones de Placas'
    
    def __str__(self):
        return f"{self.placa_texto or 'UNKNOWN'} - {self.created_at}"