import django_filters

from infrastructure.models.empresa_model import Empresa


class EmpresaFilter(django_filters.FilterSet):
    razonsocial = django_filters.CharFilter(lookup_expr='icontains')
    nombrecomercial = django_filters.CharFilter(lookup_expr='icontains')
    ruc = django_filters.CharFilter(lookup_expr='icontains')

    class Meta:
        model = Empresa
        fields = ['razonsocial', 'nombrecomercial', 'ruc', 'estado']
