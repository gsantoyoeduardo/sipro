from rest_framework import serializers, viewsets
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from infrastructure.models.base_model import (
    AuditoriaEmpresa, AuditoriaSucursal, AuditoriaAlmacen,
    AuditoriaUsuario, AuditoriaRol, AuditoriaPermiso,
    AuditoriaUsuarioRol, AuditoriaRolPermiso, AuditoriaSesionUsuario,
    AuditoriaCategoria, AuditoriaProducto, AuditoriaLote,
    AuditoriaInventario, AuditoriaKardex,
    AuditoriaZona, AuditoriaEstante,
    AuditoriaNivel, AuditoriaUbicacion, AuditoriaNodo, AuditoriaConexion,
    AuditoriaOrdenPicking, AuditoriaDetallePicking, AuditoriaIncidencia,
    AuditoriaTransferencia, AuditoriaDetalleTransferencia,
)
from infrastructure.utils.tenant_schema import tenant_schema


class AuditoriaSerializer(serializers.Serializer):
    idauditoria = serializers.CharField()
    idregistro = serializers.CharField()
    idusuario = serializers.CharField(allow_null=True)
    tipooperacion = serializers.CharField()
    datosanteriores = serializers.JSONField(allow_null=True)
    datosnuevos = serializers.JSONField(allow_null=True)
    ip = serializers.CharField(allow_null=True)
    dispositivo = serializers.CharField(allow_null=True)
    fechaevento = serializers.DateTimeField()


class BaseAuditoriaViewSet(viewsets.ReadOnlyModelViewSet):
    """Base para vistas de auditoría. Registro histórico de cambios en todas las entidades del sistema."""
    portal_only = True
    swagger_tags = 'Auditoría'
    permission_classes = [IsAdminUser]
    audit_model = None
    serializer_class = AuditoriaSerializer

    def get_queryset(self):
        idempresa = self.kwargs.get('idempresa')
        user_empresa = getattr(self.request.user, 'idempresa_id', None)
        if user_empresa and str(user_empresa) != str(idempresa):
            return []
        with tenant_schema(idempresa):
            qs = self.audit_model.objects.all().order_by('-fechaevento')
            tipo = self.request.query_params.get('tipo')
            if tipo:
                qs = qs.filter(tipooperacion=tipo)
            desde = self.request.query_params.get('desde')
            if desde:
                qs = qs.filter(fechaevento__gte=desde)
            hasta = self.request.query_params.get('hasta')
            if hasta:
                qs = qs.filter(fechaevento__lte=hasta)
            return list(qs)

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        data = [
            {
                'idauditoria': str(r.idauditoria),
                'idregistro': str(r.idregistro),
                'idusuario': str(r.idusuario) if r.idusuario else None,
                'tipooperacion': r.tipooperacion,
                'datosanteriores': r.datosanteriores,
                'datosnuevos': r.datosnuevos,
                'ip': r.ip,
                'dispositivo': r.dispositivo,
                'fechaevento': r.fechaevento.isoformat(),
            }
            for r in queryset
        ]
        return Response(data)


class AuditoriaEmpresaViewSet(BaseAuditoriaViewSet):
    audit_model = AuditoriaEmpresa


class AuditoriaSucursalViewSet(BaseAuditoriaViewSet):
    audit_model = AuditoriaSucursal


class AuditoriaAlmacenViewSet(BaseAuditoriaViewSet):
    audit_model = AuditoriaAlmacen


class AuditoriaUsuarioViewSet(BaseAuditoriaViewSet):
    audit_model = AuditoriaUsuario


class AuditoriaRolViewSet(BaseAuditoriaViewSet):
    audit_model = AuditoriaRol


class AuditoriaPermisoViewSet(BaseAuditoriaViewSet):
    audit_model = AuditoriaPermiso


class AuditoriaUsuarioRolViewSet(BaseAuditoriaViewSet):
    audit_model = AuditoriaUsuarioRol


class AuditoriaRolPermisoViewSet(BaseAuditoriaViewSet):
    audit_model = AuditoriaRolPermiso


class AuditoriaSesionUsuarioViewSet(BaseAuditoriaViewSet):
    audit_model = AuditoriaSesionUsuario


class AuditoriaCategoriaViewSet(BaseAuditoriaViewSet):
    audit_model = AuditoriaCategoria


class AuditoriaProductoViewSet(BaseAuditoriaViewSet):
    audit_model = AuditoriaProducto


class AuditoriaLoteViewSet(BaseAuditoriaViewSet):
    audit_model = AuditoriaLote


class AuditoriaInventarioViewSet(BaseAuditoriaViewSet):
    audit_model = AuditoriaInventario


class AuditoriaKardexViewSet(BaseAuditoriaViewSet):
    audit_model = AuditoriaKardex


class AuditoriaZonaViewSet(BaseAuditoriaViewSet):
    audit_model = AuditoriaZona



class AuditoriaEstanteViewSet(BaseAuditoriaViewSet):
    audit_model = AuditoriaEstante


class AuditoriaNivelViewSet(BaseAuditoriaViewSet):
    audit_model = AuditoriaNivel


class AuditoriaUbicacionViewSet(BaseAuditoriaViewSet):
    audit_model = AuditoriaUbicacion


class AuditoriaNodoViewSet(BaseAuditoriaViewSet):
    audit_model = AuditoriaNodo


class AuditoriaConexionViewSet(BaseAuditoriaViewSet):
    audit_model = AuditoriaConexion


class AuditoriaOrdenPickingViewSet(BaseAuditoriaViewSet):
    audit_model = AuditoriaOrdenPicking


class AuditoriaDetallePickingViewSet(BaseAuditoriaViewSet):
    audit_model = AuditoriaDetallePicking


class AuditoriaIncidenciaViewSet(BaseAuditoriaViewSet):
    audit_model = AuditoriaIncidencia


class AuditoriaTransferenciaViewSet(BaseAuditoriaViewSet):
    audit_model = AuditoriaTransferencia


class AuditoriaDetalleTransferenciaViewSet(BaseAuditoriaViewSet):
    audit_model = AuditoriaDetalleTransferencia
