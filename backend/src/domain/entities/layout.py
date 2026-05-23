import uuid
from dataclasses import dataclass, field

@dataclass
class Zona:
    idzona: uuid.UUID = field(default_factory=uuid.uuid4)
    idalmacen: uuid.UUID = field(default_factory=uuid.uuid4)
    nombre: str = ''
    codigo: str = ''
    tipo: str = 'almacenamiento'
    x: int = 0
    y: int = 0
    ancho: int = 100
    alto: int = 100
    color: str | None = None
    estado: bool = True

@dataclass
class Pasillo:
    idpasillo: uuid.UUID = field(default_factory=uuid.uuid4)
    idzona: uuid.UUID = field(default_factory=uuid.uuid4)
    nombre: str = ''
    codigo: str = ''
    x: int = 0
    y: int = 0
    ancho: int = 40
    largo: int = 60
    orientacion: str = 'horizontal'
    estado: bool = True

@dataclass
class Estante:
    idestante: uuid.UUID = field(default_factory=uuid.uuid4)
    idpasillo: uuid.UUID = field(default_factory=uuid.uuid4)
    nombre: str = ''
    codigo: str = ''
    x: int = 0
    y: int = 0
    ancho: int = 20
    alto: int = 30
    profundidad: int = 20
    lado: str = 'derecha'
    cantidadniveles: int = 3
    estado: bool = True

@dataclass
class Nivel:
    idnivel: uuid.UUID = field(default_factory=uuid.uuid4)
    idestante: uuid.UUID = field(default_factory=uuid.uuid4)
    nombre: str = ''
    numero: int = 1
    altura: int = 10
    estado: bool = True

@dataclass
class Ubicacion:
    idubicacion: uuid.UUID = field(default_factory=uuid.uuid4)
    idnivel: uuid.UUID = field(default_factory=uuid.uuid4)
    codigo: str = ''
    capacidadpeso: float | None = None
    capacidadvolumen: float | None = None
    estado_ubicacion: str = 'disponible'
    x: int = 0
    y: int = 0
    estado: bool = True

@dataclass
class Nodo:
    idnodo: uuid.UUID = field(default_factory=uuid.uuid4)
    idalmacen: uuid.UUID = field(default_factory=uuid.uuid4)
    nombre: str = ''
    tipo: str = 'interseccion'
    coordenada_x: int = 0
    coordenada_y: int = 0
    idubicacion: uuid.UUID | None = None
    estado: bool = True

@dataclass
class Conexion:
    idconexion: uuid.UUID = field(default_factory=uuid.uuid4)
    idnodoorigen: uuid.UUID = field(default_factory=uuid.uuid4)
    idnododestino: uuid.UUID = field(default_factory=uuid.uuid4)
    distancia: float = 0
    tipo: str = 'pasillo'
    bidireccional: bool = True
    estado: bool = True
