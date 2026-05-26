import VistaAuditoria from '../auditoria/VistaAuditoria'

interface Props {
  idempresa: string
}

export default function TabAuditoriaEmpresa({ idempresa }: Props) {
  return (
    <div>
      <p className="text-sm text-texto-secundario mb-4">
        Historial de cambios y operaciones realizadas en esta empresa
      </p>
      <VistaAuditoria idempresa={idempresa} />
    </div>
  )
}
