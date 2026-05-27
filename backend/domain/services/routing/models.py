from dataclasses import dataclass, field


@dataclass
class Punto:
    id: str
    nombre: str
    tipo: str
    x: float = 0
    y: float = 0


@dataclass
class Parada:
    """Una ubicación a visitar durante el picking."""
    punto: Punto
    prioridad: int = 0


@dataclass
class Tramo:
    """Segmento entre dos paradas consecutivas."""
    origen: Punto
    destino: Punto
    distancia: float
    ruta_detalle: list[dict] = field(default_factory=list)


@dataclass
class Ruta:
    """Ruta completa optimizada para una orden de picking."""
    paradas: list[Parada]
    tramos: list[Tramo] = field(default_factory=list)
    distancia_total: float = 0
    tiempo_estimado: float = 0
    eficiencia: float = 0

    def agregar_tramo(self, tramo: Tramo) -> None:
        self.tramos.append(tramo)
        self.distancia_total += tramo.distancia

    @property
    def orden_visita(self) -> list[str]:
        return [p.punto.nombre for p in self.paradas]
