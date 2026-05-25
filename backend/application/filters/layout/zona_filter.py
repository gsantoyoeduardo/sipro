import django_filters
from infrastructure.models.layout_model import Zona

class ZonaFilter(django_filters.FilterSet):
    nombre = django_filters.CharFilter(lookup_expr='icontains')
    
    class Meta:
        model = Zona
        fields = ['idsucursal', 'idalmacen', 'tipo', 'nombre']
