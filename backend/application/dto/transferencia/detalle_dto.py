from rest_framework import serializers

from infrastructure.models.transferencia_model import DetalleTransferencia


class DetalleTransferenciaSerializer(serializers.ModelSerializer):
    producto_codigo = serializers.CharField(source='idproducto.codigo', read_only=True)
    producto_nombre = serializers.CharField(source='idproducto.nombre', read_only=True)
    lote_numero = serializers.CharField(source='idlote.numero_lote', read_only=True, allow_null=True)

    class Meta:
        model = DetalleTransferencia
        fields = '__all__'
