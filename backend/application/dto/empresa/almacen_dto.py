from rest_framework import serializers
from infrastructure.models.empresa_model import Almacen


class AlmacenSerializer(serializers.ModelSerializer):
    class Meta:
        model = Almacen
        fields = '__all__'
