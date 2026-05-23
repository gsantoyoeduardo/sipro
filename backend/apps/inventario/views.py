"""
Vistas del módulo Inventario (Gestión de productos, lotes y stock).

Proporciona endpoints CRUD y acciones personalizadas para categorías,
productos, lotes, inventario físico y kardex de movimientos. Incluye un
endpoint para calcular sugerencias de picking basado en estrategias FEFO/FIFO.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Categoria, Producto, Lote, Inventario, Kardex
from .serializers import (
    CategoriaSerializer,
    ProductoSerializer, ProductoListSerializer,
    LoteSerializer, InventarioSerializer, KardexSerializer,
)
from .fefo_fifo import calcular_picking


class CategoriaViewSet(viewsets.ModelViewSet):
    """
    ViewSet para el modelo Categoria (árbol de categorías de productos).

    Expone CRUD completo para categorías de productos (estructura jerárquica).
    Filtros:
      - ?raiz=true: Retorna solo categorías raíz (sin padre).
    Acciones personalizadas:
      - PATCH /{pk}/estado/: Cambia el estado de la categoría.
      - GET /{pk}/subcategorias/: Lista las subcategorías hijas.
      - GET /{pk}/productos/: Lista los productos de esta categoría.
    """
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        raiz = self.request.query_params.get('raiz')
        if raiz == 'true':
            qs = qs.filter(idcategoriapadre__isnull=True)
        return qs

    @action(detail=True, methods=['patch'], url_path='estado')
    def toggle_estado(self, request, pk=None):
        """
        Cambia el campo 'estado' (booleano) de la categoría.
        Si no se envía 'estado' en el body, alterna el valor actual.
        """
        obj = self.get_object()
        obj.estado = request.data.get('estado', not obj.estado)
        obj.save(update_fields=['estado'])
        return Response({'estado': obj.estado})

    @action(detail=True, methods=['get'], url_path='subcategorias')
    def subcategorias(self, request, pk=None):
        """Retorna las subcategorías hijas directas de esta categoría."""
        sub = Categoria.objects.filter(idcategoriapadre_id=pk)
        return Response(CategoriaSerializer(sub, many=True).data)

    @action(detail=True, methods=['get'], url_path='productos')
    def productos(self, request, pk=None):
        """Retorna todos los productos que pertenecen a esta categoría."""
        productos = Producto.objects.filter(idcategoria_id=pk)
        return Response(ProductoListSerializer(productos, many=True).data)


class ProductoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para el modelo Producto.

    Expone CRUD completo para productos del catálogo.
    Filtros:
      - ?idcategoria=<uuid>: Filtra productos de una categoría específica.
      - ?search=<str>: Busca productos por nombre o código (icontains).
    Acciones personalizadas:
      - PATCH /{pk}/estado/: Cambia el estado del producto.
      - GET /{pk}/lotes/: Lista los lotes del producto.
      - GET /{pk}/inventario/: Lista el inventario físico (stock > 0) del producto.
      - GET /{pk}/kardex/: Lista los movimientos de kardex del producto.
    """
    queryset = Producto.objects.all()
    serializer_class = ProductoSerializer

    def get_serializer_class(self):
        if self.action == 'list':
            return ProductoListSerializer
        return ProductoSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        idcategoria = self.request.query_params.get('idcategoria')
        if idcategoria:
            qs = qs.filter(idcategoria_id=idcategoria)
        search = self.request.query_params.get('search')
        if search:
            qs = qs.filter(nombre__icontains=search) | qs.filter(codigo__icontains=search)
        return qs

    @action(detail=True, methods=['patch'], url_path='estado')
    def toggle_estado(self, request, pk=None):
        """
        Cambia el campo 'estado' (booleano) del producto.
        Si no se envía 'estado' en el body, alterna el valor actual.
        """
        obj = self.get_object()
        obj.estado = request.data.get('estado', not obj.estado)
        obj.save(update_fields=['estado'])
        return Response({'estado': obj.estado})

    @action(detail=True, methods=['get'], url_path='lotes')
    def lotes(self, request, pk=None):
        """Retorna todos los lotes asociados a este producto."""
        lotes = Lote.objects.filter(idproducto_id=pk)
        return Response(LoteSerializer(lotes, many=True).data)

    @action(detail=True, methods=['get'], url_path='inventario')
    def inventario(self, request, pk=None):
        """Retorna el inventario físico (stock > 0) del producto en todas las ubicaciones."""
        inv = Inventario.objects.filter(idproducto_id=pk, cantidad__gt=0)
        return Response(InventarioSerializer(inv, many=True).data)

    @action(detail=True, methods=['get'], url_path='kardex')
    def kardex(self, request, pk=None):
        """Retorna los movimientos de kardex del producto ordenados del más reciente al más antiguo."""
        kdx = Kardex.objects.filter(idproducto_id=pk).order_by('-fecha_movimiento')
        return Response(KardexSerializer(kdx, many=True).data)


class LoteViewSet(viewsets.ModelViewSet):
    """
    ViewSet para el modelo Lote.

    Expone CRUD completo para lotes de productos.
    Filtros:
      - ?idproducto=<uuid>: Filtra los lotes de un producto específico.
    Acciones personalizadas:
      - PATCH /{pk}/estado/: Cambia el estado del lote.
    """
    queryset = Lote.objects.all()
    serializer_class = LoteSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        idproducto = self.request.query_params.get('idproducto')
        if idproducto:
            qs = qs.filter(idproducto_id=idproducto)
        return qs

    @action(detail=True, methods=['patch'], url_path='estado')
    def toggle_estado(self, request, pk=None):
        """
        Cambia el campo 'estado' (booleano) del lote.
        Si no se envía 'estado' en el body, alterna el valor actual.
        """
        obj = self.get_object()
        obj.estado = request.data.get('estado', not obj.estado)
        obj.save(update_fields=['estado'])
        return Response({'estado': obj.estado})


class InventarioViewSet(viewsets.ModelViewSet):
    """
    ViewSet para el modelo Inventario (stock físico por producto y ubicación).

    Expone CRUD completo para el inventario físico.
    Filtros:
      - ?idproducto=<uuid>: Filtra por producto.
      - ?idubicacion=<uuid>: Filtra por ubicación física.
    Acciones personalizadas:
      - PATCH /{pk}/estado/: Cambia el estado del registro de inventario.
      - GET /picking/: Calcula sugerencias de picking por estrategia (FEFO/FIFO).
    """
    queryset = Inventario.objects.all()
    serializer_class = InventarioSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        idproducto = self.request.query_params.get('idproducto')
        if idproducto:
            qs = qs.filter(idproducto_id=idproducto)
        idubicacion = self.request.query_params.get('idubicacion')
        if idubicacion:
            qs = qs.filter(idubicacion_id=idubicacion)
        return qs

    @action(detail=True, methods=['patch'], url_path='estado')
    def toggle_estado(self, request, pk=None):
        """
        Cambia el campo 'estado' (booleano) del registro de inventario.
        Si no se envía 'estado' en el body, alterna el valor actual.
        """
        obj = self.get_object()
        obj.estado = request.data.get('estado', not obj.estado)
        obj.save(update_fields=['estado'])
        return Response({'estado': obj.estado})

    @action(detail=False, methods=['get'], url_path='picking')
    def picking(self, request):
        """
        Calcula sugerencias de picking para un producto y cantidad.

        Pasos:
          1. Recibe 'producto' (ID), 'cantidad' y opcionalmente 'estrategia' (fefo/fifo).
          2. Valida que producto y cantidad estén presentes y cantidad sea numérico.
          3. Delega el cálculo en la función calcular_picking() que aplica la estrategia.
          4. Retorna las ubicaciones sugeridas para el picking o un error si no hay stock suficiente.
        """
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

        result = calcular_picking(producto_id, cantidad_decimal, estrategia)

        if 'error' in result:
            return Response(result, status=status.HTTP_404_NOT_FOUND)

        return Response(result)


class KardexViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet de solo lectura para el modelo Kardex (historial de movimientos).

    Expone list y retrieve para consultar movimientos de inventario.
    El listado se ordena del más reciente al más antiguo.
    Filtros:
      - ?idproducto=<uuid>: Filtra movimientos de un producto específico.
      - ?tipo=<str>: Filtra por tipo de movimiento (entrada, salida, ajuste).
    """
    queryset = Kardex.objects.all().order_by('-fecha_movimiento')
    serializer_class = KardexSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        idproducto = self.request.query_params.get('idproducto')
        if idproducto:
            qs = qs.filter(idproducto_id=idproducto)
        tipo = self.request.query_params.get('tipo')
        if tipo:
            qs = qs.filter(tipo_movimiento=tipo)
        return qs
