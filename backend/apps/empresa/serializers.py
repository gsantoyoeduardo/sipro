from rest_framework import serializers
from .models import Empresa, Sucursal, Almacen


class EmpresaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Empresa
        fields = '__all__'


class EmpresaListSerializer(serializers.ModelSerializer):
    sucursales_count = serializers.SerializerMethodField()

    class Meta:
        model = Empresa
        fields = ['idempresa', 'razonsocial', 'nombrecomercial', 'ruc', 'correo', 'estado', 'fechacreacion', 'sucursales_count']

    def get_sucursales_count(self, obj):
        return obj.sucursal_set.count()


class SucursalSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sucursal
        fields = '__all__'


class SucursalListSerializer(serializers.ModelSerializer):
    almacenes_count = serializers.SerializerMethodField()

    class Meta:
        model = Sucursal
        fields = ['idsucursal', 'idempresa', 'nombre', 'codigo', 'direccion', 'estado', 'fechacreacion', 'almacenes_count']

    def get_almacenes_count(self, obj):
        return obj.almacen_set.count()


class AlmacenSerializer(serializers.ModelSerializer):
    class Meta:
        model = Almacen
        fields = '__all__'
