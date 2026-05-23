"""Servicios de la capa de aplicación para la gestión de transferencias.

Administra las transferencias de stock entre almacenes, incluyendo su ciclo
de vida (pendiente → en_transito → completado / rechazado) y los detalles
de productos transferidos.
"""

import uuid
from src.infrastructure.repositories.transferencia_repo import (
    TransferenciaRepository, DetalleTransferenciaRepository
)

transferencia_repo = TransferenciaRepository()
detalle_repo = DetalleTransferenciaRepository()


class TransferenciaService:
    """Servicio CRUD y de cambio de estado para transferencias entre almacenes."""

    @staticmethod
    def listar():
        """Lista todas las transferencias."""
        return transferencia_repo.get_all()

    @staticmethod
    def obtener(idtransferencia: uuid.UUID):
        """Obtiene una transferencia por su ID."""
        return transferencia_repo.get_by_id(idtransferencia)

    @staticmethod
    def crear(data: dict):
        """Crea una nueva transferencia."""
        return transferencia_repo.create(data)

    @staticmethod
    def actualizar(idtransferencia: uuid.UUID, data: dict):
        """Actualiza los campos de una transferencia existente."""
        return transferencia_repo.update(idtransferencia, data)

    @staticmethod
    def eliminar(idtransferencia: uuid.UUID):
        """Elimina una transferencia."""
        return transferencia_repo.delete(idtransferencia)

    @staticmethod
    def enviar(idtransferencia: uuid.UUID):
        """Cambia el estado de la transferencia a 'en_transito'."""
        return transferencia_repo.cambiar_estado(idtransferencia, 'en_transito')

    @staticmethod
    def recibir(idtransferencia: uuid.UUID):
        """Cambia el estado de la transferencia a 'completado'."""
        return transferencia_repo.cambiar_estado(idtransferencia, 'completado')

    @staticmethod
    def rechazar(idtransferencia: uuid.UUID):
        """Cambia el estado de la transferencia a 'rechazado'."""
        return transferencia_repo.cambiar_estado(idtransferencia, 'rechazado')

    @staticmethod
    def listar_detalles(idtransferencia: uuid.UUID):
        """Lista los detalles (productos y cantidades) de una transferencia."""
        return transferencia_repo.get_detalles(idtransferencia)


class DetalleTransferenciaService:
    """Servicio CRUD para los detalles de una transferencia."""

    @staticmethod
    def listar():
        """Lista todos los detalles de transferencia."""
        return detalle_repo.get_all()

    @staticmethod
    def obtener(iddetalletransferencia: uuid.UUID):
        """Obtiene un detalle por su ID."""
        return detalle_repo.get_by_id(iddetalletransferencia)

    @staticmethod
    def crear(data: dict):
        """Crea un nuevo detalle de transferencia."""
        return detalle_repo.create(data)

    @staticmethod
    def actualizar(iddetalletransferencia: uuid.UUID, data: dict):
        """Actualiza los campos de un detalle existente."""
        return detalle_repo.update(iddetalletransferencia, data)

    @staticmethod
    def eliminar(iddetalletransferencia: uuid.UUID):
        """Elimina un detalle de transferencia."""
        return detalle_repo.delete(iddetalletransferencia)
