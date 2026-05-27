import uuid

from infrastructure.models.inventario_model import (
    Categoria,
    Inventario,
    Kardex,
    Lote,
    Producto,
)

from .base_repository import BaseRepository


class CategoriaRepository(BaseRepository[Categoria]):

    def __init__(self):
        super().__init__(Categoria)

    def get_raices(self, idempresa: uuid.UUID | None = None):
        qs = Categoria.objects.filter(idcategoriapadre__isnull=True)
        if idempresa:
            qs = qs.filter(idempresa_id=idempresa)
        return qs

    def get_subcategorias(self, idcategoria: uuid.UUID):
        return Categoria.objects.filter(idcategoriapadre_id=idcategoria)

    def get_productos(self, idcategoria: uuid.UUID):
        return Producto.objects.filter(idcategoria_id=idcategoria)


class ProductoRepository(BaseRepository[Producto]):

    def __init__(self):
        super().__init__(Producto)

    def get_lotes(self, idproducto: uuid.UUID):
        return Lote.objects.filter(idproducto_id=idproducto)

    def get_inventario(self, idproducto: uuid.UUID):
        return Inventario.objects.filter(idproducto_id=idproducto, cantidad__gt=0)

    def get_kardex(self, idproducto: uuid.UUID):
        return Kardex.objects.filter(idproducto_id=idproducto).order_by('-fecha_movimiento')


class LoteRepository(BaseRepository[Lote]):

    def __init__(self):
        super().__init__(Lote)


class InventarioRepository(BaseRepository[Inventario]):

    def __init__(self):
        super().__init__(Inventario)

    def get_disponible_para_picking(self, producto_id: uuid.UUID, estrategia: str = 'fefo'):
        from infrastructure.models.inventario_model import Producto
        producto = Producto.objects.get(idproducto=producto_id)
        qs = Inventario.objects.filter(idproducto=producto, cantidad__gt=0, estado=True)

        if producto.maneja_lotes:
            if estrategia == 'fefo':
                qs = qs.select_related('idlote', 'idubicacion').order_by('idlote__fecha_vencimiento')
            else:
                qs = qs.select_related('idlote', 'idubicacion').order_by('idlote__fecha_recepcion')
        else:
            qs = qs.select_related('idlote', 'idubicacion').order_by('-fecha_ultimo_conteo')

        return qs


class KardexRepository(BaseRepository[Kardex]):

    def __init__(self):
        super().__init__(Kardex)
