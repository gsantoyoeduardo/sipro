from rest_framework import serializers

from infrastructure.models.empresa_model import Empresa


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
