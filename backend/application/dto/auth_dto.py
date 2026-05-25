from rest_framework import serializers


class PortalLoginSerializer(serializers.Serializer):
    usuario = serializers.CharField(help_text='Nombre de usuario del administrador', default='admin')
    password = serializers.CharField(help_text='Contraseña del administrador', default='admin1234')


class TenantLoginSerializer(serializers.Serializer):
    ruc = serializers.CharField(help_text='RUC de la empresa (11 dígitos)', default='20123456789')
    usuario = serializers.CharField(help_text='Nombre de usuario', default='admin')
    password = serializers.CharField(help_text='Contraseña', default='admin1234')


class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField(help_text='Token JWT de refresco para invalidar')


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(help_text='Contraseña actual')
    new_password = serializers.CharField(help_text='Nueva contraseña (mín. 8 caracteres)')
