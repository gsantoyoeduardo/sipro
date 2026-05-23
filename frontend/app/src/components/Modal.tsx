/**
 * Componente de Modal reutilizable.
 * Muestra una ventana modal con overlay, t\u00edtulo, contenido y bot\u00f3n de cierre.
 * Soporta tres tama\u00f1os: sm, md, lg.
 */
interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}

export default function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  // No renderiza nada si el modal est\u00e1 cerrado
  if (!isOpen) return null

  // Clases de ancho m\u00e1ximo seg\u00fan el tama\u00f1o
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay semitransparente que cierra el modal al hacer clic fuera */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      {/* Contenedor del modal */}
      <div className={elative bg-white rounded-lg shadow-xl w-full mx-4  max-h-[90vh] flex flex-col}>
        {/* Cabecera con t\u00edtulo y bot\u00f3n de cierre */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ×
          </button>
        </div>
        {/* Contenido del modal con scroll si es necesario */}
        <div className="px-6 py-4 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  )
}
