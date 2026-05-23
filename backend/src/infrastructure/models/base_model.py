import uuid
from django.db import models


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
        db_table = 'auditoria"."auditoriaempresa'
        verbose_name = 'Auditoría Empresa'


class AuditoriaSucursal(BaseAuditoria):
    class Meta:
        app_label = 'base'
        db_table = 'auditoria"."auditoriasucursal'
        verbose_name = 'Auditoría Sucursal'


class AuditoriaAlmacen(BaseAuditoria):
    class Meta:
        app_label = 'base'
        db_table = 'auditoria"."auditoriaalmacen'
        verbose_name = 'Auditoría Almacén'


class AuditoriaUsuario(BaseAuditoria):
    class Meta:
        app_label = 'base'
        db_table = 'auditoria"."auditoriausuario'
        verbose_name = 'Auditoría Usuario'


class AuditoriaRol(BaseAuditoria):
    class Meta:
        app_label = 'base'
        db_table = 'auditoria"."auditoriarol'
        verbose_name = 'Auditoría Rol'


class AuditoriaPermiso(BaseAuditoria):
    class Meta:
        app_label = 'base'
        db_table = 'auditoria"."auditoriapermiso'
        verbose_name = 'Auditoría Permiso'


class AuditoriaUsuarioRol(BaseAuditoria):
    class Meta:
        app_label = 'base'
        db_table = 'auditoria"."auditoriausuariorol'
        verbose_name = 'Auditoría Usuario-Rol'


class AuditoriaRolPermiso(BaseAuditoria):
    class Meta:
        app_label = 'base'
        db_table = 'auditoria"."auditoriarolpermiso'
        verbose_name = 'Auditoría Rol-Permiso'


class AuditoriaSesionUsuario(BaseAuditoria):
    class Meta:
        app_label = 'base'
        db_table = 'auditoria"."auditoriancesionusuario'
        verbose_name = 'Auditoría Sesión Usuario'
