"""Servicios de la capa de aplicación para la gestión de inventario.

Proporciona la lógica de negocio para administrar el catálogo de productos
(categorías, productos, lotes), el stock físico (inventario por ubicación),
el kardex de movimientos y la estrategia de **picking** (FEFO/FIFO) para
determinar qué unidades retirar primero.
"""

import uuid
from src.infrastructure.repositories.inventario_repo import (
    CategoriaRepository, ProductoRepository, LoteRepository,
    InventarioRepository, KardexRepository,
)
from src.application.inventario.picking_service import PickingService

categoria_repo = CategoriaRepository()
producto_repo = ProductoRepository()
lote_repo = LoteRepository()
inventario_repo = InventarioRepository()
kardex_repo = KardexRepository()


class CategoriaService:
    """Servicio CRUD para las categorías de productos."""

    @staticmethod
    def listar():
        """Lista todas las categorías."""
        return categoria_repo.get_all()

    @staticmethod
    def obtener(idcategoria: uuid.UUID):
        """Obtiene una categoría por su ID."""
        return categoria_repo.get_by_id(idcategoria)

    @staticmethod
    def crear(data: dict):
        """Crea una nueva categoría."""
        return categoria_repo.create(data)

    @staticmethod
    def actualizar(idcategoria: uuid.UUID, data: dict):
        """Actualiza los campos de una categoría existente."""
        return categoria_repo.update(idcategoria, data)

    @staticmethod
    def eliminar(idcategoria: uuid.UUID):
        """Elimina una categoría."""
        return categoria_repo.delete(idcategoria)

    @staticmethod
    def toggle_estado(idcategoria: uuid.UUID):
        """Alterna el estado activo/inactivo de la categoría."""
        return categoria_repo.toggle_estado(idcategoria)

    @staticmethod
    def listar_subcategorias(idcategoria: uuid.UUID):
        """Lista las subcategorías hijas de una categoría."""
        return categoria_repo.get_subcategorias(idcategoria)

    @staticmethod
    def listar_productos(idcategoria: uuid.UUID):
        """Lista los productos que pertenecen a una categoría."""
        return categoria_repo.get_productos(idcategoria)


class ProductoService:
    """Servicio CRUD para los productos del catálogo."""

    @staticmethod
    def listar(idcategoria: uuid.UUID | None = None, search: str | None = None):
        """Lista productos, opcionalmente filtrados por categoría o búsqueda textual."""
        return producto_repo.get_all(idcategoria, search)

    @staticmethod
    def obtener(idproducto: uuid.UUID):
        """Obtiene un producto por su ID."""
        return producto_repo.get_by_id(idproducto)

    @staticmethod
    def crear(data: dict):
        """Crea un nuevo producto."""
        return producto_repo.create(data)

    @staticmethod
    def actualizar(idproducto: uuid.UUID, data: dict):
        """Actualiza los campos de un producto existente."""
        return producto_repo.update(idproducto, data)

    @staticmethod
    def eliminar(idproducto: uuid.UUID):
        """Elimina un producto."""
        return producto_repo.delete(idproducto)

    @staticmethod
    def toggle_estado(idproducto: uuid.UUID):
        """Alterna el estado activo/inactivo del producto."""
        return producto_repo.toggle_estado(idproducto)

    @staticmethod
    def listar_lotes(idproducto: uuid.UUID):
        """Lista los lotes asociados a un producto."""
        return producto_repo.get_lotes(idproducto)

    @staticmethod
    def listar_inventario(idproducto: uuid.UUID):
        """Lista el stock (inventario) de un producto en todas sus ubicaciones."""
        return producto_repo.get_inventario(idproducto)

    @staticmethod
    def listar_kardex(idproducto: uuid.UUID):
        """Lista los movimientos de kardex de un producto."""
        return producto_repo.get_kardex(idproducto)


class LoteService:
    """Servicio CRUD para los lotes de productos."""

    @staticmethod
    def listar(idproducto: uuid.UUID | None = None):
        """Lista todos los lotes, opcionalmente filtrados por producto."""
        return lote_repo.get_all(idproducto)

    @staticmethod
    def obtener(idlote: uuid.UUID):
        """Obtiene un lote por su ID."""
        return lote_repo.get_by_id(idlote)

    @staticmethod
    def crear(data: dict):
        """Crea un nuevo lote."""
        return lote_repo.create(data)

    @staticmethod
    def actualizar(idlote: uuid.UUID, data: dict):
        """Actualiza los campos de un lote existente."""
        return lote_repo.update(idlote, data)

    @staticmethod
    def eliminar(idlote: uuid.UUID):
        """Elimina un lote."""
        return lote_repo.delete(idlote)

    @staticmethod
    def toggle_estado(idlote: uuid.UUID):
        """Alterna el estado activo/inactivo del lote."""
        return lote_repo.toggle_estado(idlote)


class InventarioService:
    """Servicio CRUD para el stock físico (inventario por ubicación y lote)."""

    @staticmethod
    def listar(idproducto: uuid.UUID | None = None, idubicacion: uuid.UUID | None = None):
        """Lista registros de inventario, filtrados por producto y/o ubicación."""
        return inventario_repo.get_all(idproducto, idubicacion)

    @staticmethod
    def obtener(idinventario: uuid.UUID):
        """Obtiene un registro de inventario por su ID."""
        return inventario_repo.get_by_id(idinventario)

    @staticmethod
    def crear(data: dict):
        """Crea un nuevo registro de inventario (entrada de stock)."""
        return inventario_repo.create(data)

    @staticmethod
    def actualizar(idinventario: uuid.UUID, data: dict):
        """Actualiza un registro de inventario."""
        return inventario_repo.update(idinventario, data)

    @staticmethod
    def toggle_estado(idinventario: uuid.UUID):
        """Alterna el estado activo/inactivo del registro."""
        return inventario_repo.toggle_estado(idinventario)

    @staticmethod
    def calcular_picking(producto_id: uuid.UUID, cantidad: float, estrategia: str = 'fefo'):
        """Calcula qué ubicaciones y lotes pickear para cubrir una cantidad.

        Delega en :class:`PickingService` para aplicar la estrategia FEFO o FIFO.

        Args:
            producto_id: UUID del producto a pickear.
            cantidad: Cantidad solicitada.
            estrategia: ``'fefo'`` (primero vencidos) o ``'fifo'`` (primero en entrar).

        Returns:
            dict: Plan de picking con origen, lote y cantidades a retirar.
        """
        return PickingService.calcular(producto_id, cantidad, estrategia)
