import django_filters
from infrastructure.models.layout_model import Ubicacion

class UbicacionFilter(django_filters.FilterSet):
    class Meta:
        model = Ubicacion
        fields = ['idnivel', 'capacidadpeso']
