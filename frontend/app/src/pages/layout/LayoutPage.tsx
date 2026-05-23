import { useState, useEffect } from 'react'
import DataTable from '../../components/DataTable'
import Modal from '../../components/Modal'
import ConfirmDialog from '../../components/ConfirmDialog'
import { useSubmit } from '../../hooks/useSubmit'
import { useToastStore } from '../../store/toastStore'
import { validateRequired, validatePositive, validateNonNegative } from '../../utils/validators'
import { almacenService } from '../../api/empresa'
import { zonaService, pasilloService, estanteService, nivelService } from '../../api/layout'
import type { Almacen, Zona, Pasillo, Estante, Nivel } from '../../types'
import LayoutMapPage from './LayoutMapPage'

type ViewLevel = 'map' | 'zonas' | 'pasillos' | 'estantes' | 'niveles'

/**
 * Página de Layout con pestañas.
 * Contiene 5 vistas: Mapa (canvas Konva), Zonas, Pasillos, Estantes, Niveles.
 * Cada vista renderiza un subcomponente ABM (Alta-Baja-Modificación) con tabla + modal.
 */
export default function LayoutPage() {
  const [view, setView] = useState<ViewLevel>('map')

  return (
    <div>
      {/* Barra de pestañas de navegación */}
      <div className="flex gap-2 mb-4">
        {[
          { key: 'map', label: 'Mapa' },
          { key: 'zonas', label: 'Zonas' },
          { key: 'pasillos', label: 'Pasillos' },
          { key: 'estantes', label: 'Estantes' },
          { key: 'niveles', label: 'Niveles' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setView(tab.key as ViewLevel)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              view === tab.key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Renderizado condicional según la pestaña activa */}
      {view === 'map' && <LayoutMapPage />}
      {view === 'zonas' && <ZonasABM />}
      {view === 'pasillos' && <PasillosABM />}
      {view === 'estantes' && <EstantesABM />}
      {view === 'niveles' && <NivelesABM />}
    </div>
  )
}

/**
 * ABM de Zonas.
 * CRUD completo con tabla, filtro por almacén, modal de creación/edición,
 * confirmación para eliminar y activar/desactivar.
 *
 * Estado:
 *   - zonas: lista desde la API.
 *   - almacenes: para el selector en filtro y formulario.
 *   - form: campos del formulario (incluye posición y dimensiones).
 *   - editing: zona en modo edición (null = creación).
 *   - confirmDelete / confirmToggle: control de diálogos de confirmación.
 */
function ZonasABM() {
  const [zonas, setZonas] = useState<Zona[]>([])
  const [almacenes, setAlmacenes] = useState<Almacen[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Zona | null>(null)
  const [filterAlmacen, setFilterAlmacen] = useState('')
  const addToast = useToastStore((state) => state.addToast)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [confirmDelete, setConfirmDelete] = useState<Zona | null>(null)
  const [confirmToggle, setConfirmToggle] = useState<Zona | null>(null)
  const [form, setForm] = useState({
    idalmacen: '', nombre: '', codigo: '', tipo: 'almacenamiento' as string,
    x: 0, y: 0, ancho: 120, alto: 80, color: '',
  })

  // Carga datos de zonas y almacenes; se refiltra al cambiar filterAlmacen
  const fetchData = async () => {
    try {
      const [zonasRes, almRes] = await Promise.all([
        zonaService.list(filterAlmacen || undefined),
        almacenService.list(),
      ])
      setZonas(zonasRes.data.results)
      setAlmacenes(almRes.data.results)
    } catch { addToast('error', 'Error al cargar datos') } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [filterAlmacen])

  // Validación de campos del formulario de zona
  const validate = (): boolean => {
    const e: Record<string, string> = {}
    const v1 = validateRequired(form.idalmacen, 'Almacén'); if (v1) e.idalmacen = v1
    const v2 = validateRequired(form.nombre, 'Nombre'); if (v2) e.nombre = v2
    const v3 = validateRequired(form.codigo, 'Código'); if (v3) e.codigo = v3
    const v4 = validateNonNegative(form.x, 'X'); if (v4) e.x = v4
    const v5 = validateNonNegative(form.y, 'Y'); if (v5) e.y = v5
    const v6 = validatePositive(form.ancho, 'Ancho'); if (v6) e.ancho = v6
    const v7 = validatePositive(form.alto, 'Alto'); if (v7) e.alto = v7
    setFieldErrors(e)
    return Object.keys(e).length === 0
  }

  // Función de guardado: crea o actualiza según si editing tiene valor
  const saveFn = async () => {
    const data = { ...form, x: Number(form.x), y: Number(form.y), ancho: Number(form.ancho), alto: Number(form.alto), color: form.color || null }
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

  // Helper para clase de input con borde rojo en error
  const ic = (key: string) => `w-full px-3 py-2 border rounded-lg ${fieldErrors[key] ? 'border-red-500' : ''}`

  // Columnas de la tabla de zonas
  const columns = [
    { key: 'nombre', header: 'Nombre' },
    { key: 'codigo', header: 'Código' },
    { key: 'tipo', header: 'Tipo' },
    { key: 'pasillos_count', header: 'Pasillos' },
    { key: 'x', header: 'X' },
    { key: 'y', header: 'Y' },
    { key: 'ancho', header: 'Ancho' },
    { key: 'alto', header: 'Alto' },
    { key: 'estado', header: 'Estado', render: (item: Zona) => (
      <span className={`px-2 py-1 text-xs rounded-full ${item.estado ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
        {item.estado ? 'Activo' : 'Inactivo'}
      </span>
    )},
  ]

  return (
    <div>
      {/* Encabezado con filtro por almacén y botón de nueva zona */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-gray-800">Zonas</h2>
          <select value={filterAlmacen} onChange={(e) => setFilterAlmacen(e.target.value)} className="px-3 py-1 border rounded-lg text-sm">
            <option value="">Todos los almacenes</option>
            {almacenes.map((a) => <option key={a.idalmacen} value={a.idalmacen}>{a.nombre}</option>)}
          </select>
        </div>
        <button onClick={() => { setEditing(null); setForm({ idalmacen: filterAlmacen, nombre: '', codigo: '', tipo: 'almacenamiento', x: 0, y: 0, ancho: 120, alto: 80, color: '' }); setFieldErrors({}); setModalOpen(true) }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Nueva Zona</button>
      </div>
      <DataTable columns={columns} data={zonas} loading={loading}
        actions={(item) => (
          <>
            <button onClick={() => { setEditing(item); setForm({ idalmacen: item.idalmacen, nombre: item.nombre, codigo: item.codigo, tipo: item.tipo, x: item.x, y: item.y, ancho: item.ancho, alto: item.alto, color: item.color || '' }); setFieldErrors({}); setModalOpen(true) }}
              className="text-blue-600 hover:text-blue-800">Editar</button>
            <button onClick={() => setConfirmToggle(item)} className="text-yellow-600 hover:text-yellow-800">
              {item.estado ? 'Desactivar' : 'Activar'}</button>
            <button onClick={() => setConfirmDelete(item)} className="text-red-600 hover:text-red-800">Eliminar</button>
          </>
        )} />
      {/* Modal de creación/edición de zona */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Zona' : 'Nueva Zona'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Almacén *</label>
            <select value={form.idalmacen} onChange={(e) => { setForm({ ...form, idalmacen: e.target.value }); setFieldErrors((p) => ({ ...p, idalmacen: '' })) }} className={ic('idalmacen')} required>
              <option value="">Seleccionar</option>
              {almacenes.map((a) => <option key={a.idalmacen} value={a.idalmacen}>{a.nombre}</option>)}
            </select>
            {fieldErrors.idalmacen && <p className="text-red-500 text-xs mt-1">{fieldErrors.idalmacen}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nombre *</label>
              <input type="text" value={form.nombre} onChange={(e) => { setForm({ ...form, nombre: e.target.value }); setFieldErrors((p) => ({ ...p, nombre: '' })) }} className={ic('nombre')} required />
              {fieldErrors.nombre && <p className="text-red-500 text-xs mt-1">{fieldErrors.nombre}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Código *</label>
              <input type="text" value={form.codigo} onChange={(e) => { setForm({ ...form, codigo: e.target.value }); setFieldErrors((p) => ({ ...p, codigo: '' })) }} className={ic('codigo')} required />
              {fieldErrors.codigo && <p className="text-red-500 text-xs mt-1">{fieldErrors.codigo}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Tipo</label>
              <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                {['recepcion','almacenamiento','despacho','picking','devoluciones'].map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Color</label>
              <input type="color" value={form.color || '#2196F3'} onChange={(e) => setForm({ ...form, color: e.target.value })} className="w-full h-10 border rounded" />
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">X</label>
              <input type="number" value={form.x} onChange={(e) => { setForm({ ...form, x: Number(e.target.value) }); setFieldErrors((p) => ({ ...p, x: '' })) }} className={ic('x')} />
              {fieldErrors.x && <p className="text-red-500 text-xs mt-1">{fieldErrors.x}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Y</label>
              <input type="number" value={form.y} onChange={(e) => { setForm({ ...form, y: Number(e.target.value) }); setFieldErrors((p) => ({ ...p, y: '' })) }} className={ic('y')} />
              {fieldErrors.y && <p className="text-red-500 text-xs mt-1">{fieldErrors.y}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Ancho</label>
              <input type="number" value={form.ancho} onChange={(e) => { setForm({ ...form, ancho: Number(e.target.value) }); setFieldErrors((p) => ({ ...p, ancho: '' })) }} className={ic('ancho')} />
              {fieldErrors.ancho && <p className="text-red-500 text-xs mt-1">{fieldErrors.ancho}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Alto</label>
              <input type="number" value={form.alto} onChange={(e) => { setForm({ ...form, alto: Number(e.target.value) }); setFieldErrors((p) => ({ ...p, alto: '' })) }} className={ic('alto')} />
              {fieldErrors.alto && <p className="text-red-500 text-xs mt-1">{fieldErrors.alto}</p>}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border rounded-lg">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 flex items-center gap-2">
              {isSubmitting && <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
              {editing ? 'Guardar' : 'Crear'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Diálogos de confirmación para eliminar y activar/desactivar */}
      <ConfirmDialog isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={() => handleDeleteConfirm()} title="Eliminar Zona" message={`¿Está seguro de eliminar "${confirmDelete?.nombre}"?`} confirmLabel="Eliminar" confirmVariant="danger" isLoading={deleting} />
      <ConfirmDialog isOpen={!!confirmToggle} onClose={() => setConfirmToggle(null)} onConfirm={() => handleToggleConfirm()} title={confirmToggle?.estado ? 'Desactivar Zona' : 'Activar Zona'} message={`¿Está seguro de ${confirmToggle?.estado ? 'desactivar' : 'activar'} "${confirmToggle?.nombre}"?`} confirmLabel={confirmToggle?.estado ? 'Desactivar' : 'Activar'} confirmVariant="primary" isLoading={toggling} />
    </div>
  )
}

/**
 * ABM de Pasillos.
 * CRUD completo con filtro por zona, tabla, modal y confirmaciones.
 * Los pasillos pertenecen a una zona y tienen orientación horizontal o vertical.
 */
function PasillosABM() {
  const [items, setItems] = useState<Pasillo[]>([])
  const [zonas, setZonas] = useState<Zona[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Pasillo | null>(null)
  const [filterZona, setFilterZona] = useState('')
  const addToast = useToastStore((state) => state.addToast)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [confirmDelete, setConfirmDelete] = useState<Pasillo | null>(null)
  const [confirmToggle, setConfirmToggle] = useState<Pasillo | null>(null)
  const [form, setForm] = useState({ idzona: '', nombre: '', codigo: '', x: 0, y: 0, ancho: 40, largo: 60, orientacion: 'horizontal' as string })

  // Carga pasillos y zonas; se refiltra al cambiar filterZona
  const fetchData = async () => {
    try {
      const [pRes, zRes] = await Promise.all([pasilloService.list(filterZona || undefined), zonaService.list()])
      setItems(pRes.data.results); setZonas(zRes.data.results)
    } catch { addToast('error', 'Error al cargar datos') } finally { setLoading(false) }
  }
  useEffect(() => { fetchData() }, [filterZona])

  // Validación de campos del pasillo
  const validate = (): boolean => {
    const e: Record<string, string> = {}
    const v1 = validateRequired(form.idzona, 'Zona'); if (v1) e.idzona = v1
    const v2 = validateRequired(form.nombre, 'Nombre'); if (v2) e.nombre = v2
    const v3 = validateRequired(form.codigo, 'Código'); if (v3) e.codigo = v3
    const v4 = validateNonNegative(form.x, 'X'); if (v4) e.x = v4
    const v5 = validateNonNegative(form.y, 'Y'); if (v5) e.y = v5
    const v6 = validatePositive(form.ancho, 'Ancho'); if (v6) e.ancho = v6
    const v7 = validatePositive(form.largo, 'Largo'); if (v7) e.largo = v7
    setFieldErrors(e)
    return Object.keys(e).length === 0
  }

  // Guarda: crea o actualiza pasillo
  const saveFn = async () => {
    const data = { ...form, x: Number(form.x), y: Number(form.y), ancho: Number(form.ancho), largo: Number(form.largo) }
    if (editing) await pasilloService.update(editing.idpasillo, data)
    else await pasilloService.create(data)
  }

  const { submit: handleSave, isSubmitting } = useSubmit(saveFn, {
    successMessage: editing ? 'Pasillo actualizado' : 'Pasillo creado',
    onSuccess: () => { setModalOpen(false); fetchData() },
  })

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (validate()) handleSave() }

  const { submit: handleDeleteConfirm, isSubmitting: deleting } = useSubmit(
    () => pasilloService.remove(confirmDelete!.idpasillo),
    { successMessage: 'Pasillo eliminado', onSuccess: () => { setConfirmDelete(null); fetchData() } }
  )

  const { submit: handleToggleConfirm, isSubmitting: toggling } = useSubmit(
    () => pasilloService.toggleEstado(confirmToggle!.idpasillo),
    { successMessage: 'Estado actualizado', onSuccess: () => { setConfirmToggle(null); fetchData() } }
  )

  const ic = (key: string) => `w-full px-3 py-2 border rounded-lg ${fieldErrors[key] ? 'border-red-500' : ''}`

  const columns = [
    { key: 'nombre', header: 'Nombre' }, { key: 'codigo', header: 'Código' },
    { key: 'orientacion', header: 'Orientación' }, { key: 'estantes_count', header: 'Estantes' },
    { key: 'estado', header: 'Estado', render: (item: Pasillo) => <span className={`px-2 py-1 text-xs rounded-full ${item.estado ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{item.estado ? 'Activo' : 'Inactivo'}</span> },
  ]

  return (
    <div>
      {/* Encabezado: filtro por zona y botón nuevo pasillo */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-gray-800">Pasillos</h2>
          <select value={filterZona} onChange={(e) => setFilterZona(e.target.value)} className="px-3 py-1 border rounded-lg text-sm">
            <option value="">Todas las zonas</option>
            {zonas.map((z) => <option key={z.idzona} value={z.idzona}>{z.nombre}</option>)}
          </select>
        </div>
        <button onClick={() => { setEditing(null); setForm({ idzona: filterZona, nombre: '', codigo: '', x: 0, y: 0, ancho: 40, largo: 60, orientacion: 'horizontal' }); setFieldErrors({}); setModalOpen(true) }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Nuevo Pasillo</button>
      </div>
      <DataTable columns={columns} data={items} loading={loading}
        actions={(item) => (
          <>
            <button onClick={() => { setEditing(item); setForm({ idzona: item.idzona, nombre: item.nombre, codigo: item.codigo, x: item.x, y: item.y, ancho: item.ancho, largo: item.largo, orientacion: item.orientacion }); setFieldErrors({}); setModalOpen(true) }}
              className="text-blue-600 hover:text-blue-800">Editar</button>
            <button onClick={() => setConfirmToggle(item)} className="text-yellow-600 hover:text-yellow-800">{item.estado ? 'Desactivar' : 'Activar'}</button>
            <button onClick={() => setConfirmDelete(item)} className="text-red-600 hover:text-red-800">Eliminar</button>
          </>
        )} />
      {/* Modal de creación/edición */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Pasillo' : 'Nuevo Pasillo'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Zona *</label>
            <select value={form.idzona} onChange={(e) => { setForm({ ...form, idzona: e.target.value }); setFieldErrors((p) => ({ ...p, idzona: '' })) }} className={ic('idzona')} required>
              <option value="">Seleccionar</option>
              {zonas.map((z) => <option key={z.idzona} value={z.idzona}>{z.nombre}</option>)}
            </select>
            {fieldErrors.idzona && <p className="text-red-500 text-xs mt-1">{fieldErrors.idzona}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nombre *</label>
              <input type="text" value={form.nombre} onChange={(e) => { setForm({ ...form, nombre: e.target.value }); setFieldErrors((p) => ({ ...p, nombre: '' })) }} className={ic('nombre')} required />
              {fieldErrors.nombre && <p className="text-red-500 text-xs mt-1">{fieldErrors.nombre}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Código *</label>
              <input type="text" value={form.codigo} onChange={(e) => { setForm({ ...form, codigo: e.target.value }); setFieldErrors((p) => ({ ...p, codigo: '' })) }} className={ic('codigo')} required />
              {fieldErrors.codigo && <p className="text-red-500 text-xs mt-1">{fieldErrors.codigo}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Orientación</label>
              <select value={form.orientacion} onChange={(e) => setForm({ ...form, orientacion: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                <option value="horizontal">Horizontal</option>
                <option value="vertical">Vertical</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">X</label>
              <input type="number" value={form.x} onChange={(e) => { setForm({ ...form, x: Number(e.target.value) }); setFieldErrors((p) => ({ ...p, x: '' })) }} className={ic('x')} />
              {fieldErrors.x && <p className="text-red-500 text-xs mt-1">{fieldErrors.x}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Y</label>
              <input type="number" value={form.y} onChange={(e) => { setForm({ ...form, y: Number(e.target.value) }); setFieldErrors((p) => ({ ...p, y: '' })) }} className={ic('y')} />
              {fieldErrors.y && <p className="text-red-500 text-xs mt-1">{fieldErrors.y}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Ancho</label>
              <input type="number" value={form.ancho} onChange={(e) => { setForm({ ...form, ancho: Number(e.target.value) }); setFieldErrors((p) => ({ ...p, ancho: '' })) }} className={ic('ancho')} />
              {fieldErrors.ancho && <p className="text-red-500 text-xs mt-1">{fieldErrors.ancho}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Largo</label>
              <input type="number" value={form.largo} onChange={(e) => { setForm({ ...form, largo: Number(e.target.value) }); setFieldErrors((p) => ({ ...p, largo: '' })) }} className={ic('largo')} />
              {fieldErrors.largo && <p className="text-red-500 text-xs mt-1">{fieldErrors.largo}</p>}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border rounded-lg">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 flex items-center gap-2">
              {isSubmitting && <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
              {editing ? 'Guardar' : 'Crear'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={() => handleDeleteConfirm()} title="Eliminar Pasillo" message={`¿Está seguro de eliminar "${confirmDelete?.nombre}"?`} confirmLabel="Eliminar" confirmVariant="danger" isLoading={deleting} />
      <ConfirmDialog isOpen={!!confirmToggle} onClose={() => setConfirmToggle(null)} onConfirm={() => handleToggleConfirm()} title={confirmToggle?.estado ? 'Desactivar Pasillo' : 'Activar Pasillo'} message={`¿Está seguro de ${confirmToggle?.estado ? 'desactivar' : 'activar'} "${confirmToggle?.nombre}"?`} confirmLabel={confirmToggle?.estado ? 'Desactivar' : 'Activar'} confirmVariant="primary" isLoading={toggling} />
    </div>
  )
}

/**
 * ABM de Estantes.
 * CRUD completo con filtro por pasillo. Los estantes tienen lado (derecha/izquierda),
 * cantidad de niveles y dimensiones físicas.
 */
function EstantesABM() {
  const [items, setItems] = useState<Estante[]>([])
  const [pasillos, setPasillos] = useState<Pasillo[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Estante | null>(null)
  const [filterPasillo, setFilterPasillo] = useState('')
  const addToast = useToastStore((state) => state.addToast)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [confirmDelete, setConfirmDelete] = useState<Estante | null>(null)
  const [confirmToggle, setConfirmToggle] = useState<Estante | null>(null)
  const [form, setForm] = useState({ idpasillo: '', nombre: '', codigo: '', x: 0, y: 0, ancho: 20, alto: 30, profundidad: 20, lado: 'derecha' as string, cantidadniveles: 3 })

  // Carga estantes y pasillos; se refiltra al cambiar filterPasillo
  const fetchData = async () => {
    try {
      const [eRes, pRes] = await Promise.all([estanteService.list(filterPasillo || undefined), pasilloService.list()])
      setItems(eRes.data.results); setPasillos(pRes.data.results)
    } catch { addToast('error', 'Error al cargar datos') } finally { setLoading(false) }
  }
  useEffect(() => { fetchData() }, [filterPasillo])

  // Validación de campos del estante
  const validate = (): boolean => {
    const e: Record<string, string> = {}
    const v1 = validateRequired(form.idpasillo, 'Pasillo'); if (v1) e.idpasillo = v1
    const v2 = validateRequired(form.nombre, 'Nombre'); if (v2) e.nombre = v2
    const v3 = validateRequired(form.codigo, 'Código'); if (v3) e.codigo = v3
    const v4 = validateNonNegative(form.x, 'X'); if (v4) e.x = v4
    const v5 = validateNonNegative(form.y, 'Y'); if (v5) e.y = v5
    const v6 = validatePositive(form.ancho, 'Ancho'); if (v6) e.ancho = v6
    const v7 = validatePositive(form.alto, 'Alto'); if (v7) e.alto = v7
    const v8 = validatePositive(form.profundidad, 'Profundidad'); if (v8) e.profundidad = v8
    const v9 = validatePositive(form.cantidadniveles, 'Cant. Niveles'); if (v9) e.cantidadniveles = v9
    setFieldErrors(e)
    return Object.keys(e).length === 0
  }

  // Guarda: crea o actualiza estante
  const saveFn = async () => {
    const data = { ...form, x: Number(form.x), y: Number(form.y), ancho: Number(form.ancho), alto: Number(form.alto), profundidad: Number(form.profundidad), cantidadniveles: Number(form.cantidadniveles) }
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

  const ic = (key: string) => `w-full px-3 py-2 border rounded-lg ${fieldErrors[key] ? 'border-red-500' : ''}`

  const columns = [
    { key: 'nombre', header: 'Nombre' }, { key: 'codigo', header: 'Código' }, { key: 'lado', header: 'Lado' },
    { key: 'niveles_count', header: 'Niveles' },
    { key: 'estado', header: 'Estado', render: (item: Estante) => <span className={`px-2 py-1 text-xs rounded-full ${item.estado ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{item.estado ? 'Activo' : 'Inactivo'}</span> },
  ]

  return (
    <div>
      {/* Encabezado: filtro por pasillo y botón nuevo estante */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-gray-800">Estantes</h2>
          <select value={filterPasillo} onChange={(e) => setFilterPasillo(e.target.value)} className="px-3 py-1 border rounded-lg text-sm">
            <option value="">Todos los pasillos</option>
            {pasillos.map((p) => <option key={p.idpasillo} value={p.idpasillo}>{p.nombre}</option>)}
          </select>
        </div>
        <button onClick={() => { setEditing(null); setForm({ idpasillo: filterPasillo, nombre: '', codigo: '', x: 0, y: 0, ancho: 20, alto: 30, profundidad: 20, lado: 'derecha', cantidadniveles: 3 }); setFieldErrors({}); setModalOpen(true) }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Nuevo Estante</button>
      </div>
      <DataTable columns={columns} data={items} loading={loading}
        actions={(item) => (
          <>
            <button onClick={() => { setEditing(item); setForm({ idpasillo: item.idpasillo, nombre: item.nombre, codigo: item.codigo, x: item.x, y: item.y, ancho: item.ancho, alto: item.alto, profundidad: item.profundidad, lado: item.lado, cantidadniveles: item.cantidadniveles }); setFieldErrors({}); setModalOpen(true) }}
              className="text-blue-600 hover:text-blue-800">Editar</button>
            <button onClick={() => setConfirmToggle(item)} className="text-yellow-600 hover:text-yellow-800">{item.estado ? 'Desactivar' : 'Activar'}</button>
            <button onClick={() => setConfirmDelete(item)} className="text-red-600 hover:text-red-800">Eliminar</button>
          </>
        )} />
      {/* Modal de creación/edición */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Estante' : 'Nuevo Estante'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Pasillo *</label>
            <select value={form.idpasillo} onChange={(e) => { setForm({ ...form, idpasillo: e.target.value }); setFieldErrors((p) => ({ ...p, idpasillo: '' })) }} className={ic('idpasillo')} required>
              <option value="">Seleccionar</option>
              {pasillos.map((p) => <option key={p.idpasillo} value={p.idpasillo}>{p.nombre}</option>)}
            </select>
            {fieldErrors.idpasillo && <p className="text-red-500 text-xs mt-1">{fieldErrors.idpasillo}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nombre *</label>
              <input type="text" value={form.nombre} onChange={(e) => { setForm({ ...form, nombre: e.target.value }); setFieldErrors((p) => ({ ...p, nombre: '' })) }} className={ic('nombre')} required />
              {fieldErrors.nombre && <p className="text-red-500 text-xs mt-1">{fieldErrors.nombre}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Código *</label>
              <input type="text" value={form.codigo} onChange={(e) => { setForm({ ...form, codigo: e.target.value }); setFieldErrors((p) => ({ ...p, codigo: '' })) }} className={ic('codigo')} required />
              {fieldErrors.codigo && <p className="text-red-500 text-xs mt-1">{fieldErrors.codigo}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Lado</label>
              <select value={form.lado} onChange={(e) => setForm({ ...form, lado: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                <option value="derecha">Derecha</option><option value="izquierda">Izquierda</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Cant. Niveles</label>
              <input type="number" value={form.cantidadniveles} onChange={(e) => { setForm({ ...form, cantidadniveles: Number(e.target.value) }); setFieldErrors((p) => ({ ...p, cantidadniveles: '' })) }} className={ic('cantidadniveles')} />
              {fieldErrors.cantidadniveles && <p className="text-red-500 text-xs mt-1">{fieldErrors.cantidadniveles}</p>}
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">X</label>
              <input type="number" value={form.x} onChange={(e) => { setForm({ ...form, x: Number(e.target.value) }); setFieldErrors((p) => ({ ...p, x: '' })) }} className={ic('x')} />
              {fieldErrors.x && <p className="text-red-500 text-xs mt-1">{fieldErrors.x}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Y</label>
              <input type="number" value={form.y} onChange={(e) => { setForm({ ...form, y: Number(e.target.value) }); setFieldErrors((p) => ({ ...p, y: '' })) }} className={ic('y')} />
              {fieldErrors.y && <p className="text-red-500 text-xs mt-1">{fieldErrors.y}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Ancho</label>
              <input type="number" value={form.ancho} onChange={(e) => { setForm({ ...form, ancho: Number(e.target.value) }); setFieldErrors((p) => ({ ...p, ancho: '' })) }} className={ic('ancho')} />
              {fieldErrors.ancho && <p className="text-red-500 text-xs mt-1">{fieldErrors.ancho}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Alto</label>
              <input type="number" value={form.alto} onChange={(e) => { setForm({ ...form, alto: Number(e.target.value) }); setFieldErrors((p) => ({ ...p, alto: '' })) }} className={ic('alto')} />
              {fieldErrors.alto && <p className="text-red-500 text-xs mt-1">{fieldErrors.alto}</p>}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border rounded-lg">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 flex items-center gap-2">
              {isSubmitting && <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
              {editing ? 'Guardar' : 'Crear'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={() => handleDeleteConfirm()} title="Eliminar Estante" message={`¿Está seguro de eliminar "${confirmDelete?.nombre}"?`} confirmLabel="Eliminar" confirmVariant="danger" isLoading={deleting} />
      <ConfirmDialog isOpen={!!confirmToggle} onClose={() => setConfirmToggle(null)} onConfirm={() => handleToggleConfirm()} title={confirmToggle?.estado ? 'Desactivar Estante' : 'Activar Estante'} message={`¿Está seguro de ${confirmToggle?.estado ? 'desactivar' : 'activar'} "${confirmToggle?.nombre}"?`} confirmLabel={confirmToggle?.estado ? 'Desactivar' : 'Activar'} confirmVariant="primary" isLoading={toggling} />
    </div>
  )
}

/**
 * ABM de Niveles.
 * CRUD completo con filtro por estante. Los niveles representan cada bandeja
 * o altura dentro de un estante, con un número y altura específicos.
 */
function NivelesABM() {
  const [items, setItems] = useState<Nivel[]>([])
  const [estantes, setEstantes] = useState<Estante[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Nivel | null>(null)
  const [filterEstante, setFilterEstante] = useState('')
  const addToast = useToastStore((state) => state.addToast)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [confirmDelete, setConfirmDelete] = useState<Nivel | null>(null)
  const [confirmToggle, setConfirmToggle] = useState<Nivel | null>(null)
  const [form, setForm] = useState({ idestante: '', nombre: '', numero: 1, altura: 10 })

  // Carga niveles y estantes; se refiltra al cambiar filterEstante
  const fetchData = async () => {
    try {
      const [nRes, eRes] = await Promise.all([nivelService.list(filterEstante || undefined), estanteService.list()])
      setItems(nRes.data.results); setEstantes(eRes.data.results)
    } catch { addToast('error', 'Error al cargar datos') } finally { setLoading(false) }
  }
  useEffect(() => { fetchData() }, [filterEstante])

  // Validación de campos del nivel
  const validate = (): boolean => {
    const e: Record<string, string> = {}
    const v1 = validateRequired(form.idestante, 'Estante'); if (v1) e.idestante = v1
    const v2 = validateRequired(form.nombre, 'Nombre'); if (v2) e.nombre = v2
    const v3 = validateRequired(form.numero, 'Número'); if (v3) e.numero = v3
    const v4 = validatePositive(form.numero, 'Número'); if (v4) e.numero = v4
    const v5 = validatePositive(form.altura, 'Altura'); if (v5) e.altura = v5
    setFieldErrors(e)
    return Object.keys(e).length === 0
  }

  // Guarda: crea o actualiza nivel
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

  const ic = (key: string) => `w-full px-3 py-2 border rounded-lg ${fieldErrors[key] ? 'border-red-500' : ''}`

  const columns = [
    { key: 'nombre', header: 'Nombre' }, { key: 'numero', header: 'Número' }, { key: 'altura', header: 'Altura' },
    { key: 'estado', header: 'Estado', render: (item: Nivel) => <span className={`px-2 py-1 text-xs rounded-full ${item.estado ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{item.estado ? 'Activo' : 'Inactivo'}</span> },
  ]

  return (
    <div>
      {/* Encabezado: filtro por estante y botón nuevo nivel */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-gray-800">Niveles</h2>
          <select value={filterEstante} onChange={(e) => setFilterEstante(e.target.value)} className="px-3 py-1 border rounded-lg text-sm">
            <option value="">Todos los estantes</option>
            {estantes.map((e) => <option key={e.idestante} value={e.idestante}>{e.nombre}</option>)}
          </select>
        </div>
        <button onClick={() => { setEditing(null); setForm({ idestante: filterEstante, nombre: '', numero: 1, altura: 10 }); setFieldErrors({}); setModalOpen(true) }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Nuevo Nivel</button>
      </div>
      <DataTable columns={columns} data={items} loading={loading}
        actions={(item) => (
          <>
            <button onClick={() => { setEditing(item); setForm({ idestante: item.idestante, nombre: item.nombre, numero: item.numero, altura: item.altura }); setFieldErrors({}); setModalOpen(true) }}
              className="text-blue-600 hover:text-blue-800">Editar</button>
            <button onClick={() => setConfirmToggle(item)} className="text-yellow-600 hover:text-yellow-800">{item.estado ? 'Desactivar' : 'Activar'}</button>
            <button onClick={() => setConfirmDelete(item)} className="text-red-600 hover:text-red-800">Eliminar</button>
          </>
        )} />
      {/* Modal de creación/edición */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Nivel' : 'Nuevo Nivel'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Estante *</label>
            <select value={form.idestante} onChange={(e) => { setForm({ ...form, idestante: e.target.value }); setFieldErrors((p) => ({ ...p, idestante: '' })) }} className={ic('idestante')} required>
              <option value="">Seleccionar</option>
              {estantes.map((e) => <option key={e.idestante} value={e.idestante}>{e.nombre}</option>)}
            </select>
            {fieldErrors.idestante && <p className="text-red-500 text-xs mt-1">{fieldErrors.idestante}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nombre *</label>
              <input type="text" value={form.nombre} onChange={(e) => { setForm({ ...form, nombre: e.target.value }); setFieldErrors((p) => ({ ...p, nombre: '' })) }} className={ic('nombre')} required />
              {fieldErrors.nombre && <p className="text-red-500 text-xs mt-1">{fieldErrors.nombre}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Número *</label>
              <input type="number" value={form.numero} onChange={(e) => { setForm({ ...form, numero: Number(e.target.value) }); setFieldErrors((p) => ({ ...p, numero: '' })) }} className={ic('numero')} required />
              {fieldErrors.numero && <p className="text-red-500 text-xs mt-1">{fieldErrors.numero}</p>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Altura</label>
            <input type="number" value={form.altura} onChange={(e) => { setForm({ ...form, altura: Number(e.target.value) }); setFieldErrors((p) => ({ ...p, altura: '' })) }} className={ic('altura')} />
            {fieldErrors.altura && <p className="text-red-500 text-xs mt-1">{fieldErrors.altura}</p>}
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border rounded-lg">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 flex items-center gap-2">
              {isSubmitting && <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
              {editing ? 'Guardar' : 'Crear'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={() => handleDeleteConfirm()} title="Eliminar Nivel" message={`¿Está seguro de eliminar "${confirmDelete?.nombre}"?`} confirmLabel="Eliminar" confirmVariant="danger" isLoading={deleting} />
      <ConfirmDialog isOpen={!!confirmToggle} onClose={() => setConfirmToggle(null)} onConfirm={() => handleToggleConfirm()} title={confirmToggle?.estado ? 'Desactivar Nivel' : 'Activar Nivel'} message={`¿Está seguro de ${confirmToggle?.estado ? 'desactivar' : 'activar'} "${confirmToggle?.nombre}"?`} confirmLabel={confirmToggle?.estado ? 'Desactivar' : 'Activar'} confirmVariant="primary" isLoading={toggling} />
    </div>
  )
}
