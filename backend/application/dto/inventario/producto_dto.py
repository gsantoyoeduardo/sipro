from rest_framework import serializers
from infrastructure.models.inventario_model import Producto, Inventario


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
