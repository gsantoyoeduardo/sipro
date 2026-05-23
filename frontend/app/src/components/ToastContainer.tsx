/**
 * Componente ToastContainer.
 * Renderiza una cola de notificaciones toast en la esquina inferior derecha.
 * Cada toast se muestra con un color seg\u00fan su tipo (success, error, info)
 * y puede cerrarse manualmente mediante el bot\u00f3n "x".
 */
import { useToastStore } from '../store/toastStore'

export default function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts)
  const removeToast = useToastStore((state) => state.removeToast)

  // No renderiza nada si no hay notificaciones
  if (toasts.length === 0) return null

  // Mapa de colores seg\u00fan el tipo de toast
  const colors: Record<string, string> = {
    success: 'bg-green-500',
    error: 'bg-red-500',
    info: 'bg-blue-500',
  }

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={${colors[toast.type]} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px] max-w-[400px] animate-slide-in}
        >
          {/* \u00cdcono seg\u00fan el tipo */}
          <span className="text-lg">
            {toast.type === 'success' ? '\u2713' : toast.type === 'error' ? '\u2717' : '\u2139'}
          </span>
          {/* Mensaje del toast */}
          <span className="flex-1 text-sm">{toast.message}</span>
          {/* Bot\u00f3n para cerrar manualmente */}
          <button
            onClick={() => removeToast(toast.id)}
            className="text-white/80 hover:text-white ml-2"
          >
            x
          </button>
        </div>
      ))}
    </div>
  )
}
