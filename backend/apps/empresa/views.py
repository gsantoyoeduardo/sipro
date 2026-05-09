from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Empresa, Sucursal, Almacen
from .serializers import (
    EmpresaSerializer, EmpresaListSerializer,
    SucursalSerializer, SucursalListSerializer,
    AlmacenSerializer,
)


class EmpresaViewSet(viewsets.ModelViewSet):
    queryset = Empresa.objects.all()
    serializer_class = EmpresaSerializer
    permission_classes = [permissions.IsAdminUser]

    def get_serializer_class(self):
        if self.action == 'list':
            return EmpresaListSerializer
        return EmpresaSerializer

    @action(detail=True, methods=['patch'], url_path='estado')
    def toggle_estado(self, request, pk=None):
        empresa = self.get_object()
        empresa.estado = request.data.get('estado', not empresa.estado)
        empresa.save(update_fields=['estado'])
        return Response({'estado': empresa.estado})

    @action(detail=True, methods=['get'], url_path='sucursales')
    def sucursales(self, request, pk=None):
        sucursales = Sucursal.objects.filter(idempresa_id=pk)
        serializer = SucursalListSerializer(sucursales, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='sucursales')
    def create_sucursal(self, request, pk=None):
        data = request.data.copy()
        data['idempresa'] = pk
        serializer = SucursalSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class SucursalViewSet(viewsets.ModelViewSet):
    queryset = Sucursal.objects.all()
    serializer_class = SucursalSerializer

    def get_serializer_class(self):
        if self.action == 'list':
            return SucursalListSerializer
        return SucursalSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        idempresa = self.request.query_params.get('idempresa')
        if idempresa:
            qs = qs.filter(idempresa_id=idempresa)
        return qs

    @action(detail=True, methods=['patch'], url_path='estado')
    def toggle_estado(self, request, pk=None):
        sucursal = self.get_object()
        sucursal.estado = request.data.get('estado', not sucursal.estado)
        sucursal.save(update_fields=['estado'])
        return Response({'estado': sucursal.estado})

    @action(detail=True, methods=['get'], url_path='almacenes')
    def almacenes(self, request, pk=None):
        almacenes = Almacen.objects.filter(idsucursal_id=pk)
        serializer = AlmacenSerializer(almacenes, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='almacenes')
    def create_almacen(self, request, pk=None):
        data = request.data.copy()
        data['idsucursal'] = pk
        serializer = AlmacenSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class AlmacenViewSet(viewsets.ModelViewSet):
    queryset = Almacen.objects.all()
    serializer_class = AlmacenSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        idsucursal = self.request.query_params.get('idsucursal')
        if idsucursal:
            qs = qs.filter(idsucursal_id=idsucursal)
        return qs

    @action(detail=True, methods=['patch'], url_path='estado')
    def toggle_estado(self, request, pk=None):
        almacen = self.get_object()
        almacen.estado = request.data.get('estado', not almacen.estado)
        almacen.save(update_fields=['estado'])
        return Response({'estado': almacen.estado})
