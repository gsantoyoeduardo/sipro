from rest_framework import serializers

from infrastructure.models.picking_model import OrdenPicking

from .detalle_dto import DetallePickingSerializer


class OrdenPickingSerializer(serializers.ModelSerializer):
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
        return obj.detalles.filter(estado_detalle='completado').count()


class OrdenPickingListSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.CharField(source='idusuario.usuario', read_only=True, allow_null=True)
    almacen_nombre = serializers.CharField(source='idalmacen.nombre', read_only=True)
    total_productos = serializers.SerializerMethodField()
    total_pickeado = serializers.SerializerMethodField()

    class Meta:
        model = OrdenPicking
        fields = ['idordenpicking', 'numero_orden', 'idalmacen', 'almacen_nombre', 'idusuario', 'usuario_nombre', 'estado_orden', 'prioridad', 'fecha_creacion', 'fecha_completado', 'notas', 'total_productos', 'total_pickeado']

    def get_total_productos(self, obj):
        return obj.detalles.count()

    def get_total_pickeado(self, obj):
        return obj.detalles.filter(estado_detalle='completado').count()
