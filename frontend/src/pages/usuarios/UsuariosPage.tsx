import { useState, useEffect } from 'react'
import DataTable from '../../components/DataTable'
import Modal from '../../components/Modal'
import { usuarioService, rolService } from '../../api/seguridad'
import type { Usuario, Rol } from '../../types'

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [roles, setRoles] = useState<Rol[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Usuario | null>(null)
  const [form, setForm] = useState({
    nombres: '',
    apellidos: '',
    correo: '',
    usuario: '',
    telefono: '',
    idempresa: '',
    password: '',
  })
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])

  const fetchData = async () => {
    try {
      const [usrRes, rolRes] = await Promise.all([
        usuarioService.list(),
        rolService.list(),
      ])
      setUsuarios(usrRes.data.results)
      setRoles(rolRes.data.results)
    } catch {
      // error
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleOpenCreate = () => {
    setEditing(null)
    setForm({ nombres: '', apellidos: '', correo: '', usuario: '', telefono: '', idempresa: '', password: '' })
    setSelectedRoles([])
    setModalOpen(true)
  }

  const handleOpenEdit = (item: Usuario) => {
    setEditing(item)
    setForm({
      nombres: item.nombres,
      apellidos: item.apellidos,
      correo: item.correo,
      usuario: item.usuario,
      telefono: item.telefono || '',
      idempresa: item.idempresa || '',
      password: '',
    })
    setSelectedRoles(item.roles?.map((r) => r.idrol) || [])
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editing) {
        const { password, ...updateData } = form
        await usuarioService.update(editing.idusuario, updateData)
        if (selectedRoles.length > 0) {
          await usuarioService.asignarRoles(editing.idusuario, selectedRoles)
        }
      } else {
        const newUser = await usuarioService.create(form)
        if (selectedRoles.length > 0) {
          await usuarioService.asignarRoles(newUser.data.idusuario, selectedRoles)
        }
      }
      setModalOpen(false)
      fetchData()
    } catch {
      // error
    }
  }

  const handleToggleEstado = async (id: string) => {
    try {
      await usuarioService.toggleEstado(id)
      fetchData()
    } catch {
      // error
    }
  }

  const handleResetPassword = async (id: string) => {
    if (!confirm('¿Está seguro de resetear la contraseña de este usuario?')) return
    try {
      await usuarioService.resetPassword(id)
      alert('Contraseña reseteada exitosamente')
    } catch {
      // error
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este usuario?')) return
    try {
      await usuarioService.remove(id)
      fetchData()
    } catch {
      // error
    }
  }

  const columns = [
    {
      key: 'nombre',
      header: 'Nombre',
      render: (item: Usuario) => `${item.nombres} ${item.apellidos}`,
    },
    { key: 'usuario', header: 'Usuario' },
    { key: 'correo', header: 'Correo' },
    { key: 'telefono', header: 'Teléfono' },
    {
      key: 'estado',
      header: 'Estado',
      render: (item: Usuario) => (
        <span className={`px-2 py-1 text-xs rounded-full ${item.estado ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {item.estado ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
  ]

  const actions = (item: Usuario) => (
    <>
      <button onClick={() => handleOpenEdit(item)} className="text-blue-600 hover:text-blue-800">Editar</button>
      <button onClick={() => handleToggleEstado(item.idusuario)} className="text-yellow-600 hover:text-yellow-800">
        {item.estado ? 'Desactivar' : 'Activar'}
      </button>
      <button onClick={() => handleResetPassword(item.idusuario)} className="text-orange-600 hover:text-orange-800">Reset Pass</button>
      <button onClick={() => handleDelete(item.idusuario)} className="text-red-600 hover:text-red-800">Eliminar</button>
    </>
  )

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Usuarios</h1>
        <button
          onClick={handleOpenCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Nuevo Usuario
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <DataTable columns={columns} data={usuarios} loading={loading} actions={actions} />
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Usuario' : 'Nuevo Usuario'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombres *</label>
              <input
                type="text"
                value={form.nombres}
                onChange={(e) => setForm({ ...form, nombres: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Apellidos *</label>
              <input
                type="text"
                value={form.apellidos}
                onChange={(e) => setForm({ ...form, apellidos: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Usuario *</label>
              <input
                type="text"
                value={form.usuario}
                onChange={(e) => setForm({ ...form, usuario: e.target.value })}
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
              <input
                type="text"
                value={form.telefono}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>
            {!editing && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña *</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required={!editing}
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Roles</label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-lg p-3">
              {roles.map((rol) => (
                <label key={rol.idrol} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedRoles.includes(rol.idrol)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedRoles([...selectedRoles, rol.idrol])
                      } else {
                        setSelectedRoles(selectedRoles.filter((id) => id !== rol.idrol))
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{rol.nombre}</span>
                </label>
              ))}
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
