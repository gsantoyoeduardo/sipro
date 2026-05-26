import VistaAuditoria from '../../components/dedicated/auditoria/VistaAuditoria'

export default function AuditoriaPage() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-texto">Auditoría</h1>
          <p className="text-texto-secundario text-sm mt-1">Registro histórico de cambios en el sistema</p>
        </div>
      </div>
      <VistaAuditoria />
    </div>
  )
}
