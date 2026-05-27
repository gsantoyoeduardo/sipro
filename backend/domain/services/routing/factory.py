from domain.services.routing.interfaces.i_route_optimizer import IRouteOptimizer
from domain.services.routing.models import Parada
from domain.services.routing.optimizers import (
    ClusteredOptimizer,
    NearestNeighborOptimizer,
    TwoOptOptimizer,
)


class RouteOptimizerFactory:
    """Factory que selecciona el mejor optimizador según la cantidad de paradas.

    - <10 paradas → NearestNeighbor (rápido, suficiente para rutas pequeñas)
    - 10-100 paradas → TwoOpt (2-opt con restarts, alta precisión)
    - >100 paradas → ClusteredOptimizer (clustering + 2-opt por zona)
    """

    @staticmethod
    def get_optimizer(paradas: list[Parada]) -> IRouteOptimizer:
        n = len(paradas)
        if n == 0:
            raise ValueError("No hay paradas para optimizar")
        if n <= 1:
            return NearestNeighborOptimizer()
        if n <= 10:
            return NearestNeighborOptimizer()
        elif n <= 100:
            return TwoOptOptimizer()
        else:
            return ClusteredOptimizer()
