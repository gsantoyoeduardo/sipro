"""
Modelos del módulo de Empresa.

Define las estructuras organizacionales del sistema: Empresa, Sucursal y Almacén.
Cada modelo hereda de AuditableBaseModel para auditoría (creación, modificación, estado).
"""

import uuid
from django.db import models
from src.infrastructure.models.base_model import AuditableBaseModel


class Empresa(AuditableBaseModel):
    """Representa una empresa registrada en el sistema.

    Es la entidad raíz de la jerarquía organizacional. Una empresa agrupa
    sucursales y almacenes, y está asociada a usuarios, productos y
    configuraciones generales.

    Campos más importantes:
        razonsocial: Nombre legal/fiscal de la empresa.
        ruc: Registro Único del Contribuyente (clave única).
        correo: Correo electrónico principal de contacto.
    """
    idempresa = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    razonsocial = models.CharField(max_length=200)
    nombrecomercial = models.CharField(max_length=200)
    ruc = models.CharField(max_length=20, unique=True)
    correo = models.EmailField()
    telefono = models.CharField(max_length=20, null=True, blank=True)
    direccion = models.TextField(null=True, blank=True)
    fechacreacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = 'empresa'  # Etiqueta de la aplicación Django
        db_table = 'empresa'  # Nombre físico de la tabla en la base de datos
        verbose_name = 'Empresa'
        verbose_name_plural = 'Empresas'

    def __str__(self):
        return self.razonsocial


class Sucursal(AuditableBaseModel):
    """Representa una sucursal o filial perteneciente a una empresa.

    Relación FK:
        idempresa -> Empresa: Cada sucursal pertenece a una única empresa.
        Al eliminarse la empresa, se eliminan en cascada todas sus sucursales.

    Campos más importantes:
        nombre: Nombre comercial de la sucursal.
        codigo: Código interno único por empresa.
        unique_together: Garantiza que el código sea único dentro de una misma empresa.
    """
    idsucursal = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    idempresa = models.ForeignKey(Empresa, on_delete=models.CASCADE, db_column='idempresa')
    nombre = models.CharField(max_length=100)
    codigo = models.CharField(max_length=20)
    direccion = models.TextField(null=True, blank=True)
    telefono = models.CharField(max_length=20, null=True, blank=True)
    fechacreacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = 'empresa'
        db_table = 'sucursal'  # Nombre físico de la tabla en la base de datos
        verbose_name = 'Sucursal'
        verbose_name_plural = 'Sucursales'
        unique_together = ('idempresa', 'codigo')  # El código es único por empresa

    def __str__(self):
        return f"{self.nombre} ({self.codigo})"


class Almacen(AuditableBaseModel):
    """Representa un almacén o depósito físico dentro de una sucursal.

    Relación FK:
        idsucursal -> Sucursal: Cada almacén pertenece a una sucursal.
        Al eliminarse la sucursal, se eliminan en cascada sus almacenes.

    Campos más importantes:
        nombre: Nombre descriptivo del almacén.
        codigo: Código interno único por sucursal.
        capacidadmaxima: Capacidad máxima de almacenamiento (en unidades).
        ancho / alto: Dimensiones físicas del almacén.
    """
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
        db_table = 'almacen'  # Nombre físico de la tabla en la base de datos
        verbose_name = 'Almacén'
        verbose_name_plural = 'Almacenes'
        unique_together = ('idsucursal', 'codigo')  # El código es único por sucursal

    def __str__(self):
        return f"{self.nombre} ({self.codigo})"
