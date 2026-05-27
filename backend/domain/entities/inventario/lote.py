import uuid
from dataclasses import dataclass, field
from datetime import date, datetime


@dataclass
class Lote:
    idlote: uuid.UUID = field(default_factory=uuid.uuid4)
    idproducto: uuid.UUID = field(default_factory=uuid.uuid4)
    numero_lote: str = ''
    fecha_produccion: date | None = None
    fecha_vencimiento: date | None = None
    fecha_recepcion: datetime = field(default_factory=datetime.now)
    cantidad_inicial: float = 0
    cantidad_actual: float = 0
    estado: bool = True
