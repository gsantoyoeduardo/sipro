"""Serializers del módulo de Transferencia.

Convierte los modelos Transferencia y DetalleTransferencia a JSON.
Incluye serializers anidados para representar una transferencia con sus detalles.
"""

from rest_framework import serializers
from src.infrastructure.models.transferencia_model import Transferencia, DetalleTransferencia


class DetalleTransferenciaSerializer(serializers.ModelSerializer):
    """Serializer completo para el modelo DetalleTransferencia.

    Campos adicionales (read-only):
        producto_codigo: Código del producto transferido.
        producto_nombre: Nombre del producto transferido.
        lote_numero: Número de lote (puede ser nulo si el producto no maneja lotes).
    """
    producto_codigo = serializers.CharField(source='idproducto.codigo', read_only=True)
    producto_nombre = serializers.CharField(source='idproducto.nombre', read_only=True)
    lote_numero = serializers.CharField(source='idlote.numero_lote', read_only=True, allow_null=True)

    class Meta:
        model = DetalleTransferencia
        fields = '__all__'


class TransferenciaSerializer(serializers.ModelSerializer):
    """Serializer completo para el modelo Transferencia con detalles anidados.

    Campos adicionales (read-only):
        detalles: Lista de DetalleTransferenciaSerializer con los productos transferidos.
        origen_nombre: Nombre del almacén de origen.
        destino_nombre: Nombre del almacén de destino.
        usuario_nombre: Nombre del usuario que gestiona la transferencia.
    """
    detalles = DetalleTransferenciaSerializer(many=True, read_only=True)
    origen_nombre = serializers.CharField(source='idalmacen_origen.nombre', read_only=True)
    destino_nombre = serializers.CharField(source='idalmacen_destino.nombre', read_only=True)
    usuario_nombre = serializers.CharField(source='idusuario.usuario', read_only=True, allow_null=True)

    class Meta:
        model = Transferencia
        fields = '__all__'


class TransferenciaListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listar transferencias con conteo de ítems.

    Campos adicionales (read-only):
        origen_nombre: Nombre del almacén de origen.
        destino_nombre: Nombre del almacén de destino.
        usuario_nombre: Nombre del usuario que gestiona la transferencia.
        total_items: Cantidad total de detalles (productos) en la transferencia.

    Métodos personalizados:
        get_total_items: Cuenta los detalles asociados a la transferencia.
    """
    origen_nombre = serializers.CharField(source='idalmacen_origen.nombre', read_only=True)
    destino_nombre = serializers.CharField(source='idalmacen_destino.nombre', read_only=True)
    usuario_nombre = serializers.CharField(source='idusuario.usuario', read_only=True, allow_null=True)
    total_items = serializers.SerializerMethodField()

    class Meta:
        model = Transferencia
        fields = ['idtransferencia', 'numero_transferencia', 'idalmacen_origen', 'origen_nombre', 'idalmacen_destino', 'destino_nombre', 'idusuario', 'usuario_nombre', 'estado', 'fecha_creacion', 'fecha_envio', 'fecha_recepcion', 'notas', 'total_items']

    def get_total_items(self, obj):
        return obj.detalles.count()
