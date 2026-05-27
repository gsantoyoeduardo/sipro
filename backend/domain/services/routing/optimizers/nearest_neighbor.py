from domain.services.routing.interfaces.i_route_optimizer import IRouteOptimizer
from domain.services.routing.models import Parada, Ruta, Tramo


class NearestNeighborOptimizer(IRouteOptimizer):
    """Algoritmo del vecino más cercano (greedy).

    Desde la parada actual, siempre visita la siguiente parada no visitada
    más cercana. Rápido O(n²) pero no garantiza el óptimo global.

    Ideal para: <10 paradas
    Precisión: ~85% del óptimo
    """

    def optimize(self, paradas: list[Parada], matriz_distancias: list[list[float]]) -> Ruta:
        if not paradas:
            return Ruta(paradas=[])

        n = len(paradas)
        visitado = [False] * n
        orden = [0]
        visitado[0] = True

        for _ in range(n - 1):
            ultimo = orden[-1]
            menor_dist = float('inf')
            siguiente = -1
            for j in range(n):
                if not visitado[j] and matriz_distancias[ultimo][j] < menor_dist:
                    menor_dist = matriz_distancias[ultimo][j]
                    siguiente = j
            if siguiente >= 0:
                orden.append(siguiente)
                visitado[siguiente] = True

        paradas_ordenadas = [paradas[i] for i in orden]
        ruta = Ruta(paradas=paradas_ordenadas)

        for k in range(len(orden) - 1):
            i, j = orden[k], orden[k + 1]
            tramo = Tramo(
                origen=paradas[i].punto,
                destino=paradas[j].punto,
                distancia=matriz_distancias[i][j],
            )
            ruta.agregar_tramo(tramo)

        return ruta
