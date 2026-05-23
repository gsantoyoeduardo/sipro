import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../api/axios'
import { useAuthStore } from '../store/authStore'

interface Empresa {
  idempresa: string
  razonsocial: string
  nombrecomercial: string
  ruc: string
  correo: string
  estado: boolean
  fechacreacion: string
  admin_usuario?: string
  admin_email?: string
}

interface Stats {
  total_empresas: number
  total_usuarios: number
  empresas_activas: number
  empresas_inactivas: number
}

interface EmpresaDetalle {
  empresa: Empresa
  admin_usuario: {
    idusuario: string
    usuario: string
    nombres: string
    apellidos: string
    correo: string
  } | null
  total_usuarios: number
}

export default function AdminDashboardPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [stats, setStats] = useState<Stats>({ total_empresas: 0, total_usuarios: 0, empresas_activas: 0, empresas_inactivas: 0 })
  const [detalleModal, setDetalleModal] = useState<EmpresaDetalle | null>(null)

  const fetchEmpresas = async () => {
    try {
      console.log('[Dashboard] Fetching empresas...')
      setLoading(true)
      const { data } = await api.get('/portal/api/empresas/')
      console.log('[Dashboard] Empresas received:', data)
      setEmpresas(data.results || data || [])
    } catch (err: any) {
      console.error('[Dashboard] Error al cargar empresas:', err)
      console.error('[Dashboard] Error response:', err.response?.data)
      console.error('[Dashboard] Error status:', err.response?.status)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/portal/api/registro/stats/')
      setStats(data)
    } catch (err) {
      console.error('[Dashboard] Error al cargar stats:', err)
    }
  }

  useEffect(() => { fetchEmpresas(); fetchStats() }, [refreshKey])

  useEffect(() => {
    if (searchParams.get('refresh') === 'true') {
      setRefreshKey(prev => prev + 1)
      navigate('/admin', { replace: true })
    }
  }, [searchParams, navigate])

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
  }

  const handleToggleEstado = async (idempresa: string) => {
    try {
      await api.patch(`/portal/api/registro/${idempresa}/toggle/`)
      setRefreshKey(prev => prev + 1)
    } catch (err) {
      console.error('[Dashboard] Error al cambiar estado:', err)
    }
  }

  const handleVerDetalle = async (idempresa: string) => {
    try {
      const { data } = await api.get(`/portal/api/registro/${idempresa}/detalle/`)
      setDetalleModal(data)
    } catch (err) {
      console.error('[Dashboard] Error al cargar detalle:', err)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const userName = user ? `${user.nombres} ${user.apellidos}` : 'Administrador'

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-slate-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="font-bold text-lg hidden sm:inline">SIPRO Admin</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-300 hidden sm:inline">{userName}</span>
              <button
                onClick={handleRefresh}
                className="bg-white/10 hover:bg-white/20 text-white px-3 sm:px-4 py-2 rounded-lg text-sm transition"
                title="Refrescar"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
              <button
                onClick={() => navigate('/admin/crear')}
                className="bg-blue-600 hover:bg-blue-500 text-white px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition"
              >
                <span className="hidden sm:inline">Nueva Empresa</span>
                <span className="sm:hidden">+</span>
              </button>
              <button onClick={handleLogout} className="text-slate-400 hover:text-white text-sm transition">
                <span className="hidden sm:inline">Salir</span>
                <svg className="w-5 h-5 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm">
            <div className="text-2xl sm:text-3xl font-bold text-blue-600">{stats.total_empresas}</div>
            <div className="text-xs sm:text-sm text-gray-500 mt-1">Total Empresas</div>
          </div>
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm">
            <div className="text-2xl sm:text-3xl font-bold text-green-600">
              {stats.empresas_activas}
            </div>
            <div className="text-xs sm:text-sm text-gray-500 mt-1">Activas</div>
          </div>
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm">
            <div className="text-2xl sm:text-3xl font-bold text-red-600">
              {stats.empresas_inactivas}
            </div>
            <div className="text-xs sm:text-sm text-gray-500 mt-1">Inactivas</div>
          </div>
          <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm">
            <div className="text-2xl sm:text-3xl font-bold text-purple-600">{stats.total_usuarios}</div>
            <div className="text-xs sm:text-sm text-gray-500 mt-1">Usuarios Totales</div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800">Empresas Registradas</h2>
          </div>
          {loading ? (
            <div className="p-8 text-center text-gray-500">Cargando...</div>
          ) : empresas.length === 0 ? (
            <div className="p-8 sm:p-12 text-center">
              <div className="text-gray-400 text-5xl mb-4">🏢</div>
              <p className="text-gray-500 mb-4">No hay empresas registradas</p>
              <button
                onClick={() => navigate('/admin/crear')}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                Crear Primera Empresa
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Empresa</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">RUC</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Correo</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Fecha</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {empresas.map((emp) => (
                    <tr key={emp.idempresa} className="hover:bg-gray-50 transition">
                      <td className="px-4 sm:px-6 py-4">
                        <div className="font-medium text-gray-800 text-sm">{emp.razonsocial}</div>
                        <div className="text-xs text-gray-500 sm:hidden">{emp.ruc}</div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600 hidden sm:table-cell">{emp.ruc}</td>
                      <td className="px-4 py-4 text-sm text-gray-600 hidden md:table-cell">{emp.correo}</td>
                      <td className="px-4 py-4 text-sm text-gray-500 hidden lg:table-cell">
                        {new Date(emp.fechacreacion).toLocaleDateString('es-PE')}
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${emp.estado ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {emp.estado ? 'Activa' : 'Inactiva'}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleVerDetalle(emp.idempresa)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                            title="Ver detalles"
                          >
                            👁
                          </button>
                          <button
                            onClick={() => handleToggleEstado(emp.idempresa)}
                            className={`text-sm font-medium ${emp.estado ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'}`}
                            title={emp.estado ? 'Desactivar' : 'Activar'}
                          >
                            {emp.estado ? '⏸' : '▶'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Modal de Detalles */}
      {detalleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setDetalleModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-800">Detalles de Empresa</h2>
                <button onClick={() => setDetalleModal(null)} className="text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Razón Social</h3>
                <p className="text-gray-800 font-semibold">{detalleModal.empresa.razonsocial}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">RUC</h3>
                  <p className="text-gray-800">{detalleModal.empresa.ruc}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Nombre Comercial</h3>
                  <p className="text-gray-800">{detalleModal.empresa.nombrecomercial || '-'}</p>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Correo</h3>
                <p className="text-gray-800">{detalleModal.empresa.correo}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Estado</h3>
                <span className={`inline-block px-2 py-1 text-xs rounded-full font-medium ${detalleModal.empresa.estado ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {detalleModal.empresa.estado ? 'Activa' : 'Inactiva'}
                </span>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Fecha de Creación</h3>
                <p className="text-gray-800">{new Date(detalleModal.empresa.fechacreacion).toLocaleDateString('es-PE')}</p>
              </div>
              {detalleModal.admin_usuario && (
                <div className="border-t border-gray-100 pt-4">
                  <h3 className="text-sm font-medium text-gray-500 mb-2">Administrador de la Empresa</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-1">
                    <p className="text-gray-800 font-medium">{detalleModal.admin_usuario.nombres} {detalleModal.admin_usuario.apellidos}</p>
                    <p className="text-gray-600 text-sm">Usuario: {detalleModal.admin_usuario.usuario}</p>
                    <p className="text-gray-600 text-sm">Correo: {detalleModal.admin_usuario.correo}</p>
                  </div>
                </div>
              )}
              <div className="border-t border-gray-100 pt-4">
                <h3 className="text-sm font-medium text-gray-500">Total de Usuarios</h3>
                <p className="text-2xl font-bold text-purple-600">{detalleModal.total_usuarios}</p>
              </div>
            </div>
            <div className="p-6 border-t border-gray-100">
              <button
                onClick={() => setDetalleModal(null)}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
