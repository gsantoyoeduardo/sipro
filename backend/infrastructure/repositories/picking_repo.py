import uuid
from infrastructure.models.picking_model import OrdenPicking, DetallePicking, Incidencia
from .base_repository import BaseRepository


class OrdenPickingRepository(BaseRepository[OrdenPicking]):

    def __init__(self):
        super().__init__(OrdenPicking)

    def cambiar_estado(self, idordenpicking: uuid.UUID, estado: str):
        from django.utils import timezone
        obj = self.get_by_id(idordenpicking)
        obj.estado_orden = estado
        if estado == 'en_proceso' and not obj.fecha_inicio:
            obj.fecha_inicio = timezone.now()
        elif estado == 'completado':
            obj.fecha_completado = timezone.now()
        obj.save()
        return obj

    def get_detalles(self, idordenpicking: uuid.UUID):
        return DetallePicking.objects.filter(idorden_id=idordenpicking)


class DetallePickingRepository(BaseRepository[DetallePicking]):

    def __init__(self):
        super().__init__(DetallePicking)


class IncidenciaRepository(BaseRepository[Incidencia]):

    def __init__(self):
        super().__init__(Incidencia)
