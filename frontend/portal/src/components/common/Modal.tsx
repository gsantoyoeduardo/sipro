import { useEffect, useRef } from 'react'

interface ModalProps {
  abierto: boolean
  onCerrar: () => void
  titulo: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
}

export default function Modal({ abierto, onCerrar, titulo, children, size = 'md' }: ModalProps) {
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!abierto) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onCerrar() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [abierto, onCerrar])

  if (!abierto) return null

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onCerrar}
    >
      <div
        ref={contentRef}
        className={`bg-white rounded-2xl shadow-2xl ${sizeClasses[size]} w-full max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-800">{titulo}</h2>
            <button onClick={onCerrar} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
          </div>
        </div>
        {children}
      </div>
    </div>
  )
}

interface ModalFooterProps {
  children: React.ReactNode
}

export function ModalFooter({ children }: ModalFooterProps) {
  return (
    <div className="p-6 border-t border-gray-100">
      {children}
    </div>
  )
}

interface ModalBodyProps {
  children: React.ReactNode
}

export function ModalBody({ children }: ModalBodyProps) {
  return <div className="p-6 space-y-4">{children}</div>
}
