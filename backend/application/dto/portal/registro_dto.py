from rest_framework import serializers


class CrearEmpresaSerializer(serializers.Serializer):
    razonsocial = serializers.CharField(help_text='Razón social de la empresa', default='Nueva Empresa S.A.C.')
    nombrecomercial = serializers.CharField(required=False, help_text='Nombre comercial', default='Nueva Empresa')
    ruc = serializers.CharField(help_text='RUC de la empresa (11 dígitos)', default='20123456789')
    correo = serializers.EmailField(help_text='Correo corporativo', default='contacto@nuevaempresa.pe')
    telefono = serializers.CharField(required=False, help_text='Teléfono de contacto', default='01-555-0000')
    direccion = serializers.CharField(required=False, help_text='Dirección fiscal', default='Av. Empresarial 456')
    admin_usuario = serializers.CharField(help_text='Nombre de usuario del administrador', default='admin_nuevo')
    admin_nombres = serializers.CharField(help_text='Nombre completo del administrador', default='Admin Nuevo')
    admin_correo = serializers.EmailField(help_text='Correo del administrador', default='admin@nuevaempresa.pe')
    admin_password = serializers.CharField(min_length=8, help_text='Contraseña del administrador (mín. 8 caracteres)', default='segura123')
