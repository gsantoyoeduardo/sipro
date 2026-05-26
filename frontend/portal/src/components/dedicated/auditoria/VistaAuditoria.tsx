import { useState, useEffect } from 'react'
import { empresaService, type Empresa } from '../../../api/empresa'
import { auditoriaService, type AuditoriaEntry, type AuditoriaFiltros } from '../../../api/auditoria'
import Cargando from '../../common/Cargando'

interface Props {
  idempresa?: string
}

const OPERACIONES = ['CREATE', 'UPDATE', 'DELETE']

function formatearFecha(iso: string) {
  return new Date(iso).toLocaleString('es-PE', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

function textoDiferencia(datosAnt: Record<string, unknown> | null, datosNue: Record<string, unknown> | null) {
  if (!datosAnt && !datosNue) return 'Sin datos'
  if (!datosAnt) return 'Creación de registro'
  if (!datosNue) return 'Eliminación de registro'
  const cambios: string[] = []
  for (const key of Object.keys(datosNue)) {
    if (JSON.stringify(datosAnt[key]) !== JSON.stringify(datosNue[key])) {
      const viejo = datosAnt[key] !== undefined ? String(datosAnt[key]) : '(vacio)'
      const nuevo = datosNue[key] !== undefined ? String(datosNue[key]) : '(vacio)'
      cambios.push(`${key}: ${viejo} → ${nuevo}`)
    }
  }
  return cambios.length > 0 ? cambios.join(', ') : 'Sin cambios detectados'
}

export default function VistaAuditoria({ idempresa: idempresaProp }: Props) {
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [idempresa, setIdempresa] = useState(idempresaProp || '')
  const [tabla, setTabla] = useState('empresas')
  const [entries, setEntries] = useState<AuditoriaEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [filtros, setFiltros] = useState<AuditoriaFiltros>({})
  const [alertFecha, setAlertFecha] = useState('')
  const [expandido, setExpandido] = useState<string | null>(null)

  const mostrarSelector = !idempresaProp

  useEffect(() => {
    if (mostrarSelector) {
      empresaService.listar().then(({ data }) => {
        const lista = data.results || data || []
        setEmpresas(lista)
        if (lista.length > 0 && !idempresa) setIdempresa(lista[0].idempresa)
      }).catch(console.error)
    }
  }, [mostrarSelector])

  useEffect(() => {
    if (!idempresa) return
    const fetchData = async () => {
      try {
        setLoading(true)
        setError('')
        const { data } = await auditoriaService.list(idempresa, tabla, filtros)
        setEntries(data || [])
      } catch (err: any) {
        setEntries([])
        setError(err.response?.data?.error || 'Error al cargar auditoría')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [idempresa, tabla, filtros])

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault()
    setAlertFecha('')
    if (filtros.desde && filtros.hasta && filtros.desde > filtros.hasta) {
      setAlertFecha('La fecha "desde" no puede ser mayor que la fecha "hasta"')
      return
    }
    setFiltros({ ...filtros })
  }

  const limpiar = () => {
    setFiltros({})
    setAlertFecha('')
    setError('')
  }

  const tipoColor = (op: string) => {
    switch (op) {
      case 'CREATE': return 'bg-exito-suave text-exito-texto'
      case 'UPDATE': return 'bg-advertencia-suave text-accion'
      case 'DELETE': return 'bg-peligro-suave text-peligro-texto'
      default: return 'bg-fondo-sutil text-texto-secundario'
    }
  }

  return (
    <div>
      {mostrarSelector && (
        <div className="bg-fondo-blanco rounded-xl shadow-sm border border-borde p-4 mb-6">
          <div className="max-w-xs">
            <label className="block text-xs font-medium text-texto mb-1">Empresa</label>
            <select value={idempresa} onChange={e => setIdempresa(e.target.value)}
              className="w-full px-3 py-2 border border-borde rounded-lg focus:ring-2 focus:ring-accion focus:outline-none text-sm">
              {empresas.map(e => <option key={e.idempresa} value={e.idempresa}>{e.razonsocial}</option>)}
            </select>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1">
          <label className="block text-xs font-medium text-texto mb-1">Tabla</label>
          <select value={tabla} onChange={e => { setTabla(e.target.value); setExpandido(null) }}
            className="w-full px-3 py-2 border border-borde rounded-lg focus:ring-2 focus:ring-accion focus:outline-none text-sm">
            {auditoriaService.TABLAS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-texto mb-1">Operación</label>
          <select value={filtros.tipo || ''} onChange={e => setFiltros({...filtros, tipo: e.target.value || undefined})}
            className="w-full px-3 py-2 border border-borde rounded-lg focus:ring-2 focus:ring-accion focus:outline-none text-sm">
            <option value="">Todas</option>
            {OPERACIONES.map(op => <option key={op} value={op}>{op}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-texto mb-1">Desde</label>
          <input type="date" value={filtros.desde || ''} onChange={e => setFiltros({...filtros, desde: e.target.value || undefined})}
            className="w-full px-3 py-2 border border-borde rounded-lg focus:ring-2 focus:ring-accion focus:outline-none text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-texto mb-1">Hasta</label>
          <input type="date" value={filtros.hasta || ''} onChange={e => setFiltros({...filtros, hasta: e.target.value || undefined})}
            className="w-full px-3 py-2 border border-borde rounded-lg focus:ring-2 focus:ring-accion focus:outline-none text-sm" />
        </div>
        <div className="flex items-end gap-2">
          <button type="button" onClick={handleFilter}
            className="px-4 py-2 bg-accion text-white rounded-lg text-sm font-medium hover:bg-accion/90 transition">Filtrar</button>
          <button type="button" onClick={limpiar}
            className="px-4 py-2 border border-borde rounded-lg text-sm text-texto-secundario hover:bg-fondo-sutil transition">Limpiar</button>
        </div>
      </div>

      {alertFecha && <p className="text-peligro text-xs mb-3">{alertFecha}</p>}
      {error && <div className="bg-peligro-suave text-peligro-texto p-3 rounded-lg mb-4 text-sm border border-peligro/20">{error}</div>}

      {loading ? (
        <Cargando mensaje="Cargando auditoría..." />
      ) : entries.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-texto-secundario/30 text-5xl mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-texto-secundario font-medium">No se encontraron registros de auditoría</p>
        </div>
      ) : (
        <div>
          <p className="text-sm text-texto-secundario mb-3">
            <strong className="text-texto">{entries.length}</strong> registro{entries.length !== 1 ? 's' : ''}
          </p>
          <div className="space-y-2">
            {entries.map((entry) => (
              <div key={entry.idauditoria} className="bg-fondo-blanco rounded-xl border border-borde-suave overflow-hidden">
                <button
                  onClick={() => setExpandido(expandido === entry.idauditoria ? null : entry.idauditoria)}
                  className="w-full flex items-center gap-4 px-4 py-3 hover:bg-fondo-sutil/50 transition text-left"
                >
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full w-16 text-center shrink-0 ${tipoColor(entry.tipooperacion)}`}>
                    {entry.tipooperacion}
                  </span>
                  <span className="text-xs text-texto-secundario font-mono w-20 shrink-0">{formatearFecha(entry.fechaevento)}</span>
                  <span className="text-sm text-texto flex-1 min-w-0 truncate">
                    {entry.idusuario ? `Usuario: ${entry.idusuario.slice(0, 8)}...` : 'Sistema'}
                  </span>
                  {entry.ip && <span className="text-xs text-texto-secundario hidden sm:block">IP: {entry.ip}</span>}
                  <svg className={`w-4 h-4 text-texto-secundario transition-transform shrink-0 ${expandido === entry.idauditoria ? 'rotate-180' : ''}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandido === entry.idauditoria && (
                  <div className="px-4 pb-4 border-t border-borde-suave">
                    <div className="pt-3 space-y-2">
                      <div className="grid grid-cols-2 gap-2 text-xs text-texto-secundario">
                        <div><strong>Tabla:</strong> {entry.tabla}</div>
                        <div><strong>ID Registro:</strong> {entry.idregistro}</div>
                        <div><strong>IP:</strong> {entry.ip || '\u2014'}</div>
                        <div><strong>Dispositivo:</strong> {entry.dispositivo || '\u2014'}</div>
                      </div>
                      <div className="mt-2">
                        <p className="text-xs font-medium text-texto-secundario uppercase tracking-wider mb-1">Detalle del Cambio</p>
                        <div className="bg-fondo-sutil rounded-lg p-3 text-xs text-texto font-mono leading-relaxed break-words">
                          {textoDiferencia(entry.datosanteriores, entry.datosnuevos)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
