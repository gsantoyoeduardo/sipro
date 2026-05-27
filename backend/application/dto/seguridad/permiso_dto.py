from rest_framework import serializers

from infrastructure.models.seguridad_model import Permiso


class PermisoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permiso
        fields = ['idpermiso', 'codigo', 'nombre', 'descripcion', 'estado']
