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
        empresa = self.get_object()
        nuevo_estado = request.data.get('estado', not empresa.estado)
        empresa.estado = nuevo_estado
        empresa.save(update_fields=['estado'])
        return Response({'estado': empresa.estado})

    @action(detail=True, methods=['get'], url_path='sucursales')
    def sucursales(self, request, pk=None):
        sucursales = SucursalService.listar(idempresa=uuid.UUID(pk))
        serializer = SucursalListSerializer(sucursales, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='sucursales')
    def create_sucursal(self, request, pk=None):
        data = request.data.copy()
        serializer = SucursalSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save(idempresa_id=pk)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class SucursalViewSet(viewsets.ModelViewSet):
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
        sucursal = self.get_object()
        sucursal.estado = request.data.get('estado', not sucursal.estado)
        sucursal.save(update_fields=['estado'])
        return Response({'estado': sucursal.estado})

    @action(detail=True, methods=['get'], url_path='almacenes')
    def almacenes(self, request, pk=None):
        almacenes = AlmacenService.listar(idsucursal=uuid.UUID(pk))
        serializer = AlmacenSerializer(almacenes, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='almacenes')
    def create_almacen(self, request, pk=None):
        data = request.data.copy()
        serializer = AlmacenSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save(idsucursal_id=pk)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class AlmacenViewSet(viewsets.ModelViewSet):
    queryset = AlmacenService.listar()
    serializer_class = AlmacenSerializer

    def get_queryset(self):
        idsucursal = self.request.query_params.get('idsucursal')
        return AlmacenService.listar(idsucursal=uuid.UUID(idsucursal) if idsucursal else None)

    def perform_destroy(self, instance):
        instance.delete()

    @action(detail=True, methods=['patch'], url_path='estado')
    def toggle_estado(self, request, pk=None):
        almacen = self.get_object()
        almacen.estado = request.data.get('estado', not almacen.estado)
        almacen.save(update_fields=['estado'])
        return Response({'estado': almacen.estado})
