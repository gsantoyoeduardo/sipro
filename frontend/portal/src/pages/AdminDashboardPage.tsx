import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { empresaService } from '../api/empresa'
import type { Empresa, Stats } from '../api/empresa'
import { useAuthStore } from '../store/authStore'
import Header from '../components/common/Header'
import StatCard from '../components/common/StatCard'
import LoadingSpinner from '../components/common/LoadingSpinner'
import EmpresaTable from '../components/dedicated/EmpresaTable'
import EmpresaDetailModal from '../components/dedicated/EmpresaDetailModal'
import type { EmpresaDetalle } from '../api/empresa'

export default function AdminDashboardPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const logout = useAuthStore((state) => state.logout)
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [stats, setStats] = useState<Stats>({ total_empresas: 0, total_usuarios: 0, empresas_activas: 0, empresas_inactivas: 0 })
  const [detalleModal, setDetalleModal] = useState<EmpresaDetalle | null>(null)

  const fetchEmpresas = async () => {
    try {
      setLoading(true)
      const { data } = await empresaService.list()
      setEmpresas(data.results || data || [])
    } catch (err) {
      console.error('[Dashboard] Error al cargar empresas:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const { data } = await empresaService.stats()
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

  const handleRefresh = () => setRefreshKey(prev => prev + 1)

  const handleToggleEstado = async (idempresa: string) => {
    try {
      await empresaService.toggle(idempresa)
      setRefreshKey(prev => prev + 1)
    } catch (err) {
      console.error('[Dashboard] Error al cambiar estado:', err)
    }
  }

  const handleVerDetalle = async (idempresa: string) => {
    try {
      const { data } = await empresaService.detalle(idempresa)
      setDetalleModal(data)
    } catch (err) {
      console.error('[Dashboard] Error al cargar detalle:', err)
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header onNavigate={navigate} onLogout={handleLogout}>
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
      </Header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard label="Total Empresas" valor={stats.total_empresas} color="blue" />
          <StatCard label="Activas" valor={stats.empresas_activas} color="green" />
          <StatCard label="Inactivas" valor={stats.empresas_inactivas} color="red" />
          <StatCard label="Usuarios Totales" valor={stats.total_usuarios} color="purple" />
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-800">Empresas Registradas</h2>
          </div>
          {loading ? (
            <LoadingSpinner mensaje="Cargando empresas..." />
          ) : (
            <EmpresaTable
              empresas={empresas}
              onVerDetalle={handleVerDetalle}
              onToggleEstado={handleToggleEstado}
              onNavegarCrear={() => navigate('/admin/crear')}
            />
          )}
        </div>
      </main>

      <EmpresaDetailModal detalle={detalleModal} onCerrar={() => setDetalleModal(null)} />
    </div>
  )
}
