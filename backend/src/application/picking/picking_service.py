import uuid
from src.infrastructure.repositories.picking_repo import (
    OrdenPickingRepository, DetallePickingRepository, IncidenciaRepository
)

orden_repo = OrdenPickingRepository()
detalle_repo = DetallePickingRepository()
incidencia_repo = IncidenciaRepository()


class OrdenPickingService:
    @staticmethod
    def listar():
        return orden_repo.get_all()

    @staticmethod
    def obtener(idordenpicking: uuid.UUID):
        return orden_repo.get_by_id(idordenpicking)

    @staticmethod
    def crear(data: dict):
        return orden_repo.create(data)

    @staticmethod
    def actualizar(idordenpicking: uuid.UUID, data: dict):
        return orden_repo.update(idordenpicking, data)

    @staticmethod
    def eliminar(idordenpicking: uuid.UUID):
        return orden_repo.delete(idordenpicking)

    @staticmethod
    def iniciar(idordenpicking: uuid.UUID):
        return orden_repo.cambiar_estado(idordenpicking, 'en_proceso')

    @staticmethod
    def completar(idordenpicking: uuid.UUID):
        return orden_repo.cambiar_estado(idordenpicking, 'completado')

    @staticmethod
    def cancelar(idordenpicking: uuid.UUID):
        return orden_repo.cambiar_estado(idordenpicking, 'cancelado')

    @staticmethod
    def listar_detalles(idordenpicking: uuid.UUID):
        return orden_repo.get_detalles(idordenpicking)


class DetallePickingService:
    @staticmethod
    def listar():
        return detalle_repo.get_all()

    @staticmethod
    def obtener(iddetallepicking: uuid.UUID):
        return detalle_repo.get_by_id(iddetallepicking)

    @staticmethod
    def crear(data: dict):
        return detalle_repo.create(data)

    @staticmethod
    def actualizar(iddetallepicking: uuid.UUID, data: dict):
        return detalle_repo.update(iddetallepicking, data)

    @staticmethod
    def eliminar(iddetallepicking: uuid.UUID):
        return detalle_repo.delete(iddetallepicking)

    @staticmethod
    def pick_item(iddetallepicking: uuid.UUID, cantidad: float):
        detalle = detalle_repo.get_by_id(iddetallepicking)
        detalle.cantidad_pickeada = cantidad
        detalle.estado = 'completado' if cantidad >= float(detalle.cantidad_solicitada) else 'en_proceso'
        detalle.save()
        return detalle


class IncidenciaService:
    @staticmethod
    def listar():
        return incidencia_repo.get_all()

    @staticmethod
    def obtener(idincidencia: uuid.UUID):
        return incidencia_repo.get_by_id(idincidencia)

    @staticmethod
    def crear(data: dict):
        return incidencia_repo.create(data)

    @staticmethod
    def actualizar(idincidencia: uuid.UUID, data: dict):
        return incidencia_repo.update(idincidencia, data)

    @staticmethod
    def eliminar(idincidencia: uuid.UUID):
        return incidencia_repo.delete(idincidencia)
