import uuid
from dataclasses import dataclass, field
from datetime import datetime

@dataclass
class OrdenPicking:
    idordenpicking: uuid.UUID = field(default_factory=uuid.uuid4)
    idalmacen: uuid.UUID = field(default_factory=uuid.uuid4)
    idusuario: uuid.UUID | None = None
    numero_orden: str = ''
    estado: str = 'pendiente'
    prioridad: int = 1
    fecha_creacion: datetime = field(default_factory=datetime.now)
    fecha_inicio: datetime | None = None
    fecha_completado: datetime | None = None
    notas: str | None = None

@dataclass
class DetallePicking:
    iddetallepicking: uuid.UUID = field(default_factory=uuid.uuid4)
    idorden: uuid.UUID = field(default_factory=uuid.uuid4)
    idproducto: uuid.UUID = field(default_factory=uuid.uuid4)
    idubicacion: uuid.UUID = field(default_factory=uuid.uuid4)
    idlote: uuid.UUID | None = None
    cantidad_solicitada: float = 0
    cantidad_pickeada: float = 0
    estado: str = 'pendiente'

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
