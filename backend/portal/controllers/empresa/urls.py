from django.urls import path
from portal.controllers.empresa.views import (
    crear_empresa, listar_empresas, detalle_empresa,
    editar_empresa, desactivar_empresa, listar_usuarios_empresa,
    editar_usuario_empresa, sesiones_empresa, estadisticas
)

urlpatterns = [
    path('registro/', crear_empresa, name='registrar-empresa'),
    path('listar/', listar_empresas, name='listar-empresas'),
    path('<uuid:idempresa>/detalle/', detalle_empresa, name='detalle-empresa'),
    path('<uuid:idempresa>/editar/', editar_empresa, name='editar-empresa'),
    path('<uuid:idempresa>/desactivar/', desactivar_empresa, name='desactivar-empresa'),
    path('<uuid:idempresa>/usuarios/', listar_usuarios_empresa, name='listar-usuarios-empresa'),
    path('<uuid:idempresa>/usuarios/<uuid:userId>/editar/', editar_usuario_empresa, name='editar-usuario-empresa'),
    path('<uuid:idempresa>/sesiones/', sesiones_empresa, name='sesiones-empresa'),
    path('estadisticas/', estadisticas, name='estadisticas-empresa'),
]
