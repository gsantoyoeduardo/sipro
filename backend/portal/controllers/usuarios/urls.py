from django.urls import path
from portal.controllers.usuarios.views import (
    listar_usuarios, crear_usuario, detalle_usuario,
    editar_usuario, desactivar_usuario, restablecer_contrasena, asignar_roles
)

urlpatterns = [
    path('', listar_usuarios, name='listar-usuarios'),
    path('registro/', crear_usuario, name='crear-usuario'),
    path('<uuid:idusuario>/', detalle_usuario, name='detalle-usuario'),
    path('<uuid:idusuario>/editar/', editar_usuario, name='editar-usuario'),
    path('<uuid:idusuario>/desactivar/', desactivar_usuario, name='desactivar-usuario'),
    path('<uuid:idusuario>/restablecer-contrasena/', restablecer_contrasena, name='restablecer-contrasena'),
    path('<uuid:idusuario>/roles/', asignar_roles, name='asignar-roles'),
]
