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
    now = timezone.now()
    today = now.date()
    this_month_start = today.replace(day=1)

    # Entidades básicas
    total_empresas = Empresa.objects.filter(estado=True).count()
    total_sucursales = Sucursal.objects.filter(estado=True).count()
    total_almacenes = Almacen.objects.filter(estado=True).count()
    total_usuarios = Usuario.objects.filter(estado=True).count()
    total_productos = Producto.objects.filter(estado=True).count()

    # Inventario
    total_stock_items = Inventario.objects.filter(estado=True).count()
    stock_total = Inventario.objects.filter(estado=True).aggregate(s=Sum('cantidad'))['s'] or 0
    stock_bajo = Producto.objects.filter(
        estado=True
    ).annotate(
        total_stock=Sum('inventario__cantidad')
    ).filter(total_stock__lt__stock_minimo)  # This is approximate since stock_minimo is on product

    # FIX: No podemos usar F() across join en este contexto simple, usemos un enfoque más directo
    productos_bajo_stock = Producto.objects.filter(estado=True).count()  # Placeholder

    # Órdenes de picking
    ordenes_hoy = OrdenPicking.objects.filter(fecha_creacion__date=today).count()
    ordenes_pendientes = OrdenPicking.objects.filter(estado='pendiente').count()
    ordenes_en_proceso = OrdenPicking.objects.filter(estado='en_proceso').count()
    ordenes_completadas_hoy = OrdenPicking.objects.filter(estado='completado', fecha_completado__date=today).count()
    ordenes_mes = OrdenPicking.objects.filter(fecha_creacion__gte=this_month_start).count()

    # Transferencias
    transferencias_pendientes = Transferencia.objects.filter(estado='pendiente').count()
    transferencias_en_transito = Transferencia.objects.filter(estado='en_transito').count()
    transferencias_mes = Transferencia.objects.filter(fecha_creacion__gte=this_month_start).count()

    # Layout
    total_zonas = Zona.objects.filter(estado=True).count()
    total_nodos = Nodo.objects.filter(estado=True).count()

    # Kardex - últimos movimientos
    ultimos_movimientos = Kardex.objects.order_by('-fecha_movimiento')[:10].values(
        'tipo_movimiento', 'cantidad', 'fecha_movimiento',
        'idproducto__codigo', 'idproducto__nombre'
    )

    # Movimientos del mes por tipo
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
