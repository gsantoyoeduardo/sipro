import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { empresaService } from '../api/empresa'
import type { Empresa, Stats } from '../api/empresa'
import StatCard from '../components/common/StatCard'
import LoadingSpinner from '../components/common/LoadingSpinner'
import EmpresaTable from '../components/dedicated/EmpresaTable'
import EmpresaDetailModal from '../components/dedicated/EmpresaDetailModal'
import type { EmpresaDetalle } from '../api/empresa'

export default function AdminDashboardPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [stats, setStats] = useState<Stats>({
    total_empresas: 0, total_usuarios: 0,
    empresas_activas: 0, empresas_inactivas: 0,
  })
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0D0D0D]">Dashboard</h1>
          <p className="text-[#64748B] text-sm mt-1">Resumen general del sistema</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setRefreshKey(prev => prev + 1)}
            className="border border-gray-300 text-[#0D0D0D] px-3 py-2 rounded-lg text-sm hover:bg-gray-50 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button
            onClick={() => navigate('/admin/crear')}
            className="bg-[#0785F2] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#0A31A6] transition"
          >
            + Nueva Empresa
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Empresas" valor={stats.total_empresas} color="blue" />
        <StatCard label="Activas" valor={stats.empresas_activas} color="green" />
        <StatCard label="Inactivas" valor={stats.empresas_inactivas} color="red" />
        <StatCard label="Usuarios Totales" valor={stats.total_usuarios} color="purple" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-[#0D0D0D]">Empresas Registradas</h2>
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

      <EmpresaDetailModal detalle={detalleModal} onCerrar={() => setDetalleModal(null)} />
    </div>
  )
}
