import uuid
from django.db import models
from src.infrastructure.models.base_model import AuditableBaseModel


class Transferencia(AuditableBaseModel):
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
        app_label = 'transferencia'
        db_table = 'transferencia'
        verbose_name = 'Transferencia'
        verbose_name_plural = 'Transferencias'
        unique_together = ('idalmacen_origen', 'numero_transferencia')

    def __str__(self):
        return f"T-{self.numero_transferencia} [{self.estado}]"


class DetalleTransferencia(AuditableBaseModel):
    iddetalletransferencia = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    idtransferencia = models.ForeignKey(Transferencia, on_delete=models.CASCADE, related_name='detalles', db_column='idtransferencia')
    idproducto = models.ForeignKey('inventario.Producto', on_delete=models.CASCADE, db_column='idproducto')
    idlote = models.ForeignKey('inventario.Lote', on_delete=models.CASCADE, null=True, blank=True, db_column='idlote')
    cantidad = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        app_label = 'transferencia'
        db_table = 'detalletransferencia'
        verbose_name = 'Detalle de Transferencia'
        verbose_name_plural = 'Detalles de Transferencias'

    def __str__(self):
        return f"Detalle T-{self.idtransferencia.numero_transferencia}: {self.cantidad}"
