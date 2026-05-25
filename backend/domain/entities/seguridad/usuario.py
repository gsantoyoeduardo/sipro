import uuid
from dataclasses import dataclass, field
from datetime import datetime

@dataclass
class Usuario:
    idusuario: uuid.UUID = field(default_factory=uuid.uuid4)
    idempresa: uuid.UUID | None = None
    nombres: str = ''
    apellidos: str = ''
    correo: str = ''
    usuario: str = ''
    telefono: str | None = None
    foto: str | None = None
    ultimologin: datetime | None = None
    estado: bool = True
    is_staff: bool = False
    is_active: bool = True
    fechacreacion: datetime = field(default_factory=datetime.now)
