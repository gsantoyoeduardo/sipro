from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Zona, Pasillo, Estante, Nivel, Ubicacion, Nodo, Conexion
from .serializers import (
    ZonaSerializer, ZonaListSerializer,
    PasilloSerializer, PasilloListSerializer,
    EstanteSerializer, EstanteListSerializer,
    NivelSerializer, UbicacionSerializer,
    NodoSerializer, NodoListSerializer,
    ConexionSerializer,
)
from .dijkstra import shortest_path


class ZonaViewSet(viewsets.ModelViewSet):
    queryset = Zona.objects.all()
    serializer_class = ZonaSerializer

    def get_serializer_class(self):
        if self.action == 'list':
            return ZonaListSerializer
        return ZonaSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        idalmacen = self.request.query_params.get('idalmacen')
        if idalmacen:
            qs = qs.filter(idalmacen_id=idalmacen)
        return qs

    @action(detail=True, methods=['patch'], url_path='estado')
    def toggle_estado(self, request, pk=None):
        obj = self.get_object()
        obj.estado = request.data.get('estado', not obj.estado)
        obj.save(update_fields=['estado'])
        return Response({'estado': obj.estado})

    @action(detail=True, methods=['get'], url_path='pasillos')
    def pasillos(self, request, pk=None):
        pasillos = Pasillo.objects.filter(idzona_id=pk)
        return Response(PasilloListSerializer(pasillos, many=True).data)

    @action(detail=True, methods=['post'], url_path='pasillos')
    def create_pasillo(self, request, pk=None):
        data = request.data.copy()
        data['idzona'] = pk
        serializer = PasilloSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class PasilloViewSet(viewsets.ModelViewSet):
    queryset = Pasillo.objects.all()
    serializer_class = PasilloSerializer

    def get_serializer_class(self):
        if self.action == 'list':
            return PasilloListSerializer
        return PasilloSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        idzona = self.request.query_params.get('idzona')
        if idzona:
            qs = qs.filter(idzona_id=idzona)
        return qs

    @action(detail=True, methods=['patch'], url_path='estado')
    def toggle_estado(self, request, pk=None):
        obj = self.get_object()
        obj.estado = request.data.get('estado', not obj.estado)
        obj.save(update_fields=['estado'])
        return Response({'estado': obj.estado})

    @action(detail=True, methods=['get'], url_path='estantes')
    def estantes(self, request, pk=None):
        estantes = Estante.objects.filter(idpasillo_id=pk)
        return Response(EstanteListSerializer(estantes, many=True).data)

    @action(detail=True, methods=['post'], url_path='estantes')
    def create_estante(self, request, pk=None):
        data = request.data.copy()
        data['idpasillo'] = pk
        serializer = EstanteSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class EstanteViewSet(viewsets.ModelViewSet):
    queryset = Estante.objects.all()
    serializer_class = EstanteSerializer

    def get_serializer_class(self):
        if self.action == 'list':
            return EstanteListSerializer
        return EstanteSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        idpasillo = self.request.query_params.get('idpasillo')
        if idpasillo:
            qs = qs.filter(idpasillo_id=idpasillo)
        return qs

    @action(detail=True, methods=['patch'], url_path='estado')
    def toggle_estado(self, request, pk=None):
        obj = self.get_object()
        obj.estado = request.data.get('estado', not obj.estado)
        obj.save(update_fields=['estado'])
        return Response({'estado': obj.estado})

    @action(detail=True, methods=['get'], url_path='niveles')
    def niveles(self, request, pk=None):
        niveles = Nivel.objects.filter(idestante_id=pk)
        return Response(NivelSerializer(niveles, many=True).data)

    @action(detail=True, methods=['post'], url_path='niveles')
    def create_nivel(self, request, pk=None):
        data = request.data.copy()
        data['idestante'] = pk
        serializer = NivelSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class NivelViewSet(viewsets.ModelViewSet):
    queryset = Nivel.objects.all()
    serializer_class = NivelSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        idestante = self.request.query_params.get('idestante')
        if idestante:
            qs = qs.filter(idestante_id=idestante)
        return qs

    @action(detail=True, methods=['patch'], url_path='estado')
    def toggle_estado(self, request, pk=None):
        obj = self.get_object()
        obj.estado = request.data.get('estado', not obj.estado)
        obj.save(update_fields=['estado'])
        return Response({'estado': obj.estado})

    @action(detail=True, methods=['get'], url_path='ubicaciones')
    def ubicaciones(self, request, pk=None):
        ubicaciones = Ubicacion.objects.filter(idnivel_id=pk)
        return Response(UbicacionSerializer(ubicaciones, many=True).data)

    @action(detail=True, methods=['post'], url_path='ubicaciones')
    def create_ubicacion(self, request, pk=None):
        data = request.data.copy()
        data['idnivel'] = pk
        serializer = UbicacionSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class UbicacionViewSet(viewsets.ModelViewSet):
    queryset = Ubicacion.objects.all()
    serializer_class = UbicacionSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        idnivel = self.request.query_params.get('idnivel')
        if idnivel:
            qs = qs.filter(idnivel_id=idnivel)
        return qs

    @action(detail=True, methods=['patch'], url_path='estado')
    def toggle_estado(self, request, pk=None):
        obj = self.get_object()
        obj.estado = request.data.get('estado', not obj.estado)
        obj.save(update_fields=['estado'])
        return Response({'estado': obj.estado})

    @action(detail=True, methods=['patch'], url_path='estado-ubicacion')
    def cambiar_estado_ubicacion(self, request, pk=None):
        obj = self.get_object()
        nuevo_estado = request.data.get('estado_ubicacion')
        if nuevo_estado not in dict(Ubicacion._meta.get_field('estado_ubicacion').choices):
            return Response({'error': 'Estado inválido'}, status=status.HTTP_400_BAD_REQUEST)
        obj.estado_ubicacion = nuevo_estado
        obj.save(update_fields=['estado_ubicacion'])
        return Response({'estado_ubicacion': obj.estado_ubicacion})


class NodoViewSet(viewsets.ModelViewSet):
    queryset = Nodo.objects.all()
    serializer_class = NodoSerializer

    def get_serializer_class(self):
        if self.action == 'list':
            return NodoListSerializer
        return NodoSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        idalmacen = self.request.query_params.get('idalmacen')
        if idalmacen:
            qs = qs.filter(idalmacen_id=idalmacen)
        return qs

    @action(detail=True, methods=['patch'], url_path='estado')
    def toggle_estado(self, request, pk=None):
        obj = self.get_object()
        obj.estado = request.data.get('estado', not obj.estado)
        obj.save(update_fields=['estado'])
        return Response({'estado': obj.estado})

    @action(detail=True, methods=['get'], url_path='conexiones')
    def conexiones(self, request, pk=None):
        salida = Conexion.objects.filter(idnodoorigen_id=pk)
        entrada = Conexion.objects.filter(idnododestino_id=pk)
        data = {
            'salida': ConexionSerializer(salida, many=True).data,
            'entrada': ConexionSerializer(entrada, many=True).data,
        }
        return Response(data)


class ConexionViewSet(viewsets.ModelViewSet):
    queryset = Conexion.objects.all()
    serializer_class = ConexionSerializer

    @action(detail=True, methods=['patch'], url_path='estado')
    def toggle_estado(self, request, pk=None):
        obj = self.get_object()
        obj.estado = request.data.get('estado', not obj.estado)
        obj.save(update_fields=['estado'])
        return Response({'estado': obj.estado})


class RutaViewSet(viewsets.ViewSet):
    def create(self, request):
        origen_id = request.data.get('origen_id')
        destino_id = request.data.get('destino_id')

        if not origen_id or not destino_id:
            return Response(
                {'error': 'origen_id y destino_id son obligatorios'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        result = shortest_path(origen_id, destino_id)

        if 'error' in result:
            return Response(result, status=status.HTTP_404_NOT_FOUND)

        return Response(result)

    def list(self, request):
        origen_id = request.query_params.get('origen_id')
        destino_id = request.query_params.get('destino_id')

        if not origen_id or not destino_id:
            return Response(
                {'error': 'origen_id y destino_id son obligatorios como query params'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        result = shortest_path(origen_id, destino_id)

        if 'error' in result:
            return Response(result, status=status.HTTP_404_NOT_FOUND)

        return Response(result)
