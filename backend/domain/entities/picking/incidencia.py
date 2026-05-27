import uuid
from dataclasses import dataclass, field
from datetime import datetime


@dataclass
class Incidencia:
    idincidencia: uuid.UUID = field(default_factory=uuid.uuid4)
    iddetalle: uuid.UUID = field(default_factory=uuid.uuid4)
    idusuario: uuid.UUID = field(default_factory=uuid.uuid4)
    tipo: str = 'otro'
    descripcion: str = ''
    cantidad_reportada: float = 0
    fecha_reporte: datetime = field(default_factory=datetime.now)
    resuelta: bool = False
    estado: bool = True
