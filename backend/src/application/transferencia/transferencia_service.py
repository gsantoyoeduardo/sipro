import uuid
from src.infrastructure.repositories.transferencia_repo import (
    TransferenciaRepository, DetalleTransferenciaRepository
)

transferencia_repo = TransferenciaRepository()
detalle_repo = DetalleTransferenciaRepository()


class TransferenciaService:
    @staticmethod
    def listar():
        return transferencia_repo.get_all()

    @staticmethod
    def obtener(idtransferencia: uuid.UUID):
        return transferencia_repo.get_by_id(idtransferencia)

    @staticmethod
    def crear(data: dict):
        return transferencia_repo.create(data)

    @staticmethod
    def actualizar(idtransferencia: uuid.UUID, data: dict):
        return transferencia_repo.update(idtransferencia, data)

    @staticmethod
    def eliminar(idtransferencia: uuid.UUID):
        return transferencia_repo.delete(idtransferencia)

    @staticmethod
    def enviar(idtransferencia: uuid.UUID):
        return transferencia_repo.cambiar_estado(idtransferencia, 'en_transito')

    @staticmethod
    def recibir(idtransferencia: uuid.UUID):
        return transferencia_repo.cambiar_estado(idtransferencia, 'completado')

    @staticmethod
    def rechazar(idtransferencia: uuid.UUID):
        return transferencia_repo.cambiar_estado(idtransferencia, 'rechazado')

    @staticmethod
    def listar_detalles(idtransferencia: uuid.UUID):
        return transferencia_repo.get_detalles(idtransferencia)


class DetalleTransferenciaService:
    @staticmethod
    def listar():
        return detalle_repo.get_all()

    @staticmethod
    def obtener(iddetalletransferencia: uuid.UUID):
        return detalle_repo.get_by_id(iddetalletransferencia)

    @staticmethod
    def crear(data: dict):
        return detalle_repo.create(data)

    @staticmethod
    def actualizar(iddetalletransferencia: uuid.UUID, data: dict):
        return detalle_repo.update(iddetalletransferencia, data)

    @staticmethod
    def eliminar(iddetalletransferencia: uuid.UUID):
        return detalle_repo.delete(iddetalletransferencia)
