from rest_framework import serializers
from infrastructure.models.seguridad_model import SesionUsuario


class SesionUsuarioSerializer(serializers.ModelSerializer):
    usuariousuario = serializers.CharField(source='idusuario.usuario', read_only=True)
    usuarionombre = serializers.CharField(source='idusuario.nombres', read_only=True)

    class Meta:
        model = SesionUsuario
        fields = ['idsesionusuario', 'idusuario', 'usuariousuario', 'usuarionombre',
                  'token_hash', 'ip', 'dispositivo', 'navegador',
                  'fechainicio', 'fechafin', 'activa']
