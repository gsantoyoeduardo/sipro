import uuid
from dataclasses import dataclass, field


@dataclass
class Permiso:
    idpermiso: uuid.UUID = field(default_factory=uuid.uuid4)
    codigo: str = ''
    nombre: str = ''
    descripcion: str | None = None
    estado: bool = True
