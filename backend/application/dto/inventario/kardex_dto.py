from rest_framework import serializers
from infrastructure.models.inventario_model import Kardex


class KardexSerializer(serializers.ModelSerializer):
    producto_codigo = serializers.CharField(source='idproducto.codigo', read_only=True)
    lote_numero = serializers.CharField(source='idlote.numero_lote', read_only=True, allow_null=True, default=None)
    ubicacion_codigo = serializers.CharField(source='idubicacion.codigo', read_only=True, allow_null=True, default=None)
    usuario_nombre = serializers.CharField(source='idusuario.usuario', read_only=True, allow_null=True, default=None)

    class Meta:
        model = Kardex
        fields = '__all__'
