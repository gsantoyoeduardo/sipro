import django_filters

from infrastructure.models.inventario_model import Producto


class ProductoFilter(django_filters.FilterSet):
    nombre = django_filters.CharFilter(lookup_expr='icontains')
    codigo = django_filters.CharFilter(lookup_expr='icontains')
    search = django_filters.CharFilter(method='filter_search')

    def filter_search(self, queryset, name, value):
        return queryset.filter(nombre__icontains=value) | queryset.filter(codigo__icontains=value)

    class Meta:
        model = Producto
        fields = ['idcategoria', 'nombre', 'codigo', 'estado', 'maneja_lotes']
