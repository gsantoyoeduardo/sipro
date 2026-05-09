import { useState, useEffect } from 'react'
import DataTable from '../../components/DataTable'
import Modal from '../../components/Modal'
import { empresaService } from '../../api/empresa'
import type { Empresa } from '../../types'

export default function EmpresasPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Empresa | null>(null)
  const [form, setForm] = useState({
    razonsocial: '',
    nombrecomercial: '',
    ruc: '',
    correo: '',
    telefono: '',
    direccion: '',
  })

  const fetchEmpresas = async () => {
    try {
      const { data } = await empresaService.list()
      setEmpresas(data.results)
    } catch {
      // error
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEmpresas()
  }, [])

  const handleOpenCreate = () => {
    setEditing(null)
    setForm({ razonsocial: '', nombrecomercial: '', ruc: '', correo: '', telefono: '', direccion: '' })
    setModalOpen(true)
  }

  const handleOpenEdit = (item: Empresa) => {
    setEditing(item)
    setForm({
      razonsocial: item.razonsocial,
      nombrecomercial: item.nombrecomercial,
      ruc: item.ruc,
      correo: item.correo,
      telefono: item.telefono || '',
      direccion: item.direccion || '',
    })
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editing) {
        await empresaService.update(editing.idempresa, form)
      } else {
        await empresaService.create(form)
      }
      setModalOpen(false)
      fetchEmpresas()
    } catch {
      // error
    }
  }

  const handleToggleEstado = async (id: string) => {
    try {
      await empresaService.toggleEstado(id)
      fetchEmpresas()
    } catch {
      // error
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar esta empresa?')) return
    try {
      await empresaService.remove(id)
      fetchEmpresas()
    } catch {
      // error
    }
  }

  const columns = [
    { key: 'razonsocial', header: 'Razón Social' },
    { key: 'nombrecomercial', header: 'Nombre Comercial' },
    { key: 'ruc', header: 'RUC' },
    { key: 'correo', header: 'Correo' },
    {
      key: 'estado',
      header: 'Estado',
      render: (item: Empresa) => (
        <span className={`px-2 py-1 text-xs rounded-full ${item.estado ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {item.estado ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
  ]

  const actions = (item: Empresa) => (
    <>
      <button onClick={() => handleOpenEdit(item)} className="text-blue-600 hover:text-blue-800">Editar</button>
      <button onClick={() => handleToggleEstado(item.idempresa)} className="text-yellow-600 hover:text-yellow-800">
        {item.estado ? 'Desactivar' : 'Activar'}
      </button>
      <button onClick={() => handleDelete(item.idempresa)} className="text-red-600 hover:text-red-800">Eliminar</button>
    </>
  )

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Empresas</h1>
        <button
          onClick={handleOpenCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Nueva Empresa
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <DataTable columns={columns} data={empresas} loading={loading} actions={actions} />
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Empresa' : 'Nueva Empresa'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Razón Social *</label>
            <input
              type="text"
              value={form.razonsocial}
              onChange={(e) => setForm({ ...form, razonsocial: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Comercial</label>
            <input
              type="text"
              value={form.nombrecomercial}
              onChange={(e) => setForm({ ...form, nombrecomercial: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">RUC *</label>
              <input
                type="text"
                value={form.ruc}
                onChange={(e) => setForm({ ...form, ruc: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Correo *</label>
              <input
                type="email"
                value={form.correo}
                onChange={(e) => setForm({ ...form, correo: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
            <textarea
              value={form.direccion}
              onChange={(e) => setForm({ ...form, direccion: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              rows={2}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              {editing ? 'Guardar' : 'Crear'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
