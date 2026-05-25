from rest_framework import serializers
from infrastructure.models.layout_model import Conexion


class ConexionSerializer(serializers.ModelSerializer):
    origen_nombre = serializers.CharField(source='idnodoorigen.nombre', read_only=True)
    destino_nombre = serializers.CharField(source='idnododestino.nombre', read_only=True)

    class Meta:
        model = Conexion
        fields = '__all__'
