from rest_framework import serializers, viewsets
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response

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
    tabla_nombre = ''

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
                'tabla': self.tabla_nombre,
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
    tabla_nombre = 'Empresa'


class AuditoriaSucursalViewSet(BaseAuditoriaViewSet):
    audit_model = AuditoriaSucursal
    tabla_nombre = 'Sucursal'


class AuditoriaAlmacenViewSet(BaseAuditoriaViewSet):
    audit_model = AuditoriaAlmacen
    tabla_nombre = 'Almacen'


class AuditoriaUsuarioViewSet(BaseAuditoriaViewSet):
    audit_model = AuditoriaUsuario
    tabla_nombre = 'Usuario'


class AuditoriaRolViewSet(BaseAuditoriaViewSet):
    audit_model = AuditoriaRol
    tabla_nombre = 'Rol'


class AuditoriaPermisoViewSet(BaseAuditoriaViewSet):
    audit_model = AuditoriaPermiso
    tabla_nombre = 'Permiso'


class AuditoriaUsuarioRolViewSet(BaseAuditoriaViewSet):
    audit_model = AuditoriaUsuarioRol
    tabla_nombre = 'UsuarioRol'


class AuditoriaRolPermisoViewSet(BaseAuditoriaViewSet):
    audit_model = AuditoriaRolPermiso
    tabla_nombre = 'RolPermiso'


class AuditoriaSesionUsuarioViewSet(BaseAuditoriaViewSet):
    audit_model = AuditoriaSesionUsuario
    tabla_nombre = 'Sesion'


class AuditoriaCategoriaViewSet(BaseAuditoriaViewSet):
    audit_model = AuditoriaCategoria
    tabla_nombre = 'Categoria'


class AuditoriaProductoViewSet(BaseAuditoriaViewSet):
    audit_model = AuditoriaProducto
    tabla_nombre = 'Producto'


class AuditoriaLoteViewSet(BaseAuditoriaViewSet):
    audit_model = AuditoriaLote
    tabla_nombre = 'Lote'


class AuditoriaInventarioViewSet(BaseAuditoriaViewSet):
    audit_model = AuditoriaInventario
    tabla_nombre = 'Inventario'


class AuditoriaKardexViewSet(BaseAuditoriaViewSet):
    audit_model = AuditoriaKardex
    tabla_nombre = 'Kardex'


class AuditoriaZonaViewSet(BaseAuditoriaViewSet):
    audit_model = AuditoriaZona
    tabla_nombre = 'Zona'


class AuditoriaEstanteViewSet(BaseAuditoriaViewSet):
    audit_model = AuditoriaEstante
    tabla_nombre = 'Estante'


class AuditoriaNivelViewSet(BaseAuditoriaViewSet):
    audit_model = AuditoriaNivel
    tabla_nombre = 'Nivel'


class AuditoriaUbicacionViewSet(BaseAuditoriaViewSet):
    audit_model = AuditoriaUbicacion
    tabla_nombre = 'Ubicacion'


class AuditoriaNodoViewSet(BaseAuditoriaViewSet):
    audit_model = AuditoriaNodo
    tabla_nombre = 'Nodo'


class AuditoriaConexionViewSet(BaseAuditoriaViewSet):
    audit_model = AuditoriaConexion
    tabla_nombre = 'Conexion'


class AuditoriaOrdenPickingViewSet(BaseAuditoriaViewSet):
    audit_model = AuditoriaOrdenPicking
    tabla_nombre = 'OrdenPicking'


class AuditoriaDetallePickingViewSet(BaseAuditoriaViewSet):
    audit_model = AuditoriaDetallePicking
    tabla_nombre = 'DetallePicking'


class AuditoriaIncidenciaViewSet(BaseAuditoriaViewSet):
    audit_model = AuditoriaIncidencia
    tabla_nombre = 'Incidencia'


class AuditoriaTransferenciaViewSet(BaseAuditoriaViewSet):
    audit_model = AuditoriaTransferencia
    tabla_nombre = 'Transferencia'


class AuditoriaDetalleTransferenciaViewSet(BaseAuditoriaViewSet):
    audit_model = AuditoriaDetalleTransferencia
    tabla_nombre = 'DetalleTransferencia'
