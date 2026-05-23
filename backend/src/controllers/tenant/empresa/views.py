import uuid
from django.shortcuts import get_object_or_404
from rest_framework import serializers, viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from src.infrastructure.models.empresa_model import Empresa, Sucursal, Almacen
from src.infrastructure.serializers.empresa_serializer import (
    EmpresaSerializer,
    SucursalSerializer, SucursalListSerializer,
    AlmacenSerializer,
)


class TenantSucursalSerializer(SucursalSerializer):
    class Meta(SucursalSerializer.Meta):
        read_only_fields = ('idempresa',)


class TenantSucursalListSerializer(SucursalListSerializer):
    class Meta(SucursalListSerializer.Meta):
        read_only_fields = ('idempresa',)


class EmpresaViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Empresa.objects.none()
    serializer_class = EmpresaSerializer

    def get_queryset(self):
        idempresa = getattr(self.request.user, 'idempresa_id', None)
        if idempresa:
            return Empresa.objects.filter(idempresa=idempresa)
        return Empresa.objects.none()


class SucursalViewSet(viewsets.ModelViewSet):
    queryset = Sucursal.objects.none()
    serializer_class = TenantSucursalSerializer

    def get_serializer_class(self):
        if self.action == 'list':
            return TenantSucursalListSerializer
        return TenantSucursalSerializer

    def get_queryset(self):
        idempresa = getattr(self.request.user, 'idempresa_id', None)
        qs = Sucursal.objects.all()
        if idempresa:
            qs = qs.filter(idempresa_id=idempresa)
        return qs

    def perform_create(self, serializer):
        idempresa = getattr(self.request.user, 'idempresa_id', None)
        serializer.save(idempresa_id=idempresa)

    @action(detail=True, methods=['patch'], url_path='estado')
    def toggle_estado(self, request, pk=None):
        obj = self.get_object()
        obj.estado = request.data.get('estado', not obj.estado)
        obj.save(update_fields=['estado'])
        return Response({'estado': obj.estado})

    @action(detail=True, methods=['get'], url_path='almacenes')
    def almacenes(self, request, pk=None):
        almacenes = Almacen.objects.filter(idsucursal_id=pk)
        serializer = AlmacenSerializer(almacenes, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='almacenes')
    def create_almacen(self, request, pk=None):
        sucursal = get_object_or_404(Sucursal, pk=pk)
        idempresa = getattr(self.request.user, 'idempresa_id', None)
        if idempresa and str(sucursal.idempresa_id) != str(idempresa):
            return Response({'error': 'Sucursal no pertenece a tu empresa'}, status=status.HTTP_403_FORBIDDEN)
        data = request.data.copy()
        serializer = AlmacenSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save(idsucursal=sucursal)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class AlmacenViewSet(viewsets.ModelViewSet):
    queryset = Almacen.objects.none()
    serializer_class = AlmacenSerializer

    def get_queryset(self):
        idempresa = getattr(self.request.user, 'idempresa_id', None)
        qs = Almacen.objects.select_related('idsucursal')
        if idempresa:
            qs = qs.filter(idsucursal__idempresa_id=idempresa)
        idsucursal = self.request.query_params.get('idsucursal')
        if idsucursal:
            qs = qs.filter(idsucursal_id=idsucursal)
        return qs

    def perform_create(self, serializer):
        idempresa = getattr(self.request.user, 'idempresa_id', None)
        idsucursal = serializer.validated_data.get('idsucursal')
        if idempresa and idsucursal and str(idsucursal.idempresa_id) != str(idempresa):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('Sucursal no pertenece a tu empresa')
        serializer.save()

    @action(detail=True, methods=['patch'], url_path='estado')
    def toggle_estado(self, request, pk=None):
        obj = self.get_object()
        obj.estado = request.data.get('estado', not obj.estado)
        obj.save(update_fields=['estado'])
        return Response({'estado': obj.estado})
