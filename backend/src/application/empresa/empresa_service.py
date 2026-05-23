import uuid
from src.infrastructure.repositories.empresa_repo import EmpresaRepository, SucursalRepository, AlmacenRepository

empresa_repo = EmpresaRepository()
sucursal_repo = SucursalRepository()
almacen_repo = AlmacenRepository()


class EmpresaService:
    @staticmethod
    def listar():
        return empresa_repo.get_all()

    @staticmethod
    def obtener(idempresa: uuid.UUID):
        return empresa_repo.get_by_id(idempresa)

    @staticmethod
    def crear(data: dict):
        return empresa_repo.create(data)

    @staticmethod
    def actualizar(idempresa: uuid.UUID, data: dict):
        return empresa_repo.update(idempresa, data)

    @staticmethod
    def eliminar(idempresa: uuid.UUID):
        return empresa_repo.delete(idempresa)

    @staticmethod
    def toggle_estado(idempresa: uuid.UUID):
        return empresa_repo.toggle_estado(idempresa)

    @staticmethod
    def listar_sucursales(idempresa: uuid.UUID):
        return empresa_repo.get_sucursales(idempresa)

    @staticmethod
    def crear_sucursal(idempresa: uuid.UUID, data: dict):
        data['idempresa'] = idempresa
        return sucursal_repo.create(data)


class SucursalService:
    @staticmethod
    def listar(idempresa: uuid.UUID | None = None):
        return sucursal_repo.get_all(idempresa)

    @staticmethod
    def obtener(idsucursal: uuid.UUID):
        return sucursal_repo.get_by_id(idsucursal)

    @staticmethod
    def crear(data: dict):
        return sucursal_repo.create(data)

    @staticmethod
    def actualizar(idsucursal: uuid.UUID, data: dict):
        return sucursal_repo.update(idsucursal, data)

    @staticmethod
    def eliminar(idsucursal: uuid.UUID):
        return sucursal_repo.delete(idsucursal)

    @staticmethod
    def toggle_estado(idsucursal: uuid.UUID):
        return sucursal_repo.toggle_estado(idsucursal)

    @staticmethod
    def listar_almacenes(idsucursal: uuid.UUID):
        return sucursal_repo.get_almacenes(idsucursal)

    @staticmethod
    def crear_almacen(idsucursal: uuid.UUID, data: dict):
        data['idsucursal'] = idsucursal
        return almacen_repo.create(data)


class AlmacenService:
    @staticmethod
    def listar(idsucursal: uuid.UUID | None = None):
        return almacen_repo.get_all(idsucursal)

    @staticmethod
    def obtener(idalmacen: uuid.UUID):
        return almacen_repo.get_by_id(idalmacen)

    @staticmethod
    def crear(data: dict):
        return almacen_repo.create(data)

    @staticmethod
    def actualizar(idalmacen: uuid.UUID, data: dict):
        return almacen_repo.update(idalmacen, data)

    @staticmethod
    def eliminar(idalmacen: uuid.UUID):
        return almacen_repo.delete(idalmacen)

    @staticmethod
    def toggle_estado(idalmacen: uuid.UUID):
        return almacen_repo.toggle_estado(idalmacen)
