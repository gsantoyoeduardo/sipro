import uuid
from django.db import models
from src.infrastructure.models.base_model import AuditableBaseModel


class OrdenPicking(AuditableBaseModel):
    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('en_proceso', 'En Proceso'),
        ('completado', 'Completado'),
        ('cancelado', 'Cancelado'),
    ]
    idordenpicking = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    idalmacen = models.ForeignKey('empresa.Almacen', on_delete=models.CASCADE, db_column='idalmacen')
    idusuario = models.ForeignKey('seguridad.Usuario', on_delete=models.CASCADE, null=True, blank=True, db_column='idusuario')
    numero_orden = models.CharField(max_length=50)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='pendiente')
    prioridad = models.IntegerField(default=1)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_inicio = models.DateTimeField(null=True, blank=True)
    fecha_completado = models.DateTimeField(null=True, blank=True)
    notas = models.TextField(null=True, blank=True)

    class Meta:
        app_label = 'picking'
        db_table = 'ordenpicking'
        verbose_name = 'Orden de Picking'
        verbose_name_plural = 'Órdenes de Picking'
        unique_together = ('idalmacen', 'numero_orden')

    def __str__(self):
        return f"OP-{self.numero_orden} [{self.estado}]"


class DetallePicking(AuditableBaseModel):
    iddetallepicking = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    idorden = models.ForeignKey(OrdenPicking, on_delete=models.CASCADE, related_name='detalles', db_column='idorden')
    idproducto = models.ForeignKey('inventario.Producto', on_delete=models.CASCADE, db_column='idproducto')
    idubicacion = models.ForeignKey('layout.Ubicacion', on_delete=models.CASCADE, db_column='idubicacion')
    idlote = models.ForeignKey('inventario.Lote', on_delete=models.CASCADE, null=True, blank=True, db_column='idlote')
    cantidad_solicitada = models.DecimalField(max_digits=12, decimal_places=2)
    cantidad_pickeada = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    estado = models.CharField(max_length=20, choices=[('pendiente','Pendiente'),('en_proceso','En Proceso'),('completado','Completado'),('incidencia','Con Incidencia')], default='pendiente')

    class Meta:
        app_label = 'picking'
        db_table = 'detallepicking'
        verbose_name = 'Detalle de Picking'
        verbose_name_plural = 'Detalles de Picking'

    def __str__(self):
        return f"Detalle #{self.iddetallepicking} — {self.cantidad_pickeada}/{self.cantidad_solicitada}"


class Incidencia(AuditableBaseModel):
    TIPO_CHOICES = [
        ('faltante', 'Faltante'),
        ('danado', 'Dañado'),
        ('caducado', 'Caducado'),
        ('ubicacion_vacia', 'Ubicación Vacía'),
        ('otro', 'Otro'),
    ]
    idincidencia = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    iddetalle = models.ForeignKey(DetallePicking, on_delete=models.CASCADE, related_name='incidencias', db_column='iddetalle')
    idusuario = models.ForeignKey('seguridad.Usuario', on_delete=models.CASCADE, db_column='idusuario')
    tipo = models.CharField(max_length=30, choices=TIPO_CHOICES)
    descripcion = models.TextField()
    cantidad_reportada = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    fecha_reporte = models.DateTimeField(auto_now_add=True)
    resuelta = models.BooleanField(default=False)

    class Meta:
        app_label = 'picking'
        db_table = 'incidencia'
        verbose_name = 'Incidencia'
        verbose_name_plural = 'Incidencias'

    def __str__(self):
        return f"Incidencia #{self.idincidencia} — {self.tipo}"
