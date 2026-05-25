from rest_framework import serializers
from infrastructure.models.layout_model import Ubicacion


class CambiarEstadoUbicacionSerializer(serializers.Serializer):
    estado_ubicacion = serializers.CharField()


class UbicacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ubicacion
        fields = '__all__'
