from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from src.infrastructure.models.inventario_model import Categoria, Producto, Lote, Inventario, Kardex
from src.infrastructure.serializers.inventario_serializer import (
    CategoriaSerializer,
    ProductoSerializer, ProductoListSerializer,
    LoteSerializer, InventarioSerializer, KardexSerializer,
)
from src.application.inventario.picking_service import PickingService


class CategoriaViewSet(viewsets.ModelViewSet):
    queryset = Categoria.objects.none()
    serializer_class = CategoriaSerializer

    def get_queryset(self):
        idempresa = getattr(self.request.user, 'idempresa_id', None)
        qs = Categoria.objects.all()
        if idempresa:
            qs = qs.filter(idempresa_id=idempresa)
        raiz = self.request.query_params.get('raiz')
        if raiz == 'true':
            qs = qs.filter(idcategoriapadre__isnull=True)
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

    @action(detail=True, methods=['get'], url_path='subcategorias')
    def subcategorias(self, request, pk=None):
        sub = Categoria.objects.filter(idcategoriapadre_id=pk)
        return Response(CategoriaSerializer(sub, many=True).data)

    @action(detail=True, methods=['get'], url_path='productos')
    def productos(self, request, pk=None):
        productos = Producto.objects.filter(idcategoria_id=pk)
        return Response(ProductoListSerializer(productos, many=True).data)


class ProductoViewSet(viewsets.ModelViewSet):
    queryset = Producto.objects.none()
    serializer_class = ProductoSerializer

    def get_serializer_class(self):
        if self.action == 'list':
            return ProductoListSerializer
        return ProductoSerializer

    def get_queryset(self):
        idempresa = getattr(self.request.user, 'idempresa_id', None)
        qs = Producto.objects.select_related('idcategoria')
        if idempresa:
            qs = qs.filter(idcategoria__idempresa_id=idempresa)
        idcategoria = self.request.query_params.get('idcategoria')
        if idcategoria:
            qs = qs.filter(idcategoria_id=idcategoria)
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(nombre__icontains=search) | qs.filter(codigo__icontains=search)
        return qs

    @action(detail=True, methods=['patch'], url_path='estado')
    def toggle_estado(self, request, pk=None):
        obj = self.get_object()
        obj.estado = request.data.get('estado', not obj.estado)
        obj.save(update_fields=['estado'])
        return Response({'estado': obj.estado})

    @action(detail=True, methods=['get'], url_path='lotes')
    def lotes(self, request, pk=None):
        lotes = Lote.objects.filter(idproducto_id=pk)
        return Response(LoteSerializer(lotes, many=True).data)

    @action(detail=True, methods=['get'], url_path='inventario')
    def inventario(self, request, pk=None):
        inv = Inventario.objects.filter(idproducto_id=pk, cantidad__gt=0)
        return Response(InventarioSerializer(inv, many=True).data)

    @action(detail=True, methods=['get'], url_path='kardex')
    def kardex(self, request, pk=None):
        kdx = Kardex.objects.filter(idproducto_id=pk).order_by('-fecha_movimiento')
        return Response(KardexSerializer(kdx, many=True).data)


class LoteViewSet(viewsets.ModelViewSet):
    queryset = Lote.objects.none()
    serializer_class = LoteSerializer

    def get_queryset(self):
        idempresa = getattr(self.request.user, 'idempresa_id', None)
        qs = Lote.objects.select_related('idproducto__idcategoria')
        if idempresa:
            qs = qs.filter(idproducto__idcategoria__idempresa_id=idempresa)
        idproducto = self.request.query_params.get('idproducto')
        if idproducto:
            qs = qs.filter(idproducto_id=idproducto)
        return qs

    @action(detail=True, methods=['patch'], url_path='estado')
    def toggle_estado(self, request, pk=None):
        obj = self.get_object()
        obj.estado = request.data.get('estado', not obj.estado)
        obj.save(update_fields=['estado'])
        return Response({'estado': obj.estado})


class InventarioViewSet(viewsets.ModelViewSet):
    queryset = Inventario.objects.none()
    serializer_class = InventarioSerializer

    def get_queryset(self):
        idempresa = getattr(self.request.user, 'idempresa_id', None)
        qs = Inventario.objects.select_related('idproducto__idcategoria', 'idubicacion__idnivel__idestante__idpasillo__idzona__idalmacen__idsucursal')
        if idempresa:
            qs = qs.filter(idproducto__idcategoria__idempresa_id=idempresa)
        idproducto = self.request.query_params.get('idproducto')
        if idproducto:
            qs = qs.filter(idproducto_id=idproducto)
        idubicacion = self.request.query_params.get('idubicacion')
        if idubicacion:
            qs = qs.filter(idubicacion_id=idubicacion)
        return qs

    @action(detail=True, methods=['patch'], url_path='estado')
    def toggle_estado(self, request, pk=None):
        obj = self.get_object()
        obj.estado = request.data.get('estado', not obj.estado)
        obj.save(update_fields=['estado'])
        return Response({'estado': obj.estado})

    @action(detail=False, methods=['get'], url_path='picking')
    def picking(self, request):
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
    queryset = Kardex.objects.none()
    serializer_class = KardexSerializer

    def get_queryset(self):
        idempresa = getattr(self.request.user, 'idempresa_id', None)
        qs = Kardex.objects.select_related('idproducto__idcategoria').order_by('-fecha_movimiento')
        if idempresa:
            qs = qs.filter(idproducto__idcategoria__idempresa_id=idempresa)
        idproducto = self.request.query_params.get('idproducto')
        if idproducto:
            qs = qs.filter(idproducto_id=idproducto)
        tipo = self.request.query_params.get('tipo')
        if tipo:
            qs = qs.filter(tipo_movimiento=tipo)
        return qs
