from drf_spectacular.utils import OpenApiExample, extend_schema, extend_schema_view
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from application.dto.layout.conexion_dto import ConexionSerializer
from application.dto.layout.estante_dto import EstanteListSerializer, EstanteSerializer
from application.dto.layout.nivel_dto import NivelSerializer
from application.dto.layout.nodo_dto import NodoListSerializer, NodoSerializer
from application.dto.layout.ubicacion_dto import (
    CambiarEstadoUbicacionSerializer,
    UbicacionSerializer,
)
from application.dto.layout.zona_dto import ZonaListSerializer, ZonaSerializer
from application.dto.shared_dto import ToggleEstadoSerializer
from application.filters.layout.estante_filter import EstanteFilter
from application.filters.layout.nivel_filter import NivelFilter
from application.filters.layout.nodo_filter import NodoFilter
from application.filters.layout.ubicacion_filter import UbicacionFilter
from application.filters.layout.zona_filter import ZonaFilter
from application.services.layout.layout_service import RutaService
from infrastructure.models.layout_model import (
    Conexion,
    Estante,
    Nivel,
    Nodo,
    Ubicacion,
    Zona,
)


@extend_schema_view(
    create=extend_schema(examples=[
        OpenApiExample('Ejemplo correcto', value={"nombre": "Zona Nueva", "codigo": "Z-NUEVA", "tipo": "almacenamiento", "x": 100, "y": 200, "color": "#2196F3"}, request_only=True),
        OpenApiExample('Ejemplo incorrecto', value={"tipo": "invalido"}, request_only=True),
    ]),
    update=extend_schema(examples=[
        OpenApiExample('Ejemplo correcto', value={"nombre": "Zona Editada"}, request_only=True),
    ]),
    partial_update=extend_schema(examples=[
        OpenApiExample('Ejemplo correcto', value={"estado": False}, request_only=True),
    ]),
)
class ZonaViewSet(viewsets.ModelViewSet):
    """CRUD de zonas de almacén. Cada zona agrupa estantes."""
    tenant_only = True
    swagger_tags = 'Zonas'
    queryset = Zona.objects.none()
    serializer_class = ZonaSerializer
    filterset_class = ZonaFilter

    def get_serializer_class(self):
        if self.action == 'list':
            return ZonaListSerializer
        return ZonaSerializer

    def get_queryset(self):
        qs = Zona.objects.select_related('idsucursal', 'idalmacen')
        idsucursal = self.request.query_params.get('idsucursal')
        idalmacen = self.request.query_params.get('idalmacen')
        if idsucursal:
            qs = qs.filter(idsucursal_id=idsucursal)
        if idalmacen:
            qs = qs.filter(idalmacen_id=idalmacen)
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

    @action(detail=True, methods=['get'], url_path='estantes')
    def estantes(self, request, pk=None):
        """Retorna los estantes pertenecientes a una zona."""
        estantes = Estante.objects.filter(idzona_id=pk)
        return Response(EstanteListSerializer(estantes, many=True).data)

    @extend_schema(examples=[
        OpenApiExample('Ejemplo correcto', value={"nombre": "Estante Z1", "codigo": "EZ1", "cantidadniveles": 3, "x": 50, "y": 50, "ancho": 240, "alto": 120}, request_only=True),
    ])
    @action(detail=True, methods=['post'], url_path='estantes', serializer_class=EstanteSerializer)
    def create_estante(self, request, pk=None):
        """Crea un nuevo estante dentro de una zona."""
        data = request.data.copy()
        data['idzona'] = pk
        serializer = EstanteSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


@extend_schema_view(
    create=extend_schema(examples=[
        OpenApiExample('Ejemplo correcto', value={"nombre": "Estante Nuevo", "codigo": "EN001", "cantidadniveles": 4}, request_only=True),
        OpenApiExample('Ejemplo incorrecto', value={"cantidadniveles": 0}, request_only=True),
    ]),
    update=extend_schema(examples=[
        OpenApiExample('Ejemplo correcto', value={"nombre": "Estante Editado"}, request_only=True),
    ]),
    partial_update=extend_schema(examples=[
        OpenApiExample('Ejemplo correcto', value={"estado": False}, request_only=True),
    ]),
)
class EstanteViewSet(viewsets.ModelViewSet):
    """CRUD de estantes dentro de una zona. Cada estante contiene niveles."""
    tenant_only = True
    swagger_tags = 'Estantes'
    queryset = Estante.objects.none()
    serializer_class = EstanteSerializer
    filterset_class = EstanteFilter

    def get_serializer_class(self):
        if self.action == 'list':
            return EstanteListSerializer
        return EstanteSerializer

    def get_queryset(self):
        qs = Estante.objects.select_related('idzona__idsucursal', 'idzona__idalmacen')
        idzona = self.request.query_params.get('idzona')
        if idzona:
            qs = qs.filter(idzona_id=idzona)
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

    @action(detail=True, methods=['get'], url_path='niveles')
    def niveles(self, request, pk=None):
        """Retorna los niveles de un estante."""
        niveles = Nivel.objects.filter(idestante_id=pk)
        return Response(NivelSerializer(niveles, many=True).data)

    @extend_schema(examples=[
        OpenApiExample('Ejemplo correcto', value={"numero": 1, "nombre": "Nivel 1", "altura": 40}, request_only=True),
    ])
    @action(detail=True, methods=['post'], url_path='niveles', serializer_class=NivelSerializer)
    def create_nivel(self, request, pk=None):
        """Crea un nuevo nivel dentro de un estante."""
        data = request.data.copy()
        data['idestante'] = pk
        serializer = NivelSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


@extend_schema_view(
    create=extend_schema(examples=[
        OpenApiExample('Ejemplo correcto', value={"numero": 2, "nombre": "Nivel 2", "altura": 35}, request_only=True),
        OpenApiExample('Ejemplo incorrecto', value={"altura": -1}, request_only=True),
    ]),
    partial_update=extend_schema(examples=[
        OpenApiExample('Ejemplo correcto', value={"estado": False}, request_only=True),
    ]),
)
class NivelViewSet(viewsets.ModelViewSet):
    """CRUD de niveles de estante. Cada nivel contiene ubicaciones."""
    tenant_only = True
    swagger_tags = 'Niveles'
    queryset = Nivel.objects.none()
    serializer_class = NivelSerializer
    filterset_class = NivelFilter

    def get_queryset(self):
        qs = Nivel.objects.select_related('idestante__idzona__idsucursal', 'idestante__idzona__idalmacen')
        idestante = self.request.query_params.get('idestante')
        if idestante:
            qs = qs.filter(idestante_id=idestante)
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

    @action(detail=True, methods=['get'], url_path='ubicaciones')
    def ubicaciones(self, request, pk=None):
        """Retorna las ubicaciones de un nivel."""
        ubicaciones = Ubicacion.objects.filter(idnivel_id=pk)
        return Response(UbicacionSerializer(ubicaciones, many=True).data)

    @extend_schema(examples=[
        OpenApiExample('Ejemplo correcto', value={"codigo": "UBIC-NUEVA", "capacidadpeso": 500, "capacidadvolumen": 1.5}, request_only=True),
    ])
    @action(detail=True, methods=['post'], url_path='ubicaciones', serializer_class=UbicacionSerializer)
    def create_ubicacion(self, request, pk=None):
        """Crea una nueva ubicación dentro de un nivel."""
        data = request.data.copy()
        data['idnivel'] = pk
        serializer = UbicacionSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


@extend_schema_view(
    create=extend_schema(examples=[
        OpenApiExample('Ejemplo correcto', value={"codigo": "LOC-001", "capacidadpeso": 500}, request_only=True),
        OpenApiExample('Ejemplo incorrecto', value={"codigo": ""}, request_only=True),
    ]),
    partial_update=extend_schema(examples=[
        OpenApiExample('Ejemplo correcto', value={"estado": False}, request_only=True),
    ]),
)
class UbicacionViewSet(viewsets.ModelViewSet):
    """CRUD de ubicaciones de picking. Punto físico donde se almacena inventario."""
    tenant_only = True
    swagger_tags = 'Ubicaciones'
    queryset = Ubicacion.objects.none()
    serializer_class = UbicacionSerializer
    filterset_class = UbicacionFilter

    def get_queryset(self):
        qs = Ubicacion.objects.select_related('idnivel__idestante__idzona__idsucursal', 'idnivel__idestante__idzona__idalmacen')
        idnivel = self.request.query_params.get('idnivel')
        if idnivel:
            qs = qs.filter(idnivel_id=idnivel)
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

    @extend_schema(examples=[
        OpenApiExample('Ejemplo correcto', value={"estado_ubicacion": "ocupado"}, request_only=True),
    ])
    @action(detail=True, methods=['patch'], url_path='cambiar-estado', serializer_class=CambiarEstadoUbicacionSerializer)
    def cambiar_estado_ubicacion(self, request, pk=None):
        obj = self.get_object()
        nuevo_estado = request.data.get('estado_ubicacion')
        if nuevo_estado:
            obj.estado_ubicacion = nuevo_estado
            obj.save(update_fields=['estado_ubicacion'])
        return Response({'estado_ubicacion': obj.estado_ubicacion})


@extend_schema_view(
    create=extend_schema(examples=[
        OpenApiExample('Ejemplo correcto', value={"nombre": "N-Nuevo", "tipo": "interseccion", "coordenada_x": 150, "coordenada_y": 300}, request_only=True),
        OpenApiExample('Ejemplo incorrecto', value={"tipo": ""}, request_only=True),
    ]),
    partial_update=extend_schema(examples=[
        OpenApiExample('Ejemplo correcto', value={"estado": False}, request_only=True),
    ]),
)
class NodoViewSet(viewsets.ModelViewSet):
    """CRUD de nodos del grafo de recorrido del almacén."""
    tenant_only = True
    swagger_tags = 'Nodos'
    queryset = Nodo.objects.none()
    serializer_class = NodoSerializer
    filterset_class = NodoFilter

    def get_serializer_class(self):
        if self.action == 'list':
            return NodoListSerializer
        return NodoSerializer

    def get_queryset(self):
        qs = Nodo.objects.select_related('idsucursal', 'idalmacen')
        idsucursal = self.request.query_params.get('idsucursal')
        idalmacen = self.request.query_params.get('idalmacen')
        if idsucursal:
            qs = qs.filter(idsucursal_id=idsucursal)
        if idalmacen:
            qs = qs.filter(idalmacen_id=idalmacen)
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

    @action(detail=True, methods=['get'], url_path='conexiones')
    def conexiones(self, request, pk=None):
        """Retorna las conexiones de entrada y salida de un nodo."""
        salida = Conexion.objects.filter(idnodoorigen_id=pk)
        entrada = Conexion.objects.filter(idnododestino_id=pk)
        return Response({
            'salida': ConexionSerializer(salida, many=True).data,
            'entrada': ConexionSerializer(entrada, many=True).data,
        })


@extend_schema_view(
    create=extend_schema(examples=[
        OpenApiExample('Ejemplo correcto', value={"distancia": 200, "ancho": 400, "tipo": "pasillo"}, request_only=True),
        OpenApiExample('Ejemplo incorrecto', value={"distancia": -50}, request_only=True),
    ]),
    partial_update=extend_schema(examples=[
        OpenApiExample('Ejemplo correcto', value={"estado": False}, request_only=True),
    ]),
)
class ConexionViewSet(viewsets.ModelViewSet):
    """CRUD de conexiones entre nodos del grafo de recorrido."""
    tenant_only = True
    swagger_tags = 'Conexiones'
    queryset = Conexion.objects.none()
    serializer_class = ConexionSerializer

    def get_queryset(self):
        return Conexion.objects.select_related('idnodoorigen', 'idnododestino').all()

    @extend_schema(examples=[
        OpenApiExample('Ejemplo correcto', value={"activo": False}, request_only=True),
    ])
    @action(detail=True, methods=['patch'], url_path='estado', serializer_class=ToggleEstadoSerializer)
    def toggle_estado(self, request, pk=None):
        obj = self.get_object()
        obj.estado = request.data.get('activo', not obj.estado)
        obj.save(update_fields=['estado'])
        return Response({'estado': obj.estado})


class RutaViewSet(viewsets.ViewSet):
    """Cálculo de rutas óptimas entre dos puntos del almacén."""
    tenant_only = True
    swagger_tags = 'Rutas'
    @action(detail=False, methods=['get'], url_path='calcular')
    def calcular(self, request):
        """Calcula la ruta más corta entre un nodo origen y destino."""
        origen = request.query_params.get('origen')
        destino = request.query_params.get('destino')
        ancho_minimo = request.query_params.get('ancho_minimo', 0)
        if not origen or not destino:
            return Response({'error': 'origen y destino son requeridos'}, status=status.HTTP_400_BAD_REQUEST)
        result = RutaService.calcular(origen, destino, float(ancho_minimo))
        if 'error' in result:
            return Response(result, status=status.HTTP_404_NOT_FOUND)
        return Response(result)

