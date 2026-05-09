from django.apps import AppConfig

class BaseConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.base'
    label = 'base'

    def ready(self):
        from . import audit_signals
        from .models import (
            AuditoriaEmpresa, AuditoriaSucursal, AuditoriaAlmacen,
            AuditoriaUsuario, AuditoriaRol, AuditoriaPermiso,
            AuditoriaUsuarioRol, AuditoriaRolPermiso, AuditoriaSesionUsuario,
        )
        from apps.empresa.models import Empresa, Sucursal, Almacen
        from apps.seguridad.models import Usuario, Rol, Permiso, UsuarioRol, RolPermiso, SesionUsuario

        audit_signals.register_audit(Empresa, AuditoriaEmpresa)
        audit_signals.register_audit(Sucursal, AuditoriaSucursal)
        audit_signals.register_audit(Almacen, AuditoriaAlmacen)
        audit_signals.register_audit(Usuario, AuditoriaUsuario)
        audit_signals.register_audit(Rol, AuditoriaRol)
        audit_signals.register_audit(Permiso, AuditoriaPermiso)
        audit_signals.register_audit(UsuarioRol, AuditoriaUsuarioRol)
        audit_signals.register_audit(RolPermiso, AuditoriaRolPermiso)
        audit_signals.register_audit(SesionUsuario, AuditoriaSesionUsuario)
