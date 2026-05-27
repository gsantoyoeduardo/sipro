from django.db.models import Sum
from django.utils import timezone

from infrastructure.models.empresa_model import Almacen, Empresa, Sucursal
from infrastructure.models.inventario_model import Inventario, Kardex, Producto
from infrastructure.models.layout_model import Nodo, Zona
from infrastructure.models.picking_model import OrdenPicking
from infrastructure.models.seguridad_model import Usuario
from infrastructure.models.transferencia_model import Transferencia


class PortalDashboardService:
    @staticmethod
    def obtener_kpis():
        now = timezone.now()
        today = now.date()
        this_month_start = today.replace(day=1)

        total_empresas = Empresa.objects.filter(estado=True).count()
        total_sucursales = Sucursal.objects.filter(estado=True).count()
        total_almacenes = Almacen.objects.filter(estado=True).count()
        total_usuarios = Usuario.objects.filter(estado=True).count()
        total_productos = Producto.objects.filter(estado=True).count()
        total_stock_items = Inventario.objects.filter(estado=True).count()
        stock_total = Inventario.objects.filter(estado=True).aggregate(s=Sum('cantidad'))['s'] or 0

        ordenes_hoy = OrdenPicking.objects.filter(fecha_creacion__date=today).count()
        ordenes_pendientes = OrdenPicking.objects.filter(estado_orden='pendiente').count()
        ordenes_en_proceso = OrdenPicking.objects.filter(estado_orden='en_proceso').count()
        ordenes_completadas_hoy = OrdenPicking.objects.filter(estado_orden='completado', fecha_completado__date=today).count()
        ordenes_mes = OrdenPicking.objects.filter(fecha_creacion__gte=this_month_start).count()

        transferencias_pendientes = Transferencia.objects.filter(estado_transferencia='pendiente').count()
        transferencias_en_transito = Transferencia.objects.filter(estado_transferencia='en_transito').count()
        transferencias_mes = Transferencia.objects.filter(fecha_creacion__gte=this_month_start).count()

        total_zonas = Zona.objects.filter(estado=True).count()
        total_nodos = Nodo.objects.filter(estado=True).count()

        ultimos_movimientos = Kardex.objects.order_by('-fecha_movimiento')[:10].values(
            'tipo_movimiento', 'cantidad', 'fecha_movimiento',
            'idproducto__codigo', 'idproducto__nombre'
        )

        movimientos_mes = {
            'entradas': Kardex.objects.filter(tipo_movimiento='entrada', fecha_movimiento__gte=this_month_start).count(),
            'salidas': Kardex.objects.filter(tipo_movimiento='salida', fecha_movimiento__gte=this_month_start).count(),
            'ajustes': Kardex.objects.filter(tipo_movimiento='ajuste', fecha_movimiento__gte=this_month_start).count(),
        }

        return {
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
                'productos_bajo_stock': 0,
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
        }
