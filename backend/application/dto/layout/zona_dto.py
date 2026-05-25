from rest_framework import serializers
from infrastructure.models.layout_model import Zona
from .estante_dto import EstanteListSerializer


class ZonaSerializer(serializers.ModelSerializer):
    estantes = EstanteListSerializer(source='estante_set', many=True, read_only=True)

    class Meta:
        model = Zona
        fields = '__all__'


class ZonaListSerializer(serializers.ModelSerializer):
    estantes_count = serializers.SerializerMethodField()

    class Meta:
        model = Zona
        fields = ['idzona', 'idsucursal', 'idalmacen', 'nombre', 'codigo', 'tipo', 'x', 'y', 'poligono', 'z_base', 'z_techo', 'color', 'estado', 'estantes_count']

    def get_estantes_count(self, obj):
        return obj.estante_set.count()
