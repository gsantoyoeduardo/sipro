from rest_framework import serializers
from infrastructure.models.layout_model import Nodo


class NodoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Nodo
        fields = '__all__'


class NodoListSerializer(serializers.ModelSerializer):
    conexiones_count = serializers.SerializerMethodField()

    class Meta:
        model = Nodo
        fields = ['idnodo', 'idsucursal', 'idalmacen', 'nombre', 'tipo', 'coordenada_x', 'coordenada_y', 'coordenada_z', 'idubicacion', 'estado', 'conexiones_count']

    def get_conexiones_count(self, obj):
        return obj.conexiones_salida.count() + obj.conexiones_entrada.count()
