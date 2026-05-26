import Modal from './Modal'

interface DialogoConfirmacionProps {
  abierto: boolean
  onCerrar: () => void
  onConfirmar: () => void
  titulo: string
  mensaje: string
  loading?: boolean
  textoConfirmar?: string
  variant?: 'danger' | 'primary'
}

export default function DialogoConfirmacion({
  abierto,
  onCerrar,
  onConfirmar,
  titulo,
  mensaje,
  loading = false,
  textoConfirmar = 'Confirmar',
  variant = 'primary',
}: DialogoConfirmacionProps) {
  const btnClass =
    variant === 'danger'
      ? 'bg-peligro hover:bg-peligro-texto'
      : 'bg-primario hover:bg-primario-oscuro'

  return (
    <Modal abierto={abierto} onCerrar={onCerrar} titulo={titulo} size="sm">
      <div className="p-6">
        <p className="text-texto-secundario">{mensaje}</p>
      </div>
      <div className="p-6 border-t border-borde-suave flex justify-end gap-3">
        <button
          onClick={onCerrar}
          className="px-4 py-2 border border-borde rounded-lg hover:bg-fondo-sutil transition text-sm font-medium"
          disabled={loading}
        >
          Cancelar
        </button>
        <button
          onClick={onConfirmar}
          disabled={loading}
          className={`px-4 py-2 text-white rounded-lg transition text-sm font-medium disabled:opacity-50 flex items-center gap-2 ${btnClass}`}
        >
          {loading && (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          {textoConfirmar}
        </button>
      </div>
    </Modal>
  )
}
