import { useState, useEffect } from 'react'
import DataTable from '../../components/DataTable'
import Modal from '../../components/Modal'
import { almacenService } from '../../api/empresa'
import { nodoService, conexionService } from '../../api/layout'
import type { Almacen, Nodo, Conexion } from '../../types'

export default function NodosPage() {
  const [nodos, setNodos] = useState<Nodo[]>([])
  const [conexiones, setConexiones] = useState<Conexion[]>([])
  const [almacenes, setAlmacenes] = useState<Almacen[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [conexModalOpen, setConexModalOpen] = useState(false)
  const [editing, setEditing] = useState<Nodo | null>(null)
  const [filterAlmacen, setFilterAlmacen] = useState('')
  const [form, setForm] = useState({
    idalmacen: '', nombre: '', tipo: 'interseccion' as string,
    coordenada_x: 0, coordenada_y: 0, idubicacion: '',
  })
  const [conexForm, setConexForm] = useState({
    idnodoorigen: '', idnododestino: '', distancia: 0, tipo: 'pasillo' as string, bidireccional: true,
  })

  const fetchData = async () => {
    try {
      const [nRes, cRes, aRes] = await Promise.all([
        nodoService.list(filterAlmacen || undefined),
        conexionService.list(),
        almacenService.list(),
      ])
      setNodos(nRes.data.results)
      setConexiones(cRes.data.results)
      setAlmacenes(aRes.data.results)
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [filterAlmacen])

  const handleSubmitNodo = async (e: React.FormEvent) => {
    e.preventDefault()
    const data = {
      ...form,
      coordenada_x: Number(form.coordenada_x),
      coordenada_y: Number(form.coordenada_y),
      idubicacion: form.idubicacion || null,
    }
    try {
      if (editing) await nodoService.update(editing.idnodo, data)
      else await nodoService.create(data)
      setModalOpen(false); fetchData()
    } catch {}
  }

  const handleSubmitConex = async (e: React.FormEvent) => {
    e.preventDefault()
    const data = { ...conexForm, distancia: Number(conexForm.distancia) }
    try {
      await conexionService.create(data)
      setConexModalOpen(false); fetchData()
    } catch {}
  }

  const nodoColumns = [
    { key: 'nombre', header: 'Nombre' },
    { key: 'tipo', header: 'Tipo' },
    { key: 'coordenada_x', header: 'X' },
    { key: 'coordenada_y', header: 'Y' },
    { key: 'conexiones_count', header: 'Conexiones' },
    {
      key: 'estado', header: 'Estado',
      render: (item: Nodo) => (
        <span className={`px-2 py-1 text-xs rounded-full ${item.estado ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {item.estado ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
  ]

  const conexColumns = [
    {
      key: 'origen',
      header: 'Origen',
      render: (item: Conexion) => item.origen_nombre || item.idnodoorigen.substring(0, 8),
    },
    {
      key: 'destino',
      header: 'Destino',
      render: (item: Conexion) => item.destino_nombre || item.idnododestino.substring(0, 8),
    },
    { key: 'distancia', header: 'Distancia (m)' },
    { key: 'tipo', header: 'Tipo' },
    {
      key: 'bidireccional',
      header: 'Bidireccional',
      render: (item: Conexion) => item.bidireccional ? 'Sí' : 'No',
    },
    {
      key: 'estado', header: 'Estado',
      render: (item: Conexion) => (
        <span className={`px-2 py-1 text-xs rounded-full ${item.estado ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {item.estado ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
  ]

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-800">Nodos</h1>
          <select value={filterAlmacen} onChange={(e) => setFilterAlmacen(e.target.value)} className="px-3 py-1 border rounded-lg text-sm">
            <option value="">Todos los almacenes</option>
            {almacenes.map((a) => <option key={a.idalmacen} value={a.idalmacen}>{a.nombre}</option>)}
          </select>
        </div>
        <button
          onClick={() => { setEditing(null); setForm({ idalmacen: filterAlmacen, nombre: '', tipo: 'interseccion', coordenada_x: 0, coordenada_y: 0, idubicacion: '' }); setModalOpen(true) }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Nuevo Nodo
        </button>
      </div>

      <div className="bg-white rounded-lg shadow mb-8">
        <DataTable columns={nodoColumns} data={nodos} loading={loading}
          actions={(item) => (
            <>
              <button onClick={() => { setEditing(item); setForm({ idalmacen: item.idalmacen, nombre: item.nombre, tipo: item.tipo, coordenada_x: item.coordenada_x, coordenada_y: item.coordenada_y, idubicacion: item.idubicacion || '' }); setModalOpen(true) }}
                className="text-blue-600 hover:text-blue-800">Editar</button>
              <button onClick={() => nodoService.toggleEstado(item.idnodo).then(fetchData)} className="text-yellow-600 hover:text-yellow-800">
                {item.estado ? 'Desactivar' : 'Activar'}</button>
              <button onClick={() => { if (confirm('¿Eliminar?')) nodoService.remove(item.idnodo).then(fetchData) }} className="text-red-600 hover:text-red-800">Eliminar</button>
            </>
          )} />
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Conexiones</h2>
        <button
          onClick={() => { setConexForm({ idnodoorigen: '', idnododestino: '', distancia: 0, tipo: 'pasillo', bidireccional: true }); setConexModalOpen(true) }}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          Nueva Conexión
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <DataTable columns={conexColumns} data={conexiones} loading={loading}
          actions={(item) => (
            <>
              <button onClick={() => conexionService.toggleEstado(item.idconexion).then(fetchData)} className="text-yellow-600 hover:text-yellow-800">
                {item.estado ? 'Desactivar' : 'Activar'}</button>
              <button onClick={() => { if (confirm('¿Eliminar?')) conexionService.remove(item.idconexion).then(fetchData) }} className="text-red-600 hover:text-red-800">Eliminar</button>
            </>
          )} />
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Nodo' : 'Nuevo Nodo'} size="lg">
        <form onSubmit={handleSubmitNodo} className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">Almacén *</label>
            <select value={form.idalmacen} onChange={(e) => setForm({ ...form, idalmacen: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required>
              <option value="">Seleccionar</option>
              {almacenes.map((a) => <option key={a.idalmacen} value={a.idalmacen}>{a.nombre}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">Nombre *</label><input type="text" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required /></div>
            <div><label className="block text-sm font-medium mb-1">Tipo *</label>
              <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required>
                {['entrada','salida','esquina','interseccion','punto_recogida'].map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">Coordenada X *</label><input type="number" value={form.coordenada_x} onChange={(e) => setForm({ ...form, coordenada_x: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" required /></div>
            <div><label className="block text-sm font-medium mb-1">Coordenada Y *</label><input type="number" value={form.coordenada_y} onChange={(e) => setForm({ ...form, coordenada_y: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" required /></div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border rounded-lg">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">{editing ? 'Guardar' : 'Crear'}</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={conexModalOpen} onClose={() => setConexModalOpen(false)} title="Nueva Conexión">
        <form onSubmit={handleSubmitConex} className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">Nodo Origen *</label>
            <select value={conexForm.idnodoorigen} onChange={(e) => setConexForm({ ...conexForm, idnodoorigen: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required>
              <option value="">Seleccionar</option>
              {nodos.map((n) => <option key={n.idnodo} value={n.idnodo}>{n.nombre}</option>)}
            </select>
          </div>
          <div><label className="block text-sm font-medium mb-1">Nodo Destino *</label>
            <select value={conexForm.idnododestino} onChange={(e) => setConexForm({ ...conexForm, idnododestino: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required>
              <option value="">Seleccionar</option>
              {nodos.map((n) => <option key={n.idnodo} value={n.idnodo}>{n.nombre}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">Distancia (m) *</label><input type="number" step="0.01" value={conexForm.distancia} onChange={(e) => setConexForm({ ...conexForm, distancia: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" required /></div>
            <div><label className="block text-sm font-medium mb-1">Tipo</label>
              <select value={conexForm.tipo} onChange={(e) => setConexForm({ ...conexForm, tipo: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                {['pasillo','cruce','acceso'].map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={conexForm.bidireccional} onChange={(e) => setConexForm({ ...conexForm, bidireccional: e.target.checked })} />
            Bidireccional
          </label>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setConexModalOpen(false)} className="px-4 py-2 border rounded-lg">Cancelar</button>
            <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg">Crear Conexión</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
