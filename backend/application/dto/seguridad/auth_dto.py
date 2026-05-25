from rest_framework import serializers


class ResetPasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField()
    new_password = serializers.CharField()


class AsignarRolesSerializer(serializers.Serializer):
    roles = serializers.ListField(child=serializers.UUIDField())


class AsignarPermisosSerializer(serializers.Serializer):
    permisos = serializers.ListField(child=serializers.UUIDField())


class RemovePermisoSerializer(serializers.Serializer):
    permiso_id = serializers.UUIDField()
