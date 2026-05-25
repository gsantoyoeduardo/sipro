from rest_framework import permissions


class RolePermission(permissions.BasePermission):
    def has_permission(self, request, view):
        portal_only = getattr(view, 'portal_only', False)
        tenant_only = getattr(view, 'tenant_only', False)

        if not portal_only and not tenant_only:
            return True

        if not request.user.is_authenticated:
            return False

        if portal_only and request.user.tipo_usuario != 'admin_sistema':
            return False
        if tenant_only and request.user.tipo_usuario not in ('admin_empresa', 'operador'):
            return False
        return True
