import hashlib
import logging
import uuid

from django.contrib.auth import authenticate
from django.utils import timezone
from rest_framework_simplejwt.tokens import RefreshToken

from application.dto.seguridad.usuario_dto import UsuarioSerializer
from infrastructure.repositories.seguridad_repo import (
    PermisoRepository,
    RolRepository,
    SesionRepository,
    UsuarioRepository,
)

logger = logging.getLogger(__name__)

usuario_repo = UsuarioRepository()
rol_repo = RolRepository()
permiso_repo = PermisoRepository()
sesion_repo = SesionRepository()


class AuthService:
    @staticmethod
    def portal_login(usuario: str, password: str, ip: str, user_agent: str):
        user = authenticate(usuario=usuario, password=password)
        if not user or not user.estado:
            logger.warning(f"Portal login fallido - usuario={usuario}, ip={ip}")
            return {'error': 'Credenciales inválidas'}

        if user.tipo_usuario != 'admin_sistema':
            logger.warning(f"Portal login denegado por tipo_usuario - usuario={usuario}, tipo={user.tipo_usuario}, ip={ip}")
            return {'error': 'Acceso denegado.'}

        return AuthService._create_session(user, ip, user_agent, {
            'aud': 'portal',
            'tipo_usuario': user.tipo_usuario,
        })

    @staticmethod
    def tenant_login(ruc: str, usuario: str, password: str, ip: str, user_agent: str):
        from django.db import connection

        from infrastructure.models.empresa_model import Empresa

        empresa = Empresa.objects.filter(ruc=ruc, estado=True).first()
        if not empresa:
            logger.warning(f"Tenant login fallido - empresa no encontrada ruc={ruc}, usuario={usuario}, ip={ip}")
            return {'error': 'Credenciales inválidas'}

        schema = f'empresa_{str(empresa.idempresa).replace("-", "_")}'
        with connection.cursor() as cursor:
            cursor.execute(f'SET search_path = "{schema}", public')

        try:
            user = authenticate(usuario=usuario, password=password)
            if not user or not user.estado or user.idempresa_id != empresa.idempresa:
                logger.warning(f"Tenant login fallido - usuario={usuario}, ruc={ruc}, ip={ip}")
                return {'error': 'Credenciales inválidas'}

            if user.tipo_usuario not in ('admin_empresa', 'operador'):
                logger.warning(f"Tenant login denegado por tipo_usuario - usuario={usuario}, tipo={user.tipo_usuario}, ip={ip}")
                return {'error': 'Acceso denegado.'}

            return AuthService._create_session(user, ip, user_agent, {
                'aud': 'tenant',
                'idempresa': str(empresa.idempresa),
                'tipo_usuario': user.tipo_usuario,
            })
        finally:
            with connection.cursor() as cursor:
                cursor.execute('SET search_path = public')

    @staticmethod
    def _create_session(user, ip: str, user_agent: str, extra_claims: dict | None = None):
        import uuid
        from datetime import datetime, timedelta

        from rest_framework_simplejwt.settings import api_settings
        from rest_framework_simplejwt.tokens import AccessToken, RefreshToken

        now = datetime.utcnow()
        refresh_exp = now + timedelta(seconds=api_settings.REFRESH_TOKEN_LIFETIME.total_seconds())
        access_exp = now + timedelta(seconds=api_settings.ACCESS_TOKEN_LIFETIME.total_seconds())

        refresh_token = RefreshToken()
        refresh_token['user_id'] = str(user.idusuario)
        refresh_token['token_type'] = 'refresh'
        refresh_token['exp'] = refresh_exp
        refresh_token['jti'] = str(uuid.uuid4())
        if extra_claims:
            for key, value in extra_claims.items():
                refresh_token[key] = value

        access_token = AccessToken()
        access_token['user_id'] = str(user.idusuario)
        access_token['token_type'] = 'access'
        access_token['exp'] = access_exp
        access_token['jti'] = str(uuid.uuid4())
        if extra_claims:
            for key, value in extra_claims.items():
                access_token[key] = value

        refresh_str = str(refresh_token)
        access_str = str(access_token)

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
            'tokenjwt': access_str,
            'refreshtoken': refresh_str,
            'token_hash': hashlib.sha256(refresh_str.encode()).hexdigest(),
            'ip': ip,
            'dispositivo': dispositivo,
            'navegador': navegador,
            'activa': True,
        })

        user.ultimologin = timezone.now()
        user.save(update_fields=['ultimologin'])

        logger.info(f"Login exitoso - usuario={user.usuario}, tipo={user.tipo_usuario}, ip={ip}")

        return {
            'user': UsuarioSerializer(user).data,
            'access': access_str,
            'refresh': refresh_str,
        }

    @staticmethod
    def logout(refresh_token: str, user):
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except Exception:
            pass

        from infrastructure.models.seguridad_model import SesionUsuario
        SesionUsuario.objects.filter(
            idusuario=user,
            activa=True,
            refreshtoken=refresh_token,
        ).update(activa=False, fechafin=timezone.now())

        return {'mensaje': 'Sesión cerrada exitosamente'}

    @staticmethod
    def change_password(user, old_password: str, new_password: str):
        if not user.check_password(old_password):
            logger.warning(f"Cambio password fallido - usuario={user.usuario}")
            return {'error': 'Contraseña actual incorrecta'}
        user.set_password(new_password)
        user.save()
        logger.info(f"Password cambiado exitosamente - usuario={user.usuario}")
        return {'mensaje': 'Contraseña actualizada exitosamente'}


class UsuarioService:
    @staticmethod
    def listar(idempresa: uuid.UUID | None = None):
        if idempresa:
            return usuario_repo.get_all(idempresa=idempresa)
        return usuario_repo.get_all()

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
        if idempresa:
            return rol_repo.get_all(idempresa=idempresa)
        return rol_repo.get_all()

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
