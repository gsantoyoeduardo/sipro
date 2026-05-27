import django_filters

from infrastructure.models.empresa_model import Sucursal


class SucursalFilter(django_filters.FilterSet):
    nombre = django_filters.CharFilter(lookup_expr='icontains')
    codigo = django_filters.CharFilter(lookup_expr='icontains')

    class Meta:
        model = Sucursal
        fields = ['idempresa', 'nombre', 'codigo', 'estado']
