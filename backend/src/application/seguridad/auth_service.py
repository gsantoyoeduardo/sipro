"""Servicios de autenticación, autorización y gestión de usuarios/roles.

Implementa la lógica de negocio para:
- **Autenticación**: login (general y por tenant), logout, cambio de contraseña.
- **Sesiones JWT**: creación, registro de sesión en base de datos y blacklist.
- **CRUD de usuarios y roles**: con asignación de permisos.
- Distingue entre usuarios del portal (``admin_sistema``) y usuarios de
  empresa (``admin_empresa`` / ``operador``).
"""

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
    """Servicio principal de autenticación y manejo de sesiones."""

    @staticmethod
    def login(usuario: str, password: str, ip: str, user_agent: str):
        """Autentica a un usuario genérico y genera tokens JWT.

        Pasos:
        1. Autentica credenciales con Django Auth.
        2. Genera un par access/refresh JWT.
        3. Detecta el navegador desde el User-Agent.
        4. Registra la sesión activa en la base de datos.
        5. Actualiza ``ultimologin`` del usuario.

        Returns:
            dict: Datos del usuario, access token y refresh token.
        """
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
        """Autentica exclusivamente a usuarios tipo ``admin_sistema`` (portal).

        Rechaza cualquier otro tipo de usuario. Los tokens JWT incluyen
        el claim ``aud: portal``.

        Returns:
            dict: Datos del usuario y tokens JWT, o error si no es admin.
        """
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
        """Autentica a un usuario dentro del contexto de una empresa (tenant).

        Flujo:
        1. Busca la empresa por RUC y estado activo.
        2. Busca el usuario dentro de esa empresa.
        3. Valida contraseña, estado y tipo de usuario.
        4. Crea sesión con claims ``aud: tenant``, ``idempresa`` y ``tipo_usuario``.

        Returns:
            dict: Datos del usuario y tokens JWT, o error.
        """
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
        """Crea una sesión JWT y la registra en la base de datos.

        Es el método base usado por ``login``, ``portal_login`` y
        ``tenant_login``. Permite inyectar claims adicionales al token.

        Args:
            user: Instancia del usuario autenticado.
            ip: Dirección IP del cliente.
            user_agent: User-Agent del navegador.
            extra_claims: Diccionario opcional de claims extra para el JWT.

        Returns:
            dict: Usuario serializado, access token y refresh token.
        """
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
        """Cierra la sesión del usuario: blacklist del JWT y marca sesión como inactiva.

        Args:
            refresh_token: Token de refresco a invalidar.
            user: Instancia del usuario.

        Returns:
            dict: Mensaje de confirmación.
        """
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
        """Cambia la contraseña de un usuario validando la actual.

        Args:
            user: Instancia del usuario.
            old_password: Contraseña actual para verificación.
            new_password: Nueva contraseña.

        Returns:
            dict: Mensaje de éxito o error si la actual es incorrecta.
        """
        if not user.check_password(old_password):
            return {'error': 'Contraseña actual incorrecta'}
        user.set_password(new_password)
        user.save()
        return {'mensaje': 'Contraseña actualizada exitosamente'}


class UsuarioService:
    """Servicio CRUD y de gestión de roles/permisos para usuarios."""

    @staticmethod
    def listar(idempresa: uuid.UUID | None = None):
        """Lista usuarios, opcionalmente filtrados por empresa."""
        return usuario_repo.get_all(idempresa)

    @staticmethod
    def obtener(idusuario: uuid.UUID):
        """Obtiene un usuario por su ID."""
        return usuario_repo.get_by_id(idusuario)

    @staticmethod
    def crear(data: dict):
        """Crea un nuevo usuario (con password hasheado)."""
        return usuario_repo.create(data)

    @staticmethod
    def actualizar(idusuario: uuid.UUID, data: dict):
        """Actualiza los datos de un usuario (permite cambiar password)."""
        return usuario_repo.update(idusuario, data)

    @staticmethod
    def eliminar(idusuario: uuid.UUID):
        """Elimina un usuario."""
        return usuario_repo.delete(idusuario)

    @staticmethod
    def toggle_estado(idusuario: uuid.UUID):
        """Alterna el estado activo/inactivo del usuario."""
        return usuario_repo.toggle_estado(idusuario)

    @staticmethod
    def reset_password(idusuario: uuid.UUID, new_password: str):
        """Resetea la contraseña de un usuario sin validar la anterior."""
        usuario_repo.reset_password(idusuario, new_password)

    @staticmethod
    def get_permisos(idusuario: uuid.UUID):
        """Retorna todos los permisos que tiene un usuario a través de sus roles."""
        return usuario_repo.get_permisos(idusuario)

    @staticmethod
    def asignar_roles(idusuario: uuid.UUID, roles_ids: list):
        """Reemplaza los roles de un usuario (borra y crea)."""
        usuario_repo.asignar_roles(idusuario, roles_ids)


class RolService:
    """Servicio CRUD y de asignación de permisos para roles."""

    @staticmethod
    def listar(idempresa: uuid.UUID | None = None):
        """Lista roles, opcionalmente filtrados por empresa."""
        return rol_repo.get_all(idempresa)

    @staticmethod
    def obtener(idrol: uuid.UUID):
        """Obtiene un rol por su ID."""
        return rol_repo.get_by_id(idrol)

    @staticmethod
    def crear(data: dict):
        """Crea un nuevo rol."""
        return rol_repo.create(data)

    @staticmethod
    def actualizar(idrol: uuid.UUID, data: dict):
        """Actualiza los campos de un rol existente."""
        return rol_repo.update(idrol, data)

    @staticmethod
    def eliminar(idrol: uuid.UUID):
        """Elimina un rol."""
        return rol_repo.delete(idrol)

    @staticmethod
    def toggle_estado(idrol: uuid.UUID):
        """Alterna el estado activo/inactivo del rol."""
        return rol_repo.toggle_estado(idrol)

    @staticmethod
    def get_permisos(idrol: uuid.UUID):
        """Retorna los permisos asignados a un rol."""
        return rol_repo.get_permisos(idrol)

    @staticmethod
    def asignar_permisos(idrol: uuid.UUID, permisos_ids: list):
        """Reemplaza los permisos de un rol (borra y crea)."""
        rol_repo.asignar_permisos(idrol, permisos_ids)

    @staticmethod
    def remove_permiso(idrol: uuid.UUID, idpermiso: uuid.UUID):
        """Elimina un permiso específico de un rol."""
        return rol_repo.remove_permiso(idrol, idpermiso)
