import Modal from './Modal'

interface ConfirmDialogProps {
  abierto: boolean
  onCerrar: () => void
  onConfirmar: () => void
  titulo: string
  mensaje: string
  loading?: boolean
  textoConfirmar?: string
  variant?: 'danger' | 'primary'
}

export default function ConfirmDialog({
  abierto,
  onCerrar,
  onConfirmar,
  titulo,
  mensaje,
  loading = false,
  textoConfirmar = 'Confirmar',
  variant = 'primary',
}: ConfirmDialogProps) {
  const btnClass =
    variant === 'danger'
      ? 'bg-red-600 hover:bg-red-700'
      : 'bg-blue-600 hover:bg-blue-700'

  return (
    <Modal abierto={abierto} onCerrar={onCerrar} titulo={titulo} size="sm">
      <div className="p-6">
        <p className="text-gray-600">{mensaje}</p>
      </div>
      <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
        <button
          onClick={onCerrar}
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition text-sm font-medium"
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
