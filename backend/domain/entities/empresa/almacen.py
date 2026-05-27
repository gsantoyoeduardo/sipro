import uuid
from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class Almacen:
    idalmacen: uuid.UUID = field(default_factory=uuid.uuid4)
    idsucursal: uuid.UUID = field(default_factory=uuid.uuid4)
    nombre: str = ''
    codigo: str = ''
    descripcion: str | None = None
    ancho: float | None = None
    alto: float | None = None
    capacidadmaxima: float | None = None
    estado: bool = True
    fechacreacion: datetime = field(default_factory=datetime.now)
