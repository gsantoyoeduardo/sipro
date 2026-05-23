import uuid
from dataclasses import dataclass, field
from datetime import datetime, date

@dataclass
class Categoria:
    idcategoria: uuid.UUID = field(default_factory=uuid.uuid4)
    nombre: str = ''
    descripcion: str | None = None
    idcategoriapadre: uuid.UUID | None = None
    estado: bool = True

@dataclass
class Producto:
    idproducto: uuid.UUID = field(default_factory=uuid.uuid4)
    idcategoria: uuid.UUID = field(default_factory=uuid.uuid4)
    codigo: str = ''
    nombre: str = ''
    descripcion: str | None = None
    unidad_medida: str = 'unidad'
    peso: float | None = None
    volumen: float | None = None
    precio_costo: float | None = None
    precio_venta: float | None = None
    stock_minimo: float = 0
    stock_maximo: float = 0
    maneja_lotes: bool = False
    estado: bool = True
    fechacreacion: datetime = field(default_factory=datetime.now)

@dataclass
class Lote:
    idlote: uuid.UUID = field(default_factory=uuid.uuid4)
    idproducto: uuid.UUID = field(default_factory=uuid.uuid4)
    numero_lote: str = ''
    fecha_produccion: date | None = None
    fecha_vencimiento: date | None = None
    fecha_recepcion: datetime = field(default_factory=datetime.now)
    cantidad_inicial: float = 0
    cantidad_actual: float = 0
    estado: bool = True

@dataclass
class Inventario:
    idinventario: uuid.UUID = field(default_factory=uuid.uuid4)
    idproducto: uuid.UUID = field(default_factory=uuid.uuid4)
    idlote: uuid.UUID | None = None
    idubicacion: uuid.UUID = field(default_factory=uuid.uuid4)
    cantidad: float = 0
    estado: bool = True
    fecha_ultimo_conteo: datetime = field(default_factory=datetime.now)

@dataclass
class Kardex:
    idkardex: uuid.UUID = field(default_factory=uuid.uuid4)
    idproducto: uuid.UUID = field(default_factory=uuid.uuid4)
    idlote: uuid.UUID | None = None
    idubicacion: uuid.UUID | None = None
    tipo_movimiento: str = 'entrada'
    cantidad: float = 0
    saldo_anterior: float = 0
    saldo_nuevo: float = 0
    fecha_movimiento: datetime = field(default_factory=datetime.now)
    referencia: str | None = None
    idusuario: uuid.UUID | None = None
    estado: bool = True
