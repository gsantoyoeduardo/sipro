import uuid
from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class OrdenPicking:
    idordenpicking: uuid.UUID = field(default_factory=uuid.uuid4)
    idalmacen: uuid.UUID = field(default_factory=uuid.uuid4)
    idusuario: uuid.UUID | None = None
    numero_orden: str = ''
    estado_orden: str = 'pendiente'
    prioridad: int = 1
    fecha_creacion: datetime = field(default_factory=datetime.now)
    fecha_inicio: datetime | None = None
    fecha_completado: datetime | None = None
    notas: str | None = None
