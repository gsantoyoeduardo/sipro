"""Serializers del módulo de Picking.

Convierte los modelos OrdenPicking, DetallePicking e Incidencia a JSON.
Incluye serializers anidados para representar la jerarquía completa de una orden.
"""

from rest_framework import serializers
from src.infrastructure.models.picking_model import OrdenPicking, DetallePicking, Incidencia


class IncidenciaSerializer(serializers.ModelSerializer):
    """Serializer completo para el modelo Incidencia.

    Campos adicionales (read-only):
        usuario_nombre: Nombre de usuario que reportó la incidencia.
    """
    usuario_nombre = serializers.CharField(source='idusuario.usuario', read_only=True)

    class Meta:
        model = Incidencia
        fields = '__all__'


class DetallePickingSerializer(serializers.ModelSerializer):
    """Serializer completo para el modelo DetallePicking con incidencias anidadas.

    Campos adicionales (read-only):
        producto_codigo: Código del producto a pickear.
        producto_nombre: Nombre del producto a pickear.
        ubicacion_codigo: Código de la ubicación de extracción.
        lote_numero: Número de lote (puede ser nulo).

    Campos anidados:
        incidencias: Lista de IncidenciaSerializer asociadas al detalle (read-only).
    """
    producto_codigo = serializers.CharField(source='idproducto.codigo', read_only=True)
    producto_nombre = serializers.CharField(source='idproducto.nombre', read_only=True)
    ubicacion_codigo = serializers.CharField(source='idubicacion.codigo', read_only=True)
    lote_numero = serializers.CharField(source='idlote.numero_lote', read_only=True, allow_null=True)
    incidencias = IncidenciaSerializer(many=True, read_only=True)

    class Meta:
        model = DetallePicking
        fields = '__all__'


class OrdenPickingSerializer(serializers.ModelSerializer):
    """Serializer completo para el modelo OrdenPicking con detalles e incidencias anidadas.

    Campos adicionales (read-only):
        detalles: Lista de DetallePickingSerializer con todos los detalles (read-only).
        usuario_nombre: Nombre del operador asignado.
        almacen_nombre: Nombre del almacén donde se ejecuta el picking.
        total_productos: Cantidad total de detalles en la orden.
        total_pickeado: Cantidad de detalles completados.

    Métodos personalizados:
        get_total_productos: Cuenta todos los detalles de la orden.
        get_total_pickeado: Cuenta los detalles con estado 'completado'.
    """
    detalles = DetallePickingSerializer(many=True, read_only=True)
    usuario_nombre = serializers.CharField(source='idusuario.usuario', read_only=True, allow_null=True)
    almacen_nombre = serializers.CharField(source='idalmacen.nombre', read_only=True)
    total_productos = serializers.SerializerMethodField()
    total_pickeado = serializers.SerializerMethodField()

    class Meta:
        model = OrdenPicking
        fields = '__all__'

    def get_total_productos(self, obj):
        return obj.detalles.count()

    def get_total_pickeado(self, obj):
        return obj.detalles.filter(estado='completado').count()


class OrdenPickingListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listar órdenes de picking.

    Campos adicionales (read-only):
        usuario_nombre: Nombre del operador asignado.
        almacen_nombre: Nombre del almacén.
        total_productos: Cantidad total de detalles en la orden.
        total_pickeado: Cantidad de detalles ya completados.

    Métodos personalizados:
        get_total_productos: Cuenta todos los detalles de la orden.
        get_total_pickeado: Cuenta los detalles con estado 'completado'.
    """
    usuario_nombre = serializers.CharField(source='idusuario.usuario', read_only=True, allow_null=True)
    almacen_nombre = serializers.CharField(source='idalmacen.nombre', read_only=True)
    total_productos = serializers.SerializerMethodField()
    total_pickeado = serializers.SerializerMethodField()

    class Meta:
        model = OrdenPicking
        fields = ['idordenpicking', 'numero_orden', 'idalmacen', 'almacen_nombre', 'idusuario', 'usuario_nombre', 'estado', 'prioridad', 'fecha_creacion', 'fecha_completado', 'notas', 'total_productos', 'total_pickeado']

    def get_total_productos(self, obj):
        return obj.detalles.count()

    def get_total_pickeado(self, obj):
        return obj.detalles.filter(estado='completado').count()
