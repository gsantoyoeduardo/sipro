import uuid
from dataclasses import dataclass, field


@dataclass
class Nodo:
    idnodo: uuid.UUID = field(default_factory=uuid.uuid4)
    idsucursal: uuid.UUID | None = None
    idalmacen: uuid.UUID | None = None
    nombre: str = ''
    tipo: str = 'interseccion'
    coordenada_x: float = 0
    coordenada_y: float = 0
    coordenada_z: float = 0
    idubicacion: uuid.UUID | None = None
    estado: bool = True
