from drf_spectacular.utils import (
    OpenApiExample,
    OpenApiParameter,
    extend_schema,
    extend_schema_view,
)
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from application.dto.inventario.categoria_dto import CategoriaSerializer
from application.dto.inventario.inventario_dto import InventarioSerializer
from application.dto.inventario.kardex_dto import KardexSerializer
from application.dto.inventario.lote_dto import LoteSerializer
from application.dto.inventario.producto_dto import (
    ProductoListSerializer,
    ProductoSerializer,
)
from application.dto.shared_dto import ToggleEstadoSerializer
from application.filters.inventario.inventario_filter import InventarioFilter
from application.filters.inventario.kardex_filter import KardexFilter
from application.filters.inventario.lote_filter import LoteFilter
from application.filters.inventario.producto_filter import ProductoFilter
from application.services.inventario.picking_service import PickingService
from infrastructure.models.inventario_model import (
    Categoria,
    Inventario,
    Kardex,
    Lote,
    Producto,
)


@extend_schema_view(
    create=extend_schema(examples=[
        OpenApiExample('Ejemplo correcto', value={"nombre": "Nueva Categoría", "descripcion": "Categoría de prueba"}, request_only=True),
        OpenApiExample('Ejemplo incorrecto', value={"nombre": ""}, request_only=True),
    ]),
    update=extend_schema(examples=[
        OpenApiExample('Ejemplo correcto', value={"nombre": "Categoría Editada"}, request_only=True),
    ]),
    partial_update=extend_schema(examples=[
        OpenApiExample('Ejemplo correcto', value={"estado": False}, request_only=True),
    ]),
)
class CategoriaViewSet(viewsets.ModelViewSet):
    """CRUD de categorías de productos. Organización jerárquica con subcategorías."""
    swagger_tags = 'Categorías'
    tenant_only = True
    queryset = Categoria.objects.none()
    serializer_class = CategoriaSerializer

    def get_queryset(self):
        qs = Categoria.objects.all()
        raiz = self.request.query_params.get('raiz')
        if raiz == 'true':
            qs = qs.filter(idcategoriapadre__isnull=True)
        return qs

    def perform_create(self, serializer):
        idempresa = getattr(self.request.user, 'idempresa_id', None)
        serializer.save(idempresa_id=idempresa)

    @extend_schema(examples=[
        OpenApiExample('Ejemplo correcto', value={"activo": False}, request_only=True),
        OpenApiExample('Ejemplo incorrecto', value={"activo": "si"}, request_only=True),
    ])
    @action(detail=True, methods=['patch'], url_path='estado', serializer_class=ToggleEstadoSerializer)
    def toggle_estado(self, request, pk=None):
        obj = self.get_object()
        obj.estado = request.data.get('activo', not obj.estado)
        obj.save(update_fields=['estado'])
        return Response({'estado': obj.estado})

    @action(detail=True, methods=['get'], url_path='subcategorias')
    def subcategorias(self, request, pk=None):
        """Retorna las subcategorías hijas de una categoría padre."""
        sub = Categoria.objects.filter(idcategoriapadre_id=pk)
        return Response(CategoriaSerializer(sub, many=True).data)

    @action(detail=True, methods=['get'], url_path='productos')
    def productos(self, request, pk=None):
        """Retorna los productos pertenecientes a una categoría."""
        productos = Producto.objects.filter(idcategoria_id=pk)
        return Response(ProductoListSerializer(productos, many=True).data)


@extend_schema_view(
    create=extend_schema(examples=[
        OpenApiExample('Ejemplo correcto', value={"codigo": "SKU-100", "nombre": "Producto Nuevo", "descripcion": "Descripción", "unidad_medida": "unidad", "precio_costo": 10.00, "precio_venta": 25.00, "stock_minimo": 5, "stock_maximo": 200}, request_only=True),
        OpenApiExample('Ejemplo incorrecto', value={"codigo": "", "precio_venta": -1}, request_only=True),
    ]),
    update=extend_schema(examples=[
        OpenApiExample('Ejemplo correcto', value={"nombre": "Producto Editado"}, request_only=True),
    ]),
    partial_update=extend_schema(examples=[
        OpenApiExample('Ejemplo correcto', value={"estado": False}, request_only=True),
    ]),
)
class ProductoViewSet(viewsets.ModelViewSet):
    """CRUD de productos del inventario. Incluye stock total, lotes y kardex."""
    tenant_only = True
    swagger_tags = 'Productos'
    queryset = Producto.objects.none()
    serializer_class = ProductoSerializer
    filterset_class = ProductoFilter

    def get_serializer_class(self):
        if self.action == 'list':
            return ProductoListSerializer
        return ProductoSerializer

    def get_queryset(self):
        qs = Producto.objects.select_related('idcategoria')
        idcategoria = self.request.query_params.get('idcategoria')
        if idcategoria:
            qs = qs.filter(idcategoria_id=idcategoria)
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(nombre__icontains=search) | qs.filter(codigo__icontains=search)
        return qs

    @extend_schema(examples=[
        OpenApiExample('Ejemplo correcto', value={"activo": False}, request_only=True),
    ])
    @action(detail=True, methods=['patch'], url_path='estado', serializer_class=ToggleEstadoSerializer)
    def toggle_estado(self, request, pk=None):
        obj = self.get_object()
        obj.estado = request.data.get('activo', not obj.estado)
        obj.save(update_fields=['estado'])
        return Response({'estado': obj.estado})

    @action(detail=True, methods=['get'], url_path='lotes')
    def lotes(self, request, pk=None):
        """Retorna los lotes asociados a un producto."""
        lotes = Lote.objects.filter(idproducto_id=pk)
        return Response(LoteSerializer(lotes, many=True).data)

    @action(detail=True, methods=['get'], url_path='inventario')
    def inventario(self, request, pk=None):
        """Retorna el stock actual de un producto en todas sus ubicaciones."""
        inv = Inventario.objects.filter(idproducto_id=pk, cantidad__gt=0)
        return Response(InventarioSerializer(inv, many=True).data)

    @action(detail=True, methods=['get'], url_path='kardex')
    def kardex(self, request, pk=None):
        """Retorna el historial de movimientos de un producto."""
        kdx = Kardex.objects.filter(idproducto_id=pk).order_by('-fecha_movimiento')
        return Response(KardexSerializer(kdx, many=True).data)


@extend_schema_view(
    create=extend_schema(examples=[
        OpenApiExample('Ejemplo correcto', value={"numero_lote": "LOT-NUEVO-001", "cantidad_inicial": 200, "cantidad_actual": 200}, request_only=True),
        OpenApiExample('Ejemplo incorrecto', value={"cantidad_inicial": -1}, request_only=True),
    ]),
    partial_update=extend_schema(examples=[
        OpenApiExample('Ejemplo correcto', value={"estado": False}, request_only=True),
    ]),
)
class LoteViewSet(viewsets.ModelViewSet):
    """CRUD de lotes de productos. Control de trazabilidad por lote."""
    tenant_only = True
    swagger_tags = 'Lotes'
    queryset = Lote.objects.none()
    serializer_class = LoteSerializer
    filterset_class = LoteFilter

    def get_queryset(self):
        qs = Lote.objects.select_related('idproducto__idcategoria')
        idproducto = self.request.query_params.get('idproducto')
        if idproducto:
            qs = qs.filter(idproducto_id=idproducto)
        return qs

    @extend_schema(examples=[
        OpenApiExample('Ejemplo correcto', value={"activo": False}, request_only=True),
    ])
    @action(detail=True, methods=['patch'], url_path='estado', serializer_class=ToggleEstadoSerializer)
    def toggle_estado(self, request, pk=None):
        obj = self.get_object()
        obj.estado = request.data.get('activo', not obj.estado)
        obj.save(update_fields=['estado'])
        return Response({'estado': obj.estado})


@extend_schema_view(
    create=extend_schema(examples=[
        OpenApiExample('Ejemplo correcto', value={"cantidad": 100}, request_only=True),
        OpenApiExample('Ejemplo incorrecto', value={"cantidad": -5}, request_only=True),
    ]),
)
class InventarioViewSet(viewsets.ModelViewSet):
    """Stock actual por producto y ubicación. Consulta y cálculo de picking."""
    tenant_only = True
    swagger_tags = 'Inventario'
    queryset = Inventario.objects.none()
    serializer_class = InventarioSerializer
    filterset_class = InventarioFilter

    def get_queryset(self):
        qs = Inventario.objects.select_related('idproducto__idcategoria', 'idubicacion__idnivel__idestante__idzona')
        idproducto = self.request.query_params.get('idproducto')
        if idproducto:
            qs = qs.filter(idproducto_id=idproducto)
        idubicacion = self.request.query_params.get('idubicacion')
        if idubicacion:
            qs = qs.filter(idubicacion_id=idubicacion)
        return qs

    @extend_schema(examples=[
        OpenApiExample('Ejemplo correcto', value={"activo": False}, request_only=True),
    ])
    @action(detail=True, methods=['patch'], url_path='estado', serializer_class=ToggleEstadoSerializer)
    def toggle_estado(self, request, pk=None):
        obj = self.get_object()
        obj.estado = request.data.get('activo', not obj.estado)
        obj.save(update_fields=['estado'])
        return Response({'estado': obj.estado})

    @extend_schema(
        parameters=[
            OpenApiParameter('producto', type=str, description='ID del producto a pickear (UUID)', required=True),
            OpenApiParameter('cantidad', type=float, description='Cantidad requerida del producto', required=True),
            OpenApiParameter('estrategia', type=str, description='Estrategia de picking: fefo (lotes próximos a vencer) o fifo (lotes más antiguos)', required=False),
            OpenApiParameter('optimizar_ruta', type=bool, description='Si es true, optimiza la ruta entre las ubicaciones de picking usando algoritmo NearestNeighbor/2-opt', required=False),
        ],
        description="Calcula el origen del picking aplicando la estrategia FEFO o FIFO, y opcionalmente optimiza la ruta de recolección entre las ubicaciones seleccionadas.",
    )
    @action(detail=False, methods=['get'], url_path='picking')
    def picking(self, request):
        """Calcula la mejor estrategia de picking para un producto y cantidad dados. Si optimizar_ruta=true, devuelve la ruta optimizada entre ubicaciones."""
        producto_id = request.query_params.get('producto')
        cantidad = request.query_params.get('cantidad')
        estrategia = request.query_params.get('estrategia', 'fefo')

        if not producto_id or not cantidad:
            return Response(
                {'error': 'producto y cantidad son obligatorios'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            cantidad_decimal = float(cantidad)
        except (ValueError, TypeError):
            return Response({'error': 'cantidad debe ser un número'}, status=status.HTTP_400_BAD_REQUEST)

        result = PickingService.calcular(producto_id, cantidad_decimal, estrategia)
        if 'error' in result:
            return Response(result, status=status.HTTP_404_NOT_FOUND)
        return Response(result)


class KardexViewSet(viewsets.ReadOnlyModelViewSet):
    """Historial de movimientos de inventario por producto. Solo lectura."""
    tenant_only = True
    swagger_tags = 'Kardex'
    queryset = Kardex.objects.none()
    serializer_class = KardexSerializer
    filterset_class = KardexFilter

    def get_queryset(self):
        qs = Kardex.objects.select_related('idproducto__idcategoria').order_by('-fecha_movimiento')
        idproducto = self.request.query_params.get('idproducto')
        if idproducto:
            qs = qs.filter(idproducto_id=idproducto)
        tipo = self.request.query_params.get('tipo')
        if tipo:
            qs = qs.filter(tipo_movimiento=tipo)
        return qs

