from domain.services.routing.models import Ruta


def calcular_eficiencia(ruta: Ruta, distancia_lineal: float) -> float:
    """Eficiencia de la ruta comparada con la distancia lineal (0-100%)."""
    if distancia_lineal <= 0:
        return 0
    return round((distancia_lineal / ruta.distancia_total) * 100, 1)


def calcular_tiempo_estimado(ruta: Ruta, velocidad_m_s: float = 1.4) -> float:
    """Tiempo estimado en segundos para recorrer la ruta (velocidad en m/s)."""
    tiempo_base = ruta.distancia_total / velocidad_m_s
    tiempo_parada = len(ruta.paradas) * 5
    return round(tiempo_base + tiempo_parada, 1)
