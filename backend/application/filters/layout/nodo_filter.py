import django_filters

from infrastructure.models.layout_model import Nodo


class NodoFilter(django_filters.FilterSet):
    class Meta:
        model = Nodo
        fields = ['idsucursal', 'idalmacen', 'tipo']
