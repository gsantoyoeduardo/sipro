/**
 * Store de notificaciones toast (Zustand).
 * Administra una cola de notificaciones temporales con auto-eliminaci\u00f3n
 * despu\u00e9s de 4 segundos. Soporta tipos: success, error, info.
 */
import { create } from 'zustand'

interface Toast {
  id: number
  type: 'success' | 'error' | 'info'
  message: string
}

interface ToastState {
  toasts: Toast[]
  addToast: (type: Toast['type'], message: string) => void
  removeToast: (id: number) => void
}

// Contador incremental para IDs \u00fanicos de toast
let toastId = 0

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  // Agrega un nuevo toast y programa su eliminaci\u00f3n autom\u00e1tica tras 4s
  addToast: (type, message) => {
    const id = ++toastId
    set((state) => ({ toasts: [...state.toasts, { id, type, message }] }))
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
    }, 4000)
  },

  // Elimina un toast por su ID (cierre manual)
  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
  },
}))
