from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from src.application.seguridad.auth_service import AuthService


@api_view(['POST'])
@permission_classes([AllowAny])
def tenant_login_view(request):
    ruc = request.data.get('ruc')
    usuario = request.data.get('usuario')
    password = request.data.get('password')

    if not ruc or not usuario or not password:
        return Response(
            {'error': 'RUC, usuario y contraseña son obligatorios'},
            status=status.HTTP_400_BAD_REQUEST
        )

    ip = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', ''))
    if ip and ',' in ip:
        ip = ip.split(',')[0].strip()

    user_agent = request.META.get('HTTP_USER_AGENT', '')
    result = AuthService.tenant_login(ruc, usuario, password, ip, user_agent)

    if 'error' in result:
        return Response(result, status=status.HTTP_401_UNAUTHORIZED)

    return Response(result)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def tenant_logout_view(request):
    refresh_token = request.data.get('refresh')
    if not refresh_token:
        return Response(
            {'error': 'Refresh token es obligatorio'},
            status=status.HTTP_400_BAD_REQUEST
        )
    result = AuthService.logout(refresh_token, request.user)
    return Response(result)
