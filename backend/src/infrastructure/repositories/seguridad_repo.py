"""Repositorios de la capa de infraestructura para seguridad y autenticación.

Proporciona acceso a datos (CRUD + consultas específicas) para las
entidades del módulo de seguridad: **Usuario**, **Rol**, **Permiso**,
**UsuarioRol**, **RolPermiso** y **SesionUsuario**, todas bajo el esquema
del tenant (o ``public`` para usuarios del portal).
"""

import uuid
from src.infrastructure.models.seguridad_model import Usuario, Rol, Permiso, UsuarioRol, RolPermiso, SesionUsuario

class UsuarioRepository:
    """Repositorio para la entidad Usuario (credenciales y datos personales)."""

    def get_all(self, idempresa: uuid.UUID | None = None):
        """Retorna todos los usuarios, filtrados por empresa si se indica."""
        qs = Usuario.objects.all()
        if idempresa:
            qs = qs.filter(idempresa_id=idempresa)
        return qs

    def get_by_id(self, idusuario: uuid.UUID):
        """Obtiene un usuario por su UUID."""
        return Usuario.objects.get(idusuario=idusuario)

    def create(self, data: dict):
        """Crea un usuario, extrayendo y hasheando la contraseña si existe.

        El campo ``password`` se elimina del diccionario antes de crear
        el objeto para que Django no lo guarde en texto plano.
        """
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

    def delete(self, idusuario: uuid.UUID):
        """Elimina un usuario."""
        self.get_by_id(idusuario).delete()

    def toggle_estado(self, idusuario: uuid.UUID) -> bool:
        """Alterna el estado activo/inactivo del usuario."""
        usuario = self.get_by_id(idusuario)
        usuario.estado = not usuario.estado
        usuario.save(update_fields=['estado'])
        return usuario.estado

    def get_permisos(self, idusuario: uuid.UUID):
        """Obtiene todos los permisos de un usuario a través de sus roles.

        La consulta sigue la cadena:
        ``Usuario → UsuarioRol → Rol → RolPermiso → Permiso``

        1. Obtiene los IDs de los roles del usuario.
        2. Obtiene los IDs de los permisos de esos roles.
        3. Retorna los objetos Permiso correspondientes.
        """
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


class RolRepository:
    """Repositorio para la entidad Rol (agrupación de permisos)."""

    def get_all(self, idempresa: uuid.UUID | None = None):
        """Retorna todos los roles, filtrados por empresa si se indica."""
        qs = Rol.objects.all()
        if idempresa:
            qs = qs.filter(idempresa_id=idempresa)
        return qs

    def get_by_id(self, idrol: uuid.UUID):
        """Obtiene un rol por su UUID."""
        return Rol.objects.get(idrol=idrol)

    def create(self, data: dict):
        """Crea un nuevo rol."""
        return Rol.objects.create(**data)

    def update(self, idrol: uuid.UUID, data: dict):
        """Actualiza los campos de un rol."""
        rol = self.get_by_id(idrol)
        for k, v in data.items():
            setattr(rol, k, v)
        rol.save()
        return rol

    def delete(self, idrol: uuid.UUID):
        """Elimina un rol."""
        self.get_by_id(idrol).delete()

    def toggle_estado(self, idrol: uuid.UUID) -> bool:
        """Alterna el estado activo/inactivo del rol."""
        rol = self.get_by_id(idrol)
        rol.estado = not rol.estado
        rol.save(update_fields=['estado'])
        return rol.estado

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


class PermisoRepository:
    """Repositorio de solo lectura para la entidad Permiso (catálogo fijo)."""

    def get_all(self):
        """Retorna todos los permisos del catálogo."""
        return Permiso.objects.all()

    def get_by_id(self, idpermiso: uuid.UUID):
        """Obtiene un permiso por su UUID."""
        return Permiso.objects.get(idpermiso=idpermiso)


class SesionRepository:
    """Repositorio para la entidad SesionUsuario (sesiones JWT activas)."""

    def get_all(self, idempresa: uuid.UUID | None = None, activa: bool | None = None):
        """Retorna todas las sesiones, filtradas por empresa y/o estado activo.

        Utiliza ``select_related`` para optimizar la relación con Usuario.
        """
        qs = SesionUsuario.objects.select_related('idusuario')
        if idempresa:
            qs = qs.filter(idusuario__idempresa_id=idempresa)
        if activa is not None:
            qs = qs.filter(activa=activa)
        return qs

    def get_by_id(self, idsesionusuario: uuid.UUID):
        """Obtiene una sesión por su UUID."""
        return SesionUsuario.objects.get(idsesionusuario=idsesionusuario)

    def create(self, data: dict):
        """Registra una nueva sesión en la base de datos."""
        return SesionUsuario.objects.create(**data)

    def deactivate(self, idsesionusuario: uuid.UUID):
        """Marca una sesión como inactiva y registra la fecha de fin."""
        from django.utils import timezone
        sesion = self.get_by_id(idsesionusuario)
        sesion.activa = False
        sesion.fechafin = timezone.now()
        sesion.save()
