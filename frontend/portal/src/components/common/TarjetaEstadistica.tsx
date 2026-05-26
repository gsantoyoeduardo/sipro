interface TarjetaEstadisticaProps {
  label: string
  valor: number
  color: 'blue' | 'green' | 'red' | 'purple'
}

const colorMap = {
  blue: 'bg-primario/10 text-primario border-primario/20',
  green: 'bg-exito-suave text-exito-texto border-exito/20',
  red: 'bg-peligro-suave text-peligro-texto border-peligro/20',
  purple: 'bg-morado-suave text-morado border-morado/20',
}

export default function TarjetaEstadistica({ label, valor, color }: TarjetaEstadisticaProps) {
  return (
    <div className="bg-fondo-blanco rounded-xl p-4 sm:p-6 shadow-sm border border-borde-suave hover:shadow-md transition">
      <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border text-xs font-medium mb-3 ${colorMap[color]}`}>
        {label}
      </div>
      <div className="text-3xl sm:text-4xl font-bold text-texto">{valor}</div>
    </div>
  )
}
