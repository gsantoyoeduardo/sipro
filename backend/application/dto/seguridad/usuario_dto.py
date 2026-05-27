from rest_framework import serializers

from infrastructure.models.seguridad_model import Usuario


class UsuarioSerializer(serializers.ModelSerializer):
    roles = serializers.SerializerMethodField()

    class Meta:
        model = Usuario
        fields = ['idusuario', 'nombres', 'apellidos', 'correo', 'usuario',
                  'telefono', 'foto', 'estado', 'ultimologin', 'fechacreacion',
                  'idempresa', 'tipo_usuario', 'roles']
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
