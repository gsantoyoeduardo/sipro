import type { Almacen } from '../../types'

interface MapToolbarProps {
  almacenes: Almacen[]
  selectedAlmacen: string
  onSelectAlmacen: (id: string) => void
  onAddZona: () => void
  onAddPasillo: () => void
  onAddEstante: () => void
  zonasCount: number
  pasillosCount: number
  addingNodoType: string
  onNodoTypeChange: (tipo: string) => void
  onStartPlaceNodo: () => void
  placingNodo: boolean
  showNodos: boolean
  onToggleNodos: (show: boolean) => void
  showConexiones: boolean
  onToggleConexiones: (show: boolean) => void
  dirty: boolean
  saving: boolean
  onSave: () => void
  onCancel: () => void
}

export default function MapToolbar({
  almacenes, selectedAlmacen, onSelectAlmacen,
  onAddZona, onAddPasillo, onAddEstante,
  zonasCount, pasillosCount,
  addingNodoType, onNodoTypeChange, onStartPlaceNodo, placingNodo,
  showNodos, onToggleNodos, showConexiones, onToggleConexiones,
  dirty, saving, onSave, onCancel,
}: MapToolbarProps) {
  return (
    <div className="flex justify-between items-center mb-4">
      <div className="flex items-center gap-3 flex-wrap">
        <select value={selectedAlmacen} onChange={(e) => { onSelectAlmacen(e.target.value) }} className="px-3 py-2 border rounded-lg">
          <option value="">Seleccionar almacén</option>
          {almacenes.map((a) => (
            <option key={a.idalmacen} value={a.idalmacen}>
              {a.nombre} ({a.ancho || '?'}×{a.alto || '?'})
            </option>
          ))}
        </select>
        {selectedAlmacen && <>
          <button onClick={onAddZona} className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">+ Zona</button>
          <button onClick={onAddPasillo} disabled={zonasCount === 0} className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm">+ Pasillo</button>
          <button onClick={onAddEstante} disabled={pasillosCount === 0} className="px-3 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 text-sm">+ Estante</button>
          <div className="flex items-center gap-1">
            <select value={addingNodoType} onChange={(e) => onNodoTypeChange(e.target.value)} className="px-2 py-2 border rounded-lg text-sm">
              <option value="entrada">Entrada</option>
              <option value="salida">Salida</option>
              <option value="esquina">Esquina</option>
              <option value="interseccion">Intersección</option>
              <option value="punto_recogida">P. Recogida</option>
            </select>
            <button onClick={onStartPlaceNodo} className={'px-3 py-2 rounded-lg text-sm ' + (placingNodo ? 'bg-red-600 text-white' : 'bg-purple-600 text-white hover:bg-purple-700')}>
              {placingNodo ? 'Click en mapa' : '+ Nodo'}
            </button>
          </div>
        </>}
      </div>
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-1 text-sm">
          <input type="checkbox" checked={showNodos} onChange={(e) => onToggleNodos(e.target.checked)} /> Nodos
        </label>
        <label className="flex items-center gap-1 text-sm">
          <input type="checkbox" checked={showConexiones} onChange={(e) => onToggleConexiones(e.target.checked)} /> Conex.
        </label>
        {dirty && <>
          <button onClick={onSave} disabled={saving} className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm">
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
          <button onClick={onCancel} className="px-3 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 text-sm">Cancelar</button>
        </>}
      </div>
    </div>
  )
}
