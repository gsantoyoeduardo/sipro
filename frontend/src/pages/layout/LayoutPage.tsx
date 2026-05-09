import { useState, useEffect } from 'react'
import DataTable from '../../components/DataTable'
import Modal from '../../components/Modal'
import { almacenService } from '../../api/empresa'
import { zonaService, pasilloService, estanteService, nivelService } from '../../api/layout'
import type { Almacen, Zona, Pasillo, Estante, Nivel } from '../../types'
import LayoutMapPage from './LayoutMapPage'

type ViewLevel = 'map' | 'zonas' | 'pasillos' | 'estantes' | 'niveles'

export default function LayoutPage() {
  const [view, setView] = useState<ViewLevel>('map')

  return (
    <div>
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

      {view === 'map' && <LayoutMapPage />}
      {view === 'zonas' && <ZonasABM />}
      {view === 'pasillos' && <PasillosABM />}
      {view === 'estantes' && <EstantesABM />}
      {view === 'niveles' && <NivelesABM />}
    </div>
  )
}

function ZonasABM() {
  const [zonas, setZonas] = useState<Zona[]>([])
  const [almacenes, setAlmacenes] = useState<Almacen[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Zona | null>(null)
  const [filterAlmacen, setFilterAlmacen] = useState('')
  const [form, setForm] = useState({
    idalmacen: '', nombre: '', codigo: '', tipo: 'almacenamiento' as string,
    x: 0, y: 0, ancho: 120, alto: 80, color: '',
  })

  const fetchData = async () => {
    try {
      const [zonasRes, almRes] = await Promise.all([
        zonaService.list(filterAlmacen || undefined),
        almacenService.list(),
      ])
      setZonas(zonasRes.data.results)
      setAlmacenes(almRes.data.results)
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [filterAlmacen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const data = { ...form, x: Number(form.x), y: Number(form.y), ancho: Number(form.ancho), alto: Number(form.alto), color: form.color || null }
      if (editing) await zonaService.update(editing.idzona, data)
      else await zonaService.create(data)
      setModalOpen(false); fetchData()
    } catch {}
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta zona?')) return
    await zonaService.remove(id); fetchData()
  }

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
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-gray-800">Zonas</h2>
          <select value={filterAlmacen} onChange={(e) => setFilterAlmacen(e.target.value)} className="px-3 py-1 border rounded-lg text-sm">
            <option value="">Todos los almacenes</option>
            {almacenes.map((a) => <option key={a.idalmacen} value={a.idalmacen}>{a.nombre}</option>)}
          </select>
        </div>
        <button onClick={() => { setEditing(null); setForm({ idalmacen: filterAlmacen, nombre: '', codigo: '', tipo: 'almacenamiento', x: 0, y: 0, ancho: 120, alto: 80, color: '' }); setModalOpen(true) }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Nueva Zona</button>
      </div>
      <DataTable columns={columns} data={zonas} loading={loading}
        actions={(item) => (
          <>
            <button onClick={() => { setEditing(item); setForm({ idalmacen: item.idalmacen, nombre: item.nombre, codigo: item.codigo, tipo: item.tipo, x: item.x, y: item.y, ancho: item.ancho, alto: item.alto, color: item.color || '' }); setModalOpen(true) }}
              className="text-blue-600 hover:text-blue-800">Editar</button>
            <button onClick={() => zonaService.toggleEstado(item.idzona).then(fetchData)} className="text-yellow-600 hover:text-yellow-800">
              {item.estado ? 'Desactivar' : 'Activar'}</button>
            <button onClick={() => handleDelete(item.idzona)} className="text-red-600 hover:text-red-800">Eliminar</button>
          </>
        )} />
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Zona' : 'Nueva Zona'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Almacén *</label>
            <select value={form.idalmacen} onChange={(e) => setForm({ ...form, idalmacen: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required>
              <option value="">Seleccionar</option>
              {almacenes.map((a) => <option key={a.idalmacen} value={a.idalmacen}>{a.nombre}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">Nombre *</label><input type="text" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required /></div>
            <div><label className="block text-sm font-medium mb-1">Código *</label><input type="text" value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">Tipo</label>
              <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                {['recepcion','almacenamiento','despacho','picking','devoluciones'].map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div><label className="block text-sm font-medium mb-1">Color</label><input type="color" value={form.color || '#2196F3'} onChange={(e) => setForm({ ...form, color: e.target.value })} className="w-full h-10 border rounded" /></div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div><label className="block text-sm font-medium mb-1">X</label><input type="number" value={form.x} onChange={(e) => setForm({ ...form, x: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium mb-1">Y</label><input type="number" value={form.y} onChange={(e) => setForm({ ...form, y: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium mb-1">Ancho</label><input type="number" value={form.ancho} onChange={(e) => setForm({ ...form, ancho: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium mb-1">Alto</label><input type="number" value={form.alto} onChange={(e) => setForm({ ...form, alto: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" /></div>
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

function PasillosABM() {
  const [items, setItems] = useState<Pasillo[]>([])
  const [zonas, setZonas] = useState<Zona[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Pasillo | null>(null)
  const [filterZona, setFilterZona] = useState('')
  const [form, setForm] = useState({ idzona: '', nombre: '', codigo: '', x: 0, y: 0, ancho: 40, largo: 60, orientacion: 'horizontal' as string })

  const fetchData = async () => {
    try {
      const [pRes, zRes] = await Promise.all([pasilloService.list(filterZona || undefined), zonaService.list()])
      setItems(pRes.data.results); setZonas(zRes.data.results)
    } catch {} finally { setLoading(false) }
  }
  useEffect(() => { fetchData() }, [filterZona])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const data = { ...form, x: Number(form.x), y: Number(form.y), ancho: Number(form.ancho), largo: Number(form.largo) }
    try {
      if (editing) await pasilloService.update(editing.idpasillo, data)
      else await pasilloService.create(data)
      setModalOpen(false); fetchData()
    } catch {}
  }

  const columns = [
    { key: 'nombre', header: 'Nombre' }, { key: 'codigo', header: 'Código' },
    { key: 'orientacion', header: 'Orientación' }, { key: 'estantes_count', header: 'Estantes' },
    { key: 'estado', header: 'Estado', render: (item: Pasillo) => <span className={`px-2 py-1 text-xs rounded-full ${item.estado ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{item.estado ? 'Activo' : 'Inactivo'}</span> },
  ]

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-gray-800">Pasillos</h2>
          <select value={filterZona} onChange={(e) => setFilterZona(e.target.value)} className="px-3 py-1 border rounded-lg text-sm">
            <option value="">Todas las zonas</option>
            {zonas.map((z) => <option key={z.idzona} value={z.idzona}>{z.nombre}</option>)}
          </select>
        </div>
        <button onClick={() => { setEditing(null); setForm({ idzona: filterZona, nombre: '', codigo: '', x: 0, y: 0, ancho: 40, largo: 60, orientacion: 'horizontal' }); setModalOpen(true) }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Nuevo Pasillo</button>
      </div>
      <DataTable columns={columns} data={items} loading={loading}
        actions={(item) => (
          <>
            <button onClick={() => { setEditing(item); setForm({ idzona: item.idzona, nombre: item.nombre, codigo: item.codigo, x: item.x, y: item.y, ancho: item.ancho, largo: item.largo, orientacion: item.orientacion }); setModalOpen(true) }}
              className="text-blue-600 hover:text-blue-800">Editar</button>
            <button onClick={() => pasilloService.toggleEstado(item.idpasillo).then(fetchData)} className="text-yellow-600 hover:text-yellow-800">{item.estado ? 'Desactivar' : 'Activar'}</button>
            <button onClick={() => { if (confirm('¿Eliminar?')) pasilloService.remove(item.idpasillo).then(fetchData) }} className="text-red-600 hover:text-red-800">Eliminar</button>
          </>
        )} />
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Pasillo' : 'Nuevo Pasillo'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">Zona *</label>
            <select value={form.idzona} onChange={(e) => setForm({ ...form, idzona: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required>
              <option value="">Seleccionar</option>
              {zonas.map((z) => <option key={z.idzona} value={z.idzona}>{z.nombre}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">Nombre *</label><input type="text" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required /></div>
            <div><label className="block text-sm font-medium mb-1">Código *</label><input type="text" value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">Orientación</label>
              <select value={form.orientacion} onChange={(e) => setForm({ ...form, orientacion: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                <option value="horizontal">Horizontal</option>
                <option value="vertical">Vertical</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div><label className="block text-sm font-medium mb-1">X</label><input type="number" value={form.x} onChange={(e) => setForm({ ...form, x: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium mb-1">Y</label><input type="number" value={form.y} onChange={(e) => setForm({ ...form, y: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium mb-1">Ancho</label><input type="number" value={form.ancho} onChange={(e) => setForm({ ...form, ancho: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium mb-1">Largo</label><input type="number" value={form.largo} onChange={(e) => setForm({ ...form, largo: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" /></div>
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

function EstantesABM() {
  const [items, setItems] = useState<Estante[]>([])
  const [pasillos, setPasillos] = useState<Pasillo[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Estante | null>(null)
  const [filterPasillo, setFilterPasillo] = useState('')
  const [form, setForm] = useState({ idpasillo: '', nombre: '', codigo: '', x: 0, y: 0, ancho: 20, alto: 30, profundidad: 20, lado: 'derecha' as string, cantidadniveles: 3 })

  const fetchData = async () => {
    try {
      const [eRes, pRes] = await Promise.all([estanteService.list(filterPasillo || undefined), pasilloService.list()])
      setItems(eRes.data.results); setPasillos(pRes.data.results)
    } catch {} finally { setLoading(false) }
  }
  useEffect(() => { fetchData() }, [filterPasillo])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const data = { ...form, x: Number(form.x), y: Number(form.y), ancho: Number(form.ancho), alto: Number(form.alto), profundidad: Number(form.profundidad), cantidadniveles: Number(form.cantidadniveles) }
    try {
      if (editing) await estanteService.update(editing.idestante, data)
      else await estanteService.create(data)
      setModalOpen(false); fetchData()
    } catch {}
  }

  const columns = [
    { key: 'nombre', header: 'Nombre' }, { key: 'codigo', header: 'Código' }, { key: 'lado', header: 'Lado' },
    { key: 'niveles_count', header: 'Niveles' },
    { key: 'estado', header: 'Estado', render: (item: Estante) => <span className={`px-2 py-1 text-xs rounded-full ${item.estado ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{item.estado ? 'Activo' : 'Inactivo'}</span> },
  ]

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-gray-800">Estantes</h2>
          <select value={filterPasillo} onChange={(e) => setFilterPasillo(e.target.value)} className="px-3 py-1 border rounded-lg text-sm">
            <option value="">Todos los pasillos</option>
            {pasillos.map((p) => <option key={p.idpasillo} value={p.idpasillo}>{p.nombre}</option>)}
          </select>
        </div>
        <button onClick={() => { setEditing(null); setForm({ idpasillo: filterPasillo, nombre: '', codigo: '', x: 0, y: 0, ancho: 20, alto: 30, profundidad: 20, lado: 'derecha', cantidadniveles: 3 }); setModalOpen(true) }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Nuevo Estante</button>
      </div>
      <DataTable columns={columns} data={items} loading={loading}
        actions={(item) => (
          <>
            <button onClick={() => { setEditing(item); setForm({ idpasillo: item.idpasillo, nombre: item.nombre, codigo: item.codigo, x: item.x, y: item.y, ancho: item.ancho, alto: item.alto, profundidad: item.profundidad, lado: item.lado, cantidadniveles: item.cantidadniveles }); setModalOpen(true) }}
              className="text-blue-600 hover:text-blue-800">Editar</button>
            <button onClick={() => estanteService.toggleEstado(item.idestante).then(fetchData)} className="text-yellow-600 hover:text-yellow-800">{item.estado ? 'Desactivar' : 'Activar'}</button>
            <button onClick={() => { if (confirm('¿Eliminar?')) estanteService.remove(item.idestante).then(fetchData) }} className="text-red-600 hover:text-red-800">Eliminar</button>
          </>
        )} />
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Estante' : 'Nuevo Estante'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">Pasillo *</label>
            <select value={form.idpasillo} onChange={(e) => setForm({ ...form, idpasillo: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required>
              <option value="">Seleccionar</option>
              {pasillos.map((p) => <option key={p.idpasillo} value={p.idpasillo}>{p.nombre}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">Nombre *</label><input type="text" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required /></div>
            <div><label className="block text-sm font-medium mb-1">Código *</label><input type="text" value={form.codigo} onChange={(e) => setForm({ ...form, codigo: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">Lado</label>
              <select value={form.lado} onChange={(e) => setForm({ ...form, lado: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                <option value="derecha">Derecha</option><option value="izquierda">Izquierda</option>
              </select>
            </div>
            <div><label className="block text-sm font-medium mb-1">Cant. Niveles</label><input type="number" value={form.cantidadniveles} onChange={(e) => setForm({ ...form, cantidadniveles: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" /></div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div><label className="block text-sm font-medium mb-1">X</label><input type="number" value={form.x} onChange={(e) => setForm({ ...form, x: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium mb-1">Y</label><input type="number" value={form.y} onChange={(e) => setForm({ ...form, y: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium mb-1">Ancho</label><input type="number" value={form.ancho} onChange={(e) => setForm({ ...form, ancho: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" /></div>
            <div><label className="block text-sm font-medium mb-1">Alto</label><input type="number" value={form.alto} onChange={(e) => setForm({ ...form, alto: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" /></div>
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

function NivelesABM() {
  const [items, setItems] = useState<Nivel[]>([])
  const [estantes, setEstantes] = useState<Estante[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Nivel | null>(null)
  const [filterEstante, setFilterEstante] = useState('')
  const [form, setForm] = useState({ idestante: '', nombre: '', numero: 1, altura: 10 })

  const fetchData = async () => {
    try {
      const [nRes, eRes] = await Promise.all([nivelService.list(filterEstante || undefined), estanteService.list()])
      setItems(nRes.data.results); setEstantes(eRes.data.results)
    } catch {} finally { setLoading(false) }
  }
  useEffect(() => { fetchData() }, [filterEstante])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const data = { ...form, numero: Number(form.numero), altura: Number(form.altura) }
    try {
      if (editing) await nivelService.update(editing.idnivel, data)
      else await nivelService.create(data)
      setModalOpen(false); fetchData()
    } catch {}
  }

  const columns = [
    { key: 'nombre', header: 'Nombre' }, { key: 'numero', header: 'Número' }, { key: 'altura', header: 'Altura' },
    { key: 'estado', header: 'Estado', render: (item: Nivel) => <span className={`px-2 py-1 text-xs rounded-full ${item.estado ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{item.estado ? 'Activo' : 'Inactivo'}</span> },
  ]

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-gray-800">Niveles</h2>
          <select value={filterEstante} onChange={(e) => setFilterEstante(e.target.value)} className="px-3 py-1 border rounded-lg text-sm">
            <option value="">Todos los estantes</option>
            {estantes.map((e) => <option key={e.idestante} value={e.idestante}>{e.nombre}</option>)}
          </select>
        </div>
        <button onClick={() => { setEditing(null); setForm({ idestante: filterEstante, nombre: '', numero: 1, altura: 10 }); setModalOpen(true) }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Nuevo Nivel</button>
      </div>
      <DataTable columns={columns} data={items} loading={loading}
        actions={(item) => (
          <>
            <button onClick={() => { setEditing(item); setForm({ idestante: item.idestante, nombre: item.nombre, numero: item.numero, altura: item.altura }); setModalOpen(true) }}
              className="text-blue-600 hover:text-blue-800">Editar</button>
            <button onClick={() => nivelService.toggleEstado(item.idnivel).then(fetchData)} className="text-yellow-600 hover:text-yellow-800">{item.estado ? 'Desactivar' : 'Activar'}</button>
            <button onClick={() => { if (confirm('¿Eliminar?')) nivelService.remove(item.idnivel).then(fetchData) }} className="text-red-600 hover:text-red-800">Eliminar</button>
          </>
        )} />
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Nivel' : 'Nuevo Nivel'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">Estante *</label>
            <select value={form.idestante} onChange={(e) => setForm({ ...form, idestante: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required>
              <option value="">Seleccionar</option>
              {estantes.map((e) => <option key={e.idestante} value={e.idestante}>{e.nombre}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">Nombre *</label><input type="text" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required /></div>
            <div><label className="block text-sm font-medium mb-1">Número *</label><input type="number" value={form.numero} onChange={(e) => setForm({ ...form, numero: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" required /></div>
          </div>
          <div><label className="block text-sm font-medium mb-1">Altura</label><input type="number" value={form.altura} onChange={(e) => setForm({ ...form, altura: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" /></div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border rounded-lg">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">{editing ? 'Guardar' : 'Crear'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
