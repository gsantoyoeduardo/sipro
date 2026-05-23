"""Serializers del módulo de Seguridad.

Convierte los modelos Usuario, Rol, Permiso, UsuarioRol, RolPermiso y
SesionUsuario a JSON. Incluye manejo seguro de contraseñas y serializadores
anidados para roles y permisos.
"""

from rest_framework import serializers
from src.infrastructure.models.seguridad_model import Usuario, Rol, Permiso, UsuarioRol, RolPermiso, SesionUsuario


class UsuarioSerializer(serializers.ModelSerializer):
    """Serializer completo para el modelo Usuario con manejo de contraseña.

    Campos adicionales:
        roles: Lista de IDs de roles asignados al usuario (calculado).

    Validación especial:
        password: Campo write-only (nunca se retorna en la respuesta).
        create/update: Usa set_password para almacenar el hash seguro de la contraseña.

    Métodos personalizados:
        get_roles: Retorna los IDs de los roles asociados al usuario.
        create: Crea el usuario y aplica hash a la contraseña.
        update: Actualiza el usuario y aplica hash si se cambia la contraseña.
    """
    roles = serializers.SerializerMethodField()

    class Meta:
        model = Usuario
        fields = '__all__'
        extra_kwargs = {'password': {'write_only': True}}

    def get_roles(self, obj):
        return list(obj.usuariorol_set.values_list('idrol_id', flat=True))

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        instance = super().create(validated_data)
        if password:
            instance.set_password(password)
            instance.save()
        return instance

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        instance = super().update(instance, validated_data)
        if password:
            instance.set_password(password)
            instance.save()
        return instance


class UsuarioListSerializer(serializers.ModelSerializer):
    """Serializer simplificado para listar usuarios (sin datos sensibles).

    No incluye el campo password ni roles. Solo muestra información básica
    del perfil del usuario.
    """
    class Meta:
        model = Usuario
        fields = ['idusuario', 'nombres', 'apellidos', 'correo', 'usuario', 'telefono', 'estado', 'ultimologin', 'fechacreacion']


class RolSerializer(serializers.ModelSerializer):
    """Serializer completo para el modelo Rol con IDs de permisos asociados.

    Campos adicionales:
        permisos: Lista de IDs de permisos asignados al rol (calculado).

    Métodos personalizados:
        get_permisos: Retorna los IDs de los permisos del rol.
    """
    permisos = serializers.SerializerMethodField()

    class Meta:
        model = Rol
        fields = '__all__'

    def get_permisos(self, obj):
        return list(obj.rolpermiso_set.values_list('idpermiso_id', flat=True))


class RolDetalleSerializer(serializers.ModelSerializer):
    """Serializer detallado para el modelo Rol con objetos de permiso completos.

    Campos adicionales:
        permisos_detalle: Lista de objetos Permiso completos asignados al rol.

    Métodos personalizados:
        get_permisos_detalle: Retorna los objetos Permiso serializados del rol.
    """
    permisos_detalle = serializers.SerializerMethodField()

    class Meta:
        model = Rol
        fields = '__all__'

    def get_permisos_detalle(self, obj):
        return PermisoSerializer(
            Permiso.objects.filter(rolpermiso__idrol=obj), many=True
        ).data


class PermisoSerializer(serializers.ModelSerializer):
    """Serializer completo para el modelo Permiso.

    Serializa todos los campos del permiso (codigo, nombre, descripcion).
    """
    class Meta:
        model = Permiso
        fields = '__all__'


class UsuarioRolSerializer(serializers.ModelSerializer):
    """Serializer para la tabla intermedia UsuarioRol.

    Serializa la relación muchos a muchos entre usuarios y roles.
    """
    class Meta:
        model = UsuarioRol
        fields = '__all__'


class RolPermisoSerializer(serializers.ModelSerializer):
    """Serializer para la tabla intermedia RolPermiso.

    Serializa la relación muchos a muchos entre roles y permisos.
    """
    class Meta:
        model = RolPermiso
        fields = '__all__'


class SesionUsuarioSerializer(serializers.ModelSerializer):
    """Serializer completo para el modelo SesionUsuario.

    Campos adicionales (read-only):
        usuariousuario: Nombre de usuario de la sesión.
        usuarionombre: Nombres del usuario de la sesión.
    """
    usuariousuario = serializers.CharField(source='idusuario.usuario', read_only=True)
    usuarionombre = serializers.CharField(source='idusuario.nombres', read_only=True)

    class Meta:
        model = SesionUsuario
        fields = '__all__'
    class Meta:
        model = UsuarioRol
        fields = '__all__'


class RolPermisoSerializer(serializers.ModelSerializer):
    class Meta:
        model = RolPermiso
        fields = '__all__'


class SesionUsuarioSerializer(serializers.ModelSerializer):
    usuariousuario = serializers.CharField(source='idusuario.usuario', read_only=True)
    usuarionombre = serializers.CharField(source='idusuario.nombres', read_only=True)

    class Meta:
        model = SesionUsuario
        fields = '__all__'
