import uuid
from dataclasses import dataclass, field
from datetime import datetime


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
