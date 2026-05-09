from rest_framework import serializers
from .models import Usuario, Rol, Permiso, UsuarioRol, RolPermiso, SesionUsuario


class UsuarioSerializer(serializers.ModelSerializer):
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
    class Meta:
        model = Usuario
        fields = ['idusuario', 'nombres', 'apellidos', 'correo', 'usuario', 'telefono', 'estado', 'ultimologin', 'fechacreacion']


class RolSerializer(serializers.ModelSerializer):
    permisos = serializers.SerializerMethodField()

    class Meta:
        model = Rol
        fields = '__all__'

    def get_permisos(self, obj):
        return list(obj.rolpermiso_set.values_list('idpermiso_id', flat=True))


class RolDetalleSerializer(serializers.ModelSerializer):
    permisos_detalle = serializers.SerializerMethodField()

    class Meta:
        model = Rol
        fields = '__all__'

    def get_permisos_detalle(self, obj):
        return PermisoSerializer(
            Permiso.objects.filter(rolpermiso__idrol=obj), many=True
        ).data


class PermisoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permiso
        fields = '__all__'


class UsuarioRolSerializer(serializers.ModelSerializer):
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
