import { useState, useEffect } from 'react'
import { dashboardService } from '../api/dashboard'
import { useAuthStore } from '../store/authStore'
import type { DashboardKPI } from '../types'

export default function DashboardPage() {
  const [kpi, setKpi] = useState<DashboardKPI | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const user = useAuthStore((state) => state.user)

  useEffect(() => {
    dashboardService.getKpis()
      .then(({ data }) => setKpi(data))
      .catch((err) => {
        const msg = err?.response?.data?.error || err?.response?.data?.detail || 'Error al cargar el dashboard'
        setError(msg)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex justify-center py-12">
      <div className="animate-spin h-8 w-8 border-b-2 border-accion rounded-full" />
    </div>
  )

  if (error) return (
    <div className="bg-peligro-suave text-peligro-texto p-6 rounded-xl text-center">
      <p className="font-semibold">{error}</p>
      <p className="text-sm mt-2 opacity-75">Intenta recargar la página</p>
    </div>
  )

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-texto">Dashboard</h1>
          <p className="text-texto-secundario text-sm mt-1">Resumen de operaciones de tu empresa</p>
        </div>
      </div>

      {/* User info card */}
      <div className="bg-fondo-blanco rounded-xl shadow-sm border border-borde-suave p-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-primario rounded-full flex items-center justify-center text-white text-2xl font-semibold shrink-0">
            {user?.nombres?.charAt(0) || 'U'}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-texto">{user?.nombres} {user?.apellidos}</h2>
            <p className="text-texto-secundario">@{user?.usuario} &middot; {user?.tipo_usuario === 'admin_sistema' ? 'Admin Sistema' : user?.tipo_usuario === 'admin_empresa' ? 'Admin Empresa' : 'Operador'}</p>
            <p className="text-texto-secundario text-sm">{user?.correo}</p>
          </div>
          {kpi?.empresa && (
            <div className="hidden md:block text-right">
              <p className="text-sm font-semibold text-texto">{kpi.empresa.razonsocial}</p>
              <p className="text-xs text-texto-secundario">RUC: {kpi.empresa.ruc}</p>
              <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded-full ${kpi.empresa.estado ? 'bg-exito-suave text-exito-texto' : 'bg-peligro-suave text-peligro-texto'}`}>
                {kpi.empresa.estado ? 'Activa' : 'Inactiva'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Sucursales', value: kpi?.entidades.sucursales ?? 0, color: 'bg-exito', textColor: 'text-exito', bgSoft: 'bg-exito-suave' },
          { label: 'Almacenes', value: kpi?.entidades.almacenes ?? 0, color: 'bg-accion', textColor: 'text-accion', bgSoft: 'bg-advertencia-suave' },
          { label: 'Usuarios', value: kpi?.entidades.usuarios ?? 0, color: 'bg-morado', textColor: 'text-morado', bgSoft: 'bg-morado-suave' },
          { label: 'Productos', value: kpi?.entidades.productos ?? 0, color: 'bg-primario-claro', textColor: 'text-primario-claro', bgSoft: 'bg-azul-suave' },
        ].map((s) => (
          <div key={s.label} className="bg-fondo-blanco rounded-xl shadow-sm border border-borde-suave p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-lg ${s.bgSoft} flex items-center justify-center`}>
                <div className={`w-3 h-3 rounded-full ${s.color}`} />
              </div>
            </div>
            <p className="text-sm text-texto-secundario">{s.label}</p>
            <p className="text-3xl font-bold text-texto mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Sucursales */}
      {kpi?.sucursales && kpi.sucursales.length > 0 && (
        <div className="bg-fondo-blanco rounded-xl shadow-sm border border-borde-suave overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-borde-suave">
            <h3 className="text-lg font-semibold text-texto">Sucursales</h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {kpi.sucursales.map((s) => (
              <div key={s.idsucursal} className="border border-borde rounded-xl p-4 hover:shadow-md transition">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-texto">{s.nombre}</span>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${s.estado ? 'bg-exito-suave text-exito-texto' : 'bg-peligro-suave text-peligro-texto'}`}>
                    {s.estado ? 'Activa' : 'Inactiva'}
                  </span>
                </div>
                <p className="text-xs text-texto-secundario">{s.codigo}</p>
                {s.direccion && <p className="text-xs text-texto-secundario mt-1">{s.direccion}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Almacenes */}
      {kpi?.almacenes && kpi.almacenes.length > 0 && (
        <div className="bg-fondo-blanco rounded-xl shadow-sm border border-borde-suave overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-borde-suave">
            <h3 className="text-lg font-semibold text-texto">Almacenes</h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {kpi.almacenes.map((a) => (
              <div key={a.idalmacen} className="border border-borde rounded-xl p-4 hover:shadow-md transition">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-texto">{a.nombre}</span>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${a.estado ? 'bg-exito-suave text-exito-texto' : 'bg-peligro-suave text-peligro-texto'}`}>
                    {a.estado ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <p className="text-xs text-texto-secundario">{a.codigo}</p>
                <p className="text-xs text-texto-secundario mt-1">{a.idsucursal__nombre}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Picking, Transferencias, Movimientos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-fondo-blanco rounded-xl shadow-sm border border-borde-suave p-6">
          <h3 className="font-semibold text-texto mb-4 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accion" />
            Picking
          </h3>
          <div className="space-y-3">
            {[
              { label: 'Pendientes', value: kpi?.picking.ordenes_pendientes ?? 0, color: 'bg-advertencia' },
              { label: 'En Proceso', value: kpi?.picking.ordenes_en_proceso ?? 0, color: 'bg-primario-claro' },
              { label: 'Hoy', value: kpi?.picking.ordenes_hoy ?? 0, color: 'bg-primario' },
              { label: 'Completadas Hoy', value: kpi?.picking.ordenes_completadas_hoy ?? 0, color: 'bg-exito' },
              { label: 'Este Mes', value: kpi?.picking.ordenes_mes ?? 0, color: 'bg-morado' },
            ].map((item) => (
              <div key={item.label} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${item.color}`} />
                  <span className="text-sm text-texto-secundario">{item.label}</span>
                </div>
                <span className="font-bold text-sm text-texto">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-fondo-blanco rounded-xl shadow-sm border border-borde-suave p-6">
          <h3 className="font-semibold text-texto mb-4 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primario-claro" />
            Transferencias
          </h3>
          <div className="space-y-3">
            {[
              { label: 'Pendientes', value: kpi?.transferencias.pendientes ?? 0, color: 'bg-advertencia' },
              { label: 'En Tránsito', value: kpi?.transferencias.en_transito ?? 0, color: 'bg-primario-claro' },
              { label: 'Este Mes', value: kpi?.transferencias.transferencias_mes ?? 0, color: 'bg-morado' },
            ].map((item) => (
              <div key={item.label} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${item.color}`} />
                  <span className="text-sm text-texto-secundario">{item.label}</span>
                </div>
                <span className="font-bold text-sm text-texto">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-fondo-blanco rounded-xl shadow-sm border border-borde-suave p-6">
          <h3 className="font-semibold text-texto mb-4 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-exito" />
            Movimientos del Mes
          </h3>
          <div className="space-y-3">
            {[
              { label: 'Entradas', value: kpi?.movimientos_mes.entradas ?? 0, color: 'bg-exito' },
              { label: 'Salidas', value: kpi?.movimientos_mes.salidas ?? 0, color: 'bg-peligro' },
              { label: 'Ajustes', value: kpi?.movimientos_mes.ajustes ?? 0, color: 'bg-accion' },
            ].map((item) => (
              <div key={item.label} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${item.color}`} />
                  <span className="text-sm text-texto-secundario">{item.label}</span>
                </div>
                <span className="font-bold text-sm text-texto">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Inventario + Últimos movimientos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-fondo-blanco rounded-xl shadow-sm border border-borde-suave p-6">
          <h3 className="font-semibold text-texto mb-4 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primario" />
            Inventario
          </h3>
          <div className="space-y-3">
            {[
              { label: 'Productos', value: kpi?.entidades.productos ?? 0 },
              { label: 'Stock Items', value: kpi?.inventario.stock_items ?? 0 },
              { label: 'Stock Total', value: kpi?.inventario.stock_total ?? 0 },
              { label: 'Zonas', value: kpi?.entidades.zonas ?? 0 },
              { label: 'Nodos', value: kpi?.entidades.nodos ?? 0 },
            ].map((item) => (
              <div key={item.label} className="flex justify-between items-center py-2 border-b border-borde-suave last:border-0">
                <span className="text-sm text-texto-secundario">{item.label}</span>
                <span className="font-bold text-texto">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-fondo-blanco rounded-xl shadow-sm border border-borde-suave p-6">
          <h3 className="font-semibold text-texto mb-4 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accion" />
            Últimos Movimientos
          </h3>
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {kpi?.ultimos_movimientos.map((mov, i) => {
              const colors: Record<string, string> = { entrada: 'text-exito', salida: 'text-peligro', ajuste: 'text-accion', transferencia: 'text-primario-claro' }
              return (
                <div key={i} className="flex justify-between text-sm py-2 border-b border-borde-suave last:border-0">
                  <div>
                    <span className={`font-medium ${colors[mov.tipo] || 'text-texto-secundario'}`}>{mov.tipo}</span>
                    <span className="text-texto-secundario ml-2">{mov.producto}</span>
                  </div>
                  <span className="font-mono font-semibold text-texto">{mov.cantidad}</span>
                </div>
              )
            })}
            {(!kpi?.ultimos_movimientos || kpi.ultimos_movimientos.length === 0) && (
              <p className="text-texto-secundario text-sm text-center py-8">Sin movimientos recientes</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
