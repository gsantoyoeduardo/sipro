import django_filters

from infrastructure.models.seguridad_model import SesionUsuario


class SesionFilter(django_filters.FilterSet):
    class Meta:
        model = SesionUsuario
        fields = ['idusuario', 'activa']
