interface InterruptorProps {
  activo: boolean
  onChange: () => void
  labelActivo?: string
  labelInactivo?: string
}

export default function Interruptor({
  activo,
  onChange,
  labelActivo = 'Activo',
  labelInactivo = 'Inactivo',
}: InterruptorProps) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onChange()
      }}
      className="relative inline-flex items-center gap-3 focus:outline-none group"
      role="switch"
      aria-checked={activo}
    >
      <span
        className={`
          relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent
          transition-colors duration-200 ease-in-out focus:outline-none
          ${activo ? 'bg-exito' : 'bg-peligro'}
        `}
      >
        <span
          className={`
            pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow
            ring-0 transition duration-200 ease-in-out
            ${activo ? 'translate-x-5' : 'translate-x-0'}
          `}
        />
      </span>
      <span className={`text-xs font-semibold ${activo ? 'text-exito-texto' : 'text-peligro-texto'}`}>
        {activo ? labelActivo : labelInactivo}
      </span>
    </button>
  )
}
