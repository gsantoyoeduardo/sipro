import django_filters

from infrastructure.models.picking_model import DetallePicking


class DetallePickingFilter(django_filters.FilterSet):
    class Meta:
        model = DetallePicking
        fields = ['idorden', 'estado_detalle', 'idproducto']
