from rest_framework import serializers
from infrastructure.models.inventario_model import Categoria


class SubcategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = ['idcategoria', 'nombre', 'descripcion', 'estado']


class CategoriaSerializer(serializers.ModelSerializer):
    subcategorias = SubcategoriaSerializer(many=True, read_only=True)

    class Meta:
        model = Categoria
        fields = '__all__'
