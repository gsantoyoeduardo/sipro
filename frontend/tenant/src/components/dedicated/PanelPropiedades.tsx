import type { Zona, Estante, Nodo, Almacen } from '../../types'

interface EntitySelection {
  type: string
  id: string
}

interface PanelPropiedadesProps {
  selectedEntity: EntitySelection | null
  zona: Zona | null
  estante: Estante | null
  nodo: Nodo | null
  almacen: Almacen | null
  zonas: Zona[]
  onUpdateZona: (id: string, data: Partial<Zona>) => void
  onUpdateEstante: (id: string, data: Partial<Estante>) => void
  onUpdateNodo: (id: string, data: Partial<Nodo>) => void
  onUpdateAlmacen: (id: string, data: Partial<Almacen>) => void
  onDelete: () => void
  deleting: boolean
  setDirty: (dirty: boolean) => void
  placingNodo: boolean
}

export default function PanelPropiedades({
  selectedEntity, zona, estante, nodo, almacen,
  zonas,
  onUpdateZona, onUpdateEstante, onUpdateNodo, onUpdateAlmacen,
  onDelete, deleting, setDirty, placingNodo,
}: PanelPropiedadesProps) {
  const update = (field: string, value: unknown) => {
    setDirty(true)
    if (zona) onUpdateZona(zona.idzona, { [field]: value } as Partial<Zona>)
    else if (estante) onUpdateEstante(estante.idestante, { [field]: value } as Partial<Estante>)
    else if (nodo) onUpdateNodo(nodo.idnodo, { [field]: value } as Partial<Nodo>)
    else if (almacen) onUpdateAlmacen(almacen.idalmacen, { [field]: value } as Partial<Almacen>)
  }

  if (!selectedEntity && !placingNodo) {
    return <div className="bg-fondo-blanco rounded-xl border border-borde-suave p-4 text-sm text-texto-secundario text-center">Seleccione un elemento en el mapa</div>
  }

  if (almacen) {
    return (
      <div className="bg-fondo-blanco rounded-xl border border-borde-suave p-4 text-sm space-y-3">
        <h3 className="font-bold text-texto">Almacén: {almacen.nombre}</h3>
        <Field label="Nombre" value={almacen.nombre} onChange={(v) => update('nombre', v)} />
        <Field label="Código" value={almacen.codigo} onChange={(v) => update('codigo', v)} />
        <div className="grid grid-cols-2 gap-2">
          <Field label="Ancho" value={Number(almacen.ancho) || 600} onChange={(v) => update('ancho', parseInt(v) || 0)} type="number" />
          <Field label="Alto" value={Number(almacen.alto) || 400} onChange={(v) => update('alto', parseInt(v) || 0)} type="number" />
        </div>
        <div>
          <label className="block text-xs text-texto-secundario">Descripción</label>
          <textarea value={almacen.descripcion || ''} onChange={(e) => update('descripcion', e.target.value)} className="w-full px-2 py-1 border border-borde rounded text-sm focus:outline-none focus:ring-1 focus:ring-accion" rows={2} />
        </div>
      </div>
    )
  }

  if (zona) {
    return (
      <div className="bg-fondo-blanco rounded-xl border border-borde-suave p-4 text-sm space-y-3">
        <h3 className="font-bold text-texto">{zona.es_mascara ? 'Almacén' : 'Zona'}: {zona.nombre}</h3>
        <Field label="Nombre" value={zona.nombre} onChange={(v) => update('nombre', v)} />
        <div className="grid grid-cols-2 gap-2">
          <Field label="X" value={zona.x} onChange={(v) => update('x', parseInt(v) || 0)} type="number" />
          <Field label="Y" value={zona.y} onChange={(v) => update('y', parseInt(v) || 0)} type="number" />
          <Field label="Ancho" value={zona.ancho ?? 100} onChange={(v) => update('ancho', parseInt(v) || 0)} type="number" />
          <Field label="Alto" value={zona.alto ?? 80} onChange={(v) => update('alto', parseInt(v) || 0)} type="number" />
        </div>
        <Field label="Código" value={zona.codigo} onChange={(v) => update('codigo', v)} />
        {!zona.es_mascara && (
          <SelectField label="Tipo" value={zona.tipo} onChange={(v) => update('tipo', v)} options={['recepcion','almacenamiento','despacho','picking','devoluciones']} />
        )}
        <ColorField label="Color" value={zona.color || '#2196F3'} onChange={(v) => update('color', v)} />
        {!zona.es_mascara && <DeleteButton label="Eliminar Zona" onClick={onDelete} loading={deleting} />}
      </div>
    )
  }

  if (estante) {
    return (
      <div className="bg-fondo-blanco rounded-xl border border-borde-suave p-4 text-sm space-y-3">
        <h3 className="font-bold text-texto">Estante: {estante.nombre}</h3>
        <Field label="Nombre" value={estante.nombre} onChange={(v) => update('nombre', v)} />
        <div className="grid grid-cols-2 gap-2">
          <Field label="X" value={estante.x} onChange={(v) => update('x', parseInt(v) || 0)} type="number" />
          <Field label="Y" value={estante.y} onChange={(v) => update('y', parseInt(v) || 0)} type="number" />
          <Field label="Ancho" value={estante.ancho} onChange={(v) => update('ancho', parseInt(v) || 0)} type="number" />
          <Field label="Alto" value={estante.alto} onChange={(v) => update('alto', parseInt(v) || 0)} type="number" />
        </div>
        <Field label="Código" value={estante.codigo} onChange={(v) => update('codigo', v)} />
        <Field label="Niveles" value={estante.cantidadniveles} onChange={(v) => update('cantidadniveles', Math.max(1, parseInt(v) || 1))} type="number" />
        <SelectField label="Zona" value={estante.idzona} onChange={(v) => update('idzona', v)} options={zonas.map((z) => z.idzona)} optionLabels={zonas.reduce((acc, z) => ({ ...acc, [z.idzona]: z.nombre }), {} as Record<string, string>)} />
        <DeleteButton label="Eliminar Estante" onClick={onDelete} loading={deleting} />
      </div>
    )
  }

  if (nodo) {
    return (
      <div className="bg-fondo-blanco rounded-xl border border-borde-suave p-4 text-sm space-y-3">
        <h3 className="font-bold text-texto">Nodo: {nodo.nombre}</h3>
        <Field label="Nombre" value={nodo.nombre} onChange={(v) => update('nombre', v)} />
        <div className="grid grid-cols-2 gap-2">
          <Field label="X" value={nodo.coordenada_x} onChange={(v) => update('coordenada_x', parseInt(v) || 0)} type="number" />
          <Field label="Y" value={nodo.coordenada_y} onChange={(v) => update('coordenada_y', parseInt(v) || 0)} type="number" />
        </div>
        <SelectField label="Tipo" value={nodo.tipo} onChange={(v) => update('tipo', v)} options={['entrada','salida','esquina','interseccion','punto_recogida']} />
        <DeleteButton label="Eliminar Nodo" onClick={onDelete} loading={deleting} />
      </div>
    )
  }

  return null
}

/* Sub-components */
function Field({ label, value, onChange, type = 'text' }: { label: string; value: string | number; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="block text-xs text-texto-secundario">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-2 py-1 border border-borde rounded text-sm focus:outline-none focus:ring-1 focus:ring-accion" />
    </div>
  )
}

function SelectField({ label, value, onChange, options, optionLabels }: { label: string; value: string; onChange: (v: string) => void; options: string[]; optionLabels?: Record<string, string> }) {
  return (
    <div>
      <label className="block text-xs text-texto-secundario">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-2 py-1 border border-borde rounded text-sm focus:outline-none focus:ring-1 focus:ring-accion">
        {options.map((opt) => (
          <option key={opt} value={opt}>{optionLabels?.[opt] || opt}</option>
        ))}
      </select>
    </div>
  )
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="block text-xs text-texto-secundario">{label}</label>
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="w-full h-8 border border-borde rounded cursor-pointer" />
    </div>
  )
}

function DeleteButton({ label, onClick, loading }: { label: string; onClick: () => void; loading: boolean }) {
  return (
    <button onClick={onClick} disabled={loading} className="w-full px-3 py-2 bg-peligro text-white rounded-lg hover:bg-peligro-hover disabled:opacity-50 text-sm">
      {loading ? 'Eliminando...' : label}
    </button>
  )
}
