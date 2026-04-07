from django.db import models
from django.contrib.auth.models import AbstractUser

class Usuario(AbstractUser):
    ROLES = (
        ('ADMIN', 'Administrador'),
        ('SUPERVISOR', 'Supervisor'),
    )
    rol = models.CharField(max_length=20, choices=ROLES, default='SUPERVISOR')

    def __str__(self):
        return f"{self.username} - {self.rol}"