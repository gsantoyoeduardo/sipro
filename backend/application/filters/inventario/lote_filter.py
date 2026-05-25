import django_filters
from infrastructure.models.inventario_model import Lote

class LoteFilter(django_filters.FilterSet):
    numero_lote = django_filters.CharFilter(lookup_expr='icontains')
    
    class Meta:
        model = Lote
        fields = ['idproducto', 'numero_lote']
