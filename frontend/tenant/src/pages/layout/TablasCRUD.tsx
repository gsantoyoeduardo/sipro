import { useState, useEffect } from 'react'
import { zonaService, estanteService, nivelService } from '../../api/layout'
import { useToastStore } from '../../store/toastStore'
import { useSubmit } from '../../hooks/useSubmit'
import { validateRequired } from '../../utils/validators'
import DataTable from '../../components/DataTable'
import Modal from '../../components/Modal'
import ConfirmDialog from '../../components/ConfirmDialog'
import type { Zona, Estante, Nivel } from '../../types'

type TabView = 'zonas' | 'estantes' | 'niveles'

export default function TablasCRUD() {
  const [view, setView] = useState<TabView>('zonas')
  const tabs = [
    { key: 'zonas' as const, label: 'Zonas' },
    { key: 'estantes' as const, label: 'Estantes' },
    { key: 'niveles' as const, label: 'Niveles' },
  ]

  return (
    <div>
      <div className="flex gap-2 mb-6">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setView(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              view === t.key
                ? 'bg-accion text-white'
                : 'bg-fondo-blanco text-texto-secundario hover:bg-fondo hover:text-texto'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {view === 'zonas' && <ZonasABM />}
      {view === 'estantes' && <EstantesABM />}
      {view === 'niveles' && <NivelesABM />}
    </div>
  )
}

function ZonasABM() {
  const [items, setItems] = useState<Zona[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Zona | null>(null)
  const addToast = useToastStore((state) => state.addToast)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState({ nombre: '', codigo: '', tipo: 'almacenamiento', x: 0, y: 0, z_base: 0, z_techo: 300, color: '#3b82f6' })
  const [confirmDelete, setConfirmDelete] = useState<Zona | null>(null)
  const [confirmToggle, setConfirmToggle] = useState<Zona | null>(null)

  const fetchData = async () => {
    try {
      const res = await zonaService.list()
      setItems(res.data.results)
    } catch { addToast('error', 'Error al cargar zonas') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const handleOpenCreate = () => {
    setEditing(null)
    setForm({ nombre: '', codigo: '', tipo: 'almacenamiento', x: 0, y: 0, z_base: 0, z_techo: 300, color: '#3b82f6' })
    setFieldErrors({})
    setModalOpen(true)
  }

  const handleOpenEdit = (item: Zona) => {
    setEditing(item)
    setForm({ nombre: item.nombre, codigo: item.codigo, tipo: item.tipo, x: item.x, y: item.y, z_base: item.z_base, z_techo: item.z_techo ?? 300, color: item.color || '#3b82f6' })
    setFieldErrors({})
    setModalOpen(true)
  }

  const validate = (): boolean => {
    const e: Record<string, string> = {}
    const r1 = validateRequired(form.nombre, 'Nombre'); if (r1) e.nombre = r1
    const r2 = validateRequired(form.codigo, 'C\u00f3digo'); if (r2) e.codigo = r2
    setFieldErrors(e)
    return Object.keys(e).length === 0
  }

  const saveFn = async () => {
    const data = { ...form, x: Number(form.x), y: Number(form.y), z_base: Number(form.z_base), z_techo: Number(form.z_techo) }
    if (editing) await zonaService.update(editing.idzona, data)
    else await zonaService.create(data)
  }

  const { submit: handleSave, isSubmitting } = useSubmit(saveFn, {
    successMessage: editing ? 'Zona actualizada' : 'Zona creada',
    onSuccess: () => { setModalOpen(false); fetchData() },
  })

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (validate()) handleSave() }

  const { submit: handleDeleteConfirm, isSubmitting: deleting } = useSubmit(
    () => zonaService.remove(confirmDelete!.idzona),
    { successMessage: 'Zona eliminada', onSuccess: () => { setConfirmDelete(null); fetchData() } }
  )

  const { submit: handleToggleConfirm, isSubmitting: toggling } = useSubmit(
    () => zonaService.toggleEstado(confirmToggle!.idzona),
    { successMessage: 'Estado actualizado', onSuccess: () => { setConfirmToggle(null); fetchData() } }
  )

  const ic = (key: string) => `w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-accion focus:outline-none ${fieldErrors[key] ? 'border-peligro' : 'border-borde'}`

  const columns = [
    { key: 'nombre', header: 'Nombre' },
    { key: 'codigo', header: 'C\u00f3digo' },
    { key: 'tipo', header: 'Tipo', render: (item: Zona) => <span className="capitalize">{item.tipo}</span> },
    { key: 'x', header: 'X' },
    { key: 'y', header: 'Y' },
    { key: 'estado', header: 'Estado', render: (item: Zona) => (
      <span className={`px-2 py-1 text-xs rounded-full ${item.estado ? 'bg-exito-suave text-exito-texto' : 'bg-peligro-suave text-peligro-texto'}`}>{item.estado ? 'Activo' : 'Inactivo'}</span>
    )},
  ]

  const actions = (item: Zona) => (
    <>
      <button onClick={() => handleOpenEdit(item)} className="text-primario hover:text-primario-oscuro">Editar</button>
      <button onClick={() => setConfirmToggle(item)} className="text-advertencia hover:text-advertencia-hover">{item.estado ? 'Desactivar' : 'Activar'}</button>
      <button onClick={() => setConfirmDelete(item)} className="text-peligro hover:text-peligro-hover">Eliminar</button>
    </>
  )

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-texto">Zonas</h1>
        <button onClick={handleOpenCreate} className="bg-primario text-white px-4 py-2 rounded-lg hover:bg-primario-oscuro transition">Nueva Zona</button>
      </div>
      <div className="bg-fondo-blanco rounded-xl shadow-sm border border-borde-suave">
        <DataTable columns={columns} data={items} loading={loading} actions={actions} />
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Zona' : 'Nueva Zona'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-texto mb-1">Nombre *</label>
              <input type="text" value={form.nombre} onChange={(e) => { setForm({ ...form, nombre: e.target.value }); setFieldErrors((p) => ({ ...p, nombre: '' })) }} className={ic('nombre')} />
              {fieldErrors.nombre && <p className="text-peligro text-xs mt-1">{fieldErrors.nombre}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-texto mb-1">C\u00f3digo *</label>
              <input type="text" value={form.codigo} onChange={(e) => { setForm({ ...form, codigo: e.target.value }); setFieldErrors((p) => ({ ...p, codigo: '' })) }} className={ic('codigo')} />
              {fieldErrors.codigo && <p className="text-peligro text-xs mt-1">{fieldErrors.codigo}</p>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-texto mb-1">Tipo</label>
            <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-accion focus:outline-none">
              <option value="recepcion">Recepci\u00f3n</option>
              <option value="almacenamiento">Almacenamiento</option>
              <option value="despacho">Despacho</option>
              <option value="picking">Picking</option>
              <option value="devoluciones">Devoluciones</option>
            </select>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div><label className="block text-sm font-medium text-texto mb-1">X</label><input type="number" value={form.x} onChange={(e) => setForm({ ...form, x: Number(e.target.value) })} className="w-full px-3 py-2 border border-borde rounded-lg" /></div>
            <div><label className="block text-sm font-medium text-texto mb-1">Y</label><input type="number" value={form.y} onChange={(e) => setForm({ ...form, y: Number(e.target.value) })} className="w-full px-3 py-2 border border-borde rounded-lg" /></div>
            <div><label className="block text-sm font-medium text-texto mb-1">Z base</label><input type="number" value={form.z_base} onChange={(e) => setForm({ ...form, z_base: Number(e.target.value) })} className="w-full px-3 py-2 border border-borde rounded-lg" /></div>
            <div><label className="block text-sm font-medium text-texto mb-1">Z techo</label><input type="number" value={form.z_techo} onChange={(e) => setForm({ ...form, z_techo: Number(e.target.value) })} className="w-full px-3 py-2 border border-borde rounded-lg" /></div>
          </div>
          <div>
            <label className="block text-sm font-medium text-texto mb-1">Color</label>
            <input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="w-16 h-10 border border-borde rounded cursor-pointer" />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border border-borde rounded-lg hover:bg-fondo transition">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-primario text-white rounded-lg hover:bg-primario-oscuro transition disabled:opacity-50 flex items-center gap-2">
              {isSubmitting && <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
              {editing ? 'Guardar' : 'Crear'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={() => handleDeleteConfirm()} title="Eliminar Zona" message={`\u00bfEst\u00e1 seguro de eliminar "${confirmDelete?.nombre}"?`} confirmLabel="Eliminar" confirmVariant="danger" isLoading={deleting} />
      <ConfirmDialog isOpen={!!confirmToggle} onClose={() => setConfirmToggle(null)} onConfirm={() => handleToggleConfirm()} title={confirmToggle?.estado ? 'Desactivar Zona' : 'Activar Zona'} message={`\u00bfEst\u00e1 seguro de ${confirmToggle?.estado ? 'desactivar' : 'activar'} "${confirmToggle?.nombre}"?`} confirmLabel={confirmToggle?.estado ? 'Desactivar' : 'Activar'} confirmVariant="primary" isLoading={toggling} />
    </div>
  )
}

function EstantesABM() {
  const [items, setItems] = useState<Estante[]>([])
  const [zonas, setZonas] = useState<Zona[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Estante | null>(null)
  const addToast = useToastStore((state) => state.addToast)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [filterZona, setFilterZona] = useState('')
  const [form, setForm] = useState({ idzona: '', nombre: '', codigo: '', x: 0, y: 0, z_base: 0, rotacion: 0, ancho: 240, alto: 120, profundidad: 60, cantidadniveles: 3 })
  const [confirmDelete, setConfirmDelete] = useState<Estante | null>(null)
  const [confirmToggle, setConfirmToggle] = useState<Estante | null>(null)

  const fetchData = async () => {
    try {
      const [eRes, zRes] = await Promise.all([estanteService.list(filterZona || undefined), zonaService.list()])
      setItems(eRes.data.results); setZonas(zRes.data.results)
    } catch { addToast('error', 'Error al cargar datos') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [filterZona])

  const handleOpenCreate = () => {
    setEditing(null)
    setForm({ idzona: filterZona, nombre: '', codigo: '', x: 0, y: 0, z_base: 0, rotacion: 0, ancho: 240, alto: 120, profundidad: 60, cantidadniveles: 3 })
    setFieldErrors({})
    setModalOpen(true)
  }

  const handleOpenEdit = (item: Estante) => {
    setEditing(item)
    setForm({ idzona: item.idzona, nombre: item.nombre, codigo: item.codigo, x: item.x, y: item.y, z_base: item.z_base, rotacion: item.rotacion, ancho: item.ancho, alto: item.alto, profundidad: item.profundidad, cantidadniveles: item.cantidadniveles })
    setFieldErrors({})
    setModalOpen(true)
  }

  const validate = (): boolean => {
    const e: Record<string, string> = {}
    const r1 = validateRequired(form.idzona, 'Zona'); if (r1) e.idzona = r1
    const r2 = validateRequired(form.nombre, 'Nombre'); if (r2) e.nombre = r2
    const r3 = validateRequired(form.codigo, 'C\u00f3digo'); if (r3) e.codigo = r3
    setFieldErrors(e)
    return Object.keys(e).length === 0
  }

  const saveFn = async () => {
    const data = { ...form, x: Number(form.x), y: Number(form.y), z_base: Number(form.z_base), rotacion: Number(form.rotacion), ancho: Number(form.ancho), alto: Number(form.alto), profundidad: Number(form.profundidad), cantidadniveles: Number(form.cantidadniveles) }
    if (editing) await estanteService.update(editing.idestante, data)
    else await estanteService.create(data)
  }

  const { submit: handleSave, isSubmitting } = useSubmit(saveFn, {
    successMessage: editing ? 'Estante actualizado' : 'Estante creado',
    onSuccess: () => { setModalOpen(false); fetchData() },
  })

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (validate()) handleSave() }

  const { submit: handleDeleteConfirm, isSubmitting: deleting } = useSubmit(
    () => estanteService.remove(confirmDelete!.idestante),
    { successMessage: 'Estante eliminado', onSuccess: () => { setConfirmDelete(null); fetchData() } }
  )

  const { submit: handleToggleConfirm, isSubmitting: toggling } = useSubmit(
    () => estanteService.toggleEstado(confirmToggle!.idestante),
    { successMessage: 'Estado actualizado', onSuccess: () => { setConfirmToggle(null); fetchData() } }
  )

  const ic = (key: string) => `w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-accion focus:outline-none ${fieldErrors[key] ? 'border-peligro' : 'border-borde'}`

  const columns = [
    { key: 'nombre', header: 'Nombre' },
    { key: 'codigo', header: 'C\u00f3digo' },
    { key: 'x', header: 'X' },
    { key: 'y', header: 'Y' },
    { key: 'cantidadniveles', header: 'Niveles' },
    { key: 'estado', header: 'Estado', render: (item: Estante) => (
      <span className={`px-2 py-1 text-xs rounded-full ${item.estado ? 'bg-exito-suave text-exito-texto' : 'bg-peligro-suave text-peligro-texto'}`}>{item.estado ? 'Activo' : 'Inactivo'}</span>
    )},
  ]

  const actions = (item: Estante) => (
    <>
      <button onClick={() => handleOpenEdit(item)} className="text-primario hover:text-primario-oscuro">Editar</button>
      <button onClick={() => setConfirmToggle(item)} className="text-advertencia hover:text-advertencia-hover">{item.estado ? 'Desactivar' : 'Activar'}</button>
      <button onClick={() => setConfirmDelete(item)} className="text-peligro hover:text-peligro-hover">Eliminar</button>
    </>
  )

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-texto">Estantes</h1>
          <select value={filterZona} onChange={(e) => setFilterZona(e.target.value)} className="px-3 py-1 border border-borde rounded-lg text-sm">
            <option value="">Todas las zonas</option>
            {zonas.map((z) => <option key={z.idzona} value={z.idzona}>{z.nombre}</option>)}
          </select>
        </div>
        <button onClick={handleOpenCreate} className="bg-accion text-white px-4 py-2 rounded-lg hover:bg-accion-hover transition">Nuevo Estante</button>
      </div>
      <div className="bg-fondo-blanco rounded-xl shadow-sm border border-borde-suave">
        <DataTable columns={columns} data={items} loading={loading} actions={actions} />
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Estante' : 'Nuevo Estante'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-texto mb-1">Zona *</label>
            <select value={form.idzona} onChange={(e) => { setForm({ ...form, idzona: e.target.value }); setFieldErrors((p) => ({ ...p, idzona: '' })) }} className={ic('idzona')} required>
              <option value="">Seleccionar zona</option>
              {zonas.map((z) => <option key={z.idzona} value={z.idzona}>{z.nombre}</option>)}
            </select>
            {fieldErrors.idzona && <p className="text-peligro text-xs mt-1">{fieldErrors.idzona}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-texto mb-1">Nombre *</label><input type="text" value={form.nombre} onChange={(e) => { setForm({ ...form, nombre: e.target.value }); setFieldErrors((p) => ({ ...p, nombre: '' })) }} className={ic('nombre')} />{fieldErrors.nombre && <p className="text-peligro text-xs mt-1">{fieldErrors.nombre}</p>}</div>
            <div><label className="block text-sm font-medium text-texto mb-1">C\u00f3digo *</label><input type="text" value={form.codigo} onChange={(e) => { setForm({ ...form, codigo: e.target.value }); setFieldErrors((p) => ({ ...p, codigo: '' })) }} className={ic('codigo')} />{fieldErrors.codigo && <p className="text-peligro text-xs mt-1">{fieldErrors.codigo}</p>}</div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div><label className="block text-sm font-medium text-texto mb-1">X</label><input type="number" value={form.x} onChange={(e) => setForm({ ...form, x: Number(e.target.value) })} className="w-full px-3 py-2 border border-borde rounded-lg" /></div>
            <div><label className="block text-sm font-medium text-texto mb-1">Y</label><input type="number" value={form.y} onChange={(e) => setForm({ ...form, y: Number(e.target.value) })} className="w-full px-3 py-2 border border-borde rounded-lg" /></div>
            <div><label className="block text-sm font-medium text-texto mb-1">Rotaci\u00f3n</label><input type="number" value={form.rotacion} onChange={(e) => setForm({ ...form, rotacion: Number(e.target.value) })} className="w-full px-3 py-2 border border-borde rounded-lg" /></div>
            <div><label className="block text-sm font-medium text-texto mb-1">Niveles</label><input type="number" value={form.cantidadniveles} onChange={(e) => setForm({ ...form, cantidadniveles: Number(e.target.value) })} className="w-full px-3 py-2 border border-borde rounded-lg" /></div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="block text-sm font-medium text-texto mb-1">Ancho (cm)</label><input type="number" value={form.ancho} onChange={(e) => setForm({ ...form, ancho: Number(e.target.value) })} className="w-full px-3 py-2 border border-borde rounded-lg" /></div>
            <div><label className="block text-sm font-medium text-texto mb-1">Alto (cm)</label><input type="number" value={form.alto} onChange={(e) => setForm({ ...form, alto: Number(e.target.value) })} className="w-full px-3 py-2 border border-borde rounded-lg" /></div>
            <div><label className="block text-sm font-medium text-texto mb-1">Profundidad (cm)</label><input type="number" value={form.profundidad} onChange={(e) => setForm({ ...form, profundidad: Number(e.target.value) })} className="w-full px-3 py-2 border border-borde rounded-lg" /></div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border border-borde rounded-lg hover:bg-fondo transition">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-accion text-white rounded-lg hover:bg-accion-hover transition disabled:opacity-50 flex items-center gap-2">
              {isSubmitting && <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
              {editing ? 'Guardar' : 'Crear'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={() => handleDeleteConfirm()} title="Eliminar Estante" message={`\u00bfEst\u00e1 seguro de eliminar "${confirmDelete?.nombre}"?`} confirmLabel="Eliminar" confirmVariant="danger" isLoading={deleting} />
      <ConfirmDialog isOpen={!!confirmToggle} onClose={() => setConfirmToggle(null)} onConfirm={() => handleToggleConfirm()} title={confirmToggle?.estado ? 'Desactivar Estante' : 'Activar Estante'} message={`\u00bfEst\u00e1 seguro de ${confirmToggle?.estado ? 'desactivar' : 'activar'} "${confirmToggle?.nombre}"?`} confirmLabel={confirmToggle?.estado ? 'Desactivar' : 'Activar'} confirmVariant="primary" isLoading={toggling} />
    </div>
  )
}

function NivelesABM() {
  const [items, setItems] = useState<Nivel[]>([])
  const [estantes, setEstantes] = useState<Estante[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Nivel | null>(null)
  const addToast = useToastStore((state) => state.addToast)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [filterEstante, setFilterEstante] = useState('')
  const [form, setForm] = useState({ idestante: '', nombre: '', numero: 1, altura: 10 })
  const [confirmDelete, setConfirmDelete] = useState<Nivel | null>(null)
  const [confirmToggle, setConfirmToggle] = useState<Nivel | null>(null)

  const fetchData = async () => {
    try {
      const [nRes, eRes] = await Promise.all([nivelService.list(filterEstante || undefined), estanteService.list()])
      setItems(nRes.data.results); setEstantes(eRes.data.results)
    } catch { addToast('error', 'Error al cargar datos') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [filterEstante])

  const handleOpenCreate = () => {
    setEditing(null)
    setForm({ idestante: filterEstante, nombre: '', numero: 1, altura: 10 })
    setFieldErrors({})
    setModalOpen(true)
  }

  const handleOpenEdit = (item: Nivel) => {
    setEditing(item)
    setForm({ idestante: item.idestante, nombre: item.nombre, numero: item.numero, altura: item.altura })
    setFieldErrors({})
    setModalOpen(true)
  }

  const validate = (): boolean => {
    const e: Record<string, string> = {}
    const r1 = validateRequired(form.idestante, 'Estante'); if (r1) e.idestante = r1
    const r2 = validateRequired(form.nombre, 'Nombre'); if (r2) e.nombre = r2
    setFieldErrors(e)
    return Object.keys(e).length === 0
  }

  const saveFn = async () => {
    const data = { ...form, numero: Number(form.numero), altura: Number(form.altura) }
    if (editing) await nivelService.update(editing.idnivel, data)
    else await nivelService.create(data)
  }

  const { submit: handleSave, isSubmitting } = useSubmit(saveFn, {
    successMessage: editing ? 'Nivel actualizado' : 'Nivel creado',
    onSuccess: () => { setModalOpen(false); fetchData() },
  })

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (validate()) handleSave() }

  const { submit: handleDeleteConfirm, isSubmitting: deleting } = useSubmit(
    () => nivelService.remove(confirmDelete!.idnivel),
    { successMessage: 'Nivel eliminado', onSuccess: () => { setConfirmDelete(null); fetchData() } }
  )

  const { submit: handleToggleConfirm, isSubmitting: toggling } = useSubmit(
    () => nivelService.toggleEstado(confirmToggle!.idnivel),
    { successMessage: 'Estado actualizado', onSuccess: () => { setConfirmToggle(null); fetchData() } }
  )

  const ic = (key: string) => `w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-accion focus:outline-none ${fieldErrors[key] ? 'border-peligro' : 'border-borde'}`

  const columns = [
    { key: 'nombre', header: 'Nombre' },
    { key: 'numero', header: 'N\u00famero' },
    { key: 'altura', header: 'Altura (cm)' },
    { key: 'estado', header: 'Estado', render: (item: Nivel) => (
      <span className={`px-2 py-1 text-xs rounded-full ${item.estado ? 'bg-exito-suave text-exito-texto' : 'bg-peligro-suave text-peligro-texto'}`}>{item.estado ? 'Activo' : 'Inactivo'}</span>
    )},
  ]

  const actions = (item: Nivel) => (
    <>
      <button onClick={() => handleOpenEdit(item)} className="text-primario hover:text-primario-oscuro">Editar</button>
      <button onClick={() => setConfirmToggle(item)} className="text-advertencia hover:text-advertencia-hover">{item.estado ? 'Desactivar' : 'Activar'}</button>
      <button onClick={() => setConfirmDelete(item)} className="text-peligro hover:text-peligro-hover">Eliminar</button>
    </>
  )

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-texto">Niveles</h1>
          <select value={filterEstante} onChange={(e) => setFilterEstante(e.target.value)} className="px-3 py-1 border border-borde rounded-lg text-sm">
            <option value="">Todos los estantes</option>
            {estantes.map((e) => <option key={e.idestante} value={e.idestante}>{e.nombre}</option>)}
          </select>
        </div>
        <button onClick={handleOpenCreate} className="bg-morado text-white px-4 py-2 rounded-lg hover:bg-morado-hover transition">Nuevo Nivel</button>
      </div>
      <div className="bg-fondo-blanco rounded-xl shadow-sm border border-borde-suave">
        <DataTable columns={columns} data={items} loading={loading} actions={actions} />
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Nivel' : 'Nuevo Nivel'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-texto mb-1">Estante *</label>
            <select value={form.idestante} onChange={(e) => { setForm({ ...form, idestante: e.target.value }); setFieldErrors((p) => ({ ...p, idestante: '' })) }} className={ic('idestante')} required>
              <option value="">Seleccionar estante</option>
              {estantes.map((e) => <option key={e.idestante} value={e.idestante}>{e.nombre}</option>)}
            </select>
            {fieldErrors.idestante && <p className="text-peligro text-xs mt-1">{fieldErrors.idestante}</p>}
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="block text-sm font-medium text-texto mb-1">Nombre *</label><input type="text" value={form.nombre} onChange={(e) => { setForm({ ...form, nombre: e.target.value }); setFieldErrors((p) => ({ ...p, nombre: '' })) }} className={ic('nombre')} />{fieldErrors.nombre && <p className="text-peligro text-xs mt-1">{fieldErrors.nombre}</p>}</div>
            <div><label className="block text-sm font-medium text-texto mb-1">N\u00famero</label><input type="number" value={form.numero} onChange={(e) => setForm({ ...form, numero: Number(e.target.value) })} className="w-full px-3 py-2 border border-borde rounded-lg" /></div>
            <div><label className="block text-sm font-medium text-texto mb-1">Altura (cm)</label><input type="number" value={form.altura} onChange={(e) => setForm({ ...form, altura: Number(e.target.value) })} className="w-full px-3 py-2 border border-borde rounded-lg" /></div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border border-borde rounded-lg hover:bg-fondo transition">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-morado text-white rounded-lg hover:bg-morado-hover transition disabled:opacity-50 flex items-center gap-2">
              {isSubmitting && <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
              {editing ? 'Guardar' : 'Crear'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={() => handleDeleteConfirm()} title="Eliminar Nivel" message={`\u00bfEst\u00e1 seguro de eliminar "${confirmDelete?.nombre}"?`} confirmLabel="Eliminar" confirmVariant="danger" isLoading={deleting} />
      <ConfirmDialog isOpen={!!confirmToggle} onClose={() => setConfirmToggle(null)} onConfirm={() => handleToggleConfirm()} title={confirmToggle?.estado ? 'Desactivar Nivel' : 'Activar Nivel'} message={`\u00bfEst\u00e1 seguro de ${confirmToggle?.estado ? 'desactivar' : 'activar'} "${confirmToggle?.nombre}"?`} confirmLabel={confirmToggle?.estado ? 'Desactivar' : 'Activar'} confirmVariant="primary" isLoading={toggling} />
    </div>
  )
}
