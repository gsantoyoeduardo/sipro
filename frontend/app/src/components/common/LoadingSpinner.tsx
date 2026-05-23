interface LoadingSpinnerProps {
  mensaje?: string
}

export default function LoadingSpinner({ mensaje = 'Cargando...' }: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-3" />
      <p className="text-gray-500 text-sm">{mensaje}</p>
    </div>
  )
}
