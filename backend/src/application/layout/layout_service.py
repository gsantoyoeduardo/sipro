"""Servicios de la capa de aplicación para la gestión del layout del almacén.

Proporciona la lógica de negocio para organizar el almacén en una jerarquía
de **Zonas → Pasillos → Estantes → Niveles → Ubicaciones**, así como la
definición de **Nodos** y **Conexiones** para el grafo de navegación interna
y el cálculo de rutas óptimas (algoritmo Dijkstra).
"""

import uuid
from collections import defaultdict
import heapq
from src.infrastructure.repositories.layout_repo import (
    ZonaRepository, PasilloRepository, EstanteRepository,
    NivelRepository, UbicacionRepository, NodoRepository, ConexionRepository,
)
from src.infrastructure.models.layout_model import Nodo, Conexion

zona_repo = ZonaRepository()
pasillo_repo = PasilloRepository()
estante_repo = EstanteRepository()
nivel_repo = NivelRepository()
ubicacion_repo = UbicacionRepository()
nodo_repo = NodoRepository()
conexion_repo = ConexionRepository()


class ZonaService:
    """Servicio CRUD para la entidad Zona del layout."""

    @staticmethod
    def listar(idalmacen: uuid.UUID | None = None):
        """Lista todas las zonas, opcionalmente filtradas por almacén."""
        return zona_repo.get_all(idalmacen)

    @staticmethod
    def obtener(idzona: uuid.UUID):
        """Obtiene una zona por su ID."""
        return zona_repo.get_by_id(idzona)

    @staticmethod
    def crear(data: dict):
        """Crea una nueva zona con los datos proporcionados."""
        return zona_repo.create(data)

    @staticmethod
    def actualizar(idzona: uuid.UUID, data: dict):
        """Actualiza los campos de una zona existente."""
        return zona_repo.update(idzona, data)

    @staticmethod
    def eliminar(idzona: uuid.UUID):
        """Elimina (borrado físico) una zona."""
        return zona_repo.delete(idzona)

    @staticmethod
    def toggle_estado(idzona: uuid.UUID):
        """Alterna el estado activo/inactivo de la zona."""
        return zona_repo.toggle_estado(idzona)

    @staticmethod
    def listar_pasillos(idzona: uuid.UUID):
        """Lista los pasillos que pertenecen a una zona."""
        return zona_repo.get_pasillos(idzona)

    @staticmethod
    def crear_pasillo(idzona: uuid.UUID, data: dict):
        """Crea un nuevo pasillo dentro de una zona específica."""
        data['idzona'] = idzona
        return pasillo_repo.create(data)


class PasilloService:
    """Servicio CRUD para la entidad Pasillo del layout."""

    @staticmethod
    def listar(idzona: uuid.UUID | None = None):
        """Lista todos los pasillos, opcionalmente filtrados por zona."""
        return pasillo_repo.get_all(idzona)

    @staticmethod
    def obtener(idpasillo: uuid.UUID):
        """Obtiene un pasillo por su ID."""
        return pasillo_repo.get_by_id(idpasillo)

    @staticmethod
    def crear(data: dict):
        """Crea un nuevo pasillo."""
        return pasillo_repo.create(data)

    @staticmethod
    def actualizar(idpasillo: uuid.UUID, data: dict):
        """Actualiza los campos de un pasillo existente."""
        return pasillo_repo.update(idpasillo, data)

    @staticmethod
    def eliminar(idpasillo: uuid.UUID):
        """Elimina un pasillo."""
        return pasillo_repo.delete(idpasillo)

    @staticmethod
    def toggle_estado(idpasillo: uuid.UUID):
        """Alterna el estado activo/inactivo del pasillo."""
        return pasillo_repo.toggle_estado(idpasillo)

    @staticmethod
    def listar_estantes(idpasillo: uuid.UUID):
        """Lista los estantes que pertenecen a un pasillo."""
        return pasillo_repo.get_estantes(idpasillo)

    @staticmethod
    def crear_estante(idpasillo: uuid.UUID, data: dict):
        """Crea un nuevo estante dentro de un pasillo específico."""
        data['idpasillo'] = idpasillo
        return estante_repo.create(data)


class EstanteService:
    """Servicio CRUD para la entidad Estante del layout."""

    @staticmethod
    def listar(idpasillo: uuid.UUID | None = None):
        """Lista todos los estantes, opcionalmente filtrados por pasillo."""
        return estante_repo.get_all(idpasillo)

    @staticmethod
    def obtener(idestante: uuid.UUID):
        """Obtiene un estante por su ID."""
        return estante_repo.get_by_id(idestante)

    @staticmethod
    def crear(data: dict):
        """Crea un nuevo estante."""
        return estante_repo.create(data)

    @staticmethod
    def actualizar(idestante: uuid.UUID, data: dict):
        """Actualiza los campos de un estante existente."""
        return estante_repo.update(idestante, data)

    @staticmethod
    def eliminar(idestante: uuid.UUID):
        """Elimina un estante."""
        return estante_repo.delete(idestante)

    @staticmethod
    def toggle_estado(idestante: uuid.UUID):
        """Alterna el estado activo/inactivo del estante."""
        return estante_repo.toggle_estado(idestante)

    @staticmethod
    def listar_niveles(idestante: uuid.UUID):
        """Lista los niveles que pertenecen a un estante."""
        return estante_repo.get_niveles(idestante)

    @staticmethod
    def crear_nivel(idestante: uuid.UUID, data: dict):
        """Crea un nuevo nivel dentro de un estante específico."""
        data['idestante'] = idestante
        return nivel_repo.create(data)


class NivelService:
    """Servicio CRUD para la entidad Nivel del layout."""

    @staticmethod
    def listar(idestante: uuid.UUID | None = None):
        """Lista todos los niveles, opcionalmente filtrados por estante."""
        return nivel_repo.get_all(idestante)

    @staticmethod
    def obtener(idnivel: uuid.UUID):
        """Obtiene un nivel por su ID."""
        return nivel_repo.get_by_id(idnivel)

    @staticmethod
    def crear(data: dict):
        """Crea un nuevo nivel."""
        return nivel_repo.create(data)

    @staticmethod
    def actualizar(idnivel: uuid.UUID, data: dict):
        """Actualiza los campos de un nivel existente."""
        return nivel_repo.update(idnivel, data)

    @staticmethod
    def eliminar(idnivel: uuid.UUID):
        """Elimina un nivel."""
        return nivel_repo.delete(idnivel)

    @staticmethod
    def toggle_estado(idnivel: uuid.UUID):
        """Alterna el estado activo/inactivo del nivel."""
        return nivel_repo.toggle_estado(idnivel)

    @staticmethod
    def listar_ubicaciones(idnivel: uuid.UUID):
        """Lista las ubicaciones que pertenecen a un nivel."""
        return nivel_repo.get_ubicaciones(idnivel)

    @staticmethod
    def crear_ubicacion(idnivel: uuid.UUID, data: dict):
        """Crea una nueva ubicación dentro de un nivel específico."""
        data['idnivel'] = idnivel
        return ubicacion_repo.create(data)


class UbicacionService:
    """Servicio CRUD para la entidad Ubicación (posición física final)."""

    @staticmethod
    def listar(idnivel: uuid.UUID | None = None):
        """Lista todas las ubicaciones, opcionalmente filtradas por nivel."""
        return ubicacion_repo.get_all(idnivel)

    @staticmethod
    def obtener(idubicacion: uuid.UUID):
        """Obtiene una ubicación por su ID."""
        return ubicacion_repo.get_by_id(idubicacion)

    @staticmethod
    def crear(data: dict):
        """Crea una nueva ubicación."""
        return ubicacion_repo.create(data)

    @staticmethod
    def actualizar(idubicacion: uuid.UUID, data: dict):
        """Actualiza los campos de una ubicación existente."""
        return ubicacion_repo.update(idubicacion, data)

    @staticmethod
    def eliminar(idubicacion: uuid.UUID):
        """Elimina una ubicación."""
        return ubicacion_repo.delete(idubicacion)

    @staticmethod
    def toggle_estado(idubicacion: uuid.UUID):
        """Alterna el estado activo/inactivo de la ubicación."""
        return ubicacion_repo.toggle_estado(idubicacion)

    @staticmethod
    def cambiar_estado_ubicacion(idubicacion: uuid.UUID, estado_ubicacion: str):
        """Cambia el estado operativo de una ubicación (ej: libre, ocupada, bloqueada)."""
        return ubicacion_repo.cambiar_estado_ubicacion(idubicacion, estado_ubicacion)


class NodoService:
    """Servicio CRUD para los nodos del grafo de navegación del almacén."""

    @staticmethod
    def listar(idalmacen: uuid.UUID | None = None):
        """Lista todos los nodos, opcionalmente filtrados por almacén."""
        return nodo_repo.get_all(idalmacen)

    @staticmethod
    def obtener(idnodo: uuid.UUID):
        """Obtiene un nodo por su ID."""
        return nodo_repo.get_by_id(idnodo)

    @staticmethod
    def crear(data: dict):
        """Crea un nuevo nodo."""
        return nodo_repo.create(data)

    @staticmethod
    def actualizar(idnodo: uuid.UUID, data: dict):
        """Actualiza los campos de un nodo existente."""
        return nodo_repo.update(idnodo, data)

    @staticmethod
    def eliminar(idnodo: uuid.UUID):
        """Elimina un nodo."""
        return nodo_repo.delete(idnodo)

    @staticmethod
    def toggle_estado(idnodo: uuid.UUID):
        """Alterna el estado activo/inactivo del nodo."""
        return nodo_repo.toggle_estado(idnodo)

    @staticmethod
    def get_conexiones(idnodo: uuid.UUID):
        """Retorna las conexiones de entrada y salida de un nodo."""
        salida = nodo_repo.get_conexiones_salida(idnodo)
        entrada = nodo_repo.get_conexiones_entrada(idnodo)
        return {'salida': salida, 'entrada': entrada}


class ConexionService:
    """Servicio CRUD para las conexiones (aristas) del grafo de navegación."""

    @staticmethod
    def listar():
        """Lista todas las conexiones."""
        return conexion_repo.get_all()

    @staticmethod
    def obtener(idconexion: uuid.UUID):
        """Obtiene una conexión por su ID."""
        return conexion_repo.get_by_id(idconexion)

    @staticmethod
    def crear(data: dict):
        """Crea una nueva conexión entre dos nodos."""
        return conexion_repo.create(data)

    @staticmethod
    def actualizar(idconexion: uuid.UUID, data: dict):
        """Actualiza los campos de una conexión existente."""
        return conexion_repo.update(idconexion, data)

    @staticmethod
    def eliminar(idconexion: uuid.UUID):
        """Elimina una conexión."""
        return conexion_repo.delete(idconexion)

    @staticmethod
    def toggle_estado(idconexion: uuid.UUID):
        """Alterna el estado activo/inactivo de la conexión."""
        return conexion_repo.toggle_estado(idconexion)


class RutaService:
    """Servicio de cálculo de rutas óptimas dentro del almacén.

    Utiliza el algoritmo de **Dijkstra** sobre el grafo de nodos y conexiones
    para encontrar la ruta más corta entre dos puntos del almacén.
    """

    @staticmethod
    def calcular(origen_id: uuid.UUID, destino_id: uuid.UUID):
        """Calcula la ruta más corta entre dos nodos del almacén.

        Pasos:
        1. Valida que ambos nodos existan en la base de datos.
        2. Construye un grafo dirigido (o no dirigido si la conexión es
           bidireccional) a partir de las conexiones activas.
        3. Ejecuta Dijkstra para hallar el camino mínimo.
        4. Retorna la secuencia de nodos con distancia acumulada.

        Args:
            origen_id: UUID del nodo de origen.
            destino_id: UUID del nodo de destino.

        Returns:
            dict: Diccionario con ``ruta`` (lista de nodos), ``distancia_total``
                  y ``nodos_visitados``, o un ``error`` si no es posible.
        """
        try:
            origen = Nodo.objects.get(idnodo=origen_id)
            destino = Nodo.objects.get(idnodo=destino_id)
        except Nodo.DoesNotExist:
            return {'error': 'Nodo de origen o destino no encontrado'}

        # Construye el grafo: nodo → [(vecino, distancia), ...]
        graph = defaultdict(list)
        conexiones = Conexion.objects.filter(estado=True)

        for c in conexiones:
            graph[str(c.idnodoorigen_id)].append((str(c.idnododestino_id), float(c.distancia)))
            if c.bidireccional:
                graph[str(c.idnododestino_id)].append((str(c.idnodoorigen_id), float(c.distancia)))

        if not graph:
            return {'error': 'No hay conexiones definidas en el sistema'}

        result = RutaService._dijkstra(graph, str(origen_id), str(destino_id))
        if result is None:
            return {
                'error': f'No se encontró ruta entre {origen.nombre} y {destino.nombre}',
                'detalle': 'Los nodos no están conectados',
            }

        return result

    @staticmethod
    def _dijkstra(graph, start_id, end_id):
        """Implementación del algoritmo de Dijkstra para camino más corto.

        Args:
            graph: Diccionario con la estructura de adyacencia.
            start_id: ID del nodo de inicio.
            end_id: ID del nodo de destino.

        Returns:
            dict | None: Diccionario con la ruta y distancias, o None si no
            hay camino.
        """
        # Inicializa distancias infinitas y cola de prioridad
        distances = {}
        previous = {}
        pq = []
        distances[start_id] = 0
        heapq.heappush(pq, (0, start_id))

        # Explora nodos en orden de menor distancia acumulada
        while pq:
            current_dist, current_node = heapq.heappop(pq)
            if current_node == end_id:
                break
            if current_dist > distances.get(current_node, float('inf')):
                continue
            for neighbor, weight in graph.get(current_node, []):
                distance = current_dist + weight
                if distance < distances.get(neighbor, float('inf')):
                    distances[neighbor] = distance
                    previous[neighbor] = current_node
                    heapq.heappush(pq, (distance, neighbor))

        # Si no se llegó al destino, no hay ruta
        if end_id not in previous:
            return None

        # Reconstruye el camino desde el destino hacia atrás
        path = []
        current = end_id
        while current in previous:
            path.append(current)
            current = previous[current]
        path.append(start_id)
        path.reverse()

        # Enriquece la ruta con datos de los nodos (nombre, coordenadas)
        nodos = Nodo.objects.filter(idnodo__in=path).in_bulk()
        path_data = []
        for nid in path:
            nodo = nodos.get(nid)
            if nodo:
                path_data.append({
                    'idnodo': str(nodo.idnodo),
                    'nombre': nodo.nombre,
                    'tipo': nodo.tipo,
                    'coordenada_x': nodo.coordenada_x,
                    'coordenada_y': nodo.coordenada_y,
                    'distancia_acumulada': round(distances.get(nid, 0), 2),
                })

        return {
            'ruta': path_data,
            'distancia_total': round(distances.get(end_id, 0), 2),
            'nodos_visitados': len(path),
        }
