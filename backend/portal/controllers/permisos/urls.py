from django.urls import path
from portal.controllers.permisos.views import (
    listar_permisos, crear_permiso, detalle_permiso,
    editar_permiso, eliminar_permiso
)

urlpatterns = [
    path('', listar_permisos, name='listar-permisos'),
    path('registro/', crear_permiso, name='crear-permiso'),
    path('<uuid:idpermiso>/', detalle_permiso, name='detalle-permiso'),
    path('<uuid:idpermiso>/editar/', editar_permiso, name='editar-permiso'),
    path('<uuid:idpermiso>/eliminar/', eliminar_permiso, name='eliminar-permiso'),
]
