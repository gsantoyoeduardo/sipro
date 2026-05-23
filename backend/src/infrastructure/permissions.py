from rest_framework import permissions


class RolePermission(permissions.BasePermission):
    def has_permission(self, request, view):
        path = request.path
        if path.startswith('/portal/'):
            if not request.user.is_authenticated:
                return False
            if request.user.tipo_usuario != 'admin_sistema':
                return False
        if path.startswith('/tenant/'):
            if not request.user.is_authenticated:
                return False
            if request.user.tipo_usuario not in ('admin_empresa', 'operador'):
                return False
        return True
