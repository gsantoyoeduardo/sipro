import uuid
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from application.dto.seguridad.usuario_dto import UsuarioSerializer, UsuarioListSerializer
from application.dto.seguridad.rol_dto import RolSerializer, RolDetalleSerializer
from application.dto.seguridad.permiso_dto import PermisoSerializer
from application.dto.seguridad.sesion_dto import SesionUsuarioSerializer
from application.dto.seguridad.auth_dto import ResetPasswordSerializer, AsignarRolesSerializer, AsignarPermisosSerializer, RemovePermisoSerializer
from application.dto.shared_dto import ToggleEstadoSerializer
from application.services.seguridad.auth_service import UsuarioService, RolService, AuthService
from infrastructure.repositories.seguridad_repo import PermisoRepository, SesionRepository
from application.filters.seguridad.usuario_filter import UsuarioFilter
from drf_spectacular.utils import extend_schema_view, extend_schema, OpenApiExample

permiso_repo = PermisoRepository()
sesion_repo = SesionRepository()


@extend_schema_view(
    create=extend_schema(examples=[
        OpenApiExample('Ejemplo correcto', value={'usuario': 'nuevo_user', 'nombres': 'Nuevo', 'apellidos': 'Usuario', 'correo': 'nuevo@sipro.com', 'password': 'Segura123', 'tipo_usuario': 'admin_empresa'}, request_only=True),
        OpenApiExample('Ejemplo incorrecto', value={'password': 'abc'}, request_only=True),
    ]),
    update=extend_schema(examples=[
        OpenApiExample('Ejemplo correcto', value={'nombres': 'Editado'}, request_only=True),
        OpenApiExample('Ejemplo incorrecto', value={'correo': 'invalido'}, request_only=True),
    ]),
    partial_update=extend_schema(examples=[
        OpenApiExample('Ejemplo correcto', value={'estado': False}, request_only=True),
    ]),
)
class UsuarioViewSet(viewsets.ModelViewSet):
    """CRUD de usuarios del sistema. Gestión de cuentas, roles y permisos."""
    portal_only = True
    swagger_tags = 'Usuarios'
    queryset = UsuarioService.listar()
    serializer_class = UsuarioSerializer
    filterset_class = UsuarioFilter

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

    @extend_schema(examples=[
        OpenApiExample('Ejemplo correcto', value={'nombres': 'Mi Nombre Editado'}, request_only=True),
    ])
    @action(detail=False, methods=['get', 'put', 'patch'], url_path='me', serializer_class=UsuarioSerializer)
    def me(self, request):
        """Obtiene o actualiza los datos del usuario autenticado. GET para consultar, PUT/PATCH para modificar."""
        if request.method == 'GET':
            serializer = self.get_serializer(request.user)
            return Response(serializer.data)
        serializer = self.get_serializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    @extend_schema(examples=[
        OpenApiExample('Ejemplo correcto', value={'activo': False}, request_only=True),
        OpenApiExample('Ejemplo incorrecto', value={'activo': 'si'}, request_only=True),
    ])
    @action(detail=True, methods=['patch'], url_path='estado', serializer_class=ToggleEstadoSerializer)
    def toggle_estado(self, request, pk=None):
        user = self.get_object()
        new_estado = request.data.get('activo', not user.estado)
        user.estado = new_estado
        user.save(update_fields=['estado'])
        return Response({'estado': user.estado})

    @extend_schema(examples=[
        OpenApiExample('Ejemplo correcto', value={'old_password': 'actual123', 'new_password': 'nuevaSegura456'}, request_only=True),
        OpenApiExample('Ejemplo incorrecto', value={'old_password': '', 'new_password': 'abc'}, request_only=True),
    ])
    @action(detail=True, methods=['post'], url_path='reset-password', serializer_class=ResetPasswordSerializer)
    def reset_password(self, request, pk=None):
        """Cambia la contraseña del usuario autenticado. Requiere contraseña actual y nueva."""
        if str(request.user.idusuario) != str(pk):
            return Response({'error': 'Solo puedes resetear tu propia contraseña'}, status=status.HTTP_403_FORBIDDEN)
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')
        if not old_password or not new_password:
            return Response({'error': 'old_password y new_password son obligatorios'}, status=status.HTTP_400_BAD_REQUEST)
        result = AuthService.change_password(request.user, old_password, new_password)
        if 'error' in result:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)
        return Response({'mensaje': 'Contraseña actualizada exitosamente'})

    @action(detail=True, methods=['get'], url_path='permisos')
    def permisos(self, request, pk=None):
        """Retorna los permisos asignados a un usuario específico."""
        permisos = UsuarioService.get_permisos(uuid.UUID(pk))
        return Response(PermisoSerializer(permisos, many=True).data)

    @extend_schema(examples=[
        OpenApiExample('Ejemplo correcto', value={'roles': ['uuid-del-rol']}, request_only=True),
        OpenApiExample('Ejemplo incorrecto', value={'roles': 'no-es-array'}, request_only=True),
    ])
    @action(detail=True, methods=['post'], url_path='asignar-roles', serializer_class=AsignarRolesSerializer)
    def asignar_roles(self, request, pk=None):
        """Asigna uno o más roles a un usuario. Los roles determinan los permisos del usuario."""
        roles_ids = request.data.get('roles', [])
        UsuarioService.asignar_roles(uuid.UUID(pk), roles_ids)
        return Response({'mensaje': 'Roles asignados exitosamente'})


@extend_schema_view(
    create=extend_schema(examples=[
        OpenApiExample('Ejemplo correcto', value={'nombre': 'Nuevo Rol', 'descripcion': 'Acceso limitado a inventario'}, request_only=True),
        OpenApiExample('Ejemplo incorrecto', value={'nombre': ''}, request_only=True),
    ]),
    update=extend_schema(examples=[
        OpenApiExample('Ejemplo correcto', value={'descripcion': 'Descripción actualizada'}, request_only=True),
    ]),
    partial_update=extend_schema(examples=[
        OpenApiExample('Ejemplo correcto', value={'estado': False}, request_only=True),
    ]),
)
class RolViewSet(viewsets.ModelViewSet):
    """CRUD de roles. Define conjuntos de permisos asignables a usuarios."""
    portal_only = True
    swagger_tags = 'Roles'
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

    @extend_schema(examples=[
        OpenApiExample('Ejemplo correcto', value={'activo': False}, request_only=True),
    ])
    @action(detail=True, methods=['patch'], url_path='estado', serializer_class=ToggleEstadoSerializer)
    def toggle_estado(self, request, pk=None):
        rol = self.get_object()
        rol.estado = request.data.get('activo', not rol.estado)
        rol.save(update_fields=['estado'])
        return Response({'estado': rol.estado})

    @extend_schema(examples=[
        OpenApiExample('Ejemplo correcto', value={'permisos': ['uuid-permiso']}, request_only=True),
        OpenApiExample('Ejemplo incorrecto', value={'permisos': []}, request_only=True),
    ])
    @action(detail=True, methods=['post'], url_path='permisos', serializer_class=AsignarPermisosSerializer)
    def asignar_permisos(self, request, pk=None):
        """Asigna permisos a un rol. Recibe un array de IDs de permisos."""
        permisos_ids = request.data.get('permisos', [])
        RolService.asignar_permisos(uuid.UUID(pk), permisos_ids)
        return Response({'mensaje': 'Permisos asignados exitosamente'})

    @extend_schema(examples=[
        OpenApiExample('Ejemplo correcto', value={'permiso_id': 'uuid'}, request_only=True),
    ])
    @action(detail=True, methods=['delete'], url_path='permisos', serializer_class=RemovePermisoSerializer)
    def remove_permiso(self, request, pk=None):
        """Remueve un permiso específico de un rol."""
        permiso_id = request.data.get('permiso_id') or request.query_params.get('permiso_id')
        if not permiso_id:
            return Response({'error': 'permiso_id requerido'}, status=status.HTTP_400_BAD_REQUEST)
        deleted, _ = RolService.remove_permiso(uuid.UUID(pk), uuid.UUID(permiso_id))
        if deleted:
            return Response({'mensaje': 'Permiso removido'})
        return Response({'error': 'Permiso no encontrado en el rol'}, status=status.HTTP_404_NOT_FOUND)


class PermisoViewSet(viewsets.ReadOnlyModelViewSet):
    """Lista de permisos disponibles en el sistema. Solo lectura."""
    portal_only = True
    swagger_tags = 'Permisos'
    queryset = permiso_repo.get_all()
    serializer_class = PermisoSerializer


@extend_schema_view(
    create=extend_schema(examples=[
        OpenApiExample('Ejemplo correcto', value={'idusuario': 'uuid-user', 'ip': '192.168.1.1', 'dispositivo': 'Chrome 120', 'navegador': 'Mozilla/5.0'}, request_only=True),
        OpenApiExample('Ejemplo incorrecto', value={'ip': ''}, request_only=True),
    ]),
    partial_update=extend_schema(examples=[
        OpenApiExample('Ejemplo correcto', value={'activa': False}, request_only=True),
    ]),
)
class SesionUsuarioViewSet(viewsets.ModelViewSet):
    """Sesiones activas e históricas de los usuarios."""
    portal_only = True
    swagger_tags = 'Sesiones'
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
