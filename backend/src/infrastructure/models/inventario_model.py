import uuid
from django.db import models
from src.infrastructure.models.base_model import AuditableBaseModel


class Categoria(AuditableBaseModel):
    idcategoria = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    idempresa = models.ForeignKey('empresa.Empresa', on_delete=models.CASCADE, null=True, blank=True, db_column='idempresa')
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(null=True, blank=True)
    idcategoriapadre = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, db_column='idcategoriapadre', related_name='subcategorias')

    class Meta:
        app_label = 'inventario'
        db_table = 'categoria'
        verbose_name = 'Categoría'
        verbose_name_plural = 'Categorías'
        unique_together = ('idempresa', 'nombre')

    def __str__(self):
        return self.nombre


class Producto(AuditableBaseModel):
    UNIDAD_CHOICES = [
        ('unidad', 'Unidad'),
        ('kg', 'Kilogramo'),
        ('g', 'Gramo'),
        ('l', 'Litro'),
        ('ml', 'Mililitro'),
        ('m', 'Metro'),
        ('m2', 'Metro cuadrado'),
        ('m3', 'Metro cúbico'),
        ('caja', 'Caja'),
        ('pallet', 'Pallet'),
    ]
    idproducto = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    idcategoria = models.ForeignKey(Categoria, on_delete=models.CASCADE, db_column='idcategoria')
    codigo = models.CharField(max_length=50)
    nombre = models.CharField(max_length=200)
    descripcion = models.TextField(null=True, blank=True)
    unidad_medida = models.CharField(max_length=20, choices=UNIDAD_CHOICES, default='unidad')
    peso = models.DecimalField(max_digits=10, decimal_places=3, null=True, blank=True)
    volumen = models.DecimalField(max_digits=10, decimal_places=3, null=True, blank=True)
    precio_costo = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    precio_venta = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    stock_minimo = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    stock_maximo = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    maneja_lotes = models.BooleanField(default=False)
    fechacreacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = 'inventario'
        db_table = 'producto'
        verbose_name = 'Producto'
        verbose_name_plural = 'Productos'
        unique_together = ('idcategoria', 'codigo')

    def __str__(self):
        return f"{self.codigo} — {self.nombre}"


class Lote(AuditableBaseModel):
    idlote = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    idproducto = models.ForeignKey(Producto, on_delete=models.CASCADE, db_column='idproducto')
    numero_lote = models.CharField(max_length=50)
    fecha_produccion = models.DateField(null=True, blank=True)
    fecha_vencimiento = models.DateField(null=True, blank=True)
    fecha_recepcion = models.DateTimeField(auto_now_add=True)
    cantidad_inicial = models.DecimalField(max_digits=12, decimal_places=2)
    cantidad_actual = models.DecimalField(max_digits=12, decimal_places=2)

    class Meta:
        app_label = 'inventario'
        db_table = 'lote'
        verbose_name = 'Lote'
        verbose_name_plural = 'Lotes'
        unique_together = ('idproducto', 'numero_lote')

    def __str__(self):
        return f"{self.numero_lote} (Vence: {self.fecha_vencimiento or 'N/A'})"


class Inventario(AuditableBaseModel):
    idinventario = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    idproducto = models.ForeignKey(Producto, on_delete=models.CASCADE, db_column='idproducto')
    idlote = models.ForeignKey(Lote, on_delete=models.CASCADE, null=True, blank=True, db_column='idlote')
    idubicacion = models.ForeignKey('layout.Ubicacion', on_delete=models.CASCADE, db_column='idubicacion')
    cantidad = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    fecha_ultimo_conteo = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = 'inventario'
        db_table = 'inventario'
        verbose_name = 'Inventario'
        verbose_name_plural = 'Inventarios'
        unique_together = ('idproducto', 'idlote', 'idubicacion')

    def __str__(self):
        return f"{self.idproducto.codigo} @ {self.idubicacion.codigo}: {self.cantidad}"


class Kardex(AuditableBaseModel):
    TIPO_CHOICES = [
        ('entrada', 'Entrada'),
        ('salida', 'Salida'),
        ('ajuste', 'Ajuste'),
        ('transferencia', 'Transferencia'),
    ]
    idkardex = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    idproducto = models.ForeignKey(Producto, on_delete=models.CASCADE, db_column='idproducto')
    idlote = models.ForeignKey(Lote, on_delete=models.CASCADE, null=True, blank=True, db_column='idlote')
    idubicacion = models.ForeignKey('layout.Ubicacion', on_delete=models.CASCADE, null=True, blank=True, db_column='idubicacion')
    tipo_movimiento = models.CharField(max_length=20, choices=TIPO_CHOICES)
    cantidad = models.DecimalField(max_digits=12, decimal_places=2)
    saldo_anterior = models.DecimalField(max_digits=12, decimal_places=2)
    saldo_nuevo = models.DecimalField(max_digits=12, decimal_places=2)
    fecha_movimiento = models.DateTimeField(auto_now_add=True)
    referencia = models.CharField(max_length=100, null=True, blank=True)
    idusuario = models.ForeignKey('seguridad.Usuario', on_delete=models.CASCADE, null=True, blank=True, db_column='idusuario')

    class Meta:
        app_label = 'inventario'
        db_table = 'kardex'
        verbose_name = 'Kardex'
        verbose_name_plural = 'Kardex'

    def __str__(self):
        return f"{self.tipo_movimiento} | {self.cantidad} | {self.fecha_movimiento}"
