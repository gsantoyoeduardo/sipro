import django_filters
from infrastructure.models.layout_model import Estante

class EstanteFilter(django_filters.FilterSet):
    class Meta:
        model = Estante
        fields = ['idzona', 'estado']
