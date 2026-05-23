import uuid
from django.db import models
from src.infrastructure.models.base_model import AuditableBaseModel


class Empresa(AuditableBaseModel):
    idempresa = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    razonsocial = models.CharField(max_length=200)
    nombrecomercial = models.CharField(max_length=200)
    ruc = models.CharField(max_length=20, unique=True)
    correo = models.EmailField()
    telefono = models.CharField(max_length=20, null=True, blank=True)
    direccion = models.TextField(null=True, blank=True)
    fechacreacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = 'empresa'
        db_table = 'empresa'
        verbose_name = 'Empresa'
        verbose_name_plural = 'Empresas'

    def __str__(self):
        return self.razonsocial


class Sucursal(AuditableBaseModel):
    idsucursal = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    idempresa = models.ForeignKey(Empresa, on_delete=models.CASCADE, db_column='idempresa')
    nombre = models.CharField(max_length=100)
    codigo = models.CharField(max_length=20)
    direccion = models.TextField(null=True, blank=True)
    telefono = models.CharField(max_length=20, null=True, blank=True)
    fechacreacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = 'empresa'
        db_table = 'sucursal'
        verbose_name = 'Sucursal'
        verbose_name_plural = 'Sucursales'
        unique_together = ('idempresa', 'codigo')

    def __str__(self):
        return f"{self.nombre} ({self.codigo})"


class Almacen(AuditableBaseModel):
    idalmacen = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    idsucursal = models.ForeignKey(Sucursal, on_delete=models.CASCADE, db_column='idsucursal')
    nombre = models.CharField(max_length=100)
    codigo = models.CharField(max_length=20)
    descripcion = models.TextField(null=True, blank=True)
    ancho = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    alto = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    capacidadmaxima = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    fechacreacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = 'empresa'
        db_table = 'almacen'
        verbose_name = 'Almacén'
        verbose_name_plural = 'Almacenes'
        unique_together = ('idsucursal', 'codigo')

    def __str__(self):
        return f"{self.nombre} ({self.codigo})"
