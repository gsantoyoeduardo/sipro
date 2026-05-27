from django.apps import AppConfig


class BaseConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.base'
    label = 'base'

    def ready(self):
        from infrastructure.models.base_model import (
            AuditoriaAlmacen,
            AuditoriaCategoria,
            AuditoriaConexion,
            AuditoriaDetallePicking,
            AuditoriaDetalleTransferencia,
            AuditoriaEmpresa,
            AuditoriaEstante,
            AuditoriaIncidencia,
            AuditoriaInventario,
            AuditoriaKardex,
            AuditoriaLote,
            AuditoriaNivel,
            AuditoriaNodo,
            AuditoriaOrdenPicking,
            AuditoriaPermiso,
            AuditoriaProducto,
            AuditoriaRol,
            AuditoriaRolPermiso,
            AuditoriaSesionUsuario,
            AuditoriaSucursal,
            AuditoriaTransferencia,
            AuditoriaUbicacion,
            AuditoriaUsuario,
            AuditoriaUsuarioRol,
            AuditoriaZona,
        )
        from infrastructure.models.empresa_model import Almacen, Empresa, Sucursal
        from infrastructure.models.inventario_model import (
            Categoria,
            Inventario,
            Kardex,
            Lote,
            Producto,
        )
        from infrastructure.models.layout_model import (
            Conexion,
            Estante,
            Nivel,
            Nodo,
            Ubicacion,
            Zona,
        )
        from infrastructure.models.picking_model import (
            DetallePicking,
            Incidencia,
            OrdenPicking,
        )
        from infrastructure.models.seguridad_model import (
            Permiso,
            Rol,
            RolPermiso,
            SesionUsuario,
            Usuario,
            UsuarioRol,
        )
        from infrastructure.models.transferencia_model import (
            DetalleTransferencia,
            Transferencia,
        )

        from . import audit_signals

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
