interface EtiquetaEstadoProps {
  activo: boolean
  textoActivo?: string
  textoInactivo?: string
}

export default function EtiquetaEstado({
  activo,
  textoActivo = 'Activa',
  textoInactivo = 'Inactiva',
}: EtiquetaEstadoProps) {
  return (
    <span
      className={`px-2 py-1 text-xs rounded-full font-medium ${
        activo ? 'bg-exito-suave text-exito-texto' : 'bg-peligro-suave text-peligro-texto'
      }`}
    >
      {activo ? textoActivo : textoInactivo}
    </span>
  )
}
