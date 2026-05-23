from rest_framework.exceptions import PermissionDenied

class TenantFilterMixin:
    """
    Mixin base para filtrar querysets por empresa (tenant).

    Cómo usarlo:
        class MiViewSet(TenantFilterMixin, viewsets.ModelViewSet):
            tenant_field = 'idempresa'  # Campo FK hacia Empresa

    El mixin lee request.idempresa (seteado por TenantMiddleware)
    y filtra automáticamente todas las queries.
    """
    tenant_field = None

    def get_queryset(self):
        qs = super().get_queryset()
        idempresa = getattr(self.request, 'idempresa', None)
        if idempresa and self.tenant_field:
            filter_kwargs = {f'{self.tenant_field}': idempresa}
            return qs.filter(**filter_kwargs)
        if idempresa is None and hasattr(self.request, 'user'):
            if self.request.user.is_authenticated and self.request.user.tipo_usuario != 'admin_sistema':
                raise PermissionDenied('No se puede determinar la empresa del usuario')
        return qs

class TenantEmpresaDirectaMixin(TenantFilterMixin):
    """Filtra por idempresa directo (Ej: Empresa, Sucursal, Usuario)"""
    tenant_field = 'idempresa'

class TenantViaAlmacenMixin(TenantFilterMixin):
    """
    Filtra via: tabla → idalmacen → idsucursal → idempresa
    Ej: Zona, Pasillo, Estante (pertenecen a un almacén)
    """
    tenant_field = 'idalmacen__idsucursal__idempresa'

class TenantViaCategoriaMixin(TenantFilterMixin):
    tenant_field = 'idcategoria__idempresa'

class TenantViaProductoMixin(TenantFilterMixin):
    tenant_field = 'idproducto__idcategoria__idempresa'

class TenantViaOrdenMixin(TenantFilterMixin):
    """Filtra via: tabla → idorden → idalmacen → idsucursal → idempresa"""
    tenant_field = 'idorden__idalmacen__idsucursal__idempresa'

class TenantViaDetalleMixin(TenantFilterMixin):
    tenant_field = 'iddetalle__idorden__idalmacen__idsucursal__idempresa'

class TenantViaTransferenciaMixin(TenantFilterMixin):
    tenant_field = 'idtransferencia__idalmacen_origen__idsucursal__idempresa'
