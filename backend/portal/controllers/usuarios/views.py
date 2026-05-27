from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response

from application.dto.seguridad.auth_dto import (
    AsignarRolesSerializer,
    ResetPasswordSerializer,
)
from application.dto.seguridad.usuario_dto import (
    UsuarioListSerializer,
    UsuarioSerializer,
)
from application.services.seguridad.auth_service import UsuarioService


@api_view(['GET'])
@permission_classes([IsAdminUser])
def listar_usuarios(request):
    usuarios = UsuarioService.listar()
    serializer = UsuarioListSerializer(usuarios, many=True)
    return Response({'results': serializer.data})


@api_view(['POST'])
@permission_classes([IsAdminUser])
def crear_usuario(request):
    serializer = UsuarioSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    usuario = serializer.save()
    return Response(UsuarioSerializer(usuario).data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def detalle_usuario(request, idusuario):
    usuario = UsuarioService.obtener(idusuario)
    serializer = UsuarioSerializer(usuario)
    return Response(serializer.data)


@api_view(['PUT'])
@permission_classes([IsAdminUser])
def editar_usuario(request, idusuario):
    usuario = UsuarioService.obtener(idusuario)
    serializer = UsuarioSerializer(usuario, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data)


@api_view(['PATCH'])
@permission_classes([IsAdminUser])
def desactivar_usuario(request, idusuario):
    from infrastructure.repositories.seguridad_repo import UsuarioRepository
    repo = UsuarioRepository()
    estado = repo.toggle_estado(idusuario)
    return Response({'estado': estado})


@api_view(['POST'])
@permission_classes([IsAdminUser])
def restablecer_contrasena(request, idusuario):
    serializer = ResetPasswordSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    from infrastructure.repositories.seguridad_repo import UsuarioRepository
    repo = UsuarioRepository()
    repo.reset_password(idusuario, serializer.validated_data['new_password'])
    return Response({'mensaje': 'Contraseña restablecida exitosamente'})


@api_view(['POST'])
@permission_classes([IsAdminUser])
def asignar_roles(request, idusuario):
    serializer = AsignarRolesSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    from infrastructure.repositories.seguridad_repo import UsuarioRepository
    repo = UsuarioRepository()
    repo.asignar_roles(idusuario, serializer.validated_data['roles'])
    return Response({'mensaje': 'Roles asignados exitosamente'})
