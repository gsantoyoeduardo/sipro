import uuid

from infrastructure.models.transferencia_model import (
    DetalleTransferencia,
    Transferencia,
)

from .base_repository import BaseRepository


class TransferenciaRepository(BaseRepository[Transferencia]):

    def __init__(self):
        super().__init__(Transferencia)

    def cambiar_estado(self, idtransferencia: uuid.UUID, estado: str):
        from django.utils import timezone
        obj = self.get_by_id(idtransferencia)
        obj.estado_transferencia = estado
        if estado == 'en_transito':
            obj.fecha_envio = timezone.now()
        elif estado == 'completado':
            obj.fecha_recepcion = timezone.now()
        obj.save()
        return obj

    def get_detalles(self, idtransferencia: uuid.UUID):
        return DetalleTransferencia.objects.filter(idtransferencia_id=idtransferencia)


class DetalleTransferenciaRepository(BaseRepository[DetalleTransferencia]):

    def __init__(self):
        super().__init__(DetalleTransferencia)
