interface StatusBadgeProps {
  activo: boolean
  textoActivo?: string
  textoInactivo?: string
}

export default function StatusBadge({
  activo,
  textoActivo = 'Activa',
  textoInactivo = 'Inactiva',
}: StatusBadgeProps) {
  return (
    <span
      className={`px-2 py-1 text-xs rounded-full font-medium ${
        activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
      }`}
    >
      {activo ? textoActivo : textoInactivo}
    </span>
  )
}
