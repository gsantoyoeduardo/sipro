import django_filters
from infrastructure.models.inventario_model import Inventario

class InventarioFilter(django_filters.FilterSet):
    class Meta:
        model = Inventario
        fields = ['idproducto', 'idubicacion', 'idlote']
