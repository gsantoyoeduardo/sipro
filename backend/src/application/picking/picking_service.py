"""Servicios de la capa de aplicación para la gestión de órdenes de picking.

Administra el ciclo de vida de las órdenes de picking (pendiente → en_proceso
→ completado / cancelado), sus detalles y las incidencias reportadas durante
la ejecución.
"""

import uuid
from src.infrastructure.repositories.picking_repo import (
    OrdenPickingRepository, DetallePickingRepository, IncidenciaRepository
)

orden_repo = OrdenPickingRepository()
detalle_repo = DetallePickingRepository()
incidencia_repo = IncidenciaRepository()


class OrdenPickingService:
    """Servicio CRUD y de cambio de estado para órdenes de picking."""

    @staticmethod
    def listar():
        """Lista todas las órdenes de picking."""
        return orden_repo.get_all()

    @staticmethod
    def obtener(idordenpicking: uuid.UUID):
        """Obtiene una orden de picking por su ID."""
        return orden_repo.get_by_id(idordenpicking)

    @staticmethod
    def crear(data: dict):
        """Crea una nueva orden de picking."""
        return orden_repo.create(data)

    @staticmethod
    def actualizar(idordenpicking: uuid.UUID, data: dict):
        """Actualiza los campos de una orden existente."""
        return orden_repo.update(idordenpicking, data)

    @staticmethod
    def eliminar(idordenpicking: uuid.UUID):
        """Elimina una orden de picking."""
        return orden_repo.delete(idordenpicking)

    @staticmethod
    def iniciar(idordenpicking: uuid.UUID):
        """Cambia el estado de la orden a 'en_proceso'."""
        return orden_repo.cambiar_estado(idordenpicking, 'en_proceso')

    @staticmethod
    def completar(idordenpicking: uuid.UUID):
        """Cambia el estado de la orden a 'completado'."""
        return orden_repo.cambiar_estado(idordenpicking, 'completado')

    @staticmethod
    def cancelar(idordenpicking: uuid.UUID):
        """Cambia el estado de la orden a 'cancelado'."""
        return orden_repo.cambiar_estado(idordenpicking, 'cancelado')

    @staticmethod
    def listar_detalles(idordenpicking: uuid.UUID):
        """Lista los detalles (líneas de producto) de una orden de picking."""
        return orden_repo.get_detalles(idordenpicking)


class DetallePickingService:
    """Servicio CRUD para los detalles (líneas) de una orden de picking."""

    @staticmethod
    def listar():
        """Lista todos los detalles de picking."""
        return detalle_repo.get_all()

    @staticmethod
    def obtener(iddetallepicking: uuid.UUID):
        """Obtiene un detalle por su ID."""
        return detalle_repo.get_by_id(iddetallepicking)

    @staticmethod
    def crear(data: dict):
        """Crea un nuevo detalle de picking."""
        return detalle_repo.create(data)

    @staticmethod
    def actualizar(iddetallepicking: uuid.UUID, data: dict):
        """Actualiza los campos de un detalle existente."""
        return detalle_repo.update(iddetallepicking, data)

    @staticmethod
    def eliminar(iddetallepicking: uuid.UUID):
        """Elimina un detalle de picking."""
        return detalle_repo.delete(iddetallepicking)

    @staticmethod
    def pick_item(iddetallepicking: uuid.UUID, cantidad: float):
        """Registra la cantidad realmente pickeada para un detalle.

        Si la cantidad pickeada es igual o mayor a la solicitada, el detalle
        se marca como ``completado``; de lo contrario queda en ``en_proceso``.

        Args:
            iddetallepicking: UUID del detalle a actualizar.
            cantidad: Cantidad realmente retirada.

        Returns:
            DetallePicking: Instancia actualizada del detalle.
        """
        detalle = detalle_repo.get_by_id(iddetallepicking)
        detalle.cantidad_pickeada = cantidad
        detalle.estado = 'completado' if cantidad >= float(detalle.cantidad_solicitada) else 'en_proceso'
        detalle.save()
        return detalle


class IncidenciaService:
    """Servicio CRUD para las incidencias reportadas durante el picking."""

    @staticmethod
    def listar():
        """Lista todas las incidencias."""
        return incidencia_repo.get_all()

    @staticmethod
    def obtener(idincidencia: uuid.UUID):
        """Obtiene una incidencia por su ID."""
        return incidencia_repo.get_by_id(idincidencia)

    @staticmethod
    def crear(data: dict):
        """Crea una nueva incidencia (producto dañado, faltante, etc.)."""
        return incidencia_repo.create(data)

    @staticmethod
    def actualizar(idincidencia: uuid.UUID, data: dict):
        """Actualiza los campos de una incidencia existente."""
        return incidencia_repo.update(idincidencia, data)

    @staticmethod
    def eliminar(idincidencia: uuid.UUID):
        """Elimina una incidencia."""
        return incidencia_repo.delete(idincidencia)
