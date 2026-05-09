import heapq
from collections import defaultdict
from .models import Nodo, Conexion


def dijkstra(graph, start_id, end_id):
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


def shortest_path(origen_id, destino_id):
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

    result = dijkstra(graph, str(origen_id), str(destino_id))
    if result is None:
        return {
            'error': f'No se encontró ruta entre {origen.nombre} y {destino.nombre}',
            'detalle': 'Los nodos no están conectados',
        }

    return result
