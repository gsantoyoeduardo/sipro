import django_filters

from infrastructure.models.seguridad_model import Usuario


class UsuarioFilter(django_filters.FilterSet):
    usuario = django_filters.CharFilter(lookup_expr='icontains')
    correo = django_filters.CharFilter(lookup_expr='icontains')
    nombres = django_filters.CharFilter(lookup_expr='icontains')

    class Meta:
        model = Usuario
        fields = ['usuario', 'correo', 'nombres', 'estado', 'tipo_usuario']
