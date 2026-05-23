interface EmptyStateProps {
  mensaje: string
  accionLabel?: string
  onAccion?: () => void
  icono?: string
}

export default function EmptyState({ mensaje, accionLabel, onAccion, icono = '🏢' }: EmptyStateProps) {
  return (
    <div className="p-8 sm:p-12 text-center">
      <div className="text-gray-400 text-5xl mb-4">{icono}</div>
      <p className="text-gray-500 mb-4">{mensaje}</p>
      {accionLabel && onAccion && (
        <button
          onClick={onAccion}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          {accionLabel}
        </button>
      )}
    </div>
  )
}
