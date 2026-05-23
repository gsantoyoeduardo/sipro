"""Servicio de planificación de picking dentro del módulo de inventario.

Calcula qué ubicaciones y lotes concretos deben visitarse para satisfacer
una demanda de producto, aplicando las estrategias **FEFO** (First Expired,
First Out) o **FIFO** (First In, First Out).
"""

import uuid
from src.infrastructure.repositories.inventario_repo import InventarioRepository
from src.infrastructure.models.inventario_model import Producto

inventario_repo = InventarioRepository()


class PickingService:
    """Servicio que planifica el picking de un producto según una estrategia."""

    @staticmethod
    def calcular(producto_id: uuid.UUID, cantidad_requerida: float, estrategia: str = 'fefo'):
        """Calcula el plan de picking óptimo para cubrir la cantidad solicitada.

        Fases:
        1. Valida que el producto exista.
        2. Consulta el inventario disponible ordenado según la estrategia
           (FEFO = por fecha de vencimiento ascendente, FIFO = por fecha de
           ingreso ascendente).
        3. Itera sobre los registros de inventario tomando la cantidad
           necesaria de cada ubicación/lote hasta cubrir el total.
        4. Calcula el faltante (si el stock no alcanza).

        Args:
            producto_id: UUID del producto a pickear.
            cantidad_requerida: Cantidad solicitada por la orden.
            estrategia: ``'fefo'`` (por defecto) o ``'fifo'``.

        Returns:
            dict: Plan de picking con producto, estrategia aplicada, lista de
            ítems a retirar (ubicación, lote, cantidad), total pickeable,
            faltante e indicador ``completo``.
        """
        try:
            producto = Producto.objects.get(idproducto=producto_id)
        except Producto.DoesNotExist:
            return {'error': 'Producto no encontrado'}

        # Obtiene el stock disponible ordenado según la estrategia elegida
        inventario_qs = inventario_repo.get_disponible_para_picking(producto_id, estrategia)

        picking = []
        acumulado = 0.0

        # Recorre el inventario hasta cubrir la cantidad requerida
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
