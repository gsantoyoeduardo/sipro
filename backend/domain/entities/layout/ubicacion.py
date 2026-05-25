import uuid
from dataclasses import dataclass, field

@dataclass
class Ubicacion:
    idubicacion: uuid.UUID = field(default_factory=uuid.uuid4)
    idnivel: uuid.UUID = field(default_factory=uuid.uuid4)
    codigo: str = ''
    capacidadpeso: float | None = None
    capacidadvolumen: float | None = None
    estado_ubicacion: str = 'disponible'
    x: int = 0
    y: int = 0
    estado: bool = True
