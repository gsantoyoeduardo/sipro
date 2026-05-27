import uuid

from django.db import models


class ConfiguracionAuditoria(models.Model):
    auditoria_habilitada = models.BooleanField(default=True)
    version = models.IntegerField(default=1)

    class Meta:
        app_label = 'base'
        db_table = 'config_auditoria'
        verbose_name = 'Configuración de Auditoría'


class AuditableBaseModel(models.Model):
    estado = models.BooleanField(default=True)
    idultimaauditoria = models.UUIDField(null=True, blank=True)

    class Meta:
        abstract = True


class BaseAuditoria(models.Model):
    idauditoria = models.UUIDField(primary_key=True, default=uuid.uuid4)
    idregistro = models.UUIDField()
    idusuario = models.UUIDField(null=True, blank=True)
    tipooperacion = models.CharField(max_length=10)
    datosanteriores = models.JSONField(null=True, blank=True)
    datosnuevos = models.JSONField(null=True, blank=True)
    ip = models.GenericIPAddressField(null=True, blank=True)
    dispositivo = models.CharField(max_length=255, null=True, blank=True)
    fechaevento = models.DateTimeField(auto_now_add=True)

    class Meta:
        abstract = True


class AuditoriaEmpresa(BaseAuditoria):
    class Meta:
        app_label = 'base'
        db_table = 'aud_empresa'
        verbose_name = 'Auditoría Empresa'


class AuditoriaSucursal(BaseAuditoria):
    class Meta:
        app_label = 'base'
        db_table = 'aud_sucursal'
        verbose_name = 'Auditoría Sucursal'


class AuditoriaAlmacen(BaseAuditoria):
    class Meta:
        app_label = 'base'
        db_table = 'aud_almacen'
        verbose_name = 'Auditoría Almacén'


class AuditoriaUsuario(BaseAuditoria):
    class Meta:
        app_label = 'base'
        db_table = 'aud_usuario'
        verbose_name = 'Auditoría Usuario'


class AuditoriaRol(BaseAuditoria):
    class Meta:
        app_label = 'base'
        db_table = 'aud_rol'
        verbose_name = 'Auditoría Rol'


class AuditoriaPermiso(BaseAuditoria):
    class Meta:
        app_label = 'base'
        db_table = 'aud_permiso'
        verbose_name = 'Auditoría Permiso'


class AuditoriaUsuarioRol(BaseAuditoria):
    class Meta:
        app_label = 'base'
        db_table = 'aud_usuariorol'
        verbose_name = 'Auditoría Usuario-Rol'


class AuditoriaRolPermiso(BaseAuditoria):
    class Meta:
        app_label = 'base'
        db_table = 'aud_rolpermiso'
        verbose_name = 'Auditoría Rol-Permiso'


class AuditoriaSesionUsuario(BaseAuditoria):
    class Meta:
        app_label = 'base'
        db_table = 'aud_sesionusuario'
        verbose_name = 'Auditoría Sesión Usuario'


class AuditoriaCategoria(BaseAuditoria):
    class Meta:
        app_label = 'base'
        db_table = 'aud_categoria'
        verbose_name = 'Auditoría Categoría'


class AuditoriaProducto(BaseAuditoria):
    class Meta:
        app_label = 'base'
        db_table = 'aud_producto'
        verbose_name = 'Auditoría Producto'


class AuditoriaLote(BaseAuditoria):
    class Meta:
        app_label = 'base'
        db_table = 'aud_lote'
        verbose_name = 'Auditoría Lote'


class AuditoriaInventario(BaseAuditoria):
    class Meta:
        app_label = 'base'
        db_table = 'aud_inventario'
        verbose_name = 'Auditoría Inventario'


class AuditoriaKardex(BaseAuditoria):
    class Meta:
        app_label = 'base'
        db_table = 'aud_kardex'
        verbose_name = 'Auditoría Kardex'


class AuditoriaZona(BaseAuditoria):
    class Meta:
        app_label = 'base'
        db_table = 'aud_zona'
        verbose_name = 'Auditoría Zona'


class AuditoriaPasillo(BaseAuditoria):
    class Meta:
        app_label = 'base'
        db_table = 'aud_pasillo'
        verbose_name = 'Auditoría Pasillo'


class AuditoriaEstante(BaseAuditoria):
    class Meta:
        app_label = 'base'
        db_table = 'aud_estante'
        verbose_name = 'Auditoría Estante'


class AuditoriaNivel(BaseAuditoria):
    class Meta:
        app_label = 'base'
        db_table = 'aud_nivel'
        verbose_name = 'Auditoría Nivel'


class AuditoriaUbicacion(BaseAuditoria):
    class Meta:
        app_label = 'base'
        db_table = 'aud_ubicacion'
        verbose_name = 'Auditoría Ubicación'


class AuditoriaNodo(BaseAuditoria):
    class Meta:
        app_label = 'base'
        db_table = 'aud_nodo'
        verbose_name = 'Auditoría Nodo'


class AuditoriaConexion(BaseAuditoria):
    class Meta:
        app_label = 'base'
        db_table = 'aud_conexion'
        verbose_name = 'Auditoría Conexión'


class AuditoriaOrdenPicking(BaseAuditoria):
    class Meta:
        app_label = 'base'
        db_table = 'aud_ordenpicking'
        verbose_name = 'Auditoría Orden de Picking'


class AuditoriaDetallePicking(BaseAuditoria):
    class Meta:
        app_label = 'base'
        db_table = 'aud_detallepicking'
        verbose_name = 'Auditoría Detalle de Picking'


class AuditoriaIncidencia(BaseAuditoria):
    class Meta:
        app_label = 'base'
        db_table = 'aud_incidencia'
        verbose_name = 'Auditoría Incidencia'


class AuditoriaTransferencia(BaseAuditoria):
    class Meta:
        app_label = 'base'
        db_table = 'aud_transferencia'
        verbose_name = 'Auditoría Transferencia'


class AuditoriaDetalleTransferencia(BaseAuditoria):
    class Meta:
        app_label = 'base'
        db_table = 'aud_detalletransferencia'
        verbose_name = 'Auditoría Detalle de Transferencia'
