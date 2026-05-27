"""Repositorios de la capa de infraestructura para seguridad y autenticación.

Proporciona acceso a datos (CRUD + consultas específicas) para las
entidades del módulo de seguridad: **Usuario**, **Rol**, **Permiso**,
**UsuarioRol**, **RolPermiso** y **SesionUsuario**, todas bajo el esquema
del tenant (o ``public`` para usuarios del portal).
"""

import uuid

from infrastructure.models.seguridad_model import (
    Permiso,
    Rol,
    RolPermiso,
    SesionUsuario,
    Usuario,
    UsuarioRol,
)

from .base_repository import BaseRepository


class UsuarioRepository(BaseRepository[Usuario]):
    """Repositorio para la entidad Usuario (credenciales y datos personales)."""

    def __init__(self):
        super().__init__(Usuario)

    def create(self, data: dict):
        """Crea un usuario, extrayendo y hasheando la contraseña si existe."""
        password = data.pop('password', None)
        usuario = Usuario.objects.create(**data)
        if password:
            usuario.set_password(password)
            usuario.save()
        return usuario

    def update(self, idusuario: uuid.UUID, data: dict):
        """Actualiza un usuario, hasheando la contraseña si se proporciona."""
        usuario = self.get_by_id(idusuario)
        password = data.pop('password', None)
        for k, v in data.items():
            setattr(usuario, k, v)
        if password:
            usuario.set_password(password)
        usuario.save()
        return usuario

    def get_permisos(self, idusuario: uuid.UUID):
        """Obtiene todos los permisos de un usuario a través de sus roles."""
        roles = UsuarioRol.objects.filter(idusuario_id=idusuario).values_list('idrol_id', flat=True)
        permisos_ids = RolPermiso.objects.filter(idrol_id__in=roles).values_list('idpermiso_id', flat=True)
        return Permiso.objects.filter(idpermiso__in=permisos_ids)

    def asignar_roles(self, idusuario: uuid.UUID, roles_ids: list):
        """Reemplaza los roles de un usuario: elimina los actuales y crea los nuevos."""
        UsuarioRol.objects.filter(idusuario_id=idusuario).delete()
        for rol_id in roles_ids:
            UsuarioRol.objects.create(idusuario_id=idusuario, idrol_id=rol_id)

    def reset_password(self, idusuario: uuid.UUID, new_password: str):
        """Resetea la contraseña de un usuario sin validar la anterior."""
        usuario = self.get_by_id(idusuario)
        usuario.set_password(new_password)
        usuario.save()


class RolRepository(BaseRepository[Rol]):
    """Repositorio para la entidad Rol (agrupación de permisos)."""

    def __init__(self):
        super().__init__(Rol)

    def get_permisos(self, idrol: uuid.UUID):
        """Retorna los permisos asignados a un rol mediante la relación ``RolPermiso``."""
        return Permiso.objects.filter(rolpermiso__idrol_id=idrol)

    def asignar_permisos(self, idrol: uuid.UUID, permisos_ids: list):
        """Reemplaza los permisos de un rol: elimina los actuales y asigna los nuevos."""
        RolPermiso.objects.filter(idrol_id=idrol).delete()
        for permiso_id in permisos_ids:
            RolPermiso.objects.create(idrol_id=idrol, idpermiso_id=permiso_id)

    def remove_permiso(self, idrol: uuid.UUID, idpermiso: uuid.UUID):
        """Elimina un permiso específico de un rol."""
        return RolPermiso.objects.filter(idrol_id=idrol, idpermiso_id=idpermiso).delete()


class PermisoRepository(BaseRepository[Permiso]):
    """Repositorio de solo lectura para la entidad Permiso (catálogo fijo)."""

    def __init__(self):
        super().__init__(Permiso)


class SesionRepository(BaseRepository[SesionUsuario]):
    """Repositorio para la entidad SesionUsuario (sesiones JWT activas)."""

    def __init__(self):
        super().__init__(SesionUsuario)

    def deactivate(self, idsesionusuario: uuid.UUID):
        """Marca una sesión como inactiva y registra la fecha de fin."""
        from django.utils import timezone
        sesion = self.get_by_id(idsesionusuario)
        sesion.activa = False
        sesion.fechafin = timezone.now()
        sesion.save()
