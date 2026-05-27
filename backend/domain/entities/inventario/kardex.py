import uuid
from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class Kardex:
    idkardex: uuid.UUID = field(default_factory=uuid.uuid4)
    idproducto: uuid.UUID = field(default_factory=uuid.uuid4)
    idlote: uuid.UUID | None = None
    idubicacion: uuid.UUID | None = None
    tipo_movimiento: str = 'entrada'
    cantidad: float = 0
    saldo_anterior: float = 0
    saldo_nuevo: float = 0
    fecha_movimiento: datetime = field(default_factory=datetime.now)
    referencia: str | None = None
    idusuario: uuid.UUID | None = None
    estado: bool = True
