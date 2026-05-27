from django.conf import settings
from django.core.cache import cache
from django.db import connection
from django.views.decorators.csrf import csrf_exempt
from drf_spectacular.utils import OpenApiExample, extend_schema
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from application.dto.auth_dto import (
    ChangePasswordSerializer,
    LogoutSerializer,
    RefreshTokenSerializer,
    TenantLoginSerializer,
)
from application.services.seguridad.auth_service import AuthService

LOGIN_LIMIT_CACHE_PREFIX = 'login_attempt_'


def _check_login_rate_limit(ip):
    key = f'{LOGIN_LIMIT_CACHE_PREFIX}{ip}'
    attempts = cache.get(key, 0)
    if attempts >= 5:
        return False
    cache.set(key, attempts + 1, 300)
    return True


def _reset_login_rate_limit(ip):
    key = f'{LOGIN_LIMIT_CACHE_PREFIX}{ip}'
    cache.delete(key)


@extend_schema(
    request=TenantLoginSerializer,
    responses={200: None, 400: None, 401: None, 429: None},
    description="Autenticación para usuarios de empresa (Tenant API). Requiere RUC de la empresa, usuario y contraseña.",
    examples=[
        OpenApiExample('Login exitoso', value={'ruc': '20123456789', 'usuario': 'admin', 'password': 'admin1234'}, request_only=True),
        OpenApiExample('RUC incorrecto', value={'ruc': '00000000000', 'usuario': 'admin', 'password': 'admin1234'}, request_only=True),
    ],
)
@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def tenant_login_view(request):
    ip = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', ''))
    if ip and ',' in ip:
        ip = ip.split(',')[0].strip()
    if not settings.DEBUG and not _check_login_rate_limit(ip):
        return Response({'error': 'Demasiados intentos. Intente en 5 minutos.'},
                        status=status.HTTP_429_TOO_MANY_REQUESTS)
    ruc = request.data.get('ruc')
    usuario = request.data.get('usuario')
    password = request.data.get('password')
    if not ruc or not usuario or not password:
        return Response({'error': 'RUC, usuario y contraseña son obligatorios'}, status=status.HTTP_400_BAD_REQUEST)
    user_agent = request.META.get('HTTP_USER_AGENT', '')
    result = AuthService.tenant_login(ruc, usuario, password, ip, user_agent)
    if 'error' in result:
        return Response(result, status=status.HTTP_401_UNAUTHORIZED)
    _reset_login_rate_limit(ip)
    return Response(result)


@extend_schema(
    request=LogoutSerializer,
    responses={200: None},
    description="Cierra la sesión actual. Invalida el refresh token.",
    examples=[
        OpenApiExample('Logout exitoso', value={'refresh': 'token_jwt_de_refresco'}, request_only=True),
        OpenApiExample('Token vacío', value={'refresh': ''}, request_only=True),
    ],
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def tenant_logout_view(request):
    refresh_token = request.data.get('refresh')
    if not refresh_token:
        return Response({'error': 'Refresh token es obligatorio'}, status=status.HTTP_400_BAD_REQUEST)
    result = AuthService.logout(refresh_token, request.user)
    return Response(result)


@extend_schema(
    request=RefreshTokenSerializer,
    responses={200: None, 400: None, 401: None},
    description="Refresca el token de acceso usando un refresh token válido.",
    examples=[
        OpenApiExample('Refresh exitoso', value={'refresh': 'token_jwt_de_refresco'}, request_only=True),
    ],
)
@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def tenant_refresh_view(request):
    with connection.cursor() as cursor:
        cursor.execute('SET search_path = public')
    refresh_token = request.data.get('refresh')
    if not refresh_token:
        return Response({'error': 'Refresh token es obligatorio'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        token = RefreshToken(refresh_token)
        token.check_blacklist()
        new_access = str(token.access_token)
        return Response({'access': new_access})
    except Exception:
        return Response({'error': 'Token inválido o expirado'}, status=status.HTTP_401_UNAUTHORIZED)


@extend_schema(
    request=ChangePasswordSerializer,
    responses={200: None},
    description="Cambia la contraseña del usuario autenticado.",
    examples=[
        OpenApiExample('Cambio exitoso', value={'old_password': 'actual123', 'new_password': 'nueva456'}, request_only=True),
        OpenApiExample('Contraseña muy corta', value={'old_password': 'actual123', 'new_password': 'abc'}, request_only=True),
    ],
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password_view(request):
    old_password = request.data.get('old_password')
    new_password = request.data.get('new_password')
    if not old_password or not new_password:
        return Response({'error': 'Contraseña actual y nueva son obligatorias'}, status=status.HTTP_400_BAD_REQUEST)
    result = AuthService.change_password(request.user, old_password, new_password)
    if 'error' in result:
        return Response(result, status=status.HTTP_400_BAD_REQUEST)
    return Response(result)
