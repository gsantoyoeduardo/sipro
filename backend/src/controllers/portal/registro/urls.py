from django.urls import path
from src.controllers.portal.registro.views import crear_empresa, get_stats, toggle_empresa_estado, get_empresa_detalle

urlpatterns = [
    path('', crear_empresa, name='crear_empresa'),
    path('stats/', get_stats, name='get_stats'),
    path('<uuid:idempresa>/toggle/', toggle_empresa_estado, name='toggle_empresa_estado'),
    path('<uuid:idempresa>/detalle/', get_empresa_detalle, name='get_empresa_detalle'),
]
