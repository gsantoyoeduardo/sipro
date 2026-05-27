import heapq
import uuid
from collections import defaultdict

from domain.services.routing.factory import RouteOptimizerFactory
from domain.services.routing.metrics import calcular_tiempo_estimado
from domain.services.routing.models import Parada, Punto
from infrastructure.models.inventario_model import Producto
from infrastructure.models.layout_model import Conexion, Nodo
from infrastructure.repositories.inventario_repo import InventarioRepository

inventario_repo = InventarioRepository()


class PickingService:
    @staticmethod
    def calcular(producto_id: uuid.UUID, cantidad_requerida: float, estrategia: str = 'fefo', optimizar_ruta: bool = False):
        try:
            producto = Producto.objects.get(idproducto=producto_id)
        except Producto.DoesNotExist:
            return {'error': 'Producto no encontrado'}

        inventario_qs = inventario_repo.get_disponible_para_picking(producto_id, estrategia)

        picking = []
        acumulado = 0.0

        for inv in inventario_qs:
            if acumulado >= cantidad_requerida:
                break
            disponible = float(inv.cantidad)
            tomar = min(disponible, cantidad_requerida - acumulado)
            picking.append({
                'lote': str(inv.idlote.idlote) if inv.idlote else None,
                'lote_numero': inv.idlote.numero_lote if inv.idlote else None,
                'vencimiento': str(inv.idlote.fecha_vencimiento) if (inv.idlote and inv.idlote.fecha_vencimiento) else None,
                'ubicacion': str(inv.idubicacion.idubicacion),
                'ubicacion_codigo': inv.idubicacion.codigo,
                'cantidad_pickear': round(tomar, 2),
            })
            acumulado += tomar

        faltante = max(0.0, cantidad_requerida - acumulado)

        resultado = {
            'producto': {
                'idproducto': str(producto.idproducto),
                'codigo': producto.codigo,
                'nombre': producto.nombre,
                'unidad_medida': producto.unidad_medida,
                'maneja_lotes': producto.maneja_lotes,
            },
            'estrategia': 'FEFO' if (estrategia == 'fefo' and producto.maneja_lotes) else 'FIFO',
            'cantidad_requerida': cantidad_requerida,
            'picking': picking,
            'total_pickeable': round(acumulado, 2),
            'faltante': round(faltante, 2),
            'completo': faltante == 0,
        }

        if optimizar_ruta and len(picking) > 1:
            ruta = PickingService._optimizar_ruta_entre_ubicaciones(picking)
            resultado['ruta_optimizada'] = ruta

        return resultado

    @staticmethod
    def _optimizar_ruta_entre_ubicaciones(picking: list[dict]) -> dict:
        ubicaciones_ids = [p['ubicacion'] for p in picking]
        nodos = list(Nodo.objects.filter(idubicacion__in=ubicaciones_ids).select_related('idubicacion'))
        nodos_por_ubicacion = {str(n.idubicacion_id): n for n in nodos if n.idubicacion_id}

        grafo = defaultdict(list)
        for c in Conexion.objects.filter(estado=True):
            grafo[str(c.idnodoorigen_id)].append((str(c.idnododestino_id), float(c.distancia)))
            if c.bidireccional:
                grafo[str(c.idnododestino_id)].append((str(c.idnodoorigen_id), float(c.distancia)))

        paradas = []
        for p in picking:
            uid = p['ubicacion']
            nodo = nodos_por_ubicacion.get(uid)
            punto = Punto(
                id=uid,
                nombre=p.get('ubicacion_codigo', uid),
                tipo='picking',
                x=float(nodo.coordenada_x) if nodo else 0,
                y=float(nodo.coordenada_y) if nodo else 0,
            )
            paradas.append(Parada(punto=punto))

        if not paradas:
            return {}

        matriz = []
        for i in range(len(paradas)):
            fila = []
            for j in range(len(paradas)):
                if i == j:
                    fila.append(0.0)
                else:
                    ni = nodos_por_ubicacion.get(picking[i]['ubicacion'])
                    nj = nodos_por_ubicacion.get(picking[j]['ubicacion'])
                    if ni and nj:
                        dist = PickingService._dijkstra_distancia(grafo, str(ni.idnodo), str(nj.idnodo))
                        fila.append(dist if dist is not None else 999999.0)
                    else:
                        fila.append(999999.0)
            matriz.append(fila)

        optimizador = RouteOptimizerFactory.get_optimizer(paradas)
        ruta = optimizador.optimize(paradas, matriz)
        ruta.tiempo_estimado = calcular_tiempo_estimado(ruta)

        return {
            'orden_visita': ruta.orden_visita,
            'distancia_total': round(ruta.distancia_total, 2),
            'tiempo_estimado_seg': ruta.tiempo_estimado,
        }

    @staticmethod
    def _dijkstra_distancia(grafo: dict, origen: str, destino: str) -> float | None:
        if origen not in grafo or destino not in grafo:
            return None
        distancias = {origen: 0}
        pq = [(0, origen)]
        while pq:
            dist_actual, nodo_actual = heapq.heappop(pq)
            if nodo_actual == destino:
                return dist_actual
            if dist_actual > distancias.get(nodo_actual, float('inf')):
                continue
            for vecino, peso in grafo.get(nodo_actual, []):
                nueva_dist = dist_actual + peso
                if nueva_dist < distancias.get(vecino, float('inf')):
                    distancias[vecino] = nueva_dist
                    heapq.heappush(pq, (nueva_dist, vecino))
        return None
