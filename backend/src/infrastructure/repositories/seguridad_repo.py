import uuid
from src.infrastructure.models.seguridad_model import Usuario, Rol, Permiso, UsuarioRol, RolPermiso, SesionUsuario

class UsuarioRepository:
    def get_all(self, idempresa: uuid.UUID | None = None):
        qs = Usuario.objects.all()
        if idempresa:
            qs = qs.filter(idempresa_id=idempresa)
        return qs

    def get_by_id(self, idusuario: uuid.UUID):
        return Usuario.objects.get(idusuario=idusuario)

    def create(self, data: dict):
        password = data.pop('password', None)
        usuario = Usuario.objects.create(**data)
        if password:
            usuario.set_password(password)
            usuario.save()
        return usuario

    def update(self, idusuario: uuid.UUID, data: dict):
        usuario = self.get_by_id(idusuario)
        password = data.pop('password', None)
        for k, v in data.items():
            setattr(usuario, k, v)
        if password:
            usuario.set_password(password)
        usuario.save()
        return usuario

    def delete(self, idusuario: uuid.UUID):
        self.get_by_id(idusuario).delete()

    def toggle_estado(self, idusuario: uuid.UUID) -> bool:
        usuario = self.get_by_id(idusuario)
        usuario.estado = not usuario.estado
        usuario.save(update_fields=['estado'])
        return usuario.estado

    def get_permisos(self, idusuario: uuid.UUID):
        roles = UsuarioRol.objects.filter(idusuario_id=idusuario).values_list('idrol_id', flat=True)
        permisos_ids = RolPermiso.objects.filter(idrol_id__in=roles).values_list('idpermiso_id', flat=True)
        return Permiso.objects.filter(idpermiso__in=permisos_ids)

    def asignar_roles(self, idusuario: uuid.UUID, roles_ids: list):
        UsuarioRol.objects.filter(idusuario_id=idusuario).delete()
        for rol_id in roles_ids:
            UsuarioRol.objects.create(idusuario_id=idusuario, idrol_id=rol_id)

    def reset_password(self, idusuario: uuid.UUID, new_password: str):
        usuario = self.get_by_id(idusuario)
        usuario.set_password(new_password)
        usuario.save()


class RolRepository:
    def get_all(self, idempresa: uuid.UUID | None = None):
        qs = Rol.objects.all()
        if idempresa:
            qs = qs.filter(idempresa_id=idempresa)
        return qs

    def get_by_id(self, idrol: uuid.UUID):
        return Rol.objects.get(idrol=idrol)

    def create(self, data: dict):
        return Rol.objects.create(**data)

    def update(self, idrol: uuid.UUID, data: dict):
        rol = self.get_by_id(idrol)
        for k, v in data.items():
            setattr(rol, k, v)
        rol.save()
        return rol

    def delete(self, idrol: uuid.UUID):
        self.get_by_id(idrol).delete()

    def toggle_estado(self, idrol: uuid.UUID) -> bool:
        rol = self.get_by_id(idrol)
        rol.estado = not rol.estado
        rol.save(update_fields=['estado'])
        return rol.estado

    def get_permisos(self, idrol: uuid.UUID):
        return Permiso.objects.filter(rolpermiso__idrol_id=idrol)

    def asignar_permisos(self, idrol: uuid.UUID, permisos_ids: list):
        RolPermiso.objects.filter(idrol_id=idrol).delete()
        for permiso_id in permisos_ids:
            RolPermiso.objects.create(idrol_id=idrol, idpermiso_id=permiso_id)

    def remove_permiso(self, idrol: uuid.UUID, idpermiso: uuid.UUID):
        return RolPermiso.objects.filter(idrol_id=idrol, idpermiso_id=idpermiso).delete()


class PermisoRepository:
    def get_all(self):
        return Permiso.objects.all()

    def get_by_id(self, idpermiso: uuid.UUID):
        return Permiso.objects.get(idpermiso=idpermiso)


class SesionRepository:
    def get_all(self, idempresa: uuid.UUID | None = None, activa: bool | None = None):
        qs = SesionUsuario.objects.select_related('idusuario')
        if idempresa:
            qs = qs.filter(idusuario__idempresa_id=idempresa)
        if activa is not None:
            qs = qs.filter(activa=activa)
        return qs

    def get_by_id(self, idsesionusuario: uuid.UUID):
        return SesionUsuario.objects.get(idsesionusuario=idsesionusuario)

    def create(self, data: dict):
        return SesionUsuario.objects.create(**data)

    def deactivate(self, idsesionusuario: uuid.UUID):
        from django.utils import timezone
        sesion = self.get_by_id(idsesionusuario)
        sesion.activa = False
        sesion.fechafin = timezone.now()
        sesion.save()
