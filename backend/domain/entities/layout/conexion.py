import uuid
from dataclasses import dataclass, field


@dataclass
class Conexion:
    idconexion: uuid.UUID = field(default_factory=uuid.uuid4)
    idnodoorigen: uuid.UUID = field(default_factory=uuid.uuid4)
    idnododestino: uuid.UUID = field(default_factory=uuid.uuid4)
    distancia: float = 0
    ancho: float = 200
    tipo: str = 'pasillo'
    geometria: dict | None = None
    bidireccional: bool = True
    estado: bool = True
