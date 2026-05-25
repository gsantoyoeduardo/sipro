import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { empresaService, type Empresa } from '../api/empresa'
import LoadingSpinner from '../components/common/LoadingSpinner'
import EmpresaTable from '../components/dedicated/EmpresaTable'
import EmpresaDetailModal from '../components/dedicated/EmpresaDetailModal'
import type { EmpresaDetalle } from '../api/empresa'

export default function EmpresaListPage() {
  const navigate = useNavigate()
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [loading, setLoading] = useState(true)
  const [detalleModal, setDetalleModal] = useState<EmpresaDetalle | null>(null)

  const fetchEmpresas = async () => {
    try {
      setLoading(true)
      const { data } = await empresaService.list()
      setEmpresas(data.results || data || [])
    } catch (err) {
      console.error('[EmpresaList] Error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchEmpresas() }, [])

  const handleToggleEstado = async (idempresa: string) => {
    try {
      await empresaService.toggle(idempresa)
      fetchEmpresas()
    } catch (err) {
      console.error('[EmpresaList] Error al cambiar estado:', err)
    }
  }

  const handleVerDetalle = async (idempresa: string) => {
    try {
      const { data } = await empresaService.detalle(idempresa)
      setDetalleModal(data)
    } catch (err) {
      console.error('[EmpresaList] Error al cargar detalle:', err)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#0D0D0D]">Empresas</h1>
          <p className="text-[#64748B] text-sm mt-1">Gestión de empresas clientes del sistema</p>
        </div>
        <button
          onClick={() => navigate('/admin/crear')}
          className="bg-[#0785F2] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#0A31A6] transition shadow-sm"
        >
          + Nueva Empresa
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
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
