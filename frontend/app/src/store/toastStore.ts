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

let toastId = 0

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (type, message) => {
    const id = ++toastId
    set((state) => ({ toasts: [...state.toasts, { id, type, message }] }))
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
    }, 4000)
  },
  removeToast: (id) => {
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }))
  },
}))
