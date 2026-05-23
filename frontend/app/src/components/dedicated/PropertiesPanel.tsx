import type { Zona, Pasillo, Estante, Nodo } from '../../types'

interface EntitySelection {
  type: string
  id: string
}

interface PropertiesPanelProps {
  selectedEntity: EntitySelection | null
  zona: Zona | null
  pasillo: Pasillo | null
  estante: Estante | null
  nodo: Nodo | null
  zonas: Zona[]
  pasillos: Pasillo[]
  onUpdateZona: (id: string, data: Partial<Zona>) => void
  onUpdatePasillo: (id: string, data: Partial<Pasillo>) => void
  onUpdateEstante: (id: string, data: Partial<Estante>) => void
  onUpdateNodo: (id: string, data: Partial<Nodo>) => void
  onDelete: () => void
  deleting: boolean
  setDirty: (dirty: boolean) => void
  placingNodo: boolean
}

export default function PropertiesPanel({
  selectedEntity, zona, pasillo, estante, nodo,
  zonas, pasillos,
  onUpdateZona, onUpdatePasillo, onUpdateEstante, onUpdateNodo,
  onDelete, deleting, setDirty, placingNodo,
}: PropertiesPanelProps) {
  const update = (field: string, value: unknown) => {
    setDirty(true)
    if (zona) onUpdateZona(zona.idzona, { [field]: value } as Partial<Zona>)
    else if (pasillo) onUpdatePasillo(pasillo.idpasillo, { [field]: value } as Partial<Pasillo>)
    else if (estante) onUpdateEstante(estante.idestante, { [field]: value } as Partial<Estante>)
    else if (nodo) onUpdateNodo(nodo.idnodo, { [field]: value } as Partial<Nodo>)
  }

  if (!selectedEntity && !placingNodo) {
    return <div className="bg-white rounded-lg border p-4 text-sm text-gray-400 text-center">Seleccione un elemento en el mapa</div>
  }

  if (zona) {
    return (
      <div className="bg-white rounded-lg border p-4 text-sm space-y-3">
        <h3 className="font-bold text-gray-800">Zona: {zona.nombre}</h3>
        <Field label="Nombre" value={zona.nombre} onChange={(v) => update('nombre', v)} />
        <div className="grid grid-cols-2 gap-2">
          <Field label="X" value={zona.x} onChange={(v) => update('x', parseInt(v) || 0)} type="number" />
          <Field label="Y" value={zona.y} onChange={(v) => update('y', parseInt(v) || 0)} type="number" />
          <Field label="Ancho" value={zona.ancho} onChange={(v) => update('ancho', parseInt(v) || 0)} type="number" />
          <Field label="Alto" value={zona.alto} onChange={(v) => update('alto', parseInt(v) || 0)} type="number" />
        </div>
        <Field label="Código" value={zona.codigo} onChange={(v) => update('codigo', v)} />
        <SelectField label="Tipo" value={zona.tipo} onChange={(v) => update('tipo', v)} options={['recepcion','almacenamiento','despacho','picking','devoluciones']} />
        <ColorField label="Color" value={zona.color || '#2196F3'} onChange={(v) => update('color', v)} />
        <DeleteButton label="Eliminar Zona" onClick={onDelete} loading={deleting} />
      </div>
    )
  }

  if (pasillo) {
    return (
      <div className="bg-white rounded-lg border p-4 text-sm space-y-3">
        <h3 className="font-bold text-gray-800">Pasillo: {pasillo.nombre}</h3>
        <Field label="Nombre" value={pasillo.nombre} onChange={(v) => update('nombre', v)} />
        <div className="grid grid-cols-2 gap-2">
          <Field label="X" value={pasillo.x} onChange={(v) => update('x', parseInt(v) || 0)} type="number" />
          <Field label="Y" value={pasillo.y} onChange={(v) => update('y', parseInt(v) || 0)} type="number" />
          <Field label="Ancho" value={pasillo.ancho} onChange={(v) => update('ancho', parseInt(v) || 0)} type="number" />
          <Field label="Largo" value={pasillo.largo} onChange={(v) => update('largo', parseInt(v) || 0)} type="number" />
        </div>
        <Field label="Código" value={pasillo.codigo} onChange={(v) => update('codigo', v)} />
        <SelectField label="Orientación" value={pasillo.orientacion} onChange={(v) => update('orientacion', v)} options={['horizontal','vertical']} />
        <SelectField label="Zona" value={pasillo.idzona} onChange={(v) => update('idzona', v)} options={zonas.map((z) => z.idzona)} optionLabels={zonas.reduce((acc, z) => ({ ...acc, [z.idzona]: z.nombre }), {} as Record<string, string>)} />
        <DeleteButton label="Eliminar Pasillo" onClick={onDelete} loading={deleting} />
      </div>
    )
  }

  if (estante) {
    return (
      <div className="bg-white rounded-lg border p-4 text-sm space-y-3">
        <h3 className="font-bold text-gray-800">Estante: {estante.nombre}</h3>
        <Field label="Nombre" value={estante.nombre} onChange={(v) => update('nombre', v)} />
        <div className="grid grid-cols-2 gap-2">
          <Field label="X" value={estante.x} onChange={(v) => update('x', parseInt(v) || 0)} type="number" />
          <Field label="Y" value={estante.y} onChange={(v) => update('y', parseInt(v) || 0)} type="number" />
          <Field label="Ancho" value={estante.ancho} onChange={(v) => update('ancho', parseInt(v) || 0)} type="number" />
          <Field label="Alto" value={estante.alto} onChange={(v) => update('alto', parseInt(v) || 0)} type="number" />
        </div>
        <Field label="Código" value={estante.codigo} onChange={(v) => update('codigo', v)} />
        <SelectField label="Lado" value={estante.lado} onChange={(v) => update('lado', v)} options={['izquierda','derecha']} />
        <Field label="Niveles" value={estante.cantidadniveles} onChange={(v) => update('cantidadniveles', Math.max(1, parseInt(v) || 1))} type="number" />
        <SelectField label="Pasillo" value={estante.idpasillo} onChange={(v) => update('idpasillo', v)} options={pasillos.map((p) => p.idpasillo)} optionLabels={pasillos.reduce((acc, p) => ({ ...acc, [p.idpasillo]: p.nombre }), {} as Record<string, string>)} />
        <DeleteButton label="Eliminar Estante" onClick={onDelete} loading={deleting} />
      </div>
    )
  }

  if (nodo) {
    return (
      <div className="bg-white rounded-lg border p-4 text-sm space-y-3">
        <h3 className="font-bold text-gray-800">Nodo: {nodo.nombre}</h3>
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
      <label className="block text-xs text-gray-500">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-2 py-1 border rounded text-sm" />
    </div>
  )
}

function SelectField({ label, value, onChange, options, optionLabels }: { label: string; value: string; onChange: (v: string) => void; options: string[]; optionLabels?: Record<string, string> }) {
  return (
    <div>
      <label className="block text-xs text-gray-500">{label}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-2 py-1 border rounded text-sm">
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
      <label className="block text-xs text-gray-500">{label}</label>
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="w-full h-8 border rounded" />
    </div>
  )
}

function DeleteButton({ label, onClick, loading }: { label: string; onClick: () => void; loading: boolean }) {
  return (
    <button onClick={onClick} disabled={loading} className="w-full px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm">
      {loading ? 'Eliminando...' : label}
    </button>
  )
}
