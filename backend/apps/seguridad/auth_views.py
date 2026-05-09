from django.contrib.auth import authenticate
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from .models import SesionUsuario
from .serializers import UsuarioSerializer


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    usuario = request.data.get('usuario')
    password = request.data.get('password')

    if not usuario or not password:
        return Response(
            {'error': 'Usuario y contraseña son obligatorios'},
            status=status.HTTP_400_BAD_REQUEST
        )

    user = authenticate(usuario=usuario, password=password)
    if not user or not user.estado:
        return Response(
            {'error': 'Credenciales inválidas'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    refresh = RefreshToken.for_user(user)
    access_token = str(refresh.access_token)
    refresh_token = str(refresh)

    ip = request.META.get('HTTP_X_FORWARDED_FOR', request.META.get('REMOTE_ADDR', ''))
    if ip and ',' in ip:
        ip = ip.split(',')[0].strip()

    user_agent = request.META.get('HTTP_USER_AGENT', '')
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

    SesionUsuario.objects.create(
        idusuario=user,
        tokenjwt=access_token,
        refreshtoken=refresh_token,
        ip=ip,
        dispositivo=dispositivo,
        navegador=navegador,
        activa=True,
    )

    user.ultimologin = timezone.now()
    user.save(update_fields=['ultimologin'])

    user_data = UsuarioSerializer(user).data

    return Response({
        'user': user_data,
        'access': access_token,
        'refresh': refresh_token,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    refresh_token = request.data.get('refresh')
    if not refresh_token:
        return Response(
            {'error': 'Refresh token es obligatorio'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        token = RefreshToken(refresh_token)
        token.blacklist()
    except Exception:
        pass

    SesionUsuario.objects.filter(
        idusuario=request.user,
        activa=True,
        refreshtoken=refresh_token,
    ).update(activa=False, fechafin=timezone.now())

    return Response({'mensaje': 'Sesión cerrada exitosamente'})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password_view(request):
    user = request.user
    old_password = request.data.get('old_password')
    new_password = request.data.get('new_password')

    if not old_password or not new_password:
        return Response(
            {'error': 'Contraseña actual y nueva son obligatorias'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if not user.check_password(old_password):
        return Response(
            {'error': 'Contraseña actual incorrecta'},
            status=status.HTTP_400_BAD_REQUEST
        )

    user.set_password(new_password)
    user.save()
    return Response({'mensaje': 'Contraseña actualizada exitosamente'})
