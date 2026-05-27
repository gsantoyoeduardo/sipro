from typing import Protocol

from domain.services.routing.models import Parada, Ruta


class IRouteOptimizer(Protocol):
    """Contrato para todos los optimizadores de rutas.

    Cualquier optimizador debe implementar optimize(paradas, matriz_distancias)
    y devolver una Ruta con el orden optimizado de visita.
    """

    def optimize(self, paradas: list[Parada], matriz_distancias: list[list[float]]) -> Ruta:
        ...
