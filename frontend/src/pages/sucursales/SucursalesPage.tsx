import { useState, useEffect } from 'react'
import DataTable from '../../components/DataTable'
import Modal from '../../components/Modal'
import { sucursalService, empresaService } from '../../api/empresa'
import type { Sucursal, Empresa } from '../../types'

export default function SucursalesPage() {
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Sucursal | null>(null)
  const [filterEmpresa, setFilterEmpresa] = useState('')
  const [form, setForm] = useState({
    idempresa: '',
    nombre: '',
    codigo: '',
    direccion: '',
    telefono: '',
  })

  const fetchData = async () => {
    try {
      const [sucRes, empRes] = await Promise.all([
        sucursalService.list(),
        empresaService.list(),
      ])
      setSucursales(sucRes.data.results)
      setEmpresas(empRes.data.results)
    } catch {
      // error
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filteredSucursales = filterEmpresa
    ? sucursales.filter((s) => s.idempresa === filterEmpresa)
    : sucursales

  const getEmpresaName = (idempresa: string) => {
    return empresas.find((e) => e.idempresa === idempresa)?.razonsocial || '—'
  }

  const handleOpenCreate = () => {
    setEditing(null)
    setForm({ idempresa: filterEmpresa || '', nombre: '', codigo: '', direccion: '', telefono: '' })
    setModalOpen(true)
  }

  const handleOpenEdit = (item: Sucursal) => {
    setEditing(item)
    setForm({
      idempresa: item.idempresa,
      nombre: item.nombre,
      codigo: item.codigo,
      direccion: item.direccion || '',
      telefono: item.telefono || '',
    })
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editing) {
        await sucursalService.update(editing.idsucursal, form)
      } else {
        await sucursalService.create(form)
      }
      setModalOpen(false)
      fetchData()
    } catch {
      // error
    }
  }

  const handleToggleEstado = async (id: string) => {
    try {
      await sucursalService.toggleEstado(id)
      fetchData()
    } catch {
      // error
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar esta sucursal?')) return
    try {
      await sucursalService.remove(id)
      fetchData()
    } catch {
      // error
    }
  }

  const columns = [
    { key: 'nombre', header: 'Nombre' },
    { key: 'codigo', header: 'Código' },
    {
      key: 'idempresa',
      header: 'Empresa',
      render: (item: Sucursal) => getEmpresaName(item.idempresa),
    },
    { key: 'direccion', header: 'Dirección' },
    {
      key: 'estado',
      header: 'Estado',
      render: (item: Sucursal) => (
        <span className={`px-2 py-1 text-xs rounded-full ${item.estado ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {item.estado ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
  ]

  const actions = (item: Sucursal) => (
    <>
      <button onClick={() => handleOpenEdit(item)} className="text-blue-600 hover:text-blue-800">Editar</button>
      <button onClick={() => handleToggleEstado(item.idsucursal)} className="text-yellow-600 hover:text-yellow-800">
        {item.estado ? 'Desactivar' : 'Activar'}
      </button>
      <button onClick={() => handleDelete(item.idsucursal)} className="text-red-600 hover:text-red-800">Eliminar</button>
    </>
  )

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Sucursales</h1>
        <button
          onClick={handleOpenCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Nueva Sucursal
        </button>
      </div>

      <div className="mb-4">
        <select
          value={filterEmpresa}
          onChange={(e) => setFilterEmpresa(e.target.value)}
          className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
        >
          <option value="">Todas las empresas</option>
          {empresas.map((emp) => (
            <option key={emp.idempresa} value={emp.idempresa}>{emp.razonsocial}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-lg shadow">
        <DataTable columns={columns} data={filteredSucursales} loading={loading} actions={actions} />
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Sucursal' : 'Nueva Sucursal'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Empresa *</label>
            <select
              value={form.idempresa}
              onChange={(e) => setForm({ ...form, idempresa: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            >
              <option value="">Seleccionar empresa</option>
              {empresas.map((emp) => (
                <option key={emp.idempresa} value={emp.idempresa}>{emp.razonsocial}</option>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
            <textarea
              value={form.direccion}
              onChange={(e) => setForm({ ...form, direccion: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              rows={2}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
            <input
              type="text"
              value={form.telefono}
              onChange={(e) => setForm({ ...form, telefono: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
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
