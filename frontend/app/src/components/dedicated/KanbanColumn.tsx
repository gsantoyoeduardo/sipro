import type { OrdenPicking } from '../../types'
import KanbanCard from './KanbanCard'

interface KanbanColumnProps {
  estado: OrdenPicking['estado']
  label: string
  colorClass: string
  ordenes: OrdenPicking[]
  onOpenDetalles: (orden: OrdenPicking) => void
  onAction: (orden: OrdenPicking, action: string) => void
}

export default function KanbanColumn({
  estado, label, colorClass, ordenes, onOpenDetalles, onAction,
}: KanbanColumnProps) {
  const filtered = ordenes.filter((o) => o.estado === estado)

  return (
    <div className={`rounded-lg border-2 ${colorClass} p-3`}>
      <h3 className="font-semibold text-sm mb-3 flex justify-between">
        {label}
        <span className="bg-white rounded-full px-2 text-xs">{filtered.length}</span>
      </h3>
      <div className="space-y-2 max-h-[500px] overflow-y-auto">
        {filtered.map((orden) => (
          <KanbanCard
            key={orden.idordenpicking}
            orden={orden}
            estado={estado}
            onOpenDetalles={onOpenDetalles}
            onAction={onAction}
          />
        ))}
        {filtered.length === 0 && (
          <p className="text-xs text-gray-400 text-center py-4">Sin órdenes</p>
        )}
      </div>
    </div>
  )
}
