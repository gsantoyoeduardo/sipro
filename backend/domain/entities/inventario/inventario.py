import uuid
from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class Inventario:
    idinventario: uuid.UUID = field(default_factory=uuid.uuid4)
    idproducto: uuid.UUID = field(default_factory=uuid.uuid4)
    idlote: uuid.UUID | None = None
    idubicacion: uuid.UUID = field(default_factory=uuid.uuid4)
    cantidad: float = 0
    estado: bool = True
    fecha_ultimo_conteo: datetime = field(default_factory=datetime.now)
