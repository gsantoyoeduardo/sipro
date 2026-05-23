"""Serializers del módulo de Empresa.

Convierte los modelos Empresa, Sucursal y Almacén a JSON y viceversa.
Incluye serializers de listado con conteos calculados.
"""

from rest_framework import serializers
from src.infrastructure.models.empresa_model import Empresa, Sucursal, Almacen


class EmpresaSerializer(serializers.ModelSerializer):
    """Serializer completo para el modelo Empresa.

    Serializa todos los campos del modelo Empresa.
    No realiza validación adicional; usa la validación predeterminada de Django.
    """
    class Meta:
        model = Empresa
        fields = '__all__'


class EmpresaListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listar empresas con conteo de sucursales.

    Métodos personalizados:
        get_sucursales_count: Retorna la cantidad de sucursales asociadas a la empresa.
    """
    sucursales_count = serializers.SerializerMethodField()

    class Meta:
        model = Empresa
        fields = ['idempresa', 'razonsocial', 'nombrecomercial', 'ruc', 'correo', 'estado', 'fechacreacion', 'sucursales_count']

    def get_sucursales_count(self, obj):
        return obj.sucursal_set.count()


class SucursalSerializer(serializers.ModelSerializer):
    """Serializer completo para el modelo Sucursal.

    Serializa todos los campos del modelo. Incluye la FK idempresa.
    """
    class Meta:
        model = Sucursal
        fields = '__all__'


class SucursalListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listar sucursales con conteo de almacenes.

    Métodos personalizados:
        get_almacenes_count: Retorna la cantidad de almacenes en la sucursal.
    """
    almacenes_count = serializers.SerializerMethodField()

    class Meta:
        model = Sucursal
        fields = ['idsucursal', 'idempresa', 'nombre', 'codigo', 'direccion', 'telefono', 'estado', 'fechacreacion', 'almacenes_count']

    def get_almacenes_count(self, obj):
        return obj.almacen_set.count()


class AlmacenSerializer(serializers.ModelSerializer):
    """Serializer completo para el modelo Almacén.

    Serializa todos los campos del modelo. Incluye la FK idsucursal.
    No realiza validación adicional.
    """
    class Meta:
        model = Almacen
        fields = '__all__'
