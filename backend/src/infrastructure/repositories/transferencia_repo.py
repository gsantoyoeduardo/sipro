import uuid
from src.infrastructure.models.transferencia_model import Transferencia, DetalleTransferencia

class TransferenciaRepository:
    def get_all(self, idempresa: uuid.UUID | None = None):
        qs = Transferencia.objects.select_related('idalmacen_origen__idsucursal', 'idalmacen_destino__idsucursal')
        if idempresa:
            qs = qs.filter(idalmacen_origen__idsucursal__idempresa_id=idempresa)
        return qs

    def get_by_id(self, idtransferencia: uuid.UUID):
        return Transferencia.objects.get(idtransferencia=idtransferencia)

    def create(self, data: dict):
        return Transferencia.objects.create(**data)

    def update(self, idtransferencia: uuid.UUID, data: dict):
        obj = self.get_by_id(idtransferencia)
        for k, v in data.items():
            setattr(obj, k, v)
        obj.save()
        return obj

    def delete(self, idtransferencia: uuid.UUID):
        self.get_by_id(idtransferencia).delete()

    def cambiar_estado(self, idtransferencia: uuid.UUID, estado: str):
        from django.utils import timezone
        obj = self.get_by_id(idtransferencia)
        obj.estado = estado
        if estado == 'en_transito':
            obj.fecha_envio = timezone.now()
        elif estado == 'completado':
            obj.fecha_recepcion = timezone.now()
        obj.save()
        return obj

    def get_detalles(self, idtransferencia: uuid.UUID):
        return DetalleTransferencia.objects.filter(idtransferencia_id=idtransferencia)


class DetalleTransferenciaRepository:
    def get_all(self, idempresa: uuid.UUID | None = None):
        qs = DetalleTransferencia.objects.select_related('idtransferencia__idalmacen_origen__idsucursal')
        if idempresa:
            qs = qs.filter(idtransferencia__idalmacen_origen__idsucursal__idempresa_id=idempresa)
        return qs

    def get_by_id(self, iddetalletransferencia: uuid.UUID):
        return DetalleTransferencia.objects.get(iddetalletransferencia=iddetalletransferencia)

    def create(self, data: dict):
        return DetalleTransferencia.objects.create(**data)

    def update(self, iddetalletransferencia: uuid.UUID, data: dict):
        obj = self.get_by_id(iddetalletransferencia)
        for k, v in data.items():
            setattr(obj, k, v)
        obj.save()
        return obj

    def delete(self, iddetalletransferencia: uuid.UUID):
        self.get_by_id(iddetalletransferencia).delete()
