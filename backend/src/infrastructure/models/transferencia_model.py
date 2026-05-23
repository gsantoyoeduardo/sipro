"""
Modelos del módulo de Transferencia.

Gestiona las transferencias de inventario entre almacenes, incluyendo
los detalles de productos y lotes transferidos.
"""

import uuid
from django.db import models
from src.infrastructure.models.base_model import AuditableBaseModel


class Transferencia(AuditableBaseModel):
    """Representa una transferencia de stock entre dos almacenes.

    Relación FK:
        idalmacen_origen -> Almacen: Almacén de origen (salida del stock).
        idalmacen_destino -> Almacen: Almacén de destino (entrada del stock).
        idusuario -> Usuario (opcional): Usuario que gestiona la transferencia.

    Campos más importantes:
        numero_transferencia: Número único de transferencia (único por almacén de origen).
        estado: Estado actual (pendiente, en_transito, completado, rechazado).
        fecha_envio, fecha_recepcion: Control de fechas del proceso logístico.
        notas: Observaciones generales de la transferencia.
    """
    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('en_transito', 'En Tránsito'),
        ('completado', 'Completado'),
        ('rechazado', 'Rechazado'),
    ]
    idtransferencia = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    idalmacen_origen = models.ForeignKey('empresa.Almacen', on_delete=models.CASCADE, related_name='transferencias_salida', db_column='idalmacen_origen')
    idalmacen_destino = models.ForeignKey('empresa.Almacen', on_delete=models.CASCADE, related_name='transferencias_entrada', db_column='idalmacen_destino')
    idusuario = models.ForeignKey('seguridad.Usuario', on_delete=models.CASCADE, null=True, blank=True, db_column='idusuario')
    numero_transferencia = models.CharField(max_length=50)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='pendiente')
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_envio = models.DateTimeField(null=True, blank=True)
    fecha_recepcion = models.DateTimeField(null=True, blank=True)
    notas = models.TextField(null=True, blank=True)

    class Meta:
        app_label = 'transferencia'  # Etiqueta de la aplicación Django
        db_table = 'transferencia'  # Nombre físico de la tabla en la base de datos
        verbose_name = 'Transferencia'
        verbose_name_plural = 'Transferencias'
        unique_together = ('idalmacen_origen', 'numero_transferencia')  # El número es único por almacén de origen

    def __str__(self):
        return f"T-{self.numero_transferencia} [{self.estado}]"


class DetalleTransferencia(AuditableBaseModel):
    """Representa una línea o detalle dentro de una transferencia.

    Relación FK:
        idtransferencia -> Transferencia: Transferencia a la que pertenece el detalle.
        idproducto -> Producto: Producto transferido.
        idlote -> Lote (opcional): Lote específico transferido.

    Campos más importantes:
        cantidad: Cantidad de producto transferido en este detalle.
    """
    iddetalletransferencia = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    idtransferencia = models.ForeignKey(Transferencia, on_delete=models.CASCADE, related_name='detalles', db_column='idtransferencia')
    idproducto = models.ForeignKey('inventario.Producto', on_delete=models.CASCADE, db_column='idproducto')
    idlote = models.ForeignKey('inventario.Lote', on_delete=models.CASCADE, null=True, blank=True, db_column='idlote')
    cantidad = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        app_label = 'transferencia'
        db_table = 'detalletransferencia'  # Nombre físico de la tabla en la base de datos
        verbose_name = 'Detalle de Transferencia'
        verbose_name_plural = 'Detalles de Transferencias'

    def __str__(self):
        return f"Detalle T-{self.idtransferencia.numero_transferencia}: {self.cantidad}"
