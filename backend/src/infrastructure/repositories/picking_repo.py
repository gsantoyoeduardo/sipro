import uuid
from src.infrastructure.models.picking_model import OrdenPicking, DetallePicking, Incidencia

class OrdenPickingRepository:
    def get_all(self, idempresa: uuid.UUID | None = None):
        qs = OrdenPicking.objects.select_related('idalmacen__idsucursal')
        if idempresa:
            qs = qs.filter(idalmacen__idsucursal__idempresa_id=idempresa)
        return qs

    def get_by_id(self, idordenpicking: uuid.UUID):
        return OrdenPicking.objects.get(idordenpicking=idordenpicking)

    def create(self, data: dict):
        return OrdenPicking.objects.create(**data)

    def update(self, idordenpicking: uuid.UUID, data: dict):
        obj = self.get_by_id(idordenpicking)
        for k, v in data.items():
            setattr(obj, k, v)
        obj.save()
        return obj

    def delete(self, idordenpicking: uuid.UUID):
        self.get_by_id(idordenpicking).delete()

    def cambiar_estado(self, idordenpicking: uuid.UUID, estado: str):
        obj = self.get_by_id(idordenpicking)
        from django.utils import timezone
        obj.estado = estado
        if estado == 'en_proceso' and not obj.fecha_inicio:
            obj.fecha_inicio = timezone.now()
        elif estado == 'completado':
            obj.fecha_completado = timezone.now()
        obj.save()
        return obj

    def get_detalles(self, idordenpicking: uuid.UUID):
        return DetallePicking.objects.filter(idorden_id=idordenpicking)


class DetallePickingRepository:
    def get_all(self, idempresa: uuid.UUID | None = None):
        qs = DetallePicking.objects.select_related('idorden__idalmacen__idsucursal')
        if idempresa:
            qs = qs.filter(idorden__idalmacen__idsucursal__idempresa_id=idempresa)
        return qs

    def get_by_id(self, iddetallepicking: uuid.UUID):
        return DetallePicking.objects.get(iddetallepicking=iddetallepicking)

    def create(self, data: dict):
        return DetallePicking.objects.create(**data)

    def update(self, iddetallepicking: uuid.UUID, data: dict):
        obj = self.get_by_id(iddetallepicking)
        for k, v in data.items():
            setattr(obj, k, v)
        obj.save()
        return obj

    def delete(self, iddetallepicking: uuid.UUID):
        self.get_by_id(iddetallepicking).delete()


class IncidenciaRepository:
    def get_all(self, idempresa: uuid.UUID | None = None):
        qs = Incidencia.objects.select_related('iddetalle__idorden__idalmacen__idsucursal')
        if idempresa:
            qs = qs.filter(iddetalle__idorden__idalmacen__idsucursal__idempresa_id=idempresa)
        return qs

    def get_by_id(self, idincidencia: uuid.UUID):
        return Incidencia.objects.get(idincidencia=idincidencia)

    def create(self, data: dict):
        return Incidencia.objects.create(**data)

    def update(self, idincidencia: uuid.UUID, data: dict):
        obj = self.get_by_id(idincidencia)
        for k, v in data.items():
            setattr(obj, k, v)
        obj.save()
        return obj

    def delete(self, idincidencia: uuid.UUID):
        self.get_by_id(idincidencia).delete()
