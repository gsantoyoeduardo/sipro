import uuid
from dataclasses import dataclass, field


@dataclass
class Rol:
    idrol: uuid.UUID = field(default_factory=uuid.uuid4)
    nombre: str = ''
    descripcion: str | None = None
    estado: bool = True
