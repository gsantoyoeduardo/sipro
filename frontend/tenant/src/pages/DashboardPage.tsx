import { useState, useEffect } from 'react'
import { dashboardService } from '../api/dashboard'
import type { DashboardKPI } from '../types'

/**
 * Página principal del Dashboard (Panel de KPIs).
 * Muestra indicadores clave de la empresa: datos de la empresa, sucursales, almacenes,
 * estadísticas de picking, transferencias, movimientos del mes, inventario y últimos movimientos.
 * 
 * Estado:
 *   - kpi: DashboardKPI | null — datos completos del dashboard devueltos por la API.
 *   - loading: boolean — controla el spinner de carga inicial.
 * 
 * Llamadas API:
 *   - dashboardService.getKpis() — recupera todos los KPIs en una sola petición.
 */
export default function DashboardPage() {
  const [kpi, setKpi] = useState<DashboardKPI | null>(null)
  const [loading, setLoading] = useState(true)

  // Carga inicial de KPIs al montar el componente
  useEffect(() => {
    dashboardService.getKpis().then(({ data }) => setKpi(data)).catch(() => {}).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full" /></div>

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>

      {/* Sección: datos generales de la empresa (razón social, RUC, correo, dirección) */}
      {kpi?.empresa && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">{kpi.empresa.razonsocial}</h2>
              <p className="text-sm text-gray-500">{kpi.empresa.nombrecomercial}</p>
            </div>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${kpi.empresa.estado ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              {kpi.empresa.estado ? 'Activa' : 'Inactiva'}
            </span>
          </div>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><span className="text-gray-500">RUC:</span><span className="ml-1 font-medium">{kpi.empresa.ruc}</span></div>
            <div><span className="text-gray-500">Correo:</span><span className="ml-1 font-medium">{kpi.empresa.correo}</span></div>
            <div className="col-span-2"><span className="text-gray-500">Dirección:</span><span className="ml-1 font-medium">{kpi.empresa.direccion || '—'}</span></div>
          </div>
        </div>
      )}

      {/* Sección: lista de sucursales con su estado */}
      {kpi?.sucursales && kpi.sucursales.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="font-semibold text-gray-700 mb-4">Sucursales ({kpi.sucursales.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {kpi.sucursales.map((s) => (
              <div key={s.idsucursal} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-800">{s.nombre}</span>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${s.estado ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {s.estado ? 'Activa' : 'Inactiva'}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{s.codigo}</p>
                {s.direccion && <p className="text-xs text-gray-400 mt-1">{s.direccion}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sección: lista de almacenes con sucursal asociada */}
      {kpi?.almacenes && kpi.almacenes.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="font-semibold text-gray-700 mb-4">Almacenes ({kpi.almacenes.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {kpi.almacenes.map((a) => (
              <div key={a.idalmacen} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-800">{a.nombre}</span>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${a.estado ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {a.estado ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{a.codigo}</p>
                <p className="text-xs text-gray-400 mt-1">{a.idsucursal__nombre}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sección: tarjetas resumen con conteo de entidades (sucursales, almacenes, usuarios, productos) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Sucursales', value: kpi?.entidades.sucursales ?? 0, color: 'bg-green-500' },
          { label: 'Almacenes', value: kpi?.entidades.almacenes ?? 0, color: 'bg-yellow-500' },
          { label: 'Usuarios', value: kpi?.entidades.usuarios ?? 0, color: 'bg-purple-500' },
          { label: 'Productos', value: kpi?.entidades.productos ?? 0, color: 'bg-indigo-500' },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-lg shadow p-5">
            <div className={`w-3 h-3 rounded-full ${s.color} mb-2`} />
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className="text-3xl font-bold text-gray-800">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Sección: cuadrícula de 3 columnas con estadísticas de Picking, Transferencias y Movimientos del Mes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Panel de órdenes de picking (pendientes, en proceso, hoy, completadas hoy, este mes) */}
        <div className="bg-white rounded-lg shadow p-5">
          <h3 className="font-semibold text-gray-700 mb-4">Picking</h3>
          <div className="space-y-3">
            {[
              { label: 'Pendientes', value: kpi?.picking.ordenes_pendientes ?? 0, color: 'bg-yellow-500' },
              { label: 'En Proceso', value: kpi?.picking.ordenes_en_proceso ?? 0, color: 'bg-blue-500' },
              { label: 'Hoy', value: kpi?.picking.ordenes_hoy ?? 0, color: 'bg-indigo-500' },
              { label: 'Completadas Hoy', value: kpi?.picking.ordenes_completadas_hoy ?? 0, color: 'bg-green-500' },
              { label: 'Este Mes', value: kpi?.picking.ordenes_mes ?? 0, color: 'bg-purple-500' },
            ].map((item) => (
              <div key={item.label} className="flex justify-between items-center">
                <div className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${item.color}`} /><span className="text-sm text-gray-600">{item.label}</span></div>
                <span className="font-bold text-sm">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Panel de transferencias (pendientes, en tránsito, este mes) */}
        <div className="bg-white rounded-lg shadow p-5">
          <h3 className="font-semibold text-gray-700 mb-4">Transferencias</h3>
          <div className="space-y-3">
            {[
              { label: 'Pendientes', value: kpi?.transferencias.pendientes ?? 0, color: 'bg-yellow-500' },
              { label: 'En Tránsito', value: kpi?.transferencias.en_transito ?? 0, color: 'bg-blue-500' },
              { label: 'Este Mes', value: kpi?.transferencias.transferencias_mes ?? 0, color: 'bg-purple-500' },
            ].map((item) => (
              <div key={item.label} className="flex justify-between items-center">
                <div className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${item.color}`} /><span className="text-sm text-gray-600">{item.label}</span></div>
                <span className="font-bold text-sm">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Panel de movimientos del mes (entradas, salidas, ajustes) */}
        <div className="bg-white rounded-lg shadow p-5">
          <h3 className="font-semibold text-gray-700 mb-4">Movimientos del Mes</h3>
          <div className="space-y-3">
            {[
              { label: 'Entradas', value: kpi?.movimientos_mes.entradas ?? 0, color: 'bg-green-500' },
              { label: 'Salidas', value: kpi?.movimientos_mes.salidas ?? 0, color: 'bg-red-500' },
              { label: 'Ajustes', value: kpi?.movimientos_mes.ajustes ?? 0, color: 'bg-orange-500' },
            ].map((item) => (
              <div key={item.label} className="flex justify-between items-center">
                <div className="flex items-center gap-2"><div className={`w-2 h-2 rounded-full ${item.color}`} /><span className="text-sm text-gray-600">{item.label}</span></div>
                <span className="font-bold text-sm">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sección: inventario general y últimos movimientos (2 columnas) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel de inventario: productos, stock items, stock total, zonas, nodos */}
        <div className="bg-white rounded-lg shadow p-5">
          <h3 className="font-semibold text-gray-700 mb-4">Inventario</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Productos</span><span className="font-bold">{kpi?.entidades.productos ?? 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Stock Items</span><span className="font-bold">{kpi?.inventario.stock_items ?? 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Stock Total</span><span className="font-bold">{kpi?.inventario.stock_total ?? 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Zonas</span><span className="font-bold">{kpi?.entidades.zonas ?? 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Nodos</span><span className="font-bold">{kpi?.entidades.nodos ?? 0}</span>
            </div>
          </div>
        </div>

        {/* Panel de últimos movimientos: lista con tipo, producto y cantidad */}
        <div className="bg-white rounded-lg shadow p-5">
          <h3 className="font-semibold text-gray-700 mb-4">Últimos Movimientos</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {kpi?.ultimos_movimientos.map((mov, i) => {
              const colors: Record<string, string> = { entrada: 'text-green-600', salida: 'text-red-600', ajuste: 'text-orange-600', transferencia: 'text-blue-600' }
              return (
                <div key={i} className="flex justify-between text-xs border-b pb-1">
                  <div>
                    <span className={`font-medium ${colors[mov.tipo] || 'text-gray-600'}`}>{mov.tipo}</span>
                    <span className="text-gray-500 ml-2">{mov.producto}</span>
                  </div>
                  <span className="font-mono">{mov.cantidad}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
