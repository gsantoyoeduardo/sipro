import type { OrdenPicking } from '../../types'

interface KanbanCardProps {
  orden: OrdenPicking
  estado: OrdenPicking['estado']
  onOpenDetalles: (orden: OrdenPicking) => void
  onAction: (orden: OrdenPicking, action: string) => void
}

export default function KanbanCard({ orden, estado, onOpenDetalles, onAction }: KanbanCardProps) {
  return (
    <div
      className="bg-white rounded-lg shadow-sm p-3 border border-gray-100 cursor-pointer hover:shadow-md transition"
      onClick={() => onOpenDetalles(orden)}
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="font-bold text-sm">{orden.numero_orden}</p>
          <p className="text-xs text-gray-500">{orden.almacen_nombre}</p>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full ${orden.prioridad > 1 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
          {orden.prioridad > 1 ? `P${orden.prioridad}` : 'Normal'}
        </span>
      </div>
      <div className="flex justify-between mt-2 text-xs text-gray-500">
        <span>{orden.total_pickeado}/{orden.total_productos} items</span>
        <span>{orden.usuario_nombre || '—'}</span>
      </div>
      <div className="flex gap-1 mt-2" onClick={(e) => e.stopPropagation()}>
        {estado === 'pendiente' && (
          <button onClick={() => onAction(orden, 'iniciar')} className="flex-1 text-xs bg-blue-600 text-white py-1 rounded hover:bg-blue-700">Iniciar</button>
        )}
        {estado === 'en_proceso' && (
          <>
            <button onClick={() => onAction(orden, 'completar')} className="flex-1 text-xs bg-green-600 text-white py-1 rounded hover:bg-green-700">Completar</button>
            <button onClick={() => onAction(orden, 'cancelar')} className="text-xs bg-red-600 text-white py-1 px-2 rounded hover:bg-red-700">X</button>
          </>
        )}
      </div>
    </div>
  )
}
