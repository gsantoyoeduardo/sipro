"""
Vistas del Portal Empresa (Gestión de empresas, sucursales y almacenes).

Proporciona endpoints CRUD y acciones personalizadas para la jerarquía
organizacional: Empresas, Sucursales y Almacenes.
Utiliza servicios de aplicación (EmpresaService, SucursalService, AlmacenService)
para la lógica de negocio.
"""
import uuid
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from src.application.empresa.empresa_service import EmpresaService, SucursalService, AlmacenService
from src.infrastructure.serializers.empresa_serializer import (
    EmpresaSerializer, EmpresaListSerializer,
    SucursalSerializer, SucursalListSerializer,
    AlmacenSerializer,
)


class EmpresaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para el modelo Empresa.

    Expone CRUD completo para empresas del sistema.
    Permisos: Solo administradores (IsAdminUser).
    Acciones personalizadas:
      - PATCH /{pk}/estado/: Cambia el estado (activo/inactivo) de la empresa.
      - GET /{pk}/sucursales/: Lista las sucursales de la empresa.
      - POST /{pk}/sucursales/: Crea una nueva sucursal para la empresa.
    """
    queryset = EmpresaService.listar()
    serializer_class = EmpresaSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_serializer_class(self):
        if self.action == 'list':
            return EmpresaListSerializer
        return EmpresaSerializer

    def get_queryset(self):
        return EmpresaService.listar()

    def perform_create(self, serializer):
        serializer.save()

    def perform_update(self, serializer):
        serializer.save()

    def perform_destroy(self, instance):
        instance.delete()

    @action(detail=True, methods=['patch'], url_path='estado')
    def toggle_estado(self, request, pk=None):
        """
        Cambia el campo 'estado' (booleano) de la empresa.
        Si no se envía 'estado' en el body, alterna el valor actual.
        """
        empresa = self.get_object()
        nuevo_estado = request.data.get('estado', not empresa.estado)
        empresa.estado = nuevo_estado
        empresa.save(update_fields=['estado'])
        return Response({'estado': empresa.estado})

    @action(detail=True, methods=['get'], url_path='sucursales')
    def sucursales(self, request, pk=None):
        """Retorna todas las sucursales que pertenecen a esta empresa."""
        sucursales = SucursalService.listar(idempresa=uuid.UUID(pk))
        serializer = SucursalListSerializer(sucursales, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='sucursales')
    def create_sucursal(self, request, pk=None):
        """
        Crea una nueva sucursal asignándola automáticamente a la empresa
        especificada en la URL.
        """
        data = request.data.copy()
        serializer = SucursalSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save(idempresa_id=pk)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class SucursalViewSet(viewsets.ModelViewSet):
    """
    ViewSet para el modelo Sucursal.

    Expone CRUD completo para sucursales.
    Filtros:
      - ?idempresa=<uuid>: Filtra las sucursales de una empresa específica.
    Acciones personalizadas:
      - PATCH /{pk}/estado/: Cambia el estado de la sucursal.
      - GET /{pk}/almacenes/: Lista los almacenes de la sucursal.
      - POST /{pk}/almacenes/: Crea un nuevo almacén en la sucursal.
    """
    queryset = SucursalService.listar()
    serializer_class = SucursalSerializer

    def get_serializer_class(self):
        if self.action == 'list':
            return SucursalListSerializer
        return SucursalSerializer

    def get_queryset(self):
        idempresa = self.request.query_params.get('idempresa')
        return SucursalService.listar(idempresa=uuid.UUID(idempresa) if idempresa else None)

    def perform_destroy(self, instance):
        instance.delete()

    @action(detail=True, methods=['patch'], url_path='estado')
    def toggle_estado(self, request, pk=None):
        """
        Cambia el campo 'estado' (booleano) de la sucursal.
        Si no se envía 'estado' en el body, alterna el valor actual.
        """
        sucursal = self.get_object()
        sucursal.estado = request.data.get('estado', not sucursal.estado)
        sucursal.save(update_fields=['estado'])
        return Response({'estado': sucursal.estado})

    @action(detail=True, methods=['get'], url_path='almacenes')
    def almacenes(self, request, pk=None):
        """Retorna todos los almacenes que pertenecen a esta sucursal."""
        almacenes = AlmacenService.listar(idsucursal=uuid.UUID(pk))
        serializer = AlmacenSerializer(almacenes, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='almacenes')
    def create_almacen(self, request, pk=None):
        """
        Crea un nuevo almacén asignándolo automáticamente a la sucursal
        especificada en la URL.
        """
        data = request.data.copy()
        serializer = AlmacenSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save(idsucursal_id=pk)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class AlmacenViewSet(viewsets.ModelViewSet):
    """
    ViewSet para el modelo Almacen.

    Expone CRUD completo para almacenes.
    Filtros:
      - ?idsucursal=<uuid>: Filtra los almacenes de una sucursal específica.
    Acciones personalizadas:
      - PATCH /{pk}/estado/: Cambia el estado del almacén.
    """
    queryset = AlmacenService.listar()
    serializer_class = AlmacenSerializer

    def get_queryset(self):
        idsucursal = self.request.query_params.get('idsucursal')
        return AlmacenService.listar(idsucursal=uuid.UUID(idsucursal) if idsucursal else None)

    def perform_destroy(self, instance):
        instance.delete()

    @action(detail=True, methods=['patch'], url_path='estado')
    def toggle_estado(self, request, pk=None):
        """
        Cambia el campo 'estado' (booleano) del almacén.
        Si no se envía 'estado' en el body, alterna el valor actual.
        """
        almacen = self.get_object()
        almacen.estado = request.data.get('estado', not almacen.estado)
        almacen.save(update_fields=['estado'])
        return Response({'estado': almacen.estado})
