import uuid
from dataclasses import dataclass, field
from datetime import datetime

@dataclass
class Empresa:
    idempresa: uuid.UUID = field(default_factory=uuid.uuid4)
    razonsocial: str = ''
    nombrecomercial: str = ''
    ruc: str = ''
    correo: str = ''
    telefono: str | None = None
    direccion: str | None = None
    estado: bool = True
    fechacreacion: datetime = field(default_factory=datetime.now)
