from rest_framework import serializers
from .models import OrdenPicking, DetallePicking, Incidencia


class IncidenciaSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.CharField(source='idusuario.usuario', read_only=True)

    class Meta:
        model = Incidencia
        fields = '__all__'


class DetallePickingSerializer(serializers.ModelSerializer):
    producto_codigo = serializers.CharField(source='idproducto.codigo', read_only=True)
    producto_nombre = serializers.CharField(source='idproducto.nombre', read_only=True)
    ubicacion_codigo = serializers.CharField(source='idubicacion.codigo', read_only=True)
    lote_numero = serializers.CharField(source='idlote.numero_lote', read_only=True, allow_null=True)
    incidencias = IncidenciaSerializer(many=True, read_only=True)

    class Meta:
        model = DetallePicking
        fields = '__all__'


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
        return obj.detalles.filter(estado='completado').count()


class OrdenPickingListSerializer(serializers.ModelSerializer):
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
