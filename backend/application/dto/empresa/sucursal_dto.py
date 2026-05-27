from rest_framework import serializers

from infrastructure.models.empresa_model import Sucursal


class SucursalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sucursal
        fields = '__all__'


class SucursalListSerializer(serializers.ModelSerializer):
    almacenes_count = serializers.SerializerMethodField()

    class Meta:
        model = Sucursal
        fields = ['idsucursal', 'idempresa', 'nombre', 'codigo', 'direccion', 'telefono', 'estado', 'fechacreacion', 'almacenes_count']

    def get_almacenes_count(self, obj):
        return obj.almacen_set.count()
