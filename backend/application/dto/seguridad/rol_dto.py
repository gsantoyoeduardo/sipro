from rest_framework import serializers
from infrastructure.models.seguridad_model import Rol, Permiso
from .permiso_dto import PermisoSerializer


class RolSerializer(serializers.ModelSerializer):
    permisos = serializers.SerializerMethodField()

    class Meta:
        model = Rol
        fields = ['idrol', 'idempresa', 'nombre', 'descripcion', 'estado', 'permisos']

    def get_permisos(self, obj):
        return list(obj.rolpermiso_set.values_list('idpermiso_id', flat=True))


class RolDetalleSerializer(serializers.ModelSerializer):
    permisos_detalle = serializers.SerializerMethodField()

    class Meta:
        model = Rol
        fields = ['idrol', 'idempresa', 'nombre', 'descripcion', 'estado', 'permisos_detalle']

    def get_permisos_detalle(self, obj):
        return PermisoSerializer(
            Permiso.objects.filter(rolpermiso__idrol=obj), many=True
        ).data
