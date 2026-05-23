/**
 * Hook personalizado useSubmit.
 * Encapsula la l\u00f3gica de env\u00edo de formularios con manejo de estado
 * de carga, errores y notificaciones toast de \u00e9xito/error.
 */
import { useState, useCallback } from 'react'
import { useToastStore } from '../store/toastStore'

interface UseSubmitOptions {
  onSuccess?: () => void
  successMessage?: string
  onError?: (message: string) => void
}

export function useSubmit<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  options: UseSubmitOptions = {}
) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const addToast = useToastStore((state) => state.addToast)

  // Funci\u00f3n de env\u00edo que ejecuta fn, maneja errores y muestra notificaciones
  const submit = useCallback(
    async (...args: Parameters<T>) => {
      setIsSubmitting(true)
      setError(null)
      try {
        const result = await fn(...args)
        if (options.successMessage) {
          addToast('success', options.successMessage)
        }
        options.onSuccess?.()
        return result
      } catch (err: any) {
        // Extrae el mensaje de error desde diferentes formatos de respuesta API
        const message =
          err?.response?.data?.error ||
          err?.response?.data?.detail ||
          err?.response?.data?.message ||
          (typeof err?.response?.data === 'string' ? err.response.data : null) ||
          (typeof err?.response?.data === 'object'
            ? Object.values(err.response.data).flat().join('; ')
            : null) ||
          err?.message ||
          'Error inesperado'
        setError(message)
        addToast('error', message)
        options.onError?.(message)
        return null
      } finally {
        setIsSubmitting(false)
      }
    },
    [fn, options, addToast]
  )

  return { submit, isSubmitting, error, setError }
}
