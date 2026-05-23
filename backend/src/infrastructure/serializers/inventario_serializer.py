"""Serializers del módulo de Inventario.

Convierte los modelos Categoria, Producto, Lote, Inventario y Kardex a JSON.
Incluye serializers anidados para categorías y campos calculados como stock_total.
"""

from rest_framework import serializers
from src.infrastructure.models.inventario_model import Categoria, Producto, Lote, Inventario, Kardex


class SubcategoriaSerializer(serializers.ModelSerializer):
    """Serializer para subcategorías (uso anidado dentro de CategoriaSerializer).

    Serializa solo los campos básicos de una categoría hija.
    Se usa para representar la jerarquía de categorías padre -> subcategorías.
    """
    class Meta:
        model = Categoria
        fields = ['idcategoria', 'nombre', 'descripcion', 'estado']


class CategoriaSerializer(serializers.ModelSerializer):
    """Serializer completo para el modelo Categoria con subcategorías anidadas.

    Campos anidados:
        subcategorias: Lista de SubcategoriaSerializer con las categorías hijas (read-only).
    """
    subcategorias = SubcategoriaSerializer(many=True, read_only=True)

    class Meta:
        model = Categoria
        fields = '__all__'


class ProductoSerializer(serializers.ModelSerializer):
    """Serializer completo para el modelo Producto.

    Campos adicionales (read-only):
        categoria_nombre: Nombre legible de la categoría del producto.
        stock_total: Suma total del stock del producto en todas las ubicaciones.

    Métodos personalizados:
        get_stock_total: Agrega la cantidad total del producto desde la tabla Inventario.
    """
    categoria_nombre = serializers.CharField(source='idcategoria.nombre', read_only=True)
    stock_total = serializers.SerializerMethodField()

    class Meta:
        model = Producto
        fields = '__all__'

    def get_stock_total(self, obj):
        from django.db.models import Sum
        total = Inventario.objects.filter(idproducto=obj).aggregate(s=Sum('cantidad'))['s']
        return total or 0


class ProductoListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listar productos con stock total.

    Campos adicionales (read-only):
        categoria_nombre: Nombre legible de la categoría.
        stock_total: Suma del stock del producto en todas las ubicaciones.

    Métodos personalizados:
        get_stock_total: Calcula el stock agregado desde la tabla Inventario.
    """
    categoria_nombre = serializers.CharField(source='idcategoria.nombre', read_only=True)
    stock_total = serializers.SerializerMethodField()

    class Meta:
        model = Producto
        fields = ['idproducto', 'codigo', 'nombre', 'idcategoria', 'categoria_nombre', 'unidad_medida', 'precio_costo', 'precio_venta', 'maneja_lotes', 'estado', 'stock_total']

    def get_stock_total(self, obj):
        from django.db.models import Sum
        total = Inventario.objects.filter(idproducto=obj).aggregate(s=Sum('cantidad'))['s']
        return total or 0


class LoteSerializer(serializers.ModelSerializer):
    """Serializer completo para el modelo Lote.

    Campos adicionales (read-only):
        producto_codigo: Código del producto asociado al lote.
    """
    producto_codigo = serializers.CharField(source='idproducto.codigo', read_only=True)

    class Meta:
        model = Lote
        fields = '__all__'


class InventarioSerializer(serializers.ModelSerializer):
    """Serializer completo para el modelo Inventario (stock en ubicación).

    Campos adicionales (read-only):
        producto_codigo: Código del producto.
        producto_nombre: Nombre del producto.
        lote_numero: Número de lote (puede ser nulo si el producto no maneja lotes).
        ubicacion_codigo: Código de la ubicación física.
    """
    producto_codigo = serializers.CharField(source='idproducto.codigo', read_only=True)
    producto_nombre = serializers.CharField(source='idproducto.nombre', read_only=True)
    lote_numero = serializers.CharField(source='idlote.numero_lote', read_only=True, allow_null=True)
    ubicacion_codigo = serializers.CharField(source='idubicacion.codigo', read_only=True)

    class Meta:
        model = Inventario
        fields = '__all__'


class KardexSerializer(serializers.ModelSerializer):
    """Serializer completo para el modelo Kardex (movimientos de inventario).

    Campos adicionales (read-only):
        producto_codigo: Código del producto del movimiento.
        lote_numero: Número de lote involucrado (puede ser nulo).
        ubicacion_codigo: Código de la ubicación del movimiento.
        usuario_nombre: Nombre de usuario que realizó la operación.
    """
    producto_codigo = serializers.CharField(source='idproducto.codigo', read_only=True)
    lote_numero = serializers.CharField(source='idlote.numero_lote', read_only=True, allow_null=True, default=None)
    ubicacion_codigo = serializers.CharField(source='idubicacion.codigo', read_only=True, allow_null=True, default=None)
    usuario_nombre = serializers.CharField(source='idusuario.usuario', read_only=True, allow_null=True, default=None)

    class Meta:
        model = Kardex
        fields = '__all__'
