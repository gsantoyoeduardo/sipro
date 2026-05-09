from rest_framework import serializers
from .models import Categoria, Producto, Lote, Inventario, Kardex


class SubcategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = ['idcategoria', 'nombre', 'descripcion', 'estado']


class CategoriaSerializer(serializers.ModelSerializer):
    subcategorias = SubcategoriaSerializer(many=True, read_only=True)

    class Meta:
        model = Categoria
        fields = '__all__'


class ProductoSerializer(serializers.ModelSerializer):
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
    producto_codigo = serializers.CharField(source='idproducto.codigo', read_only=True)

    class Meta:
        model = Lote
        fields = '__all__'


class InventarioSerializer(serializers.ModelSerializer):
    producto_codigo = serializers.CharField(source='idproducto.codigo', read_only=True)
    producto_nombre = serializers.CharField(source='idproducto.nombre', read_only=True)
    lote_numero = serializers.CharField(source='idlote.numero_lote', read_only=True, allow_null=True)
    ubicacion_codigo = serializers.CharField(source='idubicacion.codigo', read_only=True)

    class Meta:
        model = Inventario
        fields = '__all__'


class KardexSerializer(serializers.ModelSerializer):
    producto_codigo = serializers.CharField(source='idproducto.codigo', read_only=True)
    lote_numero = serializers.CharField(source='idlote.numero_lote', read_only=True, allow_null=True, default=None)
    ubicacion_codigo = serializers.CharField(source='idubicacion.codigo', read_only=True, allow_null=True, default=None)
    usuario_nombre = serializers.CharField(source='idusuario.usuario', read_only=True, allow_null=True, default=None)

    class Meta:
        model = Kardex
        fields = '__all__'
