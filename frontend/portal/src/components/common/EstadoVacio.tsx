interface EstadoVacioProps {
  mensaje: string
  accionLabel?: string
  onAccion?: () => void
  icono?: string
}

export default function EstadoVacio({ mensaje, accionLabel, onAccion, icono = '🏢' }: EstadoVacioProps) {
  return (
    <div className="p-8 sm:p-12 text-center">
      <div className="text-texto-secundario/50 text-5xl mb-4">{icono}</div>
      <p className="text-texto-secundario mb-4">{mensaje}</p>
      {accionLabel && onAccion && (
        <button
          onClick={onAccion}
          className="bg-primario text-white px-6 py-2 rounded-lg hover:bg-primario-oscuro transition"
        >
          {accionLabel}
        </button>
      )}
    </div>
  )
}
