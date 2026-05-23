import uuid
from django.contrib.auth import authenticate
from django.utils import timezone
from rest_framework_simplejwt.tokens import RefreshToken
from src.infrastructure.repositories.seguridad_repo import (
    UsuarioRepository, RolRepository, PermisoRepository, SesionRepository
)
from src.infrastructure.serializers.seguridad_serializer import UsuarioSerializer

usuario_repo = UsuarioRepository()
rol_repo = RolRepository()
permiso_repo = PermisoRepository()
sesion_repo = SesionRepository()


class AuthService:
    @staticmethod
    def login(usuario: str, password: str, ip: str, user_agent: str):
        user = authenticate(usuario=usuario, password=password)
        if not user or not user.estado:
            return {'error': 'Credenciales inválidas'}

        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)

        dispositivo = user_agent[:255] if user_agent else None
        navegador = 'Desconocido'
        if 'Chrome' in user_agent:
            navegador = 'Chrome'
        elif 'Firefox' in user_agent:
            navegador = 'Firefox'
        elif 'Safari' in user_agent:
            navegador = 'Safari'
        elif 'Edge' in user_agent:
            navegador = 'Edge'

        sesion_repo.create({
            'idusuario': user,
            'tokenjwt': access_token,
            'refreshtoken': refresh_token,
            'ip': ip,
            'dispositivo': dispositivo,
            'navegador': navegador,
            'activa': True,
        })

        user.ultimologin = timezone.now()
        user.save(update_fields=['ultimologin'])

        return {
            'user': UsuarioSerializer(user).data,
            'access': access_token,
            'refresh': refresh_token,
        }

    @staticmethod
    def portal_login(usuario: str, password: str, ip: str, user_agent: str):
        user = authenticate(usuario=usuario, password=password)
        if not user or not user.estado:
            return {'error': 'Credenciales inválidas'}

        if user.tipo_usuario != 'admin_sistema':
            return {'error': 'Acceso denegado. Solo administradores del sistema.'}

        return AuthService._create_session(user, ip, user_agent, {
            'aud': 'portal',
            'tipo_usuario': user.tipo_usuario,
        })

    @staticmethod
    def tenant_login(ruc: str, usuario: str, password: str, ip: str, user_agent: str):
        from src.infrastructure.models.empresa_model import Empresa
        from src.infrastructure.models.seguridad_model import Usuario

        empresa = Empresa.objects.filter(ruc=ruc, estado=True).first()
        if not empresa:
            return {'error': 'Empresa no encontrada o inactiva'}

        user = Usuario.objects.filter(usuario=usuario, idempresa=empresa).first()
        if not user:
            return {'error': 'Usuario no encontrado en esta empresa'}

        if not user.check_password(password):
            return {'error': 'Contraseña incorrecta'}

        if not user.estado:
            return {'error': 'Usuario desactivado'}

        if user.tipo_usuario not in ('admin_empresa', 'operador'):
            return {'error': 'Acceso denegado. Usuario no pertenece a una empresa.'}

        return AuthService._create_session(user, ip, user_agent, {
            'aud': 'tenant',
            'idempresa': str(empresa.idempresa),
            'tipo_usuario': user.tipo_usuario,
        })

    @staticmethod
    def _create_session(user, ip: str, user_agent: str, extra_claims: dict | None = None):
        refresh = RefreshToken.for_user(user)
        if extra_claims:
            for key, value in extra_claims.items():
                refresh[key] = value
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)

        dispositivo = user_agent[:255] if user_agent else None
        navegador = 'Desconocido'
        if 'Chrome' in user_agent:
            navegador = 'Chrome'
        elif 'Firefox' in user_agent:
            navegador = 'Firefox'
        elif 'Safari' in user_agent:
            navegador = 'Safari'
        elif 'Edge' in user_agent:
            navegador = 'Edge'

        sesion_repo.create({
            'idusuario': user,
            'tokenjwt': access_token,
            'refreshtoken': refresh_token,
            'ip': ip,
            'dispositivo': dispositivo,
            'navegador': navegador,
            'activa': True,
        })

        user.ultimologin = timezone.now()
        user.save(update_fields=['ultimologin'])

        return {
            'user': UsuarioSerializer(user).data,
            'access': access_token,
            'refresh': refresh_token,
        }

    @staticmethod
    def logout(refresh_token: str, user):
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except Exception:
            pass

        from src.infrastructure.models.seguridad_model import SesionUsuario
        SesionUsuario.objects.filter(
            idusuario=user,
            activa=True,
            refreshtoken=refresh_token,
        ).update(activa=False, fechafin=timezone.now())

        return {'mensaje': 'Sesión cerrada exitosamente'}

    @staticmethod
    def change_password(user, old_password: str, new_password: str):
        if not user.check_password(old_password):
            return {'error': 'Contraseña actual incorrecta'}
        user.set_password(new_password)
        user.save()
        return {'mensaje': 'Contraseña actualizada exitosamente'}


class UsuarioService:
    @staticmethod
    def listar(idempresa: uuid.UUID | None = None):
        return usuario_repo.get_all(idempresa)

    @staticmethod
    def obtener(idusuario: uuid.UUID):
        return usuario_repo.get_by_id(idusuario)

    @staticmethod
    def crear(data: dict):
        return usuario_repo.create(data)

    @staticmethod
    def actualizar(idusuario: uuid.UUID, data: dict):
        return usuario_repo.update(idusuario, data)

    @staticmethod
    def eliminar(idusuario: uuid.UUID):
        return usuario_repo.delete(idusuario)

    @staticmethod
    def toggle_estado(idusuario: uuid.UUID):
        return usuario_repo.toggle_estado(idusuario)

    @staticmethod
    def reset_password(idusuario: uuid.UUID, new_password: str):
        usuario_repo.reset_password(idusuario, new_password)

    @staticmethod
    def get_permisos(idusuario: uuid.UUID):
        return usuario_repo.get_permisos(idusuario)

    @staticmethod
    def asignar_roles(idusuario: uuid.UUID, roles_ids: list):
        usuario_repo.asignar_roles(idusuario, roles_ids)


class RolService:
    @staticmethod
    def listar(idempresa: uuid.UUID | None = None):
        return rol_repo.get_all(idempresa)

    @staticmethod
    def obtener(idrol: uuid.UUID):
        return rol_repo.get_by_id(idrol)

    @staticmethod
    def crear(data: dict):
        return rol_repo.create(data)

    @staticmethod
    def actualizar(idrol: uuid.UUID, data: dict):
        return rol_repo.update(idrol, data)

    @staticmethod
    def eliminar(idrol: uuid.UUID):
        return rol_repo.delete(idrol)

    @staticmethod
    def toggle_estado(idrol: uuid.UUID):
        return rol_repo.toggle_estado(idrol)

    @staticmethod
    def get_permisos(idrol: uuid.UUID):
        return rol_repo.get_permisos(idrol)

    @staticmethod
    def asignar_permisos(idrol: uuid.UUID, permisos_ids: list):
        rol_repo.asignar_permisos(idrol, permisos_ids)

    @staticmethod
    def remove_permiso(idrol: uuid.UUID, idpermiso: uuid.UUID):
        return rol_repo.remove_permiso(idrol, idpermiso)
