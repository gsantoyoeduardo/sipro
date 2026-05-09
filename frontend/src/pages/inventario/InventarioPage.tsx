import { useState, useEffect } from 'react'
import DataTable from '../../components/DataTable'
import Modal from '../../components/Modal'
import { categoriaService, productoService, loteService, inventarioService, kardexService } from '../../api/inventario'
import type { Categoria, Producto, Lote, InventarioItem, KardexItem, PickingResult } from '../../types'

type TabView = 'categorias' | 'productos' | 'lotes' | 'inventario' | 'kardex' | 'picking'

export default function InventarioPage() {
  const [view, setView] = useState<TabView>('categorias')

  return (
    <div>
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

function CategoriasABM() {
  const [items, setItems] = useState<Categoria[]>([])
  const [allCats, setAllCats] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Categoria | null>(null)
  const [form, setForm] = useState({ nombre: '', descripcion: '', idcategoriapadre: '' })

  const fetchData = async () => {
    try {
      const catRes = await categoriaService.list()
      setItems(catRes.data.results)
      setAllCats(catRes.data.results)
    } catch {} finally { setLoading(false) }
  }
  useEffect(() => { fetchData() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const data = { ...form, idcategoriapadre: form.idcategoriapadre || null }
    try {
      if (editing) await categoriaService.update(editing.idcategoria, data)
      else await categoriaService.create(data)
      setModalOpen(false); fetchData()
    } catch {}
  }

  const getPadre = (id: string | null) => id ? allCats.find((c) => c.idcategoria === id)?.nombre || '—' : '—'

  const columns = [
    { key: 'nombre', header: 'Nombre' },
    { key: 'descripcion', header: 'Descripción' },
    { key: 'idcategoriapadre', header: 'Padre', render: (item: Categoria) => getPadre(item.idcategoriapadre) },
    { key: 'estado', header: 'Estado', render: (item: Categoria) => <span className={`px-2 py-1 text-xs rounded-full ${item.estado ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{item.estado ? 'Activo' : 'Inactivo'}</span> },
  ]

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Categorías</h2>
        <button onClick={() => { setEditing(null); setForm({ nombre: '', descripcion: '', idcategoriapadre: '' }); setModalOpen(true) }} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Nueva Categoría</button>
      </div>
      <DataTable columns={columns} data={items} loading={loading}
        actions={(item) => (
          <>
            <button onClick={() => { setEditing(item); setForm({ nombre: item.nombre, descripcion: item.descripcion || '', idcategoriapadre: item.idcategoriapadre || '' }); setModalOpen(true) }} className="text-blue-600 hover:text-blue-800">Editar</button>
            <button onClick={() => categoriaService.toggleEstado(item.idcategoria).then(fetchData)} className="text-yellow-600 hover:text-yellow-800">{item.estado ? 'Desactivar' : 'Activar'}</button>
            <button onClick={() => { if (confirm('¿Eliminar?')) categoriaService.remove(item.idcategoria).then(fetchData) }} className="text-red-600 hover:text-red-800">Eliminar</button>
          </>
        )} />
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Categoría' : 'Nueva Categoría'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">Nombre *</label><input type="text" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required /></div>
          <div><label className="block text-sm font-medium mb-1">Descripción</label><textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} className="w-full px-3 py-2 border rounded-lg" rows={2} /></div>
          <div><label className="block text-sm font-medium mb-1">Categoría Padre</label>
            <select value={form.idcategoriapadre} onChange={(e) => setForm({ ...form, idcategoriapadre: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
              <option value="">Sin padre (raíz)</option>
              {allCats.filter((c) => c.idcategoria !== editing?.idcategoria).map((c) => <option key={c.idcategoria} value={c.idcategoria}>{c.nombre}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border rounded-lg">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">{editing ? 'Guardar' : 'Crear'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

function ProductosABM() {
  const [items, setItems] = useState<Producto[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Producto | null>(null)
  const [filterCat, setFilterCat] = useState('')
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({ idcategoria: '', codigo: '', nombre: '', descripcion: '', unidad_medida: 'unidad', peso: '', volumen: '', precio_costo: '', precio_venta: '', stock_minimo: '0', stock_maximo: '0', maneja_lotes: false })

  const fetchData = async () => {
    try {
      const [pRes, cRes] = await Promise.all([productoService.list(filterCat || undefined, search || undefined), categoriaService.list()])
      setItems(pRes.data.results); setCategorias(cRes.data.results)
    } catch {} finally { setLoading(false) }
  }
  useEffect(() => { fetchData() }, [filterCat, search])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const data = {
      ...form,
      peso: form.peso ? Number(form.peso) : null, volumen: form.volumen ? Number(form.volumen) : null,
      precio_costo: form.precio_costo ? Number(form.precio_costo) : null, precio_venta: form.precio_venta ? Number(form.precio_venta) : null,
      stock_minimo: Number(form.stock_minimo), stock_maximo: Number(form.stock_maximo),
    }
    try {
      if (editing) await productoService.update(editing.idproducto, data)
      else await productoService.create(data)
      setModalOpen(false); fetchData()
    } catch {}
  }

  const columns = [
    { key: 'codigo', header: 'Código' },
    { key: 'nombre', header: 'Nombre' },
    { key: 'categoria_nombre', header: 'Categoría' },
    { key: 'unidad_medida', header: 'U.M.' },
    { key: 'stock_total', header: 'Stock' },
    { key: 'precio_venta', header: 'P.Venta' },
    { key: 'estado', header: 'Estado', render: (item: Producto) => <span className={`px-2 py-1 text-xs rounded-full ${item.estado ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{item.estado ? 'Activo' : 'Inactivo'}</span> },
  ]

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
        <button onClick={() => { setEditing(null); setForm({ idcategoria: filterCat, codigo: '', nombre: '', descripcion: '', unidad_medida: 'unidad', peso: '', volumen: '', precio_costo: '', precio_venta: '', stock_minimo: '0', stock_maximo: '0', maneja_lotes: false }); setModalOpen(true) }} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Nuevo Producto</button>
      </div>
      <DataTable columns={columns} data={items} loading={loading}
        actions={(item) => (
          <>
            <button onClick={() => { setEditing(item); setForm({ idcategoria: item.idcategoria, codigo: item.codigo, nombre: item.nombre, descripcion: item.descripcion || '', unidad_medida: item.unidad_medida, peso: item.peso?.toString() || '', volumen: item.volumen?.toString() || '', precio_costo: item.precio_costo?.toString() || '', precio_venta: item.precio_venta?.toString() || '', stock_minimo: item.stock_minimo.toString(), stock_maximo: item.stock_maximo.toString(), maneja_lotes: item.maneja_lotes }); setModalOpen(true) }} className="text-blue-600 hover:text-blue-800">Editar</button>
            <button onClick={() => productoService.toggleEstado(item.idproducto).then(fetchData)} className="text-yellow-600 hover:text-yellow-800">{item.estado ? 'Desactivar' : 'Activar'}</button>
            <button onClick={() => { if (confirm('¿Eliminar?')) productoService.remove(item.idproducto).then(fetchData) }} className="text-red-600 hover:text-red-800">Eliminar</button>
          </>
        )} />
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Producto' : 'Nuevo Producto'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">Categoría *</label>
            <select value={form.idcategoria} onChange={(e) => setForm({ ...form, idcategoria: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required>
              <option value="">Seleccionar</option>
              {categorias.map((c) => <option key={c.idcategoria} value={c.idcategoria}>{c.nombre}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div><label className="block text-sm font-medium mb-1">Código *</label><input type="text" value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required /></div>
            <div className="col-span-2"><label className="block text-sm font-medium mb-1">Nombre *</label><input type="text" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required /></div>
          </div>
          <div><label className="block text-sm font-medium mb-1">Descripción</label><textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} className="w-full px-3 py-2 border rounded-lg" rows={2} /></div>
          <div className="grid grid-cols-4 gap-4">
            <div><label className="block text-sm font-medium mb-1">Unidad Medida</label>
              <select value={form.unidad_medida} onChange={(e) => setForm({ ...form, unidad_medida: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                {['unidad','kg','g','l','ml','m','m2','m3','caja','pallet'].map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div><label className="block text-sm font-medium mb-1">Peso</label><input type="number" step="0.001" value={form.peso} onChange={(e) => setForm({ ...form, peso: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium mb-1">Volumen</label><input type="number" step="0.001" value={form.volumen} onChange={(e) => setForm({ ...form, volumen: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
            <div><label className="flex items-center gap-2 pt-6"><input type="checkbox" checked={form.maneja_lotes} onChange={(e) => setForm({ ...form, maneja_lotes: e.target.checked })} /> Maneja Lotes</label></div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div><label className="block text-sm font-medium mb-1">Precio Costo</label><input type="number" step="0.01" value={form.precio_costo} onChange={(e) => setForm({ ...form, precio_costo: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium mb-1">Precio Venta</label><input type="number" step="0.01" value={form.precio_venta} onChange={(e) => setForm({ ...form, precio_venta: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium mb-1">Stock Mínimo</label><input type="number" value={form.stock_minimo} onChange={(e) => setForm({ ...form, stock_minimo: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium mb-1">Stock Máximo</label><input type="number" value={form.stock_maximo} onChange={(e) => setForm({ ...form, stock_maximo: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border rounded-lg">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">{editing ? 'Guardar' : 'Crear'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

function LotesABM() {
  const [items, setItems] = useState<Lote[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Lote | null>(null)
  const [filterProd, setFilterProd] = useState('')
  const [form, setForm] = useState({ idproducto: '', numero_lote: '', fecha_produccion: '', fecha_vencimiento: '', cantidad_inicial: '0', cantidad_actual: '0' })

  const fetchData = async () => {
    try {
      const [lRes, pRes] = await Promise.all([loteService.list(filterProd || undefined), productoService.list()])
      setItems(lRes.data.results); setProductos(pRes.data.results)
    } catch {} finally { setLoading(false) }
  }
  useEffect(() => { fetchData() }, [filterProd])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const data = {
      ...form,
      cantidad_inicial: Number(form.cantidad_inicial), cantidad_actual: Number(form.cantidad_actual),
      fecha_produccion: form.fecha_produccion || null, fecha_vencimiento: form.fecha_vencimiento || null,
    }
    try {
      if (editing) await loteService.update(editing.idlote, data)
      else await loteService.create(data)
      setModalOpen(false); fetchData()
    } catch {}
  }

  const columns = [
    { key: 'producto_codigo', header: 'Producto' },
    { key: 'numero_lote', header: 'Lote' },
    { key: 'cantidad_actual', header: 'Cantidad' },
    { key: 'fecha_vencimiento', header: 'Vencimiento' },
    { key: 'estado', header: 'Estado', render: (item: Lote) => <span className={`px-2 py-1 text-xs rounded-full ${item.estado ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{item.estado ? 'Activo' : 'Inactivo'}</span> },
  ]

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
        <button onClick={() => { setEditing(null); setForm({ idproducto: filterProd, numero_lote: '', fecha_produccion: '', fecha_vencimiento: '', cantidad_inicial: '0', cantidad_actual: '0' }); setModalOpen(true) }} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Nuevo Lote</button>
      </div>
      <DataTable columns={columns} data={items} loading={loading}
        actions={(item) => (
          <>
            <button onClick={() => { setEditing(item); setForm({ idproducto: item.idproducto, numero_lote: item.numero_lote, fecha_produccion: item.fecha_produccion || '', fecha_vencimiento: item.fecha_vencimiento || '', cantidad_inicial: item.cantidad_inicial.toString(), cantidad_actual: item.cantidad_actual.toString() }); setModalOpen(true) }} className="text-blue-600 hover:text-blue-800">Editar</button>
            <button onClick={() => loteService.toggleEstado(item.idlote).then(fetchData)} className="text-yellow-600 hover:text-yellow-800">{item.estado ? 'Desactivar' : 'Activar'}</button>
            <button onClick={() => { if (confirm('¿Eliminar?')) loteService.remove(item.idlote).then(fetchData) }} className="text-red-600 hover:text-red-800">Eliminar</button>
          </>
        )} />
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Lote' : 'Nuevo Lote'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">Producto *</label>
            <select value={form.idproducto} onChange={(e) => setForm({ ...form, idproducto: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required>
              <option value="">Seleccionar</option>
              {productos.map((p) => <option key={p.idproducto} value={p.idproducto}>{p.nombre}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">Número Lote *</label><input type="text" value={form.numero_lote} onChange={(e) => setForm({ ...form, numero_lote: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">Fecha Producción</label><input type="date" value={form.fecha_produccion} onChange={(e) => setForm({ ...form, fecha_produccion: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium mb-1">Fecha Vencimiento</label><input type="date" value={form.fecha_vencimiento} onChange={(e) => setForm({ ...form, fecha_vencimiento: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">Cantidad Inicial *</label><input type="number" step="0.01" value={form.cantidad_inicial} onChange={(e) => setForm({ ...form, cantidad_inicial: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required /></div>
            <div><label className="block text-sm font-medium mb-1">Cantidad Actual *</label><input type="number" step="0.01" value={form.cantidad_actual} onChange={(e) => setForm({ ...form, cantidad_actual: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required /></div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border rounded-lg">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">{editing ? 'Guardar' : 'Crear'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

function InventarioABM() {
  const [items, setItems] = useState<InventarioItem[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<InventarioItem | null>(null)
  const [filterProd, setFilterProd] = useState('')
  const [form, setForm] = useState({ idproducto: '', idlote: '', idubicacion: '', cantidad: '0' })

  const fetchData = async () => {
    try {
      const [iRes, pRes] = await Promise.all([inventarioService.list(filterProd || undefined), productoService.list()])
      setItems(iRes.data.results); setProductos(pRes.data.results)
    } catch {} finally { setLoading(false) }
  }
  useEffect(() => { fetchData() }, [filterProd])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const data = { ...form, cantidad: Number(form.cantidad), idlote: form.idlote || null }
    try {
      if (editing) await inventarioService.update(editing.idinventario, data)
      else await inventarioService.create(data)
      setModalOpen(false); fetchData()
    } catch {}
  }

  const columns = [
    { key: 'producto_codigo', header: 'Producto' },
    { key: 'ubicacion_codigo', header: 'Ubicación' },
    { key: 'lote_numero', header: 'Lote' },
    { key: 'cantidad', header: 'Cantidad' },
  ]

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
        <button onClick={() => { setEditing(null); setForm({ idproducto: filterProd, idlote: '', idubicacion: '', cantidad: '0' }); setModalOpen(true) }} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Nuevo Registro</button>
      </div>
      <DataTable columns={columns} data={items} loading={loading}
        actions={(item) => (
          <>
            <button onClick={() => { setEditing(item); setForm({ idproducto: item.idproducto, idlote: item.idlote || '', idubicacion: item.idubicacion, cantidad: item.cantidad.toString() }); setModalOpen(true) }} className="text-blue-600 hover:text-blue-800">Editar</button>
            <button onClick={() => inventarioService.toggleEstado(item.idinventario).then(fetchData)} className="text-yellow-600 hover:text-yellow-800">{item.estado ? 'Desactivar' : 'Activar'}</button>
            <button onClick={() => { if (confirm('¿Eliminar?')) inventarioService.remove(item.idinventario).then(fetchData) }} className="text-red-600 hover:text-red-800">Eliminar</button>
          </>
        )} />
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Inventario' : 'Nuevo Inventario'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">Producto *</label>
            <select value={form.idproducto} onChange={(e) => setForm({ ...form, idproducto: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required>
              <option value="">Seleccionar</option>
              {productos.map((p) => <option key={p.idproducto} value={p.idproducto}>{p.nombre}</option>)}
            </select>
          </div>
          <div><label className="block text-sm font-medium mb-1">ID Ubicación *</label><input type="text" value={form.idubicacion} onChange={(e) => setForm({ ...form, idubicacion: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required /></div>
          <div><label className="block text-sm font-medium mb-1">ID Lote (opcional)</label><input type="text" value={form.idlote} onChange={(e) => setForm({ ...form, idlote: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
          <div><label className="block text-sm font-medium mb-1">Cantidad *</label><input type="number" step="0.01" value={form.cantidad} onChange={(e) => setForm({ ...form, cantidad: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required /></div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border rounded-lg">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">{editing ? 'Guardar' : 'Crear'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

function KardexView() {
  const [items, setItems] = useState<KardexItem[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [filterProd, setFilterProd] = useState('')

  useEffect(() => {
    Promise.all([kardexService.list(filterProd || undefined), productoService.list()])
      .then(([kRes, pRes]) => { setItems(kRes.data.results); setProductos(pRes.data.results) })
      .catch(() => {}).finally(() => setLoading(false))
  }, [filterProd])

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

function PickingView() {
  const [productos, setProductos] = useState<Producto[]>([])
  const [selectedProducto, setSelectedProducto] = useState('')
  const [cantidad, setCantidad] = useState('')
  const [estrategia, setEstrategia] = useState<string>('fefo')
  const [result, setResult] = useState<PickingResult | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    productoService.list().then(({ data }) => setProductos(data.results)).catch(() => {})
  }, [])

  const handleCalcular = async () => {
    if (!selectedProducto || !cantidad) return
    setError(''); setResult(null); setLoading(true)
    try {
      const { data } = await inventarioService.picking(selectedProducto, Number(cantidad), estrategia)
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
                  <td className="px-4 py-2 text-sm">{pick.lote_numero || '—'}</td>
                  <td className="px-4 py-2 text-sm">{pick.vencimiento || '—'}</td>
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
