"""
Modelos del módulo de Inventario.

Define la estructura de productos, categorías, lotes, inventario físico
y el kardex de movimientos para el control de existencias.
"""

import uuid
from django.db import models
from src.infrastructure.models.base_model import AuditableBaseModel


class Categoria(AuditableBaseModel):
    """Representa una categoría o clasificación de productos.

    Relación FK:
        idempresa -> Empresa (opcional): Categoría asociada a una empresa.
        idcategoriapadre -> Categoria (opcional, auto-referencia): Categoría padre
            para crear jerarquías de subcategorías.

    Campos más importantes:
        nombre: Nombre de la categoría (único por empresa).
        descripcion: Descripción opcional de la categoría.
    """
    idcategoria = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    idempresa = models.ForeignKey('empresa.Empresa', on_delete=models.CASCADE, null=True, blank=True, db_column='idempresa')
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(null=True, blank=True)
    idcategoriapadre = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, db_column='idcategoriapadre', related_name='subcategorias')

    class Meta:
        app_label = 'inventario'  # Etiqueta de la aplicación Django
        db_table = 'categoria'  # Nombre físico de la tabla en la base de datos
        verbose_name = 'Categoría'
        verbose_name_plural = 'Categorías'
        unique_together = ('idempresa', 'nombre')  # El nombre de categoría es único por empresa

    def __str__(self):
        return self.nombre


class Producto(AuditableBaseModel):
    """Representa un producto o artículo del inventario.

    Relación FK:
        idcategoria -> Categoria: Producto pertenece a una categoría.

    Campos más importantes:
        codigo: Código interno o SKU del producto (único por categoría).
        nombre: Nombre descriptivo del producto.
        unidad_medida: Unidad de medida base (unidad, kg, l, caja, pallet, etc.).
        peso, volumen: Dimensiones físicas del producto.
        precio_costo, precio_venta: Valores económicos.
        stock_minimo, stock_maximo: Límites de inventario para alertas.
        maneja_lotes: Indica si el producto requiere control por lotes.
    """
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
        db_table = 'producto'  # Nombre físico de la tabla en la base de datos
        verbose_name = 'Producto'
        verbose_name_plural = 'Productos'
        unique_together = ('idcategoria', 'codigo')  # El código de producto es único por categoría

    def __str__(self):
        return f"{self.codigo} — {self.nombre}"


class Lote(AuditableBaseModel):
    """Representa un lote de producción de un producto.

    Relación FK:
        idproducto -> Producto: Cada lote pertenece a un producto.

    Campos más importantes:
        numero_lote: Identificador del lote (único por producto).
        fecha_produccion: Fecha de fabricación del lote.
        fecha_vencimiento: Fecha de caducidad (para control de vigencia).
        cantidad_inicial: Cantidad original recibida del lote.
        cantidad_actual: Cantidad remanente disponible.
    """
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
        db_table = 'lote'  # Nombre físico de la tabla en la base de datos
        verbose_name = 'Lote'
        verbose_name_plural = 'Lotes'
        unique_together = ('idproducto', 'numero_lote')  # El número de lote es único por producto

    def __str__(self):
        return f"{self.numero_lote} (Vence: {self.fecha_vencimiento or 'N/A'})"


class Inventario(AuditableBaseModel):
    """Representa el stock físico de un producto en una ubicación específica.

    Relación FK:
        idproducto -> Producto: Producto almacenado.
        idlote -> Lote (opcional): Lote específico (si el producto maneja lotes).
        idubicacion -> Ubicacion: Ubicación física donde se encuentra el stock.

    Campos más importantes:
        cantidad: Cantidad actual disponible en esta ubicación.
        unique_together: Garantiza que un mismo producto+lote+ubicación solo
            tenga un registro de inventario.
        fecha_ultimo_conteo: Se actualiza automáticamente con cada modificación.
    """
    idinventario = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    idproducto = models.ForeignKey(Producto, on_delete=models.CASCADE, db_column='idproducto')
    idlote = models.ForeignKey(Lote, on_delete=models.CASCADE, null=True, blank=True, db_column='idlote')
    idubicacion = models.ForeignKey('layout.Ubicacion', on_delete=models.CASCADE, db_column='idubicacion')
    cantidad = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    fecha_ultimo_conteo = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = 'inventario'
        db_table = 'inventario'  # Nombre físico de la tabla en la base de datos
        verbose_name = 'Inventario'
        verbose_name_plural = 'Inventarios'
        unique_together = ('idproducto', 'idlote', 'idubicacion')  # Combinación única de producto + lote + ubicación

    def __str__(self):
        return f"{self.idproducto.codigo} @ {self.idubicacion.codigo}: {self.cantidad}"


class Kardex(AuditableBaseModel):
    """Registro histórico de movimientos de inventario (Kardex valorizado).

    Cada vez que ocurre una entrada, salida, ajuste o transferencia de stock,
    se registra un movimiento en esta tabla para mantener la trazabilidad.

    Relación FK:
        idproducto -> Producto: Producto afectado por el movimiento.
        idlote -> Lote (opcional): Lote afectado (si aplica).
        idubicacion -> Ubicacion (opcional): Ubicación donde ocurrió el movimiento.
        idusuario -> Usuario (opcional): Usuario que realizó la operación.

    Campos más importantes:
        tipo_movimiento: Tipo de operación (entrada, salida, ajuste, transferencia).
        cantidad: Cantidad movida (positiva para entradas, negativa para salidas).
        saldo_anterior, saldo_nuevo: Estado del stock antes y después del movimiento.
        referencia: Documento u orden de referencia que originó el movimiento.
    """
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
        db_table = 'kardex'  # Nombre físico de la tabla en la base de datos
        verbose_name = 'Kardex'
        verbose_name_plural = 'Kardex'  # Plural igual al singular (término invariable)

    def __str__(self):
        return f"{self.tipo_movimiento} | {self.cantidad} | {self.fecha_movimiento}"
