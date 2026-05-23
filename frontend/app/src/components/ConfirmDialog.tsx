/**
 * Componente ConfirmDialog.
 * Di\u00e1logo de confirmaci\u00f3n construido sobre Modal, utilizado para
 * acciones destructivas (eliminar, desactivar, etc.). Muestra un mensaje
 * y botones de Cancelar / Confirmar con variante de color (danger o primary).
 */
import Modal from './Modal'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  confirmVariant?: 'danger' | 'primary'
  isLoading?: boolean
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirmar',
  confirmVariant = 'primary',
  isLoading = false,
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      {/* Mensaje de confirmaci\u00f3n */}
      <p className="text-sm text-gray-600 mb-6">{message}</p>
      {/* Botones de acci\u00f3n */}
      <div className="flex justify-end gap-3">
        <button
          onClick={onClose}
          disabled={isLoading}
          className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          onClick={onConfirm}
          disabled={isLoading}
          className={px-4 py-2 text-sm rounded-lg text-white disabled:opacity-50 flex items-center gap-2 }
        >
          {/* Spinner durante la carga */}
          {isLoading && (
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
