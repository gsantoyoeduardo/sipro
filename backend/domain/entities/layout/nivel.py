import uuid
from dataclasses import dataclass, field

@dataclass
class Nivel:
    idnivel: uuid.UUID = field(default_factory=uuid.uuid4)
    idestante: uuid.UUID = field(default_factory=uuid.uuid4)
    nombre: str = ''
    numero: int = 1
    altura: int = 10
    estado: bool = True
