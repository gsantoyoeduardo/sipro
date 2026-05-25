import django_filters
from infrastructure.models.inventario_model import Kardex

class KardexFilter(django_filters.FilterSet):
    class Meta:
        model = Kardex
        fields = ['idproducto', 'tipo_movimiento']
