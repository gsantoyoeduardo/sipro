from rest_framework import serializers
from infrastructure.models.picking_model import DetallePicking
from .incidencia_dto import IncidenciaSerializer


class PickSerializer(serializers.Serializer):
    cantidad = serializers.DecimalField(max_digits=10, decimal_places=2)


class DetallePickingSerializer(serializers.ModelSerializer):
    producto_codigo = serializers.CharField(source='idproducto.codigo', read_only=True)
    producto_nombre = serializers.CharField(source='idproducto.nombre', read_only=True)
    ubicacion_codigo = serializers.CharField(source='idubicacion.codigo', read_only=True)
    lote_numero = serializers.CharField(source='idlote.numero_lote', read_only=True, allow_null=True)
    incidencias = IncidenciaSerializer(many=True, read_only=True)

    class Meta:
        model = DetallePicking
        fields = '__all__'
