from rest_framework.exceptions import PermissionDenied


class TenantFilterMixin:
    """
    Mixin para filtrar automaticamente los querysets por la empresa del usuario.
    Requiere que el modelo tenga una FK a Empresa o una cadena de FKs que llegue a Empresa.

    Uso:
        tenant_field = 'idempresa'           # FK directa
        tenant_field = 'idalmacen__idsucursal__idempresa'  # Cadena de FKs
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
    tenant_field = 'idempresa'


class TenantViaAlmacenMixin(TenantFilterMixin):
    tenant_field = 'idalmacen__idsucursal__idempresa'


class TenantViaCategoriaMixin(TenantFilterMixin):
    tenant_field = 'idcategoria__idempresa'


class TenantViaProductoMixin(TenantFilterMixin):
    tenant_field = 'idproducto__idcategoria__idempresa'


class TenantViaOrdenMixin(TenantFilterMixin):
    tenant_field = 'idorden__idalmacen__idsucursal__idempresa'


class TenantViaDetalleMixin(TenantFilterMixin):
    tenant_field = 'iddetalle__idorden__idalmacen__idsucursal__idempresa'


class TenantViaTransferenciaMixin(TenantFilterMixin):
    tenant_field = 'idtransferencia__idalmacen_origen__idsucursal__idempresa'
