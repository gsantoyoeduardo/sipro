from rest_framework import serializers
from .models import Transferencia, DetalleTransferencia


class DetalleTransferenciaSerializer(serializers.ModelSerializer):
    producto_codigo = serializers.CharField(source='idproducto.codigo', read_only=True)
    producto_nombre = serializers.CharField(source='idproducto.nombre', read_only=True)
    lote_numero = serializers.CharField(source='idlote.numero_lote', read_only=True, allow_null=True)

    class Meta:
        model = DetalleTransferencia
        fields = '__all__'


class TransferenciaSerializer(serializers.ModelSerializer):
    detalles = DetalleTransferenciaSerializer(many=True, read_only=True)
    origen_nombre = serializers.CharField(source='idalmacen_origen.nombre', read_only=True)
    destino_nombre = serializers.CharField(source='idalmacen_destino.nombre', read_only=True)
    usuario_nombre = serializers.CharField(source='idusuario.usuario', read_only=True, allow_null=True)

    class Meta:
        model = Transferencia
        fields = '__all__'


class TransferenciaListSerializer(serializers.ModelSerializer):
    origen_nombre = serializers.CharField(source='idalmacen_origen.nombre', read_only=True)
    destino_nombre = serializers.CharField(source='idalmacen_destino.nombre', read_only=True)
    usuario_nombre = serializers.CharField(source='idusuario.usuario', read_only=True, allow_null=True)
    total_items = serializers.SerializerMethodField()

    class Meta:
        model = Transferencia
        fields = ['idtransferencia', 'numero_transferencia', 'idalmacen_origen', 'origen_nombre', 'idalmacen_destino', 'destino_nombre', 'idusuario', 'usuario_nombre', 'estado', 'fecha_creacion', 'fecha_envio', 'fecha_recepcion', 'notas', 'total_items']

    def get_total_items(self, obj):
        return obj.detalles.count()
