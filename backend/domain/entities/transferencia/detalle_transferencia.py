import uuid
from dataclasses import dataclass, field

@dataclass
class DetalleTransferencia:
    iddetalletransferencia: uuid.UUID = field(default_factory=uuid.uuid4)
    idtransferencia: uuid.UUID = field(default_factory=uuid.uuid4)
    idproducto: uuid.UUID = field(default_factory=uuid.uuid4)
    idlote: uuid.UUID | None = None
    cantidad: float = 0
    estado: bool = True
