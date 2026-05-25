from rest_framework import serializers
from infrastructure.models.picking_model import Incidencia


class IncidenciaSerializer(serializers.ModelSerializer):
    usuario_nombre = serializers.CharField(source='idusuario.usuario', read_only=True)

    class Meta:
        model = Incidencia
        fields = '__all__'
