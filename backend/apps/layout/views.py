"""
Vistas del módulo Layout (Diseño de almacén).

Proporciona endpoints CRUD y acciones personalizadas para la jerarquía
completa del layout de un almacén: Zonas, Pasillos, Estantes, Niveles,
Ubicaciones, Nodos y Conexiones. También incluye un endpoint para
calcular la ruta más corta entre dos nodos usando el algoritmo de Dijkstra.
"""
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
    """
    ViewSet para el modelo Zona.

    Expone los endpoints estándar CRUD (list, create, retrieve, update, partial_update, destroy).
    Permisos: Por defecto, las proporcionadas por la configuración global de DRF (generalmente IsAuthenticated).
    Filtros:
      - ?idalmacen=<uuid>: Filtra las zonas que pertenecen a un almacén específico.
    Acciones personalizadas:
      - PATCH /{pk}/estado/: Cambia el estado (activo/inactivo) de la zona.
      - GET /{pk}/pasillos/: Lista los pasillos de la zona.
      - POST /{pk}/pasillos/: Crea un nuevo pasillo dentro de la zona.
    """
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
        """
        Cambia el campo 'estado' (booleano) de la zona.
        Si no se envía 'estado' en el body, alterna el valor actual.
        """
        obj = self.get_object()
        obj.estado = request.data.get('estado', not obj.estado)
        obj.save(update_fields=['estado'])
        return Response({'estado': obj.estado})

    @action(detail=True, methods=['get'], url_path='pasillos')
    def pasillos(self, request, pk=None):
        """Retorna todos los pasillos que pertenecen a esta zona."""
        pasillos = Pasillo.objects.filter(idzona_id=pk)
        return Response(PasilloListSerializer(pasillos, many=True).data)

    @action(detail=True, methods=['post'], url_path='pasillos')
    def create_pasillo(self, request, pk=None):
        """
        Crea un nuevo pasillo asignándolo automáticamente a la zona
        especificada en la URL.
        """
        data = request.data.copy()
        data['idzona'] = pk
        serializer = PasilloSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class PasilloViewSet(viewsets.ModelViewSet):
    """
    ViewSet para el modelo Pasillo.

    Expone CRUD completo para pasillos.
    Filtros:
      - ?idzona=<uuid>: Filtra los pasillos de una zona específica.
    Acciones personalizadas:
      - PATCH /{pk}/estado/: Cambia el estado del pasillo.
      - GET /{pk}/estantes/: Lista los estantes del pasillo.
      - POST /{pk}/estantes/: Crea un nuevo estante dentro del pasillo.
    """
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
        """
        Cambia el campo 'estado' (booleano) del pasillo.
        Si no se envía 'estado' en el body, alterna el valor actual.
        """
        obj = self.get_object()
        obj.estado = request.data.get('estado', not obj.estado)
        obj.save(update_fields=['estado'])
        return Response({'estado': obj.estado})

    @action(detail=True, methods=['get'], url_path='estantes')
    def estantes(self, request, pk=None):
        """Retorna todos los estantes que pertenecen a este pasillo."""
        estantes = Estante.objects.filter(idpasillo_id=pk)
        return Response(EstanteListSerializer(estantes, many=True).data)

    @action(detail=True, methods=['post'], url_path='estantes')
    def create_estante(self, request, pk=None):
        """
        Crea un nuevo estante asignándolo automáticamente al pasillo
        especificado en la URL.
        """
        data = request.data.copy()
        data['idpasillo'] = pk
        serializer = EstanteSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class EstanteViewSet(viewsets.ModelViewSet):
    """
    ViewSet para el modelo Estante.

    Expone CRUD completo para estantes.
    Filtros:
      - ?idpasillo=<uuid>: Filtra los estantes de un pasillo específico.
    Acciones personalizadas:
      - PATCH /{pk}/estado/: Cambia el estado del estante.
      - GET /{pk}/niveles/: Lista los niveles del estante.
      - POST /{pk}/niveles/: Crea un nuevo nivel dentro del estante.
    """
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
        """
        Cambia el campo 'estado' (booleano) del estante.
        Si no se envía 'estado' en el body, alterna el valor actual.
        """
        obj = self.get_object()
        obj.estado = request.data.get('estado', not obj.estado)
        obj.save(update_fields=['estado'])
        return Response({'estado': obj.estado})

    @action(detail=True, methods=['get'], url_path='niveles')
    def niveles(self, request, pk=None):
        """Retorna todos los niveles que pertenecen a este estante."""
        niveles = Nivel.objects.filter(idestante_id=pk)
        return Response(NivelSerializer(niveles, many=True).data)

    @action(detail=True, methods=['post'], url_path='niveles')
    def create_nivel(self, request, pk=None):
        """
        Crea un nuevo nivel asignándolo automáticamente al estante
        especificado en la URL.
        """
        data = request.data.copy()
        data['idestante'] = pk
        serializer = NivelSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class NivelViewSet(viewsets.ModelViewSet):
    """
    ViewSet para el modelo Nivel.

    Expone CRUD completo para niveles.
    Filtros:
      - ?idestante=<uuid>: Filtra los niveles de un estante específico.
    Acciones personalizadas:
      - PATCH /{pk}/estado/: Cambia el estado del nivel.
      - GET /{pk}/ubicaciones/: Lista las ubicaciones del nivel.
      - POST /{pk}/ubicaciones/: Crea una nueva ubicación dentro del nivel.
    """
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
        """
        Cambia el campo 'estado' (booleano) del nivel.
        Si no se envía 'estado' en el body, alterna el valor actual.
        """
        obj = self.get_object()
        obj.estado = request.data.get('estado', not obj.estado)
        obj.save(update_fields=['estado'])
        return Response({'estado': obj.estado})

    @action(detail=True, methods=['get'], url_path='ubicaciones')
    def ubicaciones(self, request, pk=None):
        """Retorna todas las ubicaciones que pertenecen a este nivel."""
        ubicaciones = Ubicacion.objects.filter(idnivel_id=pk)
        return Response(UbicacionSerializer(ubicaciones, many=True).data)

    @action(detail=True, methods=['post'], url_path='ubicaciones')
    def create_ubicacion(self, request, pk=None):
        """
        Crea una nueva ubicación asignándola automáticamente al nivel
        especificado en la URL.
        """
        data = request.data.copy()
        data['idnivel'] = pk
        serializer = UbicacionSerializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class UbicacionViewSet(viewsets.ModelViewSet):
    """
    ViewSet para el modelo Ubicacion.

    Expone CRUD completo para ubicaciones.
    Filtros:
      - ?idnivel=<uuid>: Filtra las ubicaciones de un nivel específico.
    Acciones personalizadas:
      - PATCH /{pk}/estado/: Cambia el estado (booleano) de la ubicación.
      - PATCH /{pk}/estado-ubicacion/: Cambia el estado_ubicacion (con opciones
        predefinidas como 'disponible', 'ocupado', 'reservado') de la ubicación.
    """
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
        """
        Cambia el campo 'estado' (booleano) de la ubicación.
        Si no se envía 'estado' en el body, alterna el valor actual.
        """
        obj = self.get_object()
        obj.estado = request.data.get('estado', not obj.estado)
        obj.save(update_fields=['estado'])
        return Response({'estado': obj.estado})

    @action(detail=True, methods=['patch'], url_path='estado-ubicacion')
    def cambiar_estado_ubicacion(self, request, pk=None):
        """
        Cambia el campo 'estado_ubicacion' (ej. 'disponible', 'ocupado', 'reservado').
        Valida que el valor enviado sea una de las opciones definidas en el modelo.
        """
        obj = self.get_object()
        nuevo_estado = request.data.get('estado_ubicacion')
        if nuevo_estado not in dict(Ubicacion._meta.get_field('estado_ubicacion').choices):
            return Response({'error': 'Estado inválido'}, status=status.HTTP_400_BAD_REQUEST)
        obj.estado_ubicacion = nuevo_estado
        obj.save(update_fields=['estado_ubicacion'])
        return Response({'estado_ubicacion': obj.estado_ubicacion})


class NodoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para el modelo Nodo (nodos del grafo del almacén).

    Expone CRUD completo para nodos del grafo de rutas.
    Filtros:
      - ?idalmacen=<uuid>: Filtra los nodos de un almacén específico.
    Acciones personalizadas:
      - PATCH /{pk}/estado/: Cambia el estado del nodo.
      - GET /{pk}/conexiones/: Retorna las conexiones de entrada y salida del nodo.
    """
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
        """
        Cambia el campo 'estado' (booleano) del nodo.
        Si no se envía 'estado' en el body, alterna el valor actual.
        """
        obj = self.get_object()
        obj.estado = request.data.get('estado', not obj.estado)
        obj.save(update_fields=['estado'])
        return Response({'estado': obj.estado})

    @action(detail=True, methods=['get'], url_path='conexiones')
    def conexiones(self, request, pk=None):
        """
        Retorna las conexiones del nodo agrupadas en:
          - 'salida': conexiones donde el nodo es el origen.
          - 'entrada': conexiones donde el nodo es el destino.
        """
        salida = Conexion.objects.filter(idnodoorigen_id=pk)
        entrada = Conexion.objects.filter(idnododestino_id=pk)
        data = {
            'salida': ConexionSerializer(salida, many=True).data,
            'entrada': ConexionSerializer(entrada, many=True).data,
        }
        return Response(data)


class ConexionViewSet(viewsets.ModelViewSet):
    """
    ViewSet para el modelo Conexion (aristas del grafo del almacén).

    Expone CRUD completo para conexiones entre nodos.
    Acciones personalizadas:
      - PATCH /{pk}/estado/: Cambia el estado de la conexión.
    """
    queryset = Conexion.objects.all()
    serializer_class = ConexionSerializer

    @action(detail=True, methods=['patch'], url_path='estado')
    def toggle_estado(self, request, pk=None):
        """
        Cambia el campo 'estado' (booleano) de la conexión.
        Si no se envía 'estado' en el body, alterna el valor actual.
        """
        obj = self.get_object()
        obj.estado = request.data.get('estado', not obj.estado)
        obj.save(update_fields=['estado'])
        return Response({'estado': obj.estado})


class RutaViewSet(viewsets.ViewSet):
    """
    ViewSet para el cálculo de rutas (no vinculado a un modelo).

    No tiene un modelo asociado. Sirve únicamente para exponer el algoritmo
    de ruta más corta (Dijkstra) entre dos nodos del almacén.

    Acciones:
      - POST /: Calcula la ruta más corta enviando 'origen_id' y 'destino_id'
        en el body de la solicitud.
      - GET /: Calcula la ruta más corta recibiendo 'origen_id' y 'destino_id'
        como query params.
    """
    def create(self, request):
        """
        Calcula la ruta más corta entre 'origen_id' y 'destino_id' recibidos
        en el body de la solicitud POST.
        Retorna la lista de nodos ordenados o un error 404 si no existe ruta.
        """
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
        """
        Calcula la ruta más corta entre 'origen_id' y 'destino_id' recibidos
        como query params en la solicitud GET.
        Retorna la lista de nodos ordenados o un error 404 si no existe ruta.
        """
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
