import uuid
from dataclasses import dataclass, field
from datetime import datetime

@dataclass
class SesionUsuario:
    idsesionusuario: uuid.UUID = field(default_factory=uuid.uuid4)
    idusuario: uuid.UUID = field(default_factory=uuid.uuid4)
    tokenjwt: str = ''
    refreshtoken: str | None = None
    ip: str | None = None
    dispositivo: str | None = None
    navegador: str | None = None
    fechainicio: datetime = field(default_factory=datetime.now)
    fechafin: datetime | None = None
    activa: bool = True
    estado: bool = True
