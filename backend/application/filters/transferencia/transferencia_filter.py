import django_filters
from infrastructure.models.transferencia_model import Transferencia

class TransferenciaFilter(django_filters.FilterSet):
    class Meta:
        model = Transferencia
        fields = ['estado_transferencia', 'idalmacen_origen', 'idalmacen_destino']
