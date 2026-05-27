from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response

from application.dto.seguridad.permiso_dto import PermisoSerializer
from infrastructure.repositories.seguridad_repo import PermisoRepository

permiso_repo = PermisoRepository()


@api_view(['GET'])
@permission_classes([IsAdminUser])
def listar_permisos(request):
    permisos = permiso_repo.get_all()
    serializer = PermisoSerializer(permisos, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def crear_permiso(request):
    serializer = PermisoSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def detalle_permiso(request, idpermiso):
    permiso = permiso_repo.get_by_id(idpermiso)
    serializer = PermisoSerializer(permiso)
    return Response(serializer.data)


@api_view(['PUT'])
@permission_classes([IsAdminUser])
def editar_permiso(request, idpermiso):
    permiso = permiso_repo.get_by_id(idpermiso)
    serializer = PermisoSerializer(permiso, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data)


@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def eliminar_permiso(request, idpermiso):
    permiso = permiso_repo.get_by_id(idpermiso)
    permiso.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)
