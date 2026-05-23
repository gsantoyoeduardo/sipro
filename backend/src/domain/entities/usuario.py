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

@dataclass
class Rol:
    idrol: uuid.UUID = field(default_factory=uuid.uuid4)
    nombre: str = ''
    descripcion: str | None = None
    estado: bool = True

@dataclass
class Permiso:
    idpermiso: uuid.UUID = field(default_factory=uuid.uuid4)
    codigo: str = ''
    nombre: str = ''
    descripcion: str | None = None
    estado: bool = True

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
