import django_filters
from infrastructure.models.empresa_model import Almacen

class AlmacenFilter(django_filters.FilterSet):
    nombre = django_filters.CharFilter(lookup_expr='icontains')
    codigo = django_filters.CharFilter(lookup_expr='icontains')
    
    class Meta:
        model = Almacen
        fields = ['idsucursal', 'nombre', 'codigo']
