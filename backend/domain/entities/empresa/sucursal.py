import uuid
from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class Sucursal:
    idsucursal: uuid.UUID = field(default_factory=uuid.uuid4)
    idempresa: uuid.UUID = field(default_factory=uuid.uuid4)
    nombre: str = ''
    codigo: str = ''
    direccion: str | None = None
    telefono: str | None = None
    ancho_plano: float = 2500
    alto_plano: float = 1800
    estado: bool = True
    fechacreacion: datetime = field(default_factory=datetime.now)
