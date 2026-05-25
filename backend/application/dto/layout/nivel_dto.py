from rest_framework import serializers
from infrastructure.models.layout_model import Nivel


class NivelSerializer(serializers.ModelSerializer):
    class Meta:
        model = Nivel
        fields = '__all__'
