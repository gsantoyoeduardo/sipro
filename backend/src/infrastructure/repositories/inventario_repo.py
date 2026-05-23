import uuid
from src.infrastructure.models.inventario_model import Categoria, Producto, Lote, Inventario, Kardex

class CategoriaRepository:
    def get_all(self, idempresa: uuid.UUID | None = None):
        qs = Categoria.objects.all()
        if idempresa:
            qs = qs.filter(idempresa_id=idempresa)
        return qs

    def get_raices(self, idempresa: uuid.UUID | None = None):
        qs = Categoria.objects.filter(idcategoriapadre__isnull=True)
        if idempresa:
            qs = qs.filter(idempresa_id=idempresa)
        return qs

    def get_by_id(self, idcategoria: uuid.UUID):
        return Categoria.objects.get(idcategoria=idcategoria)

    def get_subcategorias(self, idcategoria: uuid.UUID):
        return Categoria.objects.filter(idcategoriapadre_id=idcategoria)

    def get_productos(self, idcategoria: uuid.UUID):
        return Producto.objects.filter(idcategoria_id=idcategoria)

    def create(self, data: dict):
        return Categoria.objects.create(**data)

    def update(self, idcategoria: uuid.UUID, data: dict):
        obj = self.get_by_id(idcategoria)
        for k, v in data.items():
            setattr(obj, k, v)
        obj.save()
        return obj

    def delete(self, idcategoria: uuid.UUID):
        self.get_by_id(idcategoria).delete()

    def toggle_estado(self, idcategoria: uuid.UUID) -> bool:
        obj = self.get_by_id(idcategoria)
        obj.estado = not obj.estado
        obj.save(update_fields=['estado'])
        return obj.estado


class ProductoRepository:
    def get_all(self, idcategoria: uuid.UUID | None = None, search: str | None = None, idempresa: uuid.UUID | None = None):
        qs = Producto.objects.select_related('idcategoria')
        if idempresa:
            qs = qs.filter(idcategoria__idempresa_id=idempresa)
        if idcategoria:
            qs = qs.filter(idcategoria_id=idcategoria)
        if search:
            from django.db.models import Q
            qs = qs.filter(Q(nombre__icontains=search) | Q(codigo__icontains=search))
        return qs

    def get_by_id(self, idproducto: uuid.UUID):
        return Producto.objects.get(idproducto=idproducto)

    def get_lotes(self, idproducto: uuid.UUID):
        return Lote.objects.filter(idproducto_id=idproducto)

    def get_inventario(self, idproducto: uuid.UUID):
        return Inventario.objects.filter(idproducto_id=idproducto, cantidad__gt=0)

    def get_kardex(self, idproducto: uuid.UUID):
        return Kardex.objects.filter(idproducto_id=idproducto).order_by('-fecha_movimiento')

    def create(self, data: dict):
        return Producto.objects.create(**data)

    def update(self, idproducto: uuid.UUID, data: dict):
        obj = self.get_by_id(idproducto)
        for k, v in data.items():
            setattr(obj, k, v)
        obj.save()
        return obj

    def delete(self, idproducto: uuid.UUID):
        self.get_by_id(idproducto).delete()

    def toggle_estado(self, idproducto: uuid.UUID) -> bool:
        obj = self.get_by_id(idproducto)
        obj.estado = not obj.estado
        obj.save(update_fields=['estado'])
        return obj.estado


class LoteRepository:
    def get_all(self, idproducto: uuid.UUID | None = None, idempresa: uuid.UUID | None = None):
        qs = Lote.objects.select_related('idproducto__idcategoria')
        if idempresa:
            qs = qs.filter(idproducto__idcategoria__idempresa_id=idempresa)
        if idproducto:
            qs = qs.filter(idproducto_id=idproducto)
        return qs

    def get_by_id(self, idlote: uuid.UUID):
        return Lote.objects.get(idlote=idlote)

    def create(self, data: dict):
        return Lote.objects.create(**data)

    def update(self, idlote: uuid.UUID, data: dict):
        obj = self.get_by_id(idlote)
        for k, v in data.items():
            setattr(obj, k, v)
        obj.save()
        return obj

    def delete(self, idlote: uuid.UUID):
        self.get_by_id(idlote).delete()

    def toggle_estado(self, idlote: uuid.UUID) -> bool:
        obj = self.get_by_id(idlote)
        obj.estado = not obj.estado
        obj.save(update_fields=['estado'])
        return obj.estado


class InventarioRepository:
    def get_all(self, idproducto: uuid.UUID | None = None, idubicacion: uuid.UUID | None = None, idempresa: uuid.UUID | None = None):
        qs = Inventario.objects.select_related('idproducto__idcategoria')
        if idempresa:
            qs = qs.filter(idproducto__idcategoria__idempresa_id=idempresa)
        if idproducto:
            qs = qs.filter(idproducto_id=idproducto)
        if idubicacion:
            qs = qs.filter(idubicacion_id=idubicacion)
        return qs

    def get_by_id(self, idinventario: uuid.UUID):
        return Inventario.objects.get(idinventario=idinventario)

    def get_disponible_para_picking(self, producto_id: uuid.UUID, estrategia: str = 'fefo'):
        from src.infrastructure.models.inventario_model import Producto
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

    def create(self, data: dict):
        return Inventario.objects.create(**data)

    def update(self, idinventario: uuid.UUID, data: dict):
        obj = self.get_by_id(idinventario)
        for k, v in data.items():
            setattr(obj, k, v)
        obj.save()
        return obj

    def toggle_estado(self, idinventario: uuid.UUID) -> bool:
        obj = self.get_by_id(idinventario)
        obj.estado = not obj.estado
        obj.save(update_fields=['estado'])
        return obj.estado


class KardexRepository:
    def get_all(self, idproducto: uuid.UUID | None = None, idempresa: uuid.UUID | None = None):
        qs = Kardex.objects.select_related('idproducto__idcategoria').order_by('-fecha_movimiento')
        if idempresa:
            qs = qs.filter(idproducto__idcategoria__idempresa_id=idempresa)
        if idproducto:
            qs = qs.filter(idproducto_id=idproducto)
        return qs

    def create(self, data: dict):
        return Kardex.objects.create(**data)
