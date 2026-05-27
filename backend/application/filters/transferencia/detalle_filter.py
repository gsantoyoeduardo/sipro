import django_filters

from infrastructure.models.transferencia_model import DetalleTransferencia


class DetalleTransferenciaFilter(django_filters.FilterSet):
    class Meta:
        model = DetalleTransferencia
        fields = ['idtransferencia', 'idproducto']
