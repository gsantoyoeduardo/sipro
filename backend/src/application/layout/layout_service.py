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
    @staticmethod
    def listar(idalmacen: uuid.UUID | None = None):
        return zona_repo.get_all(idalmacen)

    @staticmethod
    def obtener(idzona: uuid.UUID):
        return zona_repo.get_by_id(idzona)

    @staticmethod
    def crear(data: dict):
        return zona_repo.create(data)

    @staticmethod
    def actualizar(idzona: uuid.UUID, data: dict):
        return zona_repo.update(idzona, data)

    @staticmethod
    def eliminar(idzona: uuid.UUID):
        return zona_repo.delete(idzona)

    @staticmethod
    def toggle_estado(idzona: uuid.UUID):
        return zona_repo.toggle_estado(idzona)

    @staticmethod
    def listar_pasillos(idzona: uuid.UUID):
        return zona_repo.get_pasillos(idzona)

    @staticmethod
    def crear_pasillo(idzona: uuid.UUID, data: dict):
        data['idzona'] = idzona
        return pasillo_repo.create(data)


class PasilloService:
    @staticmethod
    def listar(idzona: uuid.UUID | None = None):
        return pasillo_repo.get_all(idzona)

    @staticmethod
    def obtener(idpasillo: uuid.UUID):
        return pasillo_repo.get_by_id(idpasillo)

    @staticmethod
    def crear(data: dict):
        return pasillo_repo.create(data)

    @staticmethod
    def actualizar(idpasillo: uuid.UUID, data: dict):
        return pasillo_repo.update(idpasillo, data)

    @staticmethod
    def eliminar(idpasillo: uuid.UUID):
        return pasillo_repo.delete(idpasillo)

    @staticmethod
    def toggle_estado(idpasillo: uuid.UUID):
        return pasillo_repo.toggle_estado(idpasillo)

    @staticmethod
    def listar_estantes(idpasillo: uuid.UUID):
        return pasillo_repo.get_estantes(idpasillo)

    @staticmethod
    def crear_estante(idpasillo: uuid.UUID, data: dict):
        data['idpasillo'] = idpasillo
        return estante_repo.create(data)


class EstanteService:
    @staticmethod
    def listar(idpasillo: uuid.UUID | None = None):
        return estante_repo.get_all(idpasillo)

    @staticmethod
    def obtener(idestante: uuid.UUID):
        return estante_repo.get_by_id(idestante)

    @staticmethod
    def crear(data: dict):
        return estante_repo.create(data)

    @staticmethod
    def actualizar(idestante: uuid.UUID, data: dict):
        return estante_repo.update(idestante, data)

    @staticmethod
    def eliminar(idestante: uuid.UUID):
        return estante_repo.delete(idestante)

    @staticmethod
    def toggle_estado(idestante: uuid.UUID):
        return estante_repo.toggle_estado(idestante)

    @staticmethod
    def listar_niveles(idestante: uuid.UUID):
        return estante_repo.get_niveles(idestante)

    @staticmethod
    def crear_nivel(idestante: uuid.UUID, data: dict):
        data['idestante'] = idestante
        return nivel_repo.create(data)


class NivelService:
    @staticmethod
    def listar(idestante: uuid.UUID | None = None):
        return nivel_repo.get_all(idestante)

    @staticmethod
    def obtener(idnivel: uuid.UUID):
        return nivel_repo.get_by_id(idnivel)

    @staticmethod
    def crear(data: dict):
        return nivel_repo.create(data)

    @staticmethod
    def actualizar(idnivel: uuid.UUID, data: dict):
        return nivel_repo.update(idnivel, data)

    @staticmethod
    def eliminar(idnivel: uuid.UUID):
        return nivel_repo.delete(idnivel)

    @staticmethod
    def toggle_estado(idnivel: uuid.UUID):
        return nivel_repo.toggle_estado(idnivel)

    @staticmethod
    def listar_ubicaciones(idnivel: uuid.UUID):
        return nivel_repo.get_ubicaciones(idnivel)

    @staticmethod
    def crear_ubicacion(idnivel: uuid.UUID, data: dict):
        data['idnivel'] = idnivel
        return ubicacion_repo.create(data)


class UbicacionService:
    @staticmethod
    def listar(idnivel: uuid.UUID | None = None):
        return ubicacion_repo.get_all(idnivel)

    @staticmethod
    def obtener(idubicacion: uuid.UUID):
        return ubicacion_repo.get_by_id(idubicacion)

    @staticmethod
    def crear(data: dict):
        return ubicacion_repo.create(data)

    @staticmethod
    def actualizar(idubicacion: uuid.UUID, data: dict):
        return ubicacion_repo.update(idubicacion, data)

    @staticmethod
    def eliminar(idubicacion: uuid.UUID):
        return ubicacion_repo.delete(idubicacion)

    @staticmethod
    def toggle_estado(idubicacion: uuid.UUID):
        return ubicacion_repo.toggle_estado(idubicacion)

    @staticmethod
    def cambiar_estado_ubicacion(idubicacion: uuid.UUID, estado_ubicacion: str):
        return ubicacion_repo.cambiar_estado_ubicacion(idubicacion, estado_ubicacion)


class NodoService:
    @staticmethod
    def listar(idalmacen: uuid.UUID | None = None):
        return nodo_repo.get_all(idalmacen)

    @staticmethod
    def obtener(idnodo: uuid.UUID):
        return nodo_repo.get_by_id(idnodo)

    @staticmethod
    def crear(data: dict):
        return nodo_repo.create(data)

    @staticmethod
    def actualizar(idnodo: uuid.UUID, data: dict):
        return nodo_repo.update(idnodo, data)

    @staticmethod
    def eliminar(idnodo: uuid.UUID):
        return nodo_repo.delete(idnodo)

    @staticmethod
    def toggle_estado(idnodo: uuid.UUID):
        return nodo_repo.toggle_estado(idnodo)

    @staticmethod
    def get_conexiones(idnodo: uuid.UUID):
        salida = nodo_repo.get_conexiones_salida(idnodo)
        entrada = nodo_repo.get_conexiones_entrada(idnodo)
        return {'salida': salida, 'entrada': entrada}


class ConexionService:
    @staticmethod
    def listar():
        return conexion_repo.get_all()

    @staticmethod
    def obtener(idconexion: uuid.UUID):
        return conexion_repo.get_by_id(idconexion)

    @staticmethod
    def crear(data: dict):
        return conexion_repo.create(data)

    @staticmethod
    def actualizar(idconexion: uuid.UUID, data: dict):
        return conexion_repo.update(idconexion, data)

    @staticmethod
    def eliminar(idconexion: uuid.UUID):
        return conexion_repo.delete(idconexion)

    @staticmethod
    def toggle_estado(idconexion: uuid.UUID):
        return conexion_repo.toggle_estado(idconexion)


class RutaService:
    @staticmethod
    def calcular(origen_id: uuid.UUID, destino_id: uuid.UUID):
        try:
            origen = Nodo.objects.get(idnodo=origen_id)
            destino = Nodo.objects.get(idnodo=destino_id)
        except Nodo.DoesNotExist:
            return {'error': 'Nodo de origen o destino no encontrado'}

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
        distances = {}
        previous = {}
        pq = []
        distances[start_id] = 0
        heapq.heappush(pq, (0, start_id))

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

        if end_id not in previous:
            return None

        path = []
        current = end_id
        while current in previous:
            path.append(current)
            current = previous[current]
        path.append(start_id)
        path.reverse()

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
