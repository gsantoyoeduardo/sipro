from django.db.models import Count, Sum, Q
from django.utils import timezone
from src.infrastructure.models.empresa_model import Empresa, Sucursal, Almacen
from src.infrastructure.models.seguridad_model import Usuario
from src.infrastructure.models.inventario_model import Producto, Inventario, Kardex
from src.infrastructure.models.layout_model import Zona, Nodo
from src.infrastructure.models.picking_model import OrdenPicking
from src.infrastructure.models.transferencia_model import Transferencia


class DashboardService:
    @staticmethod
    def obtener_kpis(user=None):
        now = timezone.now()
        today = now.date()
        this_month_start = today.replace(day=1)

        idempresa = getattr(user, 'idempresa_id', None) if user else None

        if idempresa:
            total_empresas = 1
            total_sucursales = Sucursal.objects.filter(idempresa_id=idempresa, estado=True).count()
            total_almacenes = Almacen.objects.filter(idsucursal__idempresa_id=idempresa, estado=True).count()
            total_usuarios = Usuario.objects.filter(idempresa_id=idempresa, estado=True).count()
            total_productos = Producto.objects.filter(idcategoria__idempresa_id=idempresa, estado=True).count()
            total_stock_items = Inventario.objects.filter(idproducto__idcategoria__idempresa_id=idempresa, estado=True).count()
            stock_total = Inventario.objects.filter(idproducto__idcategoria__idempresa_id=idempresa, estado=True).aggregate(s=Sum('cantidad'))['s'] or 0

            ordenes_hoy = OrdenPicking.objects.filter(idalmacen__idsucursal__idempresa_id=idempresa, fecha_creacion__date=today).count()
            ordenes_pendientes = OrdenPicking.objects.filter(idalmacen__idsucursal__idempresa_id=idempresa, estado='pendiente').count()
            ordenes_en_proceso = OrdenPicking.objects.filter(idalmacen__idsucursal__idempresa_id=idempresa, estado='en_proceso').count()
            ordenes_completadas_hoy = OrdenPicking.objects.filter(idalmacen__idsucursal__idempresa_id=idempresa, estado='completado', fecha_completado__date=today).count()
            ordenes_mes = OrdenPicking.objects.filter(idalmacen__idsucursal__idempresa_id=idempresa, fecha_creacion__gte=this_month_start).count()

            transferencias_pendientes = Transferencia.objects.filter(idalmacen_origen__idsucursal__idempresa_id=idempresa, estado='pendiente').count()
            transferencias_en_transito = Transferencia.objects.filter(idalmacen_origen__idsucursal__idempresa_id=idempresa, estado='en_transito').count()
            transferencias_mes = Transferencia.objects.filter(idalmacen_origen__idsucursal__idempresa_id=idempresa, fecha_creacion__gte=this_month_start).count()

            total_zonas = Zona.objects.filter(idalmacen__idsucursal__idempresa_id=idempresa, estado=True).count()
            total_nodos = Nodo.objects.filter(idalmacen__idsucursal__idempresa_id=idempresa, estado=True).count()

            ultimos_movimientos = Kardex.objects.filter(
                idproducto__idcategoria__idempresa_id=idempresa
            ).order_by('-fecha_movimiento')[:10].values(
                'tipo_movimiento', 'cantidad', 'fecha_movimiento',
                'idproducto__codigo', 'idproducto__nombre'
            )

            movimientos_mes = {
                'entradas': Kardex.objects.filter(idproducto__idcategoria__idempresa_id=idempresa, tipo_movimiento='entrada', fecha_movimiento__gte=this_month_start).count(),
                'salidas': Kardex.objects.filter(idproducto__idcategoria__idempresa_id=idempresa, tipo_movimiento='salida', fecha_movimiento__gte=this_month_start).count(),
                'ajustes': Kardex.objects.filter(idproducto__idcategoria__idempresa_id=idempresa, tipo_movimiento='ajuste', fecha_movimiento__gte=this_month_start).count(),
            }

            empresa = Empresa.objects.filter(idempresa=idempresa).first()
            sucursales = list(Sucursal.objects.filter(idempresa_id=idempresa).values('idsucursal', 'nombre', 'codigo', 'direccion', 'estado'))
            almacenes = list(Almacen.objects.filter(idsucursal__idempresa_id=idempresa).select_related('idsucursal').values('idalmacen', 'nombre', 'codigo', 'idsucursal', 'idsucursal__nombre', 'estado'))
        else:
            total_empresas = Empresa.objects.filter(estado=True).count()
            total_sucursales = Sucursal.objects.filter(estado=True).count()
            total_almacenes = Almacen.objects.filter(estado=True).count()
            total_usuarios = Usuario.objects.filter(estado=True).count()
            total_productos = Producto.objects.filter(estado=True).count()
            total_stock_items = Inventario.objects.filter(estado=True).count()
            stock_total = Inventario.objects.filter(estado=True).aggregate(s=Sum('cantidad'))['s'] or 0

            ordenes_hoy = OrdenPicking.objects.filter(fecha_creacion__date=today).count()
            ordenes_pendientes = OrdenPicking.objects.filter(estado='pendiente').count()
            ordenes_en_proceso = OrdenPicking.objects.filter(estado='en_proceso').count()
            ordenes_completadas_hoy = OrdenPicking.objects.filter(estado='completado', fecha_completado__date=today).count()
            ordenes_mes = OrdenPicking.objects.filter(fecha_creacion__gte=this_month_start).count()

            transferencias_pendientes = Transferencia.objects.filter(estado='pendiente').count()
            transferencias_en_transito = Transferencia.objects.filter(estado='en_transito').count()
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

            empresa = None
            sucursales = []
            almacenes = []

        result = {
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

        if empresa:
            result['empresa'] = {
                'idempresa': str(empresa.idempresa),
                'razonsocial': empresa.razonsocial,
                'nombrecomercial': empresa.nombrecomercial,
                'ruc': empresa.ruc,
                'correo': empresa.correo,
                'direccion': empresa.direccion,
                'estado': empresa.estado,
            }
            result['sucursales'] = sucursales
            result['almacenes'] = almacenes

        return result
