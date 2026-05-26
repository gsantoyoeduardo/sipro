interface ModalProps {
  abierto: boolean
  onCerrar: () => void
  titulo: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}

export default function Modal({ abierto, onCerrar, titulo, children, size = 'md' }: ModalProps) {
  if (!abierto) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onCerrar}
      onKeyDown={(e) => { if (e.key === 'Escape') onCerrar() }}
    >
      <div
        className={`bg-fondo-blanco rounded-2xl shadow-2xl ${sizeClasses[size]} w-full max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-borde-suave">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-texto">{titulo}</h2>
            <button onClick={onCerrar} className="text-texto-secundario hover:text-texto text-2xl leading-none">&times;</button>
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}
