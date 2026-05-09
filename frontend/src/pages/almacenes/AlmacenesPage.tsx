import { useState, useEffect } from 'react'
import DataTable from '../../components/DataTable'
import Modal from '../../components/Modal'
import { almacenService, sucursalService } from '../../api/empresa'
import type { Almacen, Sucursal } from '../../types'

export default function AlmacenesPage() {
  const [almacenes, setAlmacenes] = useState<Almacen[]>([])
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Almacen | null>(null)
  const [filterSucursal, setFilterSucursal] = useState('')
  const [form, setForm] = useState({
    idsucursal: '',
    nombre: '',
    codigo: '',
    descripcion: '',
    ancho: '',
    alto: '',
    capacidadmaxima: '',
  })

  const fetchData = async () => {
    try {
      const [almRes, sucRes] = await Promise.all([
        almacenService.list(),
        sucursalService.list(),
      ])
      setAlmacenes(almRes.data.results)
      setSucursales(sucRes.data.results)
    } catch {
      // error
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filteredAlmacenes = filterSucursal
    ? almacenes.filter((a) => a.idsucursal === filterSucursal)
    : almacenes

  const getSucursalName = (idsucursal: string) => {
    return sucursales.find((s) => s.idsucursal === idsucursal)?.nombre || '—'
  }

  const handleOpenCreate = () => {
    setEditing(null)
    setForm({ idsucursal: filterSucursal || '', nombre: '', codigo: '', descripcion: '', ancho: '', alto: '', capacidadmaxima: '' })
    setModalOpen(true)
  }

  const handleOpenEdit = (item: Almacen) => {
    setEditing(item)
    setForm({
      idsucursal: item.idsucursal,
      nombre: item.nombre,
      codigo: item.codigo,
      descripcion: item.descripcion || '',
      ancho: item.ancho?.toString() || '',
      alto: item.alto?.toString() || '',
      capacidadmaxima: item.capacidadmaxima?.toString() || '',
    })
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const data = {
      idsucursal: form.idsucursal,
      nombre: form.nombre,
      codigo: form.codigo,
      descripcion: form.descripcion || null,
      ancho: form.ancho ? parseFloat(form.ancho) : null,
      alto: form.alto ? parseFloat(form.alto) : null,
      capacidadmaxima: form.capacidadmaxima ? parseFloat(form.capacidadmaxima) : null,
    }
    try {
      if (editing) {
        await almacenService.update(editing.idalmacen, data)
      } else {
        await almacenService.create(data)
      }
      setModalOpen(false)
      fetchData()
    } catch {
      // error
    }
  }

  const handleToggleEstado = async (id: string) => {
    try {
      await almacenService.toggleEstado(id)
      fetchData()
    } catch {
      // error
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este almacén?')) return
    try {
      await almacenService.remove(id)
      fetchData()
    } catch {
      // error
    }
  }

  const columns = [
    { key: 'nombre', header: 'Nombre' },
    { key: 'codigo', header: 'Código' },
    {
      key: 'idsucursal',
      header: 'Sucursal',
      render: (item: Almacen) => getSucursalName(item.idsucursal),
    },
    {
      key: 'capacidadmaxima',
      header: 'Capacidad Máx.',
      render: (item: Almacen) => item.capacidadmaxima ? `${item.capacidadmaxima} m³` : '—',
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (item: Almacen) => (
        <span className={`px-2 py-1 text-xs rounded-full ${item.estado ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {item.estado ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
  ]

  const actions = (item: Almacen) => (
    <>
      <button onClick={() => handleOpenEdit(item)} className="text-blue-600 hover:text-blue-800">Editar</button>
      <button onClick={() => handleToggleEstado(item.idalmacen)} className="text-yellow-600 hover:text-yellow-800">
        {item.estado ? 'Desactivar' : 'Activar'}
      </button>
      <button onClick={() => handleDelete(item.idalmacen)} className="text-red-600 hover:text-red-800">Eliminar</button>
    </>
  )

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Almacenes</h1>
        <button
          onClick={handleOpenCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Nuevo Almacén
        </button>
      </div>

      <div className="mb-4">
        <select
          value={filterSucursal}
          onChange={(e) => setFilterSucursal(e.target.value)}
          className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
        >
          <option value="">Todas las sucursales</option>
          {sucursales.map((suc) => (
            <option key={suc.idsucursal} value={suc.idsucursal}>{suc.nombre}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-lg shadow">
        <DataTable columns={columns} data={filteredAlmacenes} loading={loading} actions={actions} />
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Almacén' : 'Nuevo Almacén'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sucursal *</label>
            <select
              value={form.idsucursal}
              onChange={(e) => setForm({ ...form, idsucursal: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            >
              <option value="">Seleccionar sucursal</option>
              {sucursales.map((suc) => (
                <option key={suc.idsucursal} value={suc.idsucursal}>{suc.nombre}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <input
                type="text"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Código *</label>
              <input
                type="text"
                value={form.codigo}
                onChange={(e) => setForm({ ...form, codigo: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              rows={2}
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ancho (m)</label>
              <input
                type="number"
                step="0.01"
                value={form.ancho}
                onChange={(e) => setForm({ ...form, ancho: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alto (m)</label>
              <input
                type="number"
                step="0.01"
                value={form.alto}
                onChange={(e) => setForm({ ...form, alto: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Capacidad Máx. (m³)</label>
              <input
                type="number"
                step="0.01"
                value={form.capacidadmaxima}
                onChange={(e) => setForm({ ...form, capacidadmaxima: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition">
              Cancelar
            </button>
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
              {editing ? 'Guardar' : 'Crear'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
