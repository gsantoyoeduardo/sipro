import uuid
from src.infrastructure.models.empresa_model import Empresa, Sucursal, Almacen

class EmpresaRepository:
    def get_all(self):
        return Empresa.objects.all()

    def get_by_id(self, idempresa: uuid.UUID):
        return Empresa.objects.get(idempresa=idempresa)

    def create(self, data: dict):
        return Empresa.objects.create(**data)

    def update(self, idempresa: uuid.UUID, data: dict):
        empresa = self.get_by_id(idempresa)
        for k, v in data.items():
            setattr(empresa, k, v)
        empresa.save()
        return empresa

    def delete(self, idempresa: uuid.UUID):
        empresa = self.get_by_id(idempresa)
        empresa.delete()

    def toggle_estado(self, idempresa: uuid.UUID) -> bool:
        empresa = self.get_by_id(idempresa)
        empresa.estado = not empresa.estado
        empresa.save(update_fields=['estado'])
        return empresa.estado

    def get_sucursales(self, idempresa: uuid.UUID):
        return Sucursal.objects.filter(idempresa_id=idempresa)


class SucursalRepository:
    def get_all(self, idempresa: uuid.UUID | None = None):
        qs = Sucursal.objects.all()
        if idempresa:
            qs = qs.filter(idempresa_id=idempresa)
        return qs

    def get_by_id(self, idsucursal: uuid.UUID):
        return Sucursal.objects.get(idsucursal=idsucursal)

    def create(self, data: dict):
        return Sucursal.objects.create(**data)

    def update(self, idsucursal: uuid.UUID, data: dict):
        obj = self.get_by_id(idsucursal)
        for k, v in data.items():
            setattr(obj, k, v)
        obj.save()
        return obj

    def delete(self, idsucursal: uuid.UUID):
        self.get_by_id(idsucursal).delete()

    def toggle_estado(self, idsucursal: uuid.UUID) -> bool:
        obj = self.get_by_id(idsucursal)
        obj.estado = not obj.estado
        obj.save(update_fields=['estado'])
        return obj.estado

    def get_by_empresa(self, idempresa: uuid.UUID):
        return Sucursal.objects.filter(idempresa_id=idempresa)

    def get_almacenes(self, idsucursal: uuid.UUID):
        return Almacen.objects.filter(idsucursal_id=idsucursal)


class AlmacenRepository:
    def get_all(self, idsucursal: uuid.UUID | None = None):
        qs = Almacen.objects.all()
        if idsucursal:
            qs = qs.filter(idsucursal_id=idsucursal)
        return qs

    def get_by_id(self, idalmacen: uuid.UUID):
        return Almacen.objects.get(idalmacen=idalmacen)

    def create(self, data: dict):
        return Almacen.objects.create(**data)

    def update(self, idalmacen: uuid.UUID, data: dict):
        obj = self.get_by_id(idalmacen)
        for k, v in data.items():
            setattr(obj, k, v)
        obj.save()
        return obj

    def delete(self, idalmacen: uuid.UUID):
        self.get_by_id(idalmacen).delete()

    def toggle_estado(self, idalmacen: uuid.UUID) -> bool:
        obj = self.get_by_id(idalmacen)
        obj.estado = not obj.estado
        obj.save(update_fields=['estado'])
        return obj.estado

    def get_by_sucursal(self, idsucursal: uuid.UUID):
        return Almacen.objects.filter(idsucursal_id=idsucursal)
