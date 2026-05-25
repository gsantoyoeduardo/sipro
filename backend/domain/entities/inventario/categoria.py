import uuid
from dataclasses import dataclass, field

@dataclass
class Categoria:
    idcategoria: uuid.UUID = field(default_factory=uuid.uuid4)
    nombre: str = ''
    descripcion: str | None = None
    idcategoriapadre: uuid.UUID | None = None
    estado: bool = True
