import django_filters

from infrastructure.models.layout_model import Nivel


class NivelFilter(django_filters.FilterSet):
    class Meta:
        model = Nivel
        fields = ['idestante']
