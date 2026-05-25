from django.apps import AppConfig

class BaseConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.base'
    label = 'base'

    def ready(self):
        from . import audit_signals
        from infrastructure.models.base_model import (
            AuditoriaEmpresa, AuditoriaSucursal, AuditoriaAlmacen,
            AuditoriaUsuario, AuditoriaRol, AuditoriaPermiso,
            AuditoriaUsuarioRol, AuditoriaRolPermiso, AuditoriaSesionUsuario,
            AuditoriaCategoria, AuditoriaProducto, AuditoriaLote,
            AuditoriaInventario, AuditoriaKardex,
            AuditoriaZona, AuditoriaPasillo, AuditoriaEstante,
            AuditoriaNivel, AuditoriaUbicacion, AuditoriaNodo, AuditoriaConexion,
            AuditoriaOrdenPicking, AuditoriaDetallePicking, AuditoriaIncidencia,
            AuditoriaTransferencia, AuditoriaDetalleTransferencia,
        )
        from infrastructure.models.empresa_model import Empresa, Sucursal, Almacen
        from infrastructure.models.seguridad_model import Usuario, Rol, Permiso, UsuarioRol, RolPermiso, SesionUsuario
        from infrastructure.models.inventario_model import Categoria, Producto, Lote, Inventario, Kardex
        from infrastructure.models.layout_model import Zona, Estante, Nivel, Ubicacion, Nodo, Conexion
        from infrastructure.models.picking_model import OrdenPicking, DetallePicking, Incidencia
        from infrastructure.models.transferencia_model import Transferencia, DetalleTransferencia

        audit_signals.register_audit(Empresa, AuditoriaEmpresa)
        audit_signals.register_audit(Sucursal, AuditoriaSucursal)
        audit_signals.register_audit(Almacen, AuditoriaAlmacen)
        audit_signals.register_audit(Usuario, AuditoriaUsuario)
        audit_signals.register_audit(Rol, AuditoriaRol)
        audit_signals.register_audit(Permiso, AuditoriaPermiso)
        audit_signals.register_audit(UsuarioRol, AuditoriaUsuarioRol)
        audit_signals.register_audit(RolPermiso, AuditoriaRolPermiso)
        audit_signals.register_audit(SesionUsuario, AuditoriaSesionUsuario)
        audit_signals.register_audit(Categoria, AuditoriaCategoria)
        audit_signals.register_audit(Producto, AuditoriaProducto)
        audit_signals.register_audit(Lote, AuditoriaLote)
        audit_signals.register_audit(Inventario, AuditoriaInventario)
        audit_signals.register_audit(Kardex, AuditoriaKardex)
        audit_signals.register_audit(Zona, AuditoriaZona)
        audit_signals.register_audit(Estante, AuditoriaEstante)
        audit_signals.register_audit(Nivel, AuditoriaNivel)
        audit_signals.register_audit(Ubicacion, AuditoriaUbicacion)
        audit_signals.register_audit(Nodo, AuditoriaNodo)
        audit_signals.register_audit(Conexion, AuditoriaConexion)
        audit_signals.register_audit(OrdenPicking, AuditoriaOrdenPicking)
        audit_signals.register_audit(DetallePicking, AuditoriaDetallePicking)
        audit_signals.register_audit(Incidencia, AuditoriaIncidencia)
        audit_signals.register_audit(Transferencia, AuditoriaTransferencia)
        audit_signals.register_audit(DetalleTransferencia, AuditoriaDetalleTransferencia)
