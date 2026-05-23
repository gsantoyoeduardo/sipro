import uuid
from src.infrastructure.repositories.inventario_repo import InventarioRepository
from src.infrastructure.models.inventario_model import Producto

inventario_repo = InventarioRepository()


class PickingService:
    @staticmethod
    def calcular(producto_id: uuid.UUID, cantidad_requerida: float, estrategia: str = 'fefo'):
        try:
            producto = Producto.objects.get(idproducto=producto_id)
        except Producto.DoesNotExist:
            return {'error': 'Producto no encontrado'}

        inventario_qs = inventario_repo.get_disponible_para_picking(producto_id, estrategia)

        picking = []
        acumulado = 0.0

        for inv in inventario_qs:
            if acumulado >= cantidad_requerida:
                break
            disponible = float(inv.cantidad)
            tomar = min(disponible, cantidad_requerida - acumulado)
            picking.append({
                'lote': str(inv.idlote.idlote) if inv.idlote else None,
                'lote_numero': inv.idlote.numero_lote if inv.idlote else None,
                'vencimiento': str(inv.idlote.fecha_vencimiento) if (inv.idlote and inv.idlote.fecha_vencimiento) else None,
                'ubicacion': str(inv.idubicacion.idubicacion),
                'ubicacion_codigo': inv.idubicacion.codigo,
                'cantidad_pickear': round(tomar, 2),
            })
            acumulado += tomar

        faltante = max(0.0, cantidad_requerida - acumulado)

        return {
            'producto': {
                'idproducto': str(producto.idproducto),
                'codigo': producto.codigo,
                'nombre': producto.nombre,
                'unidad_medida': producto.unidad_medida,
                'maneja_lotes': producto.maneja_lotes,
            },
            'estrategia': 'FEFO' if (estrategia == 'fefo' and producto.maneja_lotes) else 'FIFO',
            'cantidad_requerida': cantidad_requerida,
            'picking': picking,
            'total_pickeable': round(acumulado, 2),
            'faltante': round(faltante, 2),
            'completo': faltante == 0,
        }
