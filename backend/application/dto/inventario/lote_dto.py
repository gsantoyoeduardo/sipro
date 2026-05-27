from rest_framework import serializers

from infrastructure.models.inventario_model import Lote


class LoteSerializer(serializers.ModelSerializer):
    producto_codigo = serializers.CharField(source='idproducto.codigo', read_only=True)

    class Meta:
        model = Lote
        fields = '__all__'
