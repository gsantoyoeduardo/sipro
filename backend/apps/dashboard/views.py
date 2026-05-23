"""
Vistas del módulo Dashboard (Panel de indicadores y KPIs).

Proporciona un endpoint que agrega y retorna métricas clave del sistema
para ser consumidas por el panel de control: conteo de entidades, estado
del inventario, órdenes de picking, transferencias y movimientos del mes.
"""
from django.db.models import Count, Sum, Q
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.empresa.models import Empresa, Sucursal, Almacen
from apps.seguridad.models import Usuario
from apps.inventario.models import Producto, Inventario, Kardex
from apps.layout.models import Zona, Nodo
from apps.picking.models import OrdenPicking
from apps.transferencia.models import Transferencia


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def dashboard_kpis(request):
    """
    Retorna un conjunto completo de KPIs del sistema.

    Calcula y agrupa las métricas en las siguientes categorías:
      - entidades: Conteo de empresas, sucursales, almacenes, usuarios, productos,
        zonas y nodos activos.
      - inventario: Total de items en stock, suma total de cantidades y
        productos con bajo stock (pendiente de implementación).
      - picking: Órdenes creadas hoy, pendientes, en proceso, completadas hoy
        y total del mes.
      - transferencias: Pendientes, en tránsito y total del mes.
      - movimientos_mes: Conteo de entradas, salidas y ajustes del mes.
      - ultimos_movimientos: Los 10 movimientos de kardex más recientes
        con información del producto.
    """
    now = timezone.now()
    today = now.date()
    this_month_start = today.replace(day=1)

    # Conteo de entidades básicas activas
    total_empresas = Empresa.objects.filter(estado=True).count()
    total_sucursales = Sucursal.objects.filter(estado=True).count()
    total_almacenes = Almacen.objects.filter(estado=True).count()
    total_usuarios = Usuario.objects.filter(estado=True).count()
    total_productos = Producto.objects.filter(estado=True).count()

    # Métricas de inventario: items activos y stock total acumulado
    total_stock_items = Inventario.objects.filter(estado=True).count()
    stock_total = Inventario.objects.filter(estado=True).aggregate(s=Sum('cantidad'))['s'] or 0
    productos_bajo_stock = 0  # Pendiente: calcular comparando stock vs mínimo por producto

    # Métricas de órdenes de picking por período y estado
    ordenes_hoy = OrdenPicking.objects.filter(fecha_creacion__date=today).count()
    ordenes_pendientes = OrdenPicking.objects.filter(estado='pendiente').count()
    ordenes_en_proceso = OrdenPicking.objects.filter(estado='en_proceso').count()
    ordenes_completadas_hoy = OrdenPicking.objects.filter(estado='completado', fecha_completado__date=today).count()
    ordenes_mes = OrdenPicking.objects.filter(fecha_creacion__gte=this_month_start).count()

    # Métricas de transferencias por estado y período
    transferencias_pendientes = Transferencia.objects.filter(estado='pendiente').count()
    transferencias_en_transito = Transferencia.objects.filter(estado='en_transito').count()
    transferencias_mes = Transferencia.objects.filter(fecha_creacion__gte=this_month_start).count()

    # Métricas de layout: zonas y nodos activos
    total_zonas = Zona.objects.filter(estado=True).count()
    total_nodos = Nodo.objects.filter(estado=True).count()

    # Últimos 10 movimientos de kardex con datos del producto
    ultimos_movimientos = Kardex.objects.order_by('-fecha_movimiento')[:10].values(
        'tipo_movimiento', 'cantidad', 'fecha_movimiento',
        'idproducto__codigo', 'idproducto__nombre'
    )

    # Conteo de movimientos del mes agrupados por tipo
    movimientos_mes = {
        'entradas': Kardex.objects.filter(tipo_movimiento='entrada', fecha_movimiento__gte=this_month_start).count(),
        'salidas': Kardex.objects.filter(tipo_movimiento='salida', fecha_movimiento__gte=this_month_start).count(),
        'ajustes': Kardex.objects.filter(tipo_movimiento='ajuste', fecha_movimiento__gte=this_month_start).count(),
    }

    return Response({
        'entidades': {
            'empresas': total_empresas,
            'sucursales': total_sucursales,
            'almacenes': total_almacenes,
            'usuarios': total_usuarios,
            'productos': total_productos,
            'zonas': total_zonas,
            'nodos': total_nodos,
        },
        'inventario': {
            'stock_items': total_stock_items,
            'stock_total': float(stock_total),
            'productos_bajo_stock': productos_bajo_stock,
        },
        'picking': {
            'ordenes_hoy': ordenes_hoy,
            'ordenes_pendientes': ordenes_pendientes,
            'ordenes_en_proceso': ordenes_en_proceso,
            'ordenes_completadas_hoy': ordenes_completadas_hoy,
            'ordenes_mes': ordenes_mes,
        },
        'transferencias': {
            'pendientes': transferencias_pendientes,
            'en_transito': transferencias_en_transito,
            'transferencias_mes': transferencias_mes,
        },
        'movimientos_mes': movimientos_mes,
        'ultimos_movimientos': [{
            'tipo': m['tipo_movimiento'],
            'cantidad': float(m['cantidad']),
            'producto': f"{m['idproducto__codigo']} - {m['idproducto__nombre']}",
            'fecha': m['fecha_movimiento'].isoformat(),
        } for m in ultimos_movimientos],
    })
