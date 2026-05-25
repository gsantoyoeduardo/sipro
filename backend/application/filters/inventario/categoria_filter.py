import django_filters
from infrastructure.models.inventario_model import Categoria

class CategoriaFilter(django_filters.FilterSet):
    nombre = django_filters.CharFilter(lookup_expr='icontains')
    
    class Meta:
        model = Categoria
        fields = ['nombre', 'idcategoriapadre', 'estado']
