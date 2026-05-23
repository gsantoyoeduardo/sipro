"""
Vistas del módulo Seguridad (Gestión de usuarios, roles y permisos).

Proporciona endpoints CRUD y acciones personalizadas para la administración
de usuarios, roles, permisos y sesiones de usuario en el sistema.
"""
from django.contrib.auth.hashers import make_password
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Usuario, Rol, Permiso, UsuarioRol, RolPermiso, SesionUsuario
from .serializers import (
    UsuarioSerializer, UsuarioListSerializer,
    RolSerializer, RolDetalleSerializer,
    PermisoSerializer, SesionUsuarioSerializer,
)


class UsuarioViewSet(viewsets.ModelViewSet):
    """
    ViewSet para el modelo Usuario.

    Expone CRUD completo para usuarios del sistema.
    Permisos: Dependen de la configuración global de DRF.
    Filtros:
      - ?idempresa=<uuid>: Filtra los usuarios de una empresa específica.
    Acciones personalizadas:
      - GET/PUT/PATCH /me/: Retorna o actualiza el perfil del usuario autenticado.
      - PATCH /{pk}/estado/: Cambia el estado (activo/inactivo) del usuario.
      - POST /{pk}/reset-password/: Resetea la contraseña de un usuario.
      - GET /{pk}/permisos/: Retorna los permisos agregados del usuario (vía roles).
      - POST /{pk}/asignar-roles/: Asigna roles a un usuario (reemplaza los existentes).
    """
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer

    def get_serializer_class(self):
        if self.action == 'list':
            return UsuarioListSerializer
        return UsuarioSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        idempresa = self.request.query_params.get('idempresa')
        if idempresa:
            qs = qs.filter(idempresa_id=idempresa)
        return qs

    @action(detail=False, methods=['get', 'put', 'patch'], url_path='me')
    def me(self, request):
        """
        Endpoint para que el usuario autenticado pueda ver (GET) o actualizar
        (PUT/PATCH) su propio perfil sin necesidad de conocer su ID.
        """
        if request.method == 'GET':
            serializer = self.get_serializer(request.user)
            return Response(serializer.data)
        serializer = self.get_serializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    @action(detail=True, methods=['patch'], url_path='estado')
    def toggle_estado(self, request, pk=None):
        """
        Cambia el campo 'estado' (booleano) del usuario.
        Si no se envía 'estado' en el body, alterna el valor actual.
        """
        user = self.get_object()
        user.estado = request.data.get('estado', not user.estado)
        user.save(update_fields=['estado'])
        return Response({'estado': user.estado})

    @action(detail=True, methods=['post'], url_path='reset-password')
    def reset_password(self, request, pk=None):
        """
        Resetea la contraseña de un usuario.
        Recibe 'new_password' en el body y la asigna usando el método
        set_password de Django (que hashea la contraseña automáticamente).
        """
        user = self.get_object()
        new_password = request.data.get('new_password')
        if not new_password:
            return Response(
                {'error': 'new_password es obligatorio'},
                status=status.HTTP_400_BAD_REQUEST
            )
        user.set_password(new_password)
        user.save()
        return Response({'mensaje': 'Contraseña reseteada exitosamente'})

    @action(detail=True, methods=['get'], url_path='permisos')
    def permisos(self, request, pk=None):
        """
        Obtiene todos los permisos del usuario a través de sus roles.
        Recorre la relación: Usuario -> UsuarioRol -> RolPermiso -> Permiso.
        """
        user = self.get_object()
        roles = UsuarioRol.objects.filter(idusuario=user).values_list('idrol_id', flat=True)
        permisos_ids = RolPermiso.objects.filter(idrol_id__in=roles).values_list('idpermiso_id', flat=True)
        permisos = Permiso.objects.filter(idpermiso__in=permisos_ids)
        return Response(PermisoSerializer(permisos, many=True).data)

    @action(detail=True, methods=['post'], url_path='asignar-roles')
    def asignar_roles(self, request, pk=None):
        """
        Asigna roles a un usuario.
        Recibe una lista de IDs de roles en 'roles' y reemplaza completamente
        las asignaciones existentes (elimina las anteriores y crea las nuevas).
        """
        user = self.get_object()
        roles_ids = request.data.get('roles', [])
        UsuarioRol.objects.filter(idusuario=user).delete()
        for rol_id in roles_ids:
            UsuarioRol.objects.create(idusuario=user, idrol_id=rol_id)
        return Response({'mensaje': 'Roles asignados exitosamente'})


class RolViewSet(viewsets.ModelViewSet):
    """
    ViewSet para el modelo Rol.

    Expone CRUD completo para roles del sistema.
    Para el detalle (retrieve) usa RolDetalleSerializer que incluye los permisos asociados.
    Acciones personalizadas:
      - PATCH /{pk}/estado/: Cambia el estado del rol.
      - POST /{pk}/permisos/: Asigna permisos a un rol (reemplaza los existentes).
      - DELETE /{pk}/permisos/: Remueve un permiso específico del rol.
    """
    queryset = Rol.objects.all()
    serializer_class = RolSerializer

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return RolDetalleSerializer
        return RolSerializer

    @action(detail=True, methods=['patch'], url_path='estado')
    def toggle_estado(self, request, pk=None):
        """
        Cambia el campo 'estado' (booleano) del rol.
        Si no se envía 'estado' en el body, alterna el valor actual.
        """
        rol = self.get_object()
        rol.estado = request.data.get('estado', not rol.estado)
        rol.save(update_fields=['estado'])
        return Response({'estado': rol.estado})

    @action(detail=True, methods=['post'], url_path='permisos')
    def asignar_permisos(self, request, pk=None):
        """
        Asigna permisos a un rol.
        Recibe una lista de IDs de permisos en 'permisos' y reemplaza completamente
        las asignaciones existentes.
        """
        rol = self.get_object()
        permisos_ids = request.data.get('permisos', [])
        RolPermiso.objects.filter(idrol=rol).delete()
        for permiso_id in permisos_ids:
            RolPermiso.objects.create(idrol=rol, idpermiso_id=permiso_id)
        return Response({'mensaje': 'Permisos asignados exitosamente'})

    @action(detail=True, methods=['delete'], url_path='permisos')
    def remove_permiso(self, request, pk=None):
        """
        Remueve un permiso específico del rol.
        El 'permiso_id' puede enviarse en el body o como query param.
        Retorna error 404 si la relación Rol-Permiso no existe.
        """
        permiso_id = request.data.get('permiso_id') or request.query_params.get('permiso_id')
        if not permiso_id:
            return Response(
                {'error': 'permiso_id requerido en body o query params'},
                status=status.HTTP_400_BAD_REQUEST
            )
        deleted, _ = RolPermiso.objects.filter(idrol_id=pk, idpermiso_id=permiso_id).delete()
        if deleted:
            return Response({'mensaje': 'Permiso removido'})
        return Response(
            {'error': 'Permiso no encontrado en el rol'},
            status=status.HTTP_404_NOT_FOUND
        )


class PermisoViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet de solo lectura para el modelo Permiso.

    Únicamente expone list y retrieve. Los permisos se crean en base de datos
    a través de migraciones o seeds, no desde la API.
    """
    queryset = Permiso.objects.all()
    serializer_class = PermisoSerializer


class SesionUsuarioViewSet(viewsets.ModelViewSet):
    """
    ViewSet para el modelo SesionUsuario (sesiones activas).

    Expone CRUD para sesiones de usuario. El destroy lógico (DELETE) desactiva
    la sesión en lugar de eliminarla físicamente.
    Filtros:
      - ?activa=true|false: Filtra sesiones activas o inactivas.
    """
    queryset = SesionUsuario.objects.all()
    serializer_class = SesionUsuarioSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        activa = self.request.query_params.get('activa')
        if activa is not None:
            qs = qs.filter(activa=activa.lower() in ('true', '1'))
        return qs

    def perform_destroy(self, instance):
        """
        Sobrescribe el DELETE para no eliminar físicamente el registro.
        En su lugar, marca la sesión como inactiva y registra la fecha de fin.
        """
        instance.activa = False
        instance.fechafin = __import__('django').utils.timezone.now()
        instance.save()
