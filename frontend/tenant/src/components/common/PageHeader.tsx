interface PageHeaderProps {
  titulo: string
  descripcion?: string
  accionLabel?: string
  onAccion?: () => void
}

export default function PageHeader({ titulo, descripcion, accionLabel, onAccion }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">{titulo}</h1>
        {descripcion && <p className="text-sm text-gray-500 mt-1">{descripcion}</p>}
      </div>
      {accionLabel && onAccion && (
        <button
          onClick={onAccion}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition flex items-center gap-2 self-start"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          {accionLabel}
        </button>
      )}
    </div>
  )
}
