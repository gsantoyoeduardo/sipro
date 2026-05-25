import uuid
from dataclasses import dataclass, field

@dataclass
class DetallePicking:
    iddetallepicking: uuid.UUID = field(default_factory=uuid.uuid4)
    idorden: uuid.UUID = field(default_factory=uuid.uuid4)
    idproducto: uuid.UUID = field(default_factory=uuid.uuid4)
    idubicacion: uuid.UUID = field(default_factory=uuid.uuid4)
    idlote: uuid.UUID | None = None
    cantidad_solicitada: float = 0
    cantidad_pickeada: float = 0
    estado_detalle: str = 'pendiente'
