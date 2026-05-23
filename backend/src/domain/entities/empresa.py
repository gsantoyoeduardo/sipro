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

@dataclass
class Sucursal:
    idsucursal: uuid.UUID = field(default_factory=uuid.uuid4)
    idempresa: uuid.UUID = field(default_factory=uuid.uuid4)
    nombre: str = ''
    codigo: str = ''
    direccion: str | None = None
    telefono: str | None = None
    estado: bool = True
    fechacreacion: datetime = field(default_factory=datetime.now)

@dataclass
class Almacen:
    idalmacen: uuid.UUID = field(default_factory=uuid.uuid4)
    idsucursal: uuid.UUID = field(default_factory=uuid.uuid4)
    nombre: str = ''
    codigo: str = ''
    descripcion: str | None = None
    ancho: float | None = None
    alto: float | None = None
    capacidadmaxima: float | None = None
    estado: bool = True
    fechacreacion: datetime = field(default_factory=datetime.now)
