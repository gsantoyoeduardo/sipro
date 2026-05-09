from .models import Producto, Inventario, Lote


def calcular_picking(producto_id, cantidad_requerida, estrategia='fefo'):
    """
    Calcula la estrategia óptima de picking por FEFO o FIFO.

    FEFO (First Expired First Out): prioriza lotes con fecha de vencimiento más cercana.
    FIFO (First In First Out): prioriza lotes con fecha de recepción más antigua.

    Args:
        producto_id (UUID): ID del producto.
        cantidad_requerida (Decimal): Cantidad a pickear.
        estrategia (str): 'fefo' o 'fifo'. Default: 'fefo'.

    Returns:
        dict: {
            'producto': {...},
            'estrategia': 'fefo'|'fifo',
            'cantidad_requerida': Decimal,
            'picking': [{ lote, lote_numero, vencimiento, ubicacion, ubicacion_codigo, cantidad_pickear }],
            'total_pickeable': Decimal,
            'faltante': Decimal,
            'completo': bool,
        }
    """
    try:
        producto = Producto.objects.get(idproducto=producto_id)
    except Producto.DoesNotExist:
        return {'error': 'Producto no encontrado'}

    inventario_qs = Inventario.objects.filter(idproducto=producto, cantidad__gt=0, estado=True)

    if producto.maneja_lotes:
        if estrategia == 'fefo':
            inventario_qs = inventario_qs.select_related('idlote', 'idubicacion').order_by('idlote__fecha_vencimiento')
        else:
            inventario_qs = inventario_qs.select_related('idlote', 'idubicacion').order_by('idlote__fecha_recepcion')
    else:
        inventario_qs = inventario_qs.select_related('idlote', 'idubicacion').order_by('-fecha_ultimo_conteo')

    picking = []
    acumulado = 0

    for inv in inventario_qs:
        if acumulado >= cantidad_requerida:
            break
        disponible = float(inv.cantidad)
        tomar = min(disponible, float(cantidad_requerida) - acumulado)
        picking.append({
            'lote': str(inv.idlote.idlote) if inv.idlote else None,
            'lote_numero': inv.idlote.numero_lote if inv.idlote else None,
            'vencimiento': str(inv.idlote.fecha_vencimiento) if (inv.idlote and inv.idlote.fecha_vencimiento) else None,
            'ubicacion': str(inv.idubicacion.idubicacion),
            'ubicacion_codigo': inv.idubicacion.codigo,
            'cantidad_pickear': round(tomar, 2),
        })
        acumulado += tomar

    faltante = max(0, float(cantidad_requerida) - acumulado)

    return {
        'producto': {
            'idproducto': str(producto.idproducto),
            'codigo': producto.codigo,
            'nombre': producto.nombre,
            'unidad_medida': producto.unidad_medida,
            'maneja_lotes': producto.maneja_lotes,
        },
        'estrategia': 'FEFO' if (estrategia == 'fefo' and producto.maneja_lotes) else 'FIFO',
        'cantidad_requerida': float(cantidad_requerida),
        'picking': picking,
        'total_pickeable': round(acumulado, 2),
        'faltante': round(faltante, 2),
        'completo': faltante == 0,
    }
