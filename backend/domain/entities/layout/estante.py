import uuid
from dataclasses import dataclass, field


@dataclass
class Estante:
    idestante: uuid.UUID = field(default_factory=uuid.uuid4)
    idzona: uuid.UUID = field(default_factory=uuid.uuid4)
    nombre: str = ''
    codigo: str = ''
    x: float = 0
    y: float = 0
    z_base: float = 0
    rotacion: float = 0
    ancho: int = 240
    alto: int = 120
    profundidad: int = 60
    cantidadniveles: int = 3
    estado: bool = True
