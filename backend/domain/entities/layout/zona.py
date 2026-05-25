import uuid
from dataclasses import dataclass, field


@dataclass
class Zona:
    idzona: uuid.UUID = field(default_factory=uuid.uuid4)
    idsucursal: uuid.UUID | None = None
    idalmacen: uuid.UUID | None = None
    nombre: str = ''
    codigo: str = ''
    tipo: str = 'almacenamiento'
    x: float = 0
    y: float = 0
    poligono: dict | None = None
    z_base: float = 0
    z_techo: float | None = None
    color: str | None = None
    estado: bool = True
