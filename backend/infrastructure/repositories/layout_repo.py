import uuid

from infrastructure.models.layout_model import (
    Conexion,
    Estante,
    Nivel,
    Nodo,
    Ubicacion,
    Zona,
)

from .base_repository import BaseRepository


class ZonaRepository(BaseRepository[Zona]):

    def __init__(self):
        super().__init__(Zona)

    def get_estantes(self, idzona: uuid.UUID):
        return Estante.objects.filter(idzona_id=idzona)


class EstanteRepository(BaseRepository[Estante]):

    def __init__(self):
        super().__init__(Estante)

    def get_niveles(self, idestante: uuid.UUID):
        return Nivel.objects.filter(idestante_id=idestante)


class NivelRepository(BaseRepository[Nivel]):

    def __init__(self):
        super().__init__(Nivel)

    def get_ubicaciones(self, idnivel: uuid.UUID):
        return Ubicacion.objects.filter(idnivel_id=idnivel)


class UbicacionRepository(BaseRepository[Ubicacion]):

    def __init__(self):
        super().__init__(Ubicacion)

    def cambiar_estado_ubicacion(self, idubicacion: uuid.UUID, estado_ubicacion: str):
        obj = self.get_by_id(idubicacion)
        obj.estado_ubicacion = estado_ubicacion
        obj.save(update_fields=['estado_ubicacion'])
        return obj


class NodoRepository(BaseRepository[Nodo]):

    def __init__(self):
        super().__init__(Nodo)

    def get_conexiones_salida(self, idnodo: uuid.UUID):
        return Conexion.objects.filter(idnodoorigen_id=idnodo)

    def get_conexiones_entrada(self, idnodo: uuid.UUID):
        return Conexion.objects.filter(idnododestino_id=idnodo)


class ConexionRepository(BaseRepository[Conexion]):

    def __init__(self):
        super().__init__(Conexion)
