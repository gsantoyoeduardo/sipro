import uuid
from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class Transferencia:
    idtransferencia: uuid.UUID = field(default_factory=uuid.uuid4)
    idalmacen_origen: uuid.UUID = field(default_factory=uuid.uuid4)
    idalmacen_destino: uuid.UUID = field(default_factory=uuid.uuid4)
    idusuario: uuid.UUID | None = None
    numero_transferencia: str = ''
    estado_transferencia: str = 'pendiente'
    fecha_creacion: datetime = field(default_factory=datetime.now)
    fecha_envio: datetime | None = None
    fecha_recepcion: datetime | None = None
    notas: str | None = None
