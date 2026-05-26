from django.urls import path
from portal.controllers.roles.views import (
    listar_roles, crear_rol, detalle_rol,
    editar_rol, desactivar_rol, asignar_permisos
)

urlpatterns = [
    path('', listar_roles, name='listar-roles'),
    path('registro/', crear_rol, name='crear-rol'),
    path('<uuid:idrol>/', detalle_rol, name='detalle-rol'),
    path('<uuid:idrol>/editar/', editar_rol, name='editar-rol'),
    path('<uuid:idrol>/desactivar/', desactivar_rol, name='desactivar-rol'),
    path('<uuid:idrol>/permisos/', asignar_permisos, name='asignar-permisos-rol'),
]
