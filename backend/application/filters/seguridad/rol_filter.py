import django_filters
from infrastructure.models.seguridad_model import Rol

class RolFilter(django_filters.FilterSet):
    nombre = django_filters.CharFilter(lookup_expr='icontains')
    
    class Meta:
        model = Rol
        fields = ['nombre', 'idempresa', 'estado']
