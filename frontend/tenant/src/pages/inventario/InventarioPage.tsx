import { useState, useEffect } from 'react'
import DataTable from '../../components/DataTable'
import Modal from '../../components/Modal'
import ConfirmDialog from '../../components/ConfirmDialog'
import { categoriaService, productoService, loteService, inventarioService, kardexService } from '../../api/inventario'
import { useSubmit } from '../../hooks/useSubmit'
import { useToastStore } from '../../store/toastStore'
import { validateRequired, validatePositive, validateNonNegative, validateGreaterThan, validateDateAfter } from '../../utils/validators'
import type { Categoria, Producto, Lote, InventarioItem, KardexItem, PickingResult } from '../../types'

type TabView = 'categorias' | 'productos' | 'lotes' | 'inventario' | 'kardex' | 'picking'

/**
 * Página de Inventario con 6 pestañas.
 * Incluye: Categorías, Productos, Lotes, Inventario, Kardex y Picking FEFO/FIFO.
 * Cada pestaña renderiza su propio subcomponente independiente.
 */
export default function InventarioPage() {
  const [view, setView] = useState<TabView>('categorias')

  return (
    <div>
      {/* Barra de pestañas de navegación principal */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {[
          { key: 'categorias', label: 'Categorías' },
          { key: 'productos', label: 'Productos' },
          { key: 'lotes', label: 'Lotes' },
          { key: 'inventario', label: 'Inventario' },
          { key: 'kardex', label: 'Kardex' },
          { key: 'picking', label: 'Picking FEFO/FIFO' },
        ].map((tab) => (
          <button key={tab.key} onClick={() => setView(tab.key as TabView)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${view === tab.key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {view === 'categorias' && <CategoriasABM />}
      {view === 'productos' && <ProductosABM />}
      {view === 'lotes' && <LotesABM />}
      {view === 'inventario' && <InventarioABM />}
      {view === 'kardex' && <KardexView />}
      {view === 'picking' && <PickingView />}
    </div>
  )
}

/**
 * ABM de Categorías.
 * CRUD completo con soporte jerárquico (categoría padre).
 * Cada categoría puede tener una categoría padre (relación árbol).
 *
 * Estado:
 *   - items: lista visible de categorías.
 *   - allCats: lista completa para el selector de categoría padre.
 *   - form: datos del formulario (nombre, descripción, padre).
 *   - editing: categoría en edición (null = creación).
 *
 * Llamadas API:
 *   - categoriaService.list(), .create(), .update(), .remove(), .toggleEstado()
 */
function CategoriasABM() {
  const [items, setItems] = useState<Categoria[]>([])
  const [allCats, setAllCats] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Categoria | null>(null)
  const [form, setForm] = useState({ nombre: '', descripcion: '', idcategoriapadre: '' })
  const addToast = useToastStore((state) => state.addToast)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const [confirmDelete, setConfirmDelete] = useState<Categoria | null>(null)
  const [confirmToggle, setConfirmToggle] = useState<Categoria | null>(null)

  // Carga la lista completa de categorías al montar
  const fetchData = async () => {
    try {
      const catRes = await categoriaService.list()
      setItems(catRes.data.results)
      setAllCats(catRes.data.results)
    } catch { addToast('error', 'Error al cargar categorías') } finally { setLoading(false) }
  }
  useEffect(() => { fetchData() }, [])

  const handleOpenCreate = () => {
    setEditing(null); setForm({ nombre: '', descripcion: '', idcategoriapadre: '' }); setFieldErrors({}); setModalOpen(true)
  }

  const handleOpenEdit = (item: Categoria) => {
    setEditing(item); setForm({ nombre: item.nombre, descripcion: item.descripcion || '', idcategoriapadre: item.idcategoriapadre || '' }); setFieldErrors({}); setModalOpen(true)
  }

  const validate = (): boolean => {
    const e: Record<string, string> = {}
    const v1 = validateRequired(form.nombre, 'Nombre'); if (v1) e.nombre = v1
    setFieldErrors(e)
    return Object.keys(e).length === 0
  }

  const buildData = () => ({ nombre: form.nombre, descripcion: form.descripcion || null, idcategoriapadre: form.idcategoriapadre || null })

  const saveFn = async () => {
    const data = buildData()
    if (editing) await categoriaService.update(editing.idcategoria, data)
    else await categoriaService.create(data)
  }

  const { submit: handleSave, isSubmitting } = useSubmit(saveFn, {
    successMessage: editing ? 'Categoría actualizada' : 'Categoría creada',
    onSuccess: () => { setModalOpen(false); fetchData() },
  })

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (validate()) handleSave() }

  const { submit: handleDeleteConfirm, isSubmitting: deleting } = useSubmit(
    () => categoriaService.remove(confirmDelete!.idcategoria),
    { successMessage: 'Categoría eliminada', onSuccess: () => { setConfirmDelete(null); fetchData() } }
  )

  const { submit: handleToggleConfirm, isSubmitting: toggling } = useSubmit(
    () => categoriaService.toggleEstado(confirmToggle!.idcategoria),
    { successMessage: 'Estado actualizado', onSuccess: () => { setConfirmToggle(null); fetchData() } }
  )

  const getPadre = (id: string | null) => id ? allCats.find((c) => c.idcategoria === id)?.nombre || '\u2014' : '\u2014'

  const ic = (key: string) => `w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none ${fieldErrors[key] ? 'border-red-500' : ''}`

  const columns = [
    { key: 'nombre', header: 'Nombre' },
    { key: 'descripcion', header: 'Descripción' },
    { key: 'idcategoriapadre', header: 'Padre', render: (item: Categoria) => getPadre(item.idcategoriapadre) },
    { key: 'estado', header: 'Estado', render: (item: Categoria) => <span className={`px-2 py-1 text-xs rounded-full ${item.estado ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{item.estado ? 'Activo' : 'Inactivo'}</span> },
  ]

  const actions = (item: Categoria) => (
    <>
      <button onClick={() => handleOpenEdit(item)} className="text-blue-600 hover:text-blue-800">Editar</button>
      <button onClick={() => setConfirmToggle(item)} className="text-yellow-600 hover:text-yellow-800">{item.estado ? 'Desactivar' : 'Activar'}</button>
      <button onClick={() => setConfirmDelete(item)} className="text-red-600 hover:text-red-800">Eliminar</button>
    </>
  )

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Categorías</h2>
        <button onClick={handleOpenCreate} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Nueva Categoría</button>
      </div>
      <DataTable columns={columns} data={items} loading={loading} actions={actions} />
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Categoría' : 'Nueva Categoría'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nombre *</label>
            <input type="text" value={form.nombre} onChange={(e) => { setForm({ ...form, nombre: e.target.value }); setFieldErrors((p) => ({ ...p, nombre: '' })) }} className={ic('nombre')} />
            {fieldErrors.nombre && <p className="text-red-500 text-xs mt-1">{fieldErrors.nombre}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Descripción</label>
            <textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} className="w-full px-3 py-2 border rounded-lg" rows={2} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Categoría Padre</label>
            <select value={form.idcategoriapadre} onChange={(e) => setForm({ ...form, idcategoriapadre: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
              <option value="">Sin padre (raíz)</option>
              {allCats.filter((c) => c.idcategoria !== editing?.idcategoria).map((c) => <option key={c.idcategoria} value={c.idcategoria}>{c.nombre}</option>)}
            </select>
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

      <ConfirmDialog isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={() => handleDeleteConfirm()} title="Eliminar Categoría" message={`\u00bfEst\u00e1 seguro de eliminar "${confirmDelete?.nombre}"?`} confirmLabel="Eliminar" confirmVariant="danger" isLoading={deleting} />
      <ConfirmDialog isOpen={!!confirmToggle} onClose={() => setConfirmToggle(null)} onConfirm={() => handleToggleConfirm()} title={confirmToggle?.estado ? 'Desactivar Categoría' : 'Activar Categoría'} message={`\u00bfEst\u00e1 seguro de ${confirmToggle?.estado ? 'desactivar' : 'activar'} "${confirmToggle?.nombre}"?`} confirmLabel={confirmToggle?.estado ? 'Desactivar' : 'Activar'} confirmVariant="primary" isLoading={toggling} />
    </div>
  )
}

/**
 * ABM de Productos.
 * CRUD completo con filtro por categoría y búsqueda por texto.
 * Incluye campos de precio, stock mínimo/máximo, peso, volumen y control de lotes.
 *
 * Estado:
 *   - items: lista de productos (filtrable por categoría y búsqueda).
 *   - categorias: para el selector en filtro y formulario.
 *   - form: todos los campos del producto (incluyendo precios, stock, etc.).
 *   - editing: producto en edición.
 *
 * Llamadas API:
 *   - productoService.list(), .create(), .update(), .remove(), .toggleEstado()
 *   - categoriaService.list()
 */
function ProductosABM() {
  const [items, setItems] = useState<Producto[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Producto | null>(null)
  const [filterCat, setFilterCat] = useState('')
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({ idcategoria: '', codigo: '', nombre: '', descripcion: '', unidad_medida: 'unidad', peso: '', volumen: '', precio_costo: '', precio_venta: '', stock_minimo: '0', stock_maximo: '0', maneja_lotes: false })
  const addToast = useToastStore((state) => state.addToast)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const [confirmDelete, setConfirmDelete] = useState<Producto | null>(null)
  const [confirmToggle, setConfirmToggle] = useState<Producto | null>(null)

  // Carga productos y categorías; se refiltra al cambiar filterCat o search
  const fetchData = async () => {
    try {
      const [pRes, cRes] = await Promise.all([productoService.list(filterCat || undefined, search || undefined), categoriaService.list()])
      setItems(pRes.data.results); setCategorias(cRes.data.results)
    } catch { addToast('error', 'Error al cargar productos') } finally { setLoading(false) }
  }
  useEffect(() => { fetchData() }, [filterCat, search])

  const handleOpenCreate = () => {
    setEditing(null); setForm({ idcategoria: filterCat, codigo: '', nombre: '', descripcion: '', unidad_medida: 'unidad', peso: '', volumen: '', precio_costo: '', precio_venta: '', stock_minimo: '0', stock_maximo: '0', maneja_lotes: false }); setFieldErrors({}); setModalOpen(true)
  }

  const handleOpenEdit = (item: Producto) => {
    setEditing(item); setForm({ idcategoria: item.idcategoria, codigo: item.codigo, nombre: item.nombre, descripcion: item.descripcion || '', unidad_medida: item.unidad_medida, peso: item.peso?.toString() || '', volumen: item.volumen?.toString() || '', precio_costo: item.precio_costo?.toString() || '', precio_venta: item.precio_venta?.toString() || '', stock_minimo: item.stock_minimo.toString(), stock_maximo: item.stock_maximo.toString(), maneja_lotes: item.maneja_lotes }); setFieldErrors({}); setModalOpen(true)
  }

  const validate = (): boolean => {
    const e: Record<string, string> = {}
    const v1 = validateRequired(form.idcategoria, 'Categoría'); if (v1) e.idcategoria = v1
    const v2 = validateRequired(form.codigo, 'Código'); if (v2) e.codigo = v2
    const v3 = validateRequired(form.nombre, 'Nombre'); if (v3) e.nombre = v3
    const v4 = validateNonNegative(form.stock_minimo, 'Stock Mínimo'); if (v4) e.stock_minimo = v4
    const v5 = validateNonNegative(form.stock_maximo, 'Stock Máximo'); if (v5) e.stock_maximo = v5
    const v6 = validateNonNegative(form.peso, 'Peso'); if (v6) e.peso = v6
    const v7 = validateNonNegative(form.volumen, 'Volumen'); if (v7) e.volumen = v7
    const v8 = validateGreaterThan(form.precio_venta, form.precio_costo, 'Precio Venta', 'Precio Costo'); if (v8) e.precio_venta = v8
    const v9 = validateGreaterThan(form.stock_maximo, form.stock_minimo, 'Stock Máximo', 'Stock Mínimo'); if (v9) e.stock_maximo = v9
    setFieldErrors(e)
    return Object.keys(e).length === 0
  }

  const buildData = () => ({
    idcategoria: form.idcategoria, codigo: form.codigo, nombre: form.nombre,
    descripcion: form.descripcion || null, unidad_medida: form.unidad_medida,
    peso: form.peso ? Number(form.peso) : null, volumen: form.volumen ? Number(form.volumen) : null,
    precio_costo: form.precio_costo ? Number(form.precio_costo) : null, precio_venta: form.precio_venta ? Number(form.precio_venta) : null,
    stock_minimo: Number(form.stock_minimo), stock_maximo: Number(form.stock_maximo),
    maneja_lotes: form.maneja_lotes,
  })

  const saveFn = async () => {
    const data = buildData()
    if (editing) await productoService.update(editing.idproducto, data)
    else await productoService.create(data)
  }

  const { submit: handleSave, isSubmitting } = useSubmit(saveFn, {
    successMessage: editing ? 'Producto actualizado' : 'Producto creado',
    onSuccess: () => { setModalOpen(false); fetchData() },
  })

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (validate()) handleSave() }

  const { submit: handleDeleteConfirm, isSubmitting: deleting } = useSubmit(
    () => productoService.remove(confirmDelete!.idproducto),
    { successMessage: 'Producto eliminado', onSuccess: () => { setConfirmDelete(null); fetchData() } }
  )

  const { submit: handleToggleConfirm, isSubmitting: toggling } = useSubmit(
    () => productoService.toggleEstado(confirmToggle!.idproducto),
    { successMessage: 'Estado actualizado', onSuccess: () => { setConfirmToggle(null); fetchData() } }
  )

  const ic = (key: string) => `w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none ${fieldErrors[key] ? 'border-red-500' : ''}`

  const columns = [
    { key: 'codigo', header: 'Código' },
    { key: 'nombre', header: 'Nombre' },
    { key: 'categoria_nombre', header: 'Categoría' },
    { key: 'unidad_medida', header: 'U.M.' },
    { key: 'stock_total', header: 'Stock' },
    { key: 'precio_venta', header: 'P.Venta' },
    { key: 'estado', header: 'Estado', render: (item: Producto) => <span className={`px-2 py-1 text-xs rounded-full ${item.estado ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{item.estado ? 'Activo' : 'Inactivo'}</span> },
  ]

  const actions = (item: Producto) => (
    <>
      <button onClick={() => handleOpenEdit(item)} className="text-blue-600 hover:text-blue-800">Editar</button>
      <button onClick={() => setConfirmToggle(item)} className="text-yellow-600 hover:text-yellow-800">{item.estado ? 'Desactivar' : 'Activar'}</button>
      <button onClick={() => setConfirmDelete(item)} className="text-red-600 hover:text-red-800">Eliminar</button>
    </>
  )

  return (
    <div>
      <div className="flex justify-between items-center mb-4 gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-gray-800">Productos</h2>
          <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="px-3 py-1 border rounded-lg text-sm">
            <option value="">Todas las categorías</option>
            {categorias.map((c) => <option key={c.idcategoria} value={c.idcategoria}>{c.nombre}</option>)}
          </select>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar..." className="px-3 py-1 border rounded-lg text-sm w-48" />
        </div>
        <button onClick={handleOpenCreate} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Nuevo Producto</button>
      </div>
      <DataTable columns={columns} data={items} loading={loading} actions={actions} />
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Producto' : 'Nuevo Producto'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Categoría *</label>
            <select value={form.idcategoria} onChange={(e) => { setForm({ ...form, idcategoria: e.target.value }); setFieldErrors((p) => ({ ...p, idcategoria: '' })) }} className={ic('idcategoria')}>
              <option value="">Seleccionar</option>
              {categorias.map((c) => <option key={c.idcategoria} value={c.idcategoria}>{c.nombre}</option>)}
            </select>
            {fieldErrors.idcategoria && <p className="text-red-500 text-xs mt-1">{fieldErrors.idcategoria}</p>}
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Código *</label>
              <input type="text" value={form.codigo} onChange={(e) => { setForm({ ...form, codigo: e.target.value }); setFieldErrors((p) => ({ ...p, codigo: '' })) }} className={ic('codigo')} />
              {fieldErrors.codigo && <p className="text-red-500 text-xs mt-1">{fieldErrors.codigo}</p>}
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Nombre *</label>
              <input type="text" value={form.nombre} onChange={(e) => { setForm({ ...form, nombre: e.target.value }); setFieldErrors((p) => ({ ...p, nombre: '' })) }} className={ic('nombre')} />
              {fieldErrors.nombre && <p className="text-red-500 text-xs mt-1">{fieldErrors.nombre}</p>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Descripción</label>
            <textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} className="w-full px-3 py-2 border rounded-lg" rows={2} />
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Unidad Medida</label>
              <select value={form.unidad_medida} onChange={(e) => setForm({ ...form, unidad_medida: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                {['unidad','kg','g','l','ml','m','m2','m3','caja','pallet'].map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Peso</label>
              <input type="number" step="0.001" value={form.peso} onChange={(e) => { setForm({ ...form, peso: e.target.value }); setFieldErrors((p) => ({ ...p, peso: '' })) }} className={ic('peso')} />
              {fieldErrors.peso && <p className="text-red-500 text-xs mt-1">{fieldErrors.peso}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Volumen</label>
              <input type="number" step="0.001" value={form.volumen} onChange={(e) => { setForm({ ...form, volumen: e.target.value }); setFieldErrors((p) => ({ ...p, volumen: '' })) }} className={ic('volumen')} />
              {fieldErrors.volumen && <p className="text-red-500 text-xs mt-1">{fieldErrors.volumen}</p>}
            </div>
            <div><label className="flex items-center gap-2 pt-6"><input type="checkbox" checked={form.maneja_lotes} onChange={(e) => setForm({ ...form, maneja_lotes: e.target.checked })} /> Maneja Lotes</label></div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Precio Costo</label>
              <input type="number" step="0.01" value={form.precio_costo} onChange={(e) => { setForm({ ...form, precio_costo: e.target.value }); setFieldErrors((p) => ({ ...p, precio_costo: '', precio_venta: '' })) }} className={ic('precio_costo')} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Precio Venta</label>
              <input type="number" step="0.01" value={form.precio_venta} onChange={(e) => { setForm({ ...form, precio_venta: e.target.value }); setFieldErrors((p) => ({ ...p, precio_venta: '' })) }} className={ic('precio_venta')} />
              {fieldErrors.precio_venta && <p className="text-red-500 text-xs mt-1">{fieldErrors.precio_venta}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Stock Mínimo</label>
              <input type="number" value={form.stock_minimo} onChange={(e) => { setForm({ ...form, stock_minimo: e.target.value }); setFieldErrors((p) => ({ ...p, stock_minimo: '', stock_maximo: '' })) }} className={ic('stock_minimo')} />
              {fieldErrors.stock_minimo && <p className="text-red-500 text-xs mt-1">{fieldErrors.stock_minimo}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Stock Máximo</label>
              <input type="number" value={form.stock_maximo} onChange={(e) => { setForm({ ...form, stock_maximo: e.target.value }); setFieldErrors((p) => ({ ...p, stock_maximo: '' })) }} className={ic('stock_maximo')} />
              {fieldErrors.stock_maximo && <p className="text-red-500 text-xs mt-1">{fieldErrors.stock_maximo}</p>}
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

      <ConfirmDialog isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={() => handleDeleteConfirm()} title="Eliminar Producto" message={`\u00bfEst\u00e1 seguro de eliminar "${confirmDelete?.nombre}"?`} confirmLabel="Eliminar" confirmVariant="danger" isLoading={deleting} />
      <ConfirmDialog isOpen={!!confirmToggle} onClose={() => setConfirmToggle(null)} onConfirm={() => handleToggleConfirm()} title={confirmToggle?.estado ? 'Desactivar Producto' : 'Activar Producto'} message={`\u00bfEst\u00e1 seguro de ${confirmToggle?.estado ? 'desactivar' : 'activar'} "${confirmToggle?.nombre}"?`} confirmLabel={confirmToggle?.estado ? 'Desactivar' : 'Activar'} confirmVariant="primary" isLoading={toggling} />
    </div>
  )
}

/**
 * ABM de Lotes.
 * CRUD completo con filtro por producto. Los lotes tienen fecha de producción,
 * fecha de vencimiento, cantidad inicial y cantidad actual.
 * Solo se muestran productos que manejan lotes (maneja_lotes = true).
 *
 * Estado:
 *   - items: lista de lotes.
 *   - productos: para el selector de productos (solo los que manejan lotes).
 *   - form: datos del lote (fechas, cantidades).
 *   - editing: lote en edición.
 *
 * Llamadas API:
 *   - loteService.list(), .create(), .update(), .remove(), .toggleEstado()
 *   - productoService.list()
 */
function LotesABM() {
  const [items, setItems] = useState<Lote[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Lote | null>(null)
  const [filterProd, setFilterProd] = useState('')
  const [form, setForm] = useState({ idproducto: '', numero_lote: '', fecha_produccion: '', fecha_vencimiento: '', cantidad_inicial: '0', cantidad_actual: '0' })
  const addToast = useToastStore((state) => state.addToast)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const [confirmDelete, setConfirmDelete] = useState<Lote | null>(null)
  const [confirmToggle, setConfirmToggle] = useState<Lote | null>(null)

  // Carga lotes y productos; se refiltra al cambiar filterProd
  const fetchData = async () => {
    try {
      const [lRes, pRes] = await Promise.all([loteService.list(filterProd || undefined), productoService.list()])
      setItems(lRes.data.results); setProductos(pRes.data.results)
    } catch { addToast('error', 'Error al cargar lotes') } finally { setLoading(false) }
  }
  useEffect(() => { fetchData() }, [filterProd])

  const handleOpenCreate = () => {
    setEditing(null); setForm({ idproducto: filterProd, numero_lote: '', fecha_produccion: '', fecha_vencimiento: '', cantidad_inicial: '0', cantidad_actual: '0' }); setFieldErrors({}); setModalOpen(true)
  }

  const handleOpenEdit = (item: Lote) => {
    setEditing(item); setForm({ idproducto: item.idproducto, numero_lote: item.numero_lote, fecha_produccion: item.fecha_produccion || '', fecha_vencimiento: item.fecha_vencimiento || '', cantidad_inicial: item.cantidad_inicial.toString(), cantidad_actual: item.cantidad_actual.toString() }); setFieldErrors({}); setModalOpen(true)
  }

  const validate = (): boolean => {
    const e: Record<string, string> = {}
    const v1 = validateRequired(form.idproducto, 'Producto'); if (v1) e.idproducto = v1
    const v2 = validateRequired(form.numero_lote, 'Número Lote'); if (v2) e.numero_lote = v2
    const v3 = validatePositive(form.cantidad_inicial, 'Cantidad Inicial'); if (v3) e.cantidad_inicial = v3
    const v4 = validatePositive(form.cantidad_actual, 'Cantidad Actual'); if (v4) e.cantidad_actual = v4
    const v5 = validateDateAfter(form.fecha_vencimiento, form.fecha_produccion, 'Fecha Vencimiento', 'Fecha Producción'); if (v5) e.fecha_vencimiento = v5
    const v6 = validateGreaterThan(form.cantidad_inicial, form.cantidad_actual, 'Cantidad Inicial', 'Cantidad Actual'); if (v6) e.cantidad_inicial = v6
    setFieldErrors(e)
    return Object.keys(e).length === 0
  }

  const buildData = () => ({
    idproducto: form.idproducto, numero_lote: form.numero_lote,
    fecha_produccion: form.fecha_produccion || null, fecha_vencimiento: form.fecha_vencimiento || null,
    cantidad_inicial: Number(form.cantidad_inicial), cantidad_actual: Number(form.cantidad_actual),
  })

  const saveFn = async () => {
    const data = buildData()
    if (editing) await loteService.update(editing.idlote, data)
    else await loteService.create(data)
  }

  const { submit: handleSave, isSubmitting } = useSubmit(saveFn, {
    successMessage: editing ? 'Lote actualizado' : 'Lote creado',
    onSuccess: () => { setModalOpen(false); fetchData() },
  })

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (validate()) handleSave() }

  const { submit: handleDeleteConfirm, isSubmitting: deleting } = useSubmit(
    () => loteService.remove(confirmDelete!.idlote),
    { successMessage: 'Lote eliminado', onSuccess: () => { setConfirmDelete(null); fetchData() } }
  )

  const { submit: handleToggleConfirm, isSubmitting: toggling } = useSubmit(
    () => loteService.toggleEstado(confirmToggle!.idlote),
    { successMessage: 'Estado actualizado', onSuccess: () => { setConfirmToggle(null); fetchData() } }
  )

  const ic = (key: string) => `w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none ${fieldErrors[key] ? 'border-red-500' : ''}`

  const columns = [
    { key: 'producto_codigo', header: 'Producto' },
    { key: 'numero_lote', header: 'Lote' },
    { key: 'cantidad_actual', header: 'Cantidad' },
    { key: 'fecha_vencimiento', header: 'Vencimiento' },
    { key: 'estado', header: 'Estado', render: (item: Lote) => <span className={`px-2 py-1 text-xs rounded-full ${item.estado ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{item.estado ? 'Activo' : 'Inactivo'}</span> },
  ]

  const actions = (item: Lote) => (
    <>
      <button onClick={() => handleOpenEdit(item)} className="text-blue-600 hover:text-blue-800">Editar</button>
      <button onClick={() => setConfirmToggle(item)} className="text-yellow-600 hover:text-yellow-800">{item.estado ? 'Desactivar' : 'Activar'}</button>
      <button onClick={() => setConfirmDelete(item)} className="text-red-600 hover:text-red-800">Eliminar</button>
    </>
  )

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-gray-800">Lotes</h2>
          <select value={filterProd} onChange={(e) => setFilterProd(e.target.value)} className="px-3 py-1 border rounded-lg text-sm">
            <option value="">Todos los productos</option>
            {productos.filter((p) => p.maneja_lotes).map((p) => <option key={p.idproducto} value={p.idproducto}>{p.nombre}</option>)}
          </select>
        </div>
        <button onClick={handleOpenCreate} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Nuevo Lote</button>
      </div>
      <DataTable columns={columns} data={items} loading={loading} actions={actions} />
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Lote' : 'Nuevo Lote'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Producto *</label>
            <select value={form.idproducto} onChange={(e) => { setForm({ ...form, idproducto: e.target.value }); setFieldErrors((p) => ({ ...p, idproducto: '' })) }} className={ic('idproducto')}>
              <option value="">Seleccionar</option>
              {productos.map((p) => <option key={p.idproducto} value={p.idproducto}>{p.nombre}</option>)}
            </select>
            {fieldErrors.idproducto && <p className="text-red-500 text-xs mt-1">{fieldErrors.idproducto}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Número Lote *</label>
              <input type="text" value={form.numero_lote} onChange={(e) => { setForm({ ...form, numero_lote: e.target.value }); setFieldErrors((p) => ({ ...p, numero_lote: '' })) }} className={ic('numero_lote')} />
              {fieldErrors.numero_lote && <p className="text-red-500 text-xs mt-1">{fieldErrors.numero_lote}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Fecha Producción</label>
              <input type="date" value={form.fecha_produccion} onChange={(e) => { setForm({ ...form, fecha_produccion: e.target.value }); setFieldErrors((p) => ({ ...p, fecha_produccion: '', fecha_vencimiento: '' })) }} className={ic('fecha_produccion')} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Fecha Vencimiento</label>
              <input type="date" value={form.fecha_vencimiento} onChange={(e) => { setForm({ ...form, fecha_vencimiento: e.target.value }); setFieldErrors((p) => ({ ...p, fecha_vencimiento: '' })) }} className={ic('fecha_vencimiento')} />
              {fieldErrors.fecha_vencimiento && <p className="text-red-500 text-xs mt-1">{fieldErrors.fecha_vencimiento}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Cantidad Inicial *</label>
              <input type="number" step="0.01" value={form.cantidad_inicial} onChange={(e) => { setForm({ ...form, cantidad_inicial: e.target.value }); setFieldErrors((p) => ({ ...p, cantidad_inicial: '' })) }} className={ic('cantidad_inicial')} />
              {fieldErrors.cantidad_inicial && <p className="text-red-500 text-xs mt-1">{fieldErrors.cantidad_inicial}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Cantidad Actual *</label>
              <input type="number" step="0.01" value={form.cantidad_actual} onChange={(e) => { setForm({ ...form, cantidad_actual: e.target.value }); setFieldErrors((p) => ({ ...p, cantidad_actual: '' })) }} className={ic('cantidad_actual')} />
              {fieldErrors.cantidad_actual && <p className="text-red-500 text-xs mt-1">{fieldErrors.cantidad_actual}</p>}
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

      <ConfirmDialog isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={() => handleDeleteConfirm()} title="Eliminar Lote" message={`\u00bfEst\u00e1 seguro de eliminar el lote "${confirmDelete?.numero_lote}"?`} confirmLabel="Eliminar" confirmVariant="danger" isLoading={deleting} />
      <ConfirmDialog isOpen={!!confirmToggle} onClose={() => setConfirmToggle(null)} onConfirm={() => handleToggleConfirm()} title={confirmToggle?.estado ? 'Desactivar Lote' : 'Activar Lote'} message={`\u00bfEst\u00e1 seguro de ${confirmToggle?.estado ? 'desactivar' : 'activar'} el lote "${confirmToggle?.numero_lote}"?`} confirmLabel={confirmToggle?.estado ? 'Desactivar' : 'Activar'} confirmVariant="primary" isLoading={toggling} />
    </div>
  )
}

/**
 * ABM de Inventario (stock por ubicación).
 * CRUD completo con filtro por producto. Cada registro asocia un producto
 * a una ubicación física, con cantidad y lote opcional.
 *
 * Estado:
 *   - items: registros de inventario.
 *   - productos: para el selector en filtro y formulario.
 *   - form: producto, ubicación, lote y cantidad.
 *   - editing: registro en edición.
 *
 * Llamadas API:
 *   - inventarioService.list(), .create(), .update(), .remove(), .toggleEstado()
 *   - productoService.list()
 */
function InventarioABM() {
  const [items, setItems] = useState<InventarioItem[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<InventarioItem | null>(null)
  const [filterProd, setFilterProd] = useState('')
  const [form, setForm] = useState({ idproducto: '', idlote: '', idubicacion: '', cantidad: '0' })
  const addToast = useToastStore((state) => state.addToast)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const [confirmDelete, setConfirmDelete] = useState<InventarioItem | null>(null)
  const [confirmToggle, setConfirmToggle] = useState<InventarioItem | null>(null)

  // Carga inventario y productos; se refiltra al cambiar filterProd
  const fetchData = async () => {
    try {
      const [iRes, pRes] = await Promise.all([inventarioService.list(filterProd || undefined), productoService.list()])
      setItems(iRes.data.results); setProductos(pRes.data.results)
    } catch { addToast('error', 'Error al cargar inventario') } finally { setLoading(false) }
  }
  useEffect(() => { fetchData() }, [filterProd])

  const handleOpenCreate = () => {
    setEditing(null); setForm({ idproducto: filterProd, idlote: '', idubicacion: '', cantidad: '0' }); setFieldErrors({}); setModalOpen(true)
  }

  const handleOpenEdit = (item: InventarioItem) => {
    setEditing(item); setForm({ idproducto: item.idproducto, idlote: item.idlote || '', idubicacion: item.idubicacion, cantidad: item.cantidad.toString() }); setFieldErrors({}); setModalOpen(true)
  }

  const validate = (): boolean => {
    const e: Record<string, string> = {}
    const v1 = validateRequired(form.idproducto, 'Producto'); if (v1) e.idproducto = v1
    const v2 = validateRequired(form.idubicacion, 'ID Ubicación'); if (v2) e.idubicacion = v2
    const v3 = validateRequired(form.cantidad, 'Cantidad') || validatePositive(form.cantidad, 'Cantidad'); if (v3) e.cantidad = v3
    setFieldErrors(e)
    return Object.keys(e).length === 0
  }

  const buildData = () => ({
    idproducto: form.idproducto, idubicacion: form.idubicacion,
    idlote: form.idlote || null, cantidad: Number(form.cantidad),
  })

  const saveFn = async () => {
    const data = buildData()
    if (editing) await inventarioService.update(editing.idinventario, data)
    else await inventarioService.create(data)
  }

  const { submit: handleSave, isSubmitting } = useSubmit(saveFn, {
    successMessage: editing ? 'Inventario actualizado' : 'Inventario creado',
    onSuccess: () => { setModalOpen(false); fetchData() },
  })

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (validate()) handleSave() }

  const { submit: handleDeleteConfirm, isSubmitting: deleting } = useSubmit(
    () => inventarioService.remove(confirmDelete!.idinventario),
    { successMessage: 'Registro eliminado', onSuccess: () => { setConfirmDelete(null); fetchData() } }
  )

  const { submit: handleToggleConfirm, isSubmitting: toggling } = useSubmit(
    () => inventarioService.toggleEstado(confirmToggle!.idinventario),
    { successMessage: 'Estado actualizado', onSuccess: () => { setConfirmToggle(null); fetchData() } }
  )

  const ic = (key: string) => `w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none ${fieldErrors[key] ? 'border-red-500' : ''}`

  const columns = [
    { key: 'producto_codigo', header: 'Producto' },
    { key: 'ubicacion_codigo', header: 'Ubicación' },
    { key: 'lote_numero', header: 'Lote' },
    { key: 'cantidad', header: 'Cantidad' },
  ]

  const actions = (item: InventarioItem) => (
    <>
      <button onClick={() => handleOpenEdit(item)} className="text-blue-600 hover:text-blue-800">Editar</button>
      <button onClick={() => setConfirmToggle(item)} className="text-yellow-600 hover:text-yellow-800">{item.estado ? 'Desactivar' : 'Activar'}</button>
      <button onClick={() => setConfirmDelete(item)} className="text-red-600 hover:text-red-800">Eliminar</button>
    </>
  )

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-gray-800">Inventario</h2>
          <select value={filterProd} onChange={(e) => setFilterProd(e.target.value)} className="px-3 py-1 border rounded-lg text-sm">
            <option value="">Todos los productos</option>
            {productos.map((p) => <option key={p.idproducto} value={p.idproducto}>{p.nombre}</option>)}
          </select>
        </div>
        <button onClick={handleOpenCreate} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Nuevo Registro</button>
      </div>
      <DataTable columns={columns} data={items} loading={loading} actions={actions} />
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Inventario' : 'Nuevo Inventario'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Producto *</label>
            <select value={form.idproducto} onChange={(e) => { setForm({ ...form, idproducto: e.target.value }); setFieldErrors((p) => ({ ...p, idproducto: '' })) }} className={ic('idproducto')}>
              <option value="">Seleccionar</option>
              {productos.map((p) => <option key={p.idproducto} value={p.idproducto}>{p.nombre}</option>)}
            </select>
            {fieldErrors.idproducto && <p className="text-red-500 text-xs mt-1">{fieldErrors.idproducto}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">ID Ubicación *</label>
            <input type="text" value={form.idubicacion} onChange={(e) => { setForm({ ...form, idubicacion: e.target.value }); setFieldErrors((p) => ({ ...p, idubicacion: '' })) }} className={ic('idubicacion')} />
            {fieldErrors.idubicacion && <p className="text-red-500 text-xs mt-1">{fieldErrors.idubicacion}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">ID Lote (opcional)</label>
            <input type="text" value={form.idlote} onChange={(e) => setForm({ ...form, idlote: e.target.value })} className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Cantidad *</label>
            <input type="number" step="0.01" value={form.cantidad} onChange={(e) => { setForm({ ...form, cantidad: e.target.value }); setFieldErrors((p) => ({ ...p, cantidad: '' })) }} className={ic('cantidad')} />
            {fieldErrors.cantidad && <p className="text-red-500 text-xs mt-1">{fieldErrors.cantidad}</p>}
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

      <ConfirmDialog isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={() => handleDeleteConfirm()} title="Eliminar Registro" message={`\u00bfEst\u00e1 seguro de eliminar este registro de inventario?`} confirmLabel="Eliminar" confirmVariant="danger" isLoading={deleting} />
      <ConfirmDialog isOpen={!!confirmToggle} onClose={() => setConfirmToggle(null)} onConfirm={() => handleToggleConfirm()} title={confirmToggle?.estado ? 'Desactivar Registro' : 'Activar Registro'} message={`\u00bfEst\u00e1 seguro de ${confirmToggle?.estado ? 'desactivar' : 'activar'} este registro?`} confirmLabel={confirmToggle?.estado ? 'Desactivar' : 'Activar'} confirmVariant="primary" isLoading={toggling} />
    </div>
  )
}

/**
 * Vista de Kardex (historial de movimientos de inventario).
 * Muestra una tabla con todos los movimientos (entradas, salidas, ajustes, transferencias)
 * filtrable por producto. Solo lectura (sin modificación).
 *
 * Estado:
 *   - items: movimientos de kardex.
 *   - filterProd: filtro por producto.
 *
 * Llamadas API:
 *   - kardexService.list() — lista de movimientos (con filtro opcional).
 *   - productoService.list()
 */
function KardexView() {
  const [items, setItems] = useState<KardexItem[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [filterProd, setFilterProd] = useState('')
  const addToast = useToastStore((state) => state.addToast)

  // Carga movimientos de kardex y productos; se refiltra al cambiar filterProd
  const fetchData = () => {
    setLoading(true)
    Promise.all([kardexService.list(filterProd || undefined), productoService.list()])
      .then(([kRes, pRes]) => { setItems(kRes.data.results); setProductos(pRes.data.results) })
      .catch(() => { addToast('error', 'Error al cargar kardex') })
      .finally(() => setLoading(false))
  }
  useEffect(() => { fetchData() }, [filterProd])

  const columns = [
    { key: 'producto_codigo', header: 'Producto' },
    { key: 'fecha_movimiento', header: 'Fecha' },
    {
      key: 'tipo_movimiento', header: 'Tipo',
      render: (item: KardexItem) => {
        const colors: Record<string, string> = { entrada: 'bg-green-100 text-green-800', salida: 'bg-red-100 text-red-800', ajuste: 'bg-yellow-100 text-yellow-800', transferencia: 'bg-blue-100 text-blue-800' }
        return <span className={`px-2 py-1 text-xs rounded-full ${colors[item.tipo_movimiento] || 'bg-gray-100'}`}>{item.tipo_movimiento}</span>
      },
    },
    { key: 'cantidad', header: 'Cantidad' },
    { key: 'saldo_anterior', header: 'Saldo Ant.' },
    { key: 'saldo_nuevo', header: 'Saldo Nuevo' },
    { key: 'referencia', header: 'Referencia' },
    { key: 'lote_numero', header: 'Lote' },
  ]

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-gray-800">Kardex</h2>
          <select value={filterProd} onChange={(e) => setFilterProd(e.target.value)} className="px-3 py-1 border rounded-lg text-sm">
            <option value="">Todos los productos</option>
            {productos.map((p) => <option key={p.idproducto} value={p.idproducto}>{p.nombre}</option>)}
          </select>
        </div>
      </div>
      <DataTable columns={columns} data={items} loading={loading} />
    </div>
  )
}

/**
 * Vista de Picking FEFO/FIFO.
 * Permite seleccionar un producto, cantidad y estrategia (FEFO = Primero en Vencer,
 * FIFO = Primero en Entrar), y calcula qué lotes/ubicaciones se deben pickear
 * para cubrir la cantidad solicitada.
 *
 * Estado:
 *   - productos: lista para el selector.
 *   - selectedProducto / cantidad / estrategia: parámetros del cálculo.
 *   - result: resultado del cálculo (lista de picks, info de completitud).
 *   - error: mensaje de error si el cálculo falla.
 *
 * Llamadas API:
 *   - productoService.list()
 *   - inventarioService.picking(producto, cantidad, estrategia)
 */
function PickingView() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [selectedProducto, setSelectedProducto] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [estrategia, setEstrategia] = useState<string>('fefo')
  const [result, setResult] = useState<PickingResult | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const addToast = useToastStore((state) => state.addToast)

  // Carga la lista de productos al montar
  useEffect(() => {
    productoService.list().then(({ data }) => setProductos(data.results)).catch(() => { addToast('error', 'Error al cargar productos') })
  }, [])

  // Ejecuta el cálculo de picking FEFO/FIFO en el backend
  const handleCalcular = async () => {
    if (!selectedProducto) return
    const num = parseFloat(cantidad)
    if (isNaN(num) || num <= 0) {
      setError('La cantidad debe ser mayor a 0')
      return
    }
    setError(''); setResult(null); setLoading(true)
    try {
      const { data } = await inventarioService.picking(selectedProducto, num, estrategia)
      setResult(data)
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } }
      setError(axiosErr.response?.data?.error || 'Error al calcular')
    } finally { setLoading(false) }
  }

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-4">Picking FEFO/FIFO</h2>
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium mb-1">Producto</label>
            <select value={selectedProducto} onChange={(e) => setSelectedProducto(e.target.value)} className="w-full px-3 py-2 border rounded-lg">
              <option value="">Seleccionar</option>
              {productos.map((p) => <option key={p.idproducto} value={p.idproducto}>{p.codigo} - {p.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Cantidad a Pickear</label>
            <input type="number" step="0.01" value={cantidad} onChange={(e) => setCantidad(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Estrategia</label>
            <select value={estrategia} onChange={(e) => setEstrategia(e.target.value)} className="w-full px-3 py-2 border rounded-lg">
              <option value="fefo">FEFO (Primero en Vencer)</option>
              <option value="fifo">FIFO (Primero en Entrar)</option>
            </select>
          </div>
          <button onClick={handleCalcular} disabled={loading || !selectedProducto || !cantidad}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Calculando...' : 'Calcular Picking'}
          </button>
        </div>
      </div>

      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}

      {result && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-semibold">{result.producto.nombre}</h3>
              <p className="text-sm text-gray-500">Código: {result.producto.codigo} | Estrategia: <span className="font-bold text-blue-600">{result.estrategia}</span></p>
            </div>
            <div className={`text-sm px-3 py-1 rounded-full ${result.completo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {result.completo ? 'Completo' : `Faltante: ${result.faltante}`}
            </div>
          </div>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">#</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Ubicación</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Lote</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Vencimiento</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Cantidad Pickear</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {result.picking.map((pick, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm">{idx + 1}</td>
                  <td className="px-4 py-2 text-sm font-mono">{pick.ubicacion_codigo}</td>
                  <td className="px-4 py-2 text-sm">{pick.lote_numero || '\u2014'}</td>
                  <td className="px-4 py-2 text-sm">{pick.vencimiento || '\u2014'}</td>
                  <td className="px-4 py-2 text-sm text-right font-bold">{pick.cantidad_pickear} {result.producto.unidad_medida}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
