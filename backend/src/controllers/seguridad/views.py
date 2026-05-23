import uuid
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from src.application.seguridad.auth_service import UsuarioService, RolService
from src.infrastructure.repositories.seguridad_repo import PermisoRepository, SesionRepository
from src.infrastructure.serializers.seguridad_serializer import (
    UsuarioSerializer, UsuarioListSerializer,
    RolSerializer, RolDetalleSerializer,
    PermisoSerializer, SesionUsuarioSerializer,
)

permiso_repo = PermisoRepository()
sesion_repo = SesionRepository()


class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = UsuarioService.listar()
    serializer_class = UsuarioSerializer

    def get_serializer_class(self):
        if self.action == 'list':
            return UsuarioListSerializer
        return UsuarioSerializer

    def get_queryset(self):
        idempresa = getattr(self.request.user, 'idempresa_id', None)
        return UsuarioService.listar(idempresa=idempresa)

    def perform_create(self, serializer):
        idempresa = getattr(self.request.user, 'idempresa_id', None)
        serializer.save(idempresa_id=idempresa)

    def perform_destroy(self, instance):
        instance.delete()

    @action(detail=False, methods=['get', 'put', 'patch'], url_path='me')
    def me(self, request):
        if request.method == 'GET':
            serializer = self.get_serializer(request.user)
            return Response(serializer.data)
        serializer = self.get_serializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    @action(detail=True, methods=['patch'], url_path='estado')
    def toggle_estado(self, request, pk=None):
        user = self.get_object()
        new_estado = request.data.get('estado', not user.estado)
        user.estado = new_estado
        user.save(update_fields=['estado'])
        return Response({'estado': user.estado})

    @action(detail=True, methods=['post'], url_path='reset-password')
    def reset_password(self, request, pk=None):
        new_password = request.data.get('new_password')
        if not new_password:
            return Response({'error': 'new_password es obligatorio'}, status=status.HTTP_400_BAD_REQUEST)
        UsuarioService.reset_password(uuid.UUID(pk), new_password)
        return Response({'mensaje': 'Contraseña reseteada exitosamente'})

    @action(detail=True, methods=['get'], url_path='permisos')
    def permisos(self, request, pk=None):
        permisos = UsuarioService.get_permisos(uuid.UUID(pk))
        return Response(PermisoSerializer(permisos, many=True).data)

    @action(detail=True, methods=['post'], url_path='asignar-roles')
    def asignar_roles(self, request, pk=None):
        roles_ids = request.data.get('roles', [])
        UsuarioService.asignar_roles(uuid.UUID(pk), roles_ids)
        return Response({'mensaje': 'Roles asignados exitosamente'})


class RolViewSet(viewsets.ModelViewSet):
    queryset = RolService.listar()
    serializer_class = RolSerializer

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return RolDetalleSerializer
        return RolSerializer

    def get_queryset(self):
        idempresa = getattr(self.request.user, 'idempresa_id', None)
        return RolService.listar(idempresa=idempresa)

    def perform_create(self, serializer):
        idempresa = getattr(self.request.user, 'idempresa_id', None)
        serializer.save(idempresa_id=idempresa)

    def perform_destroy(self, instance):
        instance.delete()

    @action(detail=True, methods=['patch'], url_path='estado')
    def toggle_estado(self, request, pk=None):
        rol = self.get_object()
        rol.estado = request.data.get('estado', not rol.estado)
        rol.save(update_fields=['estado'])
        return Response({'estado': rol.estado})

    @action(detail=True, methods=['post'], url_path='permisos')
    def asignar_permisos(self, request, pk=None):
        permisos_ids = request.data.get('permisos', [])
        RolService.asignar_permisos(uuid.UUID(pk), permisos_ids)
        return Response({'mensaje': 'Permisos asignados exitosamente'})

    @action(detail=True, methods=['delete'], url_path='permisos')
    def remove_permiso(self, request, pk=None):
        permiso_id = request.data.get('permiso_id') or request.query_params.get('permiso_id')
        if not permiso_id:
            return Response({'error': 'permiso_id requerido'}, status=status.HTTP_400_BAD_REQUEST)
        deleted, _ = RolService.remove_permiso(uuid.UUID(pk), uuid.UUID(permiso_id))
        if deleted:
            return Response({'mensaje': 'Permiso removido'})
        return Response({'error': 'Permiso no encontrado en el rol'}, status=status.HTTP_404_NOT_FOUND)


class PermisoViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = permiso_repo.get_all()
    serializer_class = PermisoSerializer


class SesionUsuarioViewSet(viewsets.ModelViewSet):
    queryset = sesion_repo.get_all()
    serializer_class = SesionUsuarioSerializer

    def get_queryset(self):
        idempresa = getattr(self.request.user, 'idempresa_id', None)
        activa = self.request.query_params.get('activa')
        activa_bool = activa.lower() in ('true', '1') if activa else None
        return sesion_repo.get_all(idempresa=idempresa, activa=activa_bool)

    def perform_destroy(self, instance):
        instance.activa = False
        from django.utils import timezone
        instance.fechafin = timezone.now()
        instance.save()
