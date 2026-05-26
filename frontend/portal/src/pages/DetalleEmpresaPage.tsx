import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { empresaService, type EmpresaDetalle } from '../api/empresa'
import Cargando from '../components/common/Cargando'
import TabDatosEmpresa from '../components/dedicated/empresa/TabDatosEmpresa'
import TabUsuariosEmpresa from '../components/dedicated/empresa/TabUsuariosEmpresa'
import TabSesionesEmpresa from '../components/dedicated/empresa/TabSesionesEmpresa'
import TabAuditoriaEmpresa from '../components/dedicated/empresa/TabAuditoriaEmpresa'

const tabs = [
  { id: 'datos', label: 'Datos', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
  { id: 'usuarios', label: 'Usuarios', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z' },
  { id: 'sesiones', label: 'Sesiones', icon: 'M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z' },
  { id: 'auditoria', label: 'Auditoría', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
]

export default function DetalleEmpresaPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [detalle, setDetalle] = useState<EmpresaDetalle | null>(null)
  const [loading, setLoading] = useState(true)
  const [tabActivo, setTabActivo] = useState('datos')

  const fetchDetalle = async () => {
    if (!id) return
    setLoading(true)
    try {
      const { data } = await empresaService.detalle(id)
      setDetalle(data)
    } catch {
      navigate('/admin/empresas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDetalle() }, [id])

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Cargando mensaje="Cargando empresa..." />
    </div>
  )

  if (!detalle) return null

  const { empresa } = detalle

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/admin/empresas')}
          className="p-2 text-texto-secundario hover:text-texto hover:bg-fondo-sutil rounded-lg transition"
          title="Volver"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold text-texto">{empresa.razonsocial}</h1>
          <p className="text-texto-secundario text-sm mt-0.5">
            RUC: {empresa.ruc}
            {empresa.nombrecomercial && empresa.nombrecomercial !== empresa.razonsocial && (
              <> · {empresa.nombrecomercial}</>
            )}
          </p>
        </div>
      </div>

      <div className="border-b border-borde mb-6">
        <nav className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTabActivo(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition ${
                tabActivo === tab.id
                  ? 'border-accion text-accion'
                  : 'border-transparent text-texto-secundario hover:text-texto hover:border-borde'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
              </svg>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div>
        {tabActivo === 'datos' && <TabDatosEmpresa detalle={detalle} onRefresh={fetchDetalle} />}
        {tabActivo === 'usuarios' && <TabUsuariosEmpresa idempresa={id!} />}
        {tabActivo === 'sesiones' && <TabSesionesEmpresa idempresa={id!} />}
        {tabActivo === 'auditoria' && <TabAuditoriaEmpresa idempresa={id!} />}
      </div>
    </div>
  )
}
