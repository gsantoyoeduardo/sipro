import uuid
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema_view, extend_schema, OpenApiExample
from application.dto.empresa.empresa_dto import EmpresaSerializer, EmpresaListSerializer
from application.dto.empresa.sucursal_dto import SucursalSerializer, SucursalListSerializer
from application.dto.empresa.almacen_dto import AlmacenSerializer
from application.dto.shared_dto import ToggleEstadoSerializer
from application.services.empresa.empresa_service import EmpresaService, SucursalService, AlmacenService
from application.filters.empresa.empresa_filter import EmpresaFilter
from application.filters.empresa.sucursal_filter import SucursalFilter
from application.filters.empresa.almacen_filter import AlmacenFilter


@extend_schema_view(
    create=extend_schema(examples=[
        OpenApiExample('Empresa correcta', value={'razonsocial': 'Nueva Empresa S.A.C.', 'nombrecomercial': 'Nueva Empresa', 'ruc': '20123456789', 'correo': 'contacto@nueva.pe', 'telefono': '01-555-0100', 'direccion': 'Av. Principal 123'}, request_only=True),
        OpenApiExample('RUC inválido', value={'razonsocial': 'Test', 'ruc': '123'}, request_only=True),
    ]),
    update=extend_schema(examples=[
        OpenApiExample('Actualización correcta', value={'razonsocial': 'Editada S.A.C.', 'nombrecomercial': 'Editada'}, request_only=True),
        OpenApiExample('Correo inválido', value={'correo': 'correo-invalido'}, request_only=True),
    ]),
    partial_update=extend_schema(examples=[
        OpenApiExample('Cambio de estado', value={'estado': False}, request_only=True),
    ]),
)
class EmpresaViewSet(viewsets.ModelViewSet):
    """CRUD de empresas clientes del sistema. Solo administradores del portal."""
    swagger_tags = 'Empresas'
    portal_only = True
    queryset = EmpresaService.listar()
    serializer_class = EmpresaSerializer
    filterset_class = EmpresaFilter
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

    @extend_schema(
        request=ToggleEstadoSerializer,
        examples=[
            OpenApiExample('Desactivar', value={'activo': False}, request_only=True),
            OpenApiExample('Activar', value={'activo': True}, request_only=True),
        ],
    )
    @action(detail=True, methods=['patch'], url_path='estado', serializer_class=ToggleEstadoSerializer)
    def toggle_estado(self, request, pk=None):
        empresa = self.get_object()
        nuevo_estado = request.data.get('activo', not empresa.estado)
        empresa.estado = nuevo_estado
        empresa.save(update_fields=['estado'])
        return Response({'estado': empresa.estado})

    @action(detail=True, methods=['get'], url_path='sucursales')
    def listar_sucursales(self, request, pk=None):
        """Retorna las sucursales de una empresa."""
        sucursales = SucursalService.listar(idempresa=uuid.UUID(pk))
        serializer = SucursalListSerializer(sucursales, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='sucursales', serializer_class=SucursalSerializer)
    def create_sucursal(self, request, pk=None):
        """Crea una nueva sucursal para una empresa."""
        data = request.data.copy()
        serializer = SucursalSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save(idempresa_id=pk)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


@extend_schema_view(
    create=extend_schema(examples=[
        OpenApiExample('Sucursal correcta', value={'nombre': 'Sede Norte', 'codigo': 'SEDE007', 'direccion': 'Av. Industrial 500', 'telefono': '01-555-0700'}, request_only=True),
        OpenApiExample('Código vacío', value={'nombre': 'Test', 'codigo': ''}, request_only=True),
    ]),
    update=extend_schema(examples=[
        OpenApiExample('Actualización correcta', value={'nombre': 'Sede Norte Editada'}, request_only=True),
    ]),
    partial_update=extend_schema(examples=[
        OpenApiExample('Cambio de estado', value={'estado': False}, request_only=True),
    ]),
)
class SucursalViewSet(viewsets.ModelViewSet):
    """CRUD de sucursales de una empresa."""
    portal_only = True
    swagger_tags = 'Sucursales'
    queryset = SucursalService.listar()
    serializer_class = SucursalSerializer
    filterset_class = SucursalFilter

    def get_serializer_class(self):
        if self.action == 'list':
            return SucursalListSerializer
        return SucursalSerializer

    def get_queryset(self):
        idempresa = self.request.query_params.get('idempresa')
        return SucursalService.listar(idempresa=uuid.UUID(idempresa) if idempresa else None)

    def perform_destroy(self, instance):
        instance.delete()

    @extend_schema(
        request=ToggleEstadoSerializer,
        examples=[
            OpenApiExample('Desactivar', value={'activo': False}, request_only=True),
            OpenApiExample('Activar', value={'activo': True}, request_only=True),
        ],
    )
    @action(detail=True, methods=['patch'], url_path='estado', serializer_class=ToggleEstadoSerializer)
    def toggle_estado(self, request, pk=None):
        sucursal = self.get_object()
        sucursal.estado = request.data.get('activo', not sucursal.estado)
        sucursal.save(update_fields=['estado'])
        return Response({'estado': sucursal.estado})

    @action(detail=True, methods=['get'], url_path='almacenes')
    def listar_almacenes(self, request, pk=None):
        """Retorna los almacenes de una sucursal."""
        almacenes = AlmacenService.listar(idsucursal=uuid.UUID(pk))
        serializer = AlmacenSerializer(almacenes, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], url_path='almacenes', serializer_class=AlmacenSerializer)
    def create_almacen(self, request, pk=None):
        """Crea un nuevo almacén para una sucursal."""
        data = request.data.copy()
        serializer = AlmacenSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save(idsucursal_id=pk)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


@extend_schema_view(
    create=extend_schema(examples=[
        OpenApiExample('Almacén correcto', value={'nombre': 'Almacén Norte', 'codigo': 'ALM007', 'descripcion': 'Almacén principal', 'capacidadmaxima': 10000}, request_only=True),
        OpenApiExample('Capacidad inválida', value={'nombre': 'Test', 'capacidadmaxima': -1}, request_only=True),
    ]),
    update=extend_schema(examples=[
        OpenApiExample('Actualización correcta', value={'nombre': 'Almacén Norte Editado'}, request_only=True),
    ]),
    partial_update=extend_schema(examples=[
        OpenApiExample('Cambio de nombre', value={'nombre': 'Nuevo nombre'}, request_only=True),
    ]),
)
class AlmacenViewSet(viewsets.ModelViewSet):
    """CRUD de almacenes de una sucursal."""
    portal_only = True
    swagger_tags = 'Almacenes'
    queryset = AlmacenService.listar()
    serializer_class = AlmacenSerializer
    filterset_class = AlmacenFilter

    def get_queryset(self):
        idsucursal = self.request.query_params.get('idsucursal')
        return AlmacenService.listar(idsucursal=uuid.UUID(idsucursal) if idsucursal else None)

    def perform_destroy(self, instance):
        instance.delete()

    @extend_schema(
        request=ToggleEstadoSerializer,
        examples=[
            OpenApiExample('Desactivar', value={'activo': False}, request_only=True),
            OpenApiExample('Activar', value={'activo': True}, request_only=True),
        ],
    )
    @action(detail=True, methods=['patch'], url_path='estado', serializer_class=ToggleEstadoSerializer)
    def toggle_estado(self, request, pk=None):
        almacen = self.get_object()
        almacen.estado = request.data.get('activo', not almacen.estado)
        almacen.save(update_fields=['estado'])
        return Response({'estado': almacen.estado})
