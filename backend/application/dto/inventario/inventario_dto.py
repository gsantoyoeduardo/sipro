from rest_framework import serializers

from infrastructure.models.inventario_model import Inventario


class InventarioSerializer(serializers.ModelSerializer):
    producto_codigo = serializers.CharField(source='idproducto.codigo', read_only=True)
    producto_nombre = serializers.CharField(source='idproducto.nombre', read_only=True)
    lote_numero = serializers.CharField(source='idlote.numero_lote', read_only=True, allow_null=True)
    ubicacion_codigo = serializers.CharField(source='idubicacion.codigo', read_only=True)

    class Meta:
        model = Inventario
        fields = '__all__'
