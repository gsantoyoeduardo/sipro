from rest_framework import serializers
from infrastructure.models.layout_model import Estante
from .nivel_dto import NivelSerializer


class EstanteSerializer(serializers.ModelSerializer):
    niveles = NivelSerializer(source='nivel_set', many=True, read_only=True)

    class Meta:
        model = Estante
        fields = '__all__'


class EstanteListSerializer(serializers.ModelSerializer):
    niveles_count = serializers.SerializerMethodField()

    class Meta:
        model = Estante
        fields = ['idestante', 'idzona', 'nombre', 'codigo', 'x', 'y', 'z_base', 'rotacion', 'ancho', 'alto', 'cantidadniveles', 'estado', 'niveles_count']

    def get_niveles_count(self, obj):
        return obj.nivel_set.count()
