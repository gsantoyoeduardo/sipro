interface EmptyStateProps {
  mensaje: string
  accionLabel?: string
  onAccion?: () => void
}

export default function EmptyState({ mensaje, accionLabel, onAccion }: EmptyStateProps) {
  return (
    <div className="text-center py-12">
      <p className="text-gray-500 mb-4">{mensaje}</p>
      {accionLabel && onAccion && (
        <button onClick={onAccion} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
          {accionLabel}
        </button>
      )}
    </div>
  )
}
