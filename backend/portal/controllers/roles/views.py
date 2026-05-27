from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response

from application.dto.seguridad.auth_dto import AsignarPermisosSerializer
from application.dto.seguridad.rol_dto import RolDetalleSerializer, RolSerializer
from application.services.seguridad.auth_service import RolService


@api_view(['GET'])
@permission_classes([IsAdminUser])
def listar_roles(request):
    roles = RolService.listar()
    serializer = RolSerializer(roles, many=True)
    return Response({'results': serializer.data})


@api_view(['POST'])
@permission_classes([IsAdminUser])
def crear_rol(request):
    serializer = RolSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def detalle_rol(request, idrol):
    rol = RolService.obtener(idrol)
    serializer = RolDetalleSerializer(rol)
    return Response(serializer.data)


@api_view(['PUT'])
@permission_classes([IsAdminUser])
def editar_rol(request, idrol):
    rol = RolService.obtener(idrol)
    serializer = RolSerializer(rol, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data)


@api_view(['PATCH'])
@permission_classes([IsAdminUser])
def desactivar_rol(request, idrol):
    from infrastructure.repositories.seguridad_repo import RolRepository
    repo = RolRepository()
    estado = repo.toggle_estado(idrol)
    return Response({'estado': estado})


@api_view(['POST'])
@permission_classes([IsAdminUser])
def asignar_permisos(request, idrol):
    serializer = AsignarPermisosSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    from infrastructure.repositories.seguridad_repo import RolRepository
    repo = RolRepository()
    repo.asignar_permisos(idrol, serializer.validated_data['permisos'])
    return Response({'mensaje': 'Permisos asignados exitosamente'})
