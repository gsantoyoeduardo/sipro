import uuid

from application.services.inventario.picking_service import PickingService
from infrastructure.repositories.inventario_repo import (
    CategoriaRepository,
    InventarioRepository,
    KardexRepository,
    LoteRepository,
    ProductoRepository,
)

categoria_repo = CategoriaRepository()
producto_repo = ProductoRepository()
lote_repo = LoteRepository()
inventario_repo = InventarioRepository()
kardex_repo = KardexRepository()


class CategoriaService:
    @staticmethod
    def listar():
        return categoria_repo.get_all()

    @staticmethod
    def obtener(idcategoria: uuid.UUID):
        return categoria_repo.get_by_id(idcategoria)

    @staticmethod
    def crear(data: dict):
        return categoria_repo.create(data)

    @staticmethod
    def actualizar(idcategoria: uuid.UUID, data: dict):
        return categoria_repo.update(idcategoria, data)

    @staticmethod
    def eliminar(idcategoria: uuid.UUID):
        return categoria_repo.delete(idcategoria)

    @staticmethod
    def toggle_estado(idcategoria: uuid.UUID):
        return categoria_repo.toggle_estado(idcategoria)

    @staticmethod
    def listar_subcategorias(idcategoria: uuid.UUID):
        return categoria_repo.get_subcategorias(idcategoria)

    @staticmethod
    def listar_productos(idcategoria: uuid.UUID):
        return categoria_repo.get_productos(idcategoria)


class ProductoService:
    @staticmethod
    def listar(idcategoria: uuid.UUID | None = None, search: str | None = None):
        return producto_repo.get_all(idcategoria=idcategoria, search=search)

    @staticmethod
    def obtener(idproducto: uuid.UUID):
        return producto_repo.get_by_id(idproducto)

    @staticmethod
    def crear(data: dict):
        return producto_repo.create(data)

    @staticmethod
    def actualizar(idproducto: uuid.UUID, data: dict):
        return producto_repo.update(idproducto, data)

    @staticmethod
    def eliminar(idproducto: uuid.UUID):
        return producto_repo.delete(idproducto)

    @staticmethod
    def toggle_estado(idproducto: uuid.UUID):
        return producto_repo.toggle_estado(idproducto)

    @staticmethod
    def listar_lotes(idproducto: uuid.UUID):
        return producto_repo.get_lotes(idproducto)

    @staticmethod
    def listar_inventario(idproducto: uuid.UUID):
        return producto_repo.get_inventario(idproducto)

    @staticmethod
    def listar_kardex(idproducto: uuid.UUID):
        return producto_repo.get_kardex(idproducto)


class LoteService:
    @staticmethod
    def listar(idproducto: uuid.UUID | None = None):
        return lote_repo.get_all(idproducto=idproducto)

    @staticmethod
    def obtener(idlote: uuid.UUID):
        return lote_repo.get_by_id(idlote)

    @staticmethod
    def crear(data: dict):
        return lote_repo.create(data)

    @staticmethod
    def actualizar(idlote: uuid.UUID, data: dict):
        return lote_repo.update(idlote, data)

    @staticmethod
    def eliminar(idlote: uuid.UUID):
        return lote_repo.delete(idlote)

    @staticmethod
    def toggle_estado(idlote: uuid.UUID):
        return lote_repo.toggle_estado(idlote)


class InventarioService:
    @staticmethod
    def listar(idproducto: uuid.UUID | None = None, idubicacion: uuid.UUID | None = None):
        return inventario_repo.get_all(idproducto=idproducto, idubicacion=idubicacion)

    @staticmethod
    def obtener(idinventario: uuid.UUID):
        return inventario_repo.get_by_id(idinventario)

    @staticmethod
    def crear(data: dict):
        return inventario_repo.create(data)

    @staticmethod
    def actualizar(idinventario: uuid.UUID, data: dict):
        return inventario_repo.update(idinventario, data)

    @staticmethod
    def toggle_estado(idinventario: uuid.UUID):
        return inventario_repo.toggle_estado(idinventario)

    @staticmethod
    def calcular_picking(producto_id: uuid.UUID, cantidad: float, estrategia: str = 'fefo'):
        return PickingService.calcular(producto_id, cantidad, estrategia)
