import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { empresaService } from '../api/empresa'
import type { Stats } from '../api/empresa'
import { useAuthStore } from '../store/authStore'
import TarjetaEstadistica from '../components/common/TarjetaEstadistica'
import Cargando from '../components/common/Cargando'

const accesosDirectos = [
  {
    path: '/admin/empresas',
    titulo: 'Gestionar Empresas',
    descripcion: 'Ver, crear y administrar empresas clientes',
    color: 'bg-blue-50 hover:bg-blue-100 border-blue-200',
    iconColor: 'text-blue-600',
    icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
  },
  {
    path: '/admin/usuarios',
    titulo: 'Usuarios del Portal',
    descripcion: 'Gestionar administradores del sistema',
    color: 'bg-green-50 hover:bg-green-100 border-green-200',
    iconColor: 'text-green-600',
    icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z',
  },
  {
    path: '/admin/roles',
    titulo: 'Roles y Permisos',
    descripcion: 'Configurar roles del portal',
    color: 'bg-purple-50 hover:bg-purple-100 border-purple-200',
    iconColor: 'text-purple-600',
    icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  },
  {
    path: '/admin/auditoria',
    titulo: 'Auditoría',
    descripcion: 'Revisar logs y actividad del sistema',
    color: 'bg-amber-50 hover:bg-amber-100 border-amber-200',
    iconColor: 'text-amber-600',
    icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  },
]

export default function DashboardPage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.user)

  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats>({
    total_empresas: 0, total_usuarios: 0,
    empresas_activas: 0, empresas_inactivas: 0,
  })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await empresaService.estadisticas()
        setStats(data)
      } catch (err) {
        console.error('[Dashboard] Error al cargar stats:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-texto">Dashboard</h1>
          <p className="text-texto-secundario text-sm mt-1">Resumen general del sistema</p>
        </div>
      </div>

      {loading ? (
        <Cargando mensaje="Cargando estadísticas..." />
      ) : (
        <>
          <div className="bg-fondo-blanco rounded-xl shadow-sm border border-borde-suave p-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-primario rounded-full flex items-center justify-center text-white text-2xl font-semibold shrink-0">
                {user?.nombres?.charAt(0) || 'A'}
              </div>
              <div>
                <h2 className="text-xl font-bold text-texto">{user?.nombres} {user?.apellidos}</h2>
                <p className="text-texto-secundario">@{user?.usuario}</p>
                <p className="text-texto-secundario text-sm">{user?.correo}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <TarjetaEstadistica label="Total Empresas" valor={stats.total_empresas} color="blue" />
            <TarjetaEstadistica label="Activas" valor={stats.empresas_activas} color="green" />
            <TarjetaEstadistica label="Inactivas" valor={stats.empresas_inactivas} color="red" />
            <TarjetaEstadistica label="Usuarios Totales" valor={stats.total_usuarios} color="purple" />
          </div>

          <div className="bg-fondo-blanco rounded-xl shadow-sm border border-borde-suave overflow-hidden">
            <div className="px-6 py-4 border-b border-borde-suave">
              <h2 className="text-lg font-semibold text-texto">Accesos Rápidos</h2>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {accesosDirectos.map((acceso) => (
                <button
                  key={acceso.path}
                  onClick={() => navigate(acceso.path)}
                  className={`flex flex-col items-start gap-3 p-4 rounded-lg border transition text-left ${acceso.color}`}
                >
                  <svg className={`w-8 h-8 ${acceso.iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={acceso.icon} />
                  </svg>
                  <div>
                    <h3 className="font-semibold text-texto">{acceso.titulo}</h3>
                    <p className="text-texto-secundario text-sm mt-1">{acceso.descripcion}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
