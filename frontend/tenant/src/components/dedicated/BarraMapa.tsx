import type { Almacen, Sucursal } from '../../types'

interface BarraMapaProps {
  sucursales: Sucursal[]
  sucursalSel: string
  onSelectSucursal: (id: string) => void
  almacenes: Almacen[]
  almacenSel: string
  onSelectAlmacen: (id: string) => void
  nivelVista: 'sucursal' | 'almacen'
  onCambiarNivel: (nivel: 'sucursal' | 'almacen') => void
  onAgregarZona: () => void
  onAgregarAlmacen: () => void
  onAgregarEstante: () => void
  onStartPlaceNodo: () => void
  placingNodo: boolean
  addingNodoType: string
  onNodoTypeChange: (tipo: string) => void
  showNodos: boolean
  onToggleNodos: (show: boolean) => void
  showConexiones: boolean
  onToggleConexiones: (show: boolean) => void
  dirty: boolean
  saving: boolean
  onSave: () => void
  onCancel: () => void
  zonasCount: number
  almacenesCount: number
  estantesCount: number
  nodosCount: number
}

export default function BarraMapa({
  sucursales, sucursalSel, onSelectSucursal,
  almacenes, almacenSel, onSelectAlmacen,
  nivelVista, onCambiarNivel,
  onAgregarZona, onAgregarAlmacen, onAgregarEstante,
  onStartPlaceNodo, placingNodo,
  addingNodoType, onNodoTypeChange,
  showNodos, onToggleNodos, showConexiones, onToggleConexiones,
  dirty, saving, onSave, onCancel,
  zonasCount, almacenesCount, estantesCount, nodosCount,
}: BarraMapaProps) {
  return (
    <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
      <div className="flex items-center gap-3 flex-wrap">
        {/* Toggle nivel */}
        <div className="flex rounded-lg border border-borde overflow-hidden">
          <button
            onClick={() => onCambiarNivel('sucursal')}
            className={`px-3 py-2 text-sm font-medium transition ${nivelVista === 'sucursal' ? 'bg-accion text-white' : 'bg-fondo-blanco text-texto-secundario hover:bg-fondo'}`}
          >
            Sucursal
          </button>
          <button
            onClick={() => onCambiarNivel('almacen')}
            className={`px-3 py-2 text-sm font-medium transition ${nivelVista === 'almacen' ? 'bg-accion text-white' : 'bg-fondo-blanco text-texto-secundario hover:bg-fondo'}`}
          >
            Almacén
          </button>
        </div>

        {/* Selector sucursal */}
        <select value={sucursalSel} onChange={(e) => onSelectSucursal(e.target.value)} className="px-3 py-2 border border-borde rounded-lg text-sm">
          <option value="">Seleccionar sucursal</option>
          {sucursales.map((s) => <option key={s.idsucursal} value={s.idsucursal}>{s.nombre}</option>)}
        </select>

        {/* Selector almacén (solo en modo almacén) */}
        {nivelVista === 'almacen' && (
          <select value={almacenSel} onChange={(e) => onSelectAlmacen(e.target.value)} className="px-3 py-2 border border-borde rounded-lg text-sm">
            <option value="">Seleccionar almacén</option>
            {almacenes.map((a) => <option key={a.idalmacen} value={a.idalmacen}>{a.nombre}</option>)}
          </select>
        )}

        {/* Botones de acción según nivel */}
        {sucursalSel && nivelVista === 'sucursal' && <>
          <button onClick={onAgregarZona} className="px-3 py-2 bg-primario text-white rounded-lg hover:bg-primario-oscuro text-sm">+ Zona</button>
          <button onClick={onAgregarAlmacen} className="px-3 py-2 bg-accion text-white rounded-lg hover:bg-accion-hover text-sm">+ Almacén</button>
        </>}

        {almacenSel && nivelVista === 'almacen' && <>
          <button onClick={onAgregarZona} className="px-3 py-2 bg-primario text-white rounded-lg hover:bg-primario-oscuro text-sm">+ Zona</button>
          <button onClick={onAgregarEstante} disabled={zonasCount === 0} className="px-3 py-2 bg-accion text-white rounded-lg hover:bg-accion-hover disabled:opacity-50 text-sm">+ Estante</button>
          <div className="flex items-center gap-1">
            <select value={addingNodoType} onChange={(e) => onNodoTypeChange(e.target.value)} className="px-2 py-2 border rounded-lg text-sm">
              <option value="entrada">Entrada</option>
              <option value="salida">Salida</option>
              <option value="esquina">Esquina</option>
              <option value="interseccion">Intersección</option>
              <option value="punto_recogida">P. Recogida</option>
            </select>
            <button onClick={onStartPlaceNodo} className={`px-3 py-2 rounded-lg text-sm ${placingNodo ? 'bg-peligro text-white' : 'bg-morado text-white hover:bg-morado-hover'}`}>
              {placingNodo ? 'Click en mapa' : '+ Nodo'}
            </button>
          </div>
        </>}
      </div>

      <div className="flex items-center gap-3">
        <span className="text-xs text-texto-secundario">
          {zonasCount}Z · {almacenesCount}A · {estantesCount}E · {nodosCount}N
        </span>
        {nivelVista === 'almacen' && <>
          <label className="flex items-center gap-1 text-sm">
            <input type="checkbox" checked={showNodos} onChange={(e) => onToggleNodos(e.target.checked)} /> Nodos
          </label>
          <label className="flex items-center gap-1 text-sm">
            <input type="checkbox" checked={showConexiones} onChange={(e) => onToggleConexiones(e.target.checked)} /> Conex.
          </label>
        </>}
        {dirty && <>
          <button onClick={onSave} disabled={saving} className="px-3 py-2 bg-exito text-white rounded-lg hover:bg-exito-hover disabled:opacity-50 text-sm">
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
          <button onClick={onCancel} className="px-3 py-2 bg-fondo rounded-lg hover:bg-fondo-hover text-sm">Cancelar</button>
        </>}
      </div>
    </div>
  )
}
