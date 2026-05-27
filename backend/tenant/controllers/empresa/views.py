import uuid
from django.shortcuts import get_object_or_404
from rest_framework import serializers, viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema_view, extend_schema, OpenApiExample
from infrastructure.models.empresa_model import Empresa, Sucursal, Almacen
from infrastructure.models.layout_model import Zona
from application.dto.empresa.empresa_dto import EmpresaSerializer
from application.dto.empresa.sucursal_dto import SucursalSerializer, SucursalListSerializer
from application.dto.empresa.almacen_dto import AlmacenSerializer
from application.filters.empresa.sucursal_filter import SucursalFilter
from application.filters.empresa.almacen_filter import AlmacenFilter


class TenantSucursalSerializer(SucursalSerializer):
    class Meta(SucursalSerializer.Meta):
        read_only_fields = ('idempresa',)


class TenantSucursalListSerializer(SucursalListSerializer):
    class Meta(SucursalListSerializer.Meta):
        read_only_fields = ('idempresa',)


class EmpresaViewSet(viewsets.ReadOnlyModelViewSet):
    """Datos de la empresa actual. Solo lectura."""
    tenant_only = True
    swagger_tags = 'Empresa'
    queryset = Empresa.objects.none()
    serializer_class = EmpresaSerializer

    def get_queryset(self):
        return Empresa.objects.all()


@extend_schema_view(
    create=extend_schema(examples=[
        OpenApiExample('Ejemplo correcto', value={"nombre": "Sucursal Nueva", "codigo": "SUC001", "direccion": "Av. Nueva 500"}, request_only=True),
        OpenApiExample('Ejemplo incorrecto', value={"codigo": ""}, request_only=True),
    ]),
    update=extend_schema(examples=[
        OpenApiExample('Ejemplo correcto', value={"nombre": "Sucursal Editada"}, request_only=True),
    ]),
)
class SucursalViewSet(viewsets.ModelViewSet):
    """CRUD de sucursales de la empresa."""
    tenant_only = True
    swagger_tags = 'Sucursales'
    queryset = Sucursal.objects.none()
    serializer_class = TenantSucursalSerializer
    filterset_class = SucursalFilter

    def get_serializer_class(self):
        if self.action == 'list':
            return TenantSucursalListSerializer
        return TenantSucursalSerializer

    def get_queryset(self):
        return Sucursal.objects.all()

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


@extend_schema_view(
    create=extend_schema(examples=[
        OpenApiExample('Ejemplo correcto', value={"nombre": "Almacén Nuevo", "codigo": "ALM001", "capacidadmaxima": 8000}, request_only=True),
        OpenApiExample('Ejemplo incorrecto', value={"capacidadmaxima": -100}, request_only=True),
    ]),
    update=extend_schema(examples=[
        OpenApiExample('Ejemplo correcto', value={"nombre": "Almacén Editado"}, request_only=True),
    ]),
)
class AlmacenViewSet(viewsets.ModelViewSet):
    """CRUD de almacenes de una sucursal."""
    tenant_only = True
    swagger_tags = 'Almacenes'
    queryset = Almacen.objects.none()
    serializer_class = AlmacenSerializer
    filterset_class = AlmacenFilter

    def get_queryset(self):
        qs = Almacen.objects.select_related('idsucursal')
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
        almacen = serializer.save()

        # Auto-crear zona máscara visual del almacén en el plano de la sucursal
        Zona.objects.create(
            idsucursal=idsucursal,
            idalmacen=almacen,
            nombre=almacen.nombre,
            codigo=f'MASC-{almacen.codigo}',
            tipo='almacenamiento',
            x=0,
            y=0,
            ancho=float(almacen.ancho or 600),
            alto=float(almacen.alto or 400),
            color='#1E3A5F',
            es_mascara=True,
        )

    @action(detail=True, methods=['patch'], url_path='estado')
    def toggle_estado(self, request, pk=None):
        obj = self.get_object()
        obj.estado = request.data.get('estado', not obj.estado)
        obj.save(update_fields=['estado'])
        return Response({'estado': obj.estado})

