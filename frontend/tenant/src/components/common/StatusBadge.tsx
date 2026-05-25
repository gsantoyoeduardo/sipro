const variantStyles: Record<string, string> = {
  activa: 'bg-green-100 text-green-800',
  inactiva: 'bg-red-100 text-red-800',
  pendiente: 'bg-yellow-100 text-yellow-800',
  en_proceso: 'bg-blue-100 text-blue-800',
  completada: 'bg-green-100 text-green-800',
  cancelada: 'bg-red-100 text-red-800',
  en_transito: 'bg-purple-100 text-purple-800',
  recibida: 'bg-green-100 text-green-800',
  rechazada: 'bg-red-100 text-red-800',
  success: 'bg-green-100 text-green-800',
  warning: 'bg-yellow-100 text-yellow-800',
  error: 'bg-red-100 text-red-800',
  info: 'bg-blue-100 text-blue-800',
}

interface StatusBadgeProps {
  variant: string
  label?: string
}

export default function StatusBadge({ variant, label }: StatusBadgeProps) {
  const style = variantStyles[variant] || 'bg-gray-100 text-gray-800'
  return (
    <span className={`px-2 py-1 text-xs rounded-full font-medium ${style}`}>
      {label || variant}
    </span>
  )
}
