import django_filters

from infrastructure.models.picking_model import OrdenPicking


class OrdenPickingFilter(django_filters.FilterSet):
    class Meta:
        model = OrdenPicking
        fields = ['idalmacen', 'estado_orden', 'prioridad', 'idusuario']
