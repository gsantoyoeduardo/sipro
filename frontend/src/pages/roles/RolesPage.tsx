import { useState, useEffect } from 'react'
import DataTable from '../../components/DataTable'
import Modal from '../../components/Modal'
import { rolService, permisoService } from '../../api/seguridad'
import type { Rol, Permiso } from '../../types'

export default function RolesPage() {
  const [roles, setRoles] = useState<Rol[]>([])
  const [permisos, setPermisos] = useState<Permiso[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [permisosModalOpen, setPermisosModalOpen] = useState(false)
  const [editing, setEditing] = useState<Rol | null>(null)
  const [form, setForm] = useState({ nombre: '', descripcion: '' })
  const [selectedPermisos, setSelectedPermisos] = useState<string[]>([])

  const fetchData = async () => {
    try {
      const [rolRes, permRes] = await Promise.all([
        rolService.list(),
        permisoService.list(),
      ])
      setRoles(rolRes.data.results)
      setPermisos(permRes.data.results)
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
    setForm({ nombre: '', descripcion: '' })
    setSelectedPermisos([])
    setModalOpen(true)
  }

  const handleOpenEdit = (item: Rol) => {
    setEditing(item)
    setForm({ nombre: item.nombre, descripcion: item.descripcion || '' })
    setSelectedPermisos(item.permisos?.map((p) => p.idpermiso) || [])
    setModalOpen(true)
  }

  const handleOpenPermisos = (item: Rol) => {
    setEditing(item)
    setSelectedPermisos(item.permisos?.map((p) => p.idpermiso) || [])
    setPermisosModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editing) {
        await rolService.update(editing.idrol, form)
        await rolService.asignarPermisos(editing.idrol, selectedPermisos)
      } else {
        const newRol = await rolService.create(form)
        if (selectedPermisos.length > 0) {
          await rolService.asignarPermisos(newRol.data.idrol, selectedPermisos)
        }
      }
      setModalOpen(false)
      fetchData()
    } catch {
      // error
    }
  }

  const handleSavePermisos = async () => {
    if (!editing) return
    try {
      await rolService.asignarPermisos(editing.idrol, selectedPermisos)
      setPermisosModalOpen(false)
      fetchData()
    } catch {
      // error
    }
  }

  const handleToggleEstado = async (id: string) => {
    try {
      await rolService.toggleEstado(id)
      fetchData()
    } catch {
      // error
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Está seguro de eliminar este rol?')) return
    try {
      await rolService.remove(id)
      fetchData()
    } catch {
      // error
    }
  }

  const columns = [
    { key: 'nombre', header: 'Nombre' },
    { key: 'descripcion', header: 'Descripción' },
    {
      key: 'permisos',
      header: 'Permisos',
      render: (item: Rol) => (
        <span className="text-sm text-gray-500">{item.permisos?.length || 0} asignados</span>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      render: (item: Rol) => (
        <span className={`px-2 py-1 text-xs rounded-full ${item.estado ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {item.estado ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
  ]

  const actions = (item: Rol) => (
    <>
      <button onClick={() => handleOpenEdit(item)} className="text-blue-600 hover:text-blue-800">Editar</button>
      <button onClick={() => handleOpenPermisos(item)} className="text-green-600 hover:text-green-800">Permisos</button>
      <button onClick={() => handleToggleEstado(item.idrol)} className="text-yellow-600 hover:text-yellow-800">
        {item.estado ? 'Desactivar' : 'Activar'}
      </button>
      <button onClick={() => handleDelete(item.idrol)} className="text-red-600 hover:text-red-800">Eliminar</button>
    </>
  )

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Roles</h1>
        <button
          onClick={handleOpenCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Nuevo Rol
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <DataTable columns={columns} data={roles} loading={loading} actions={actions} />
      </div>

      {/* Create/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Rol' : 'Nuevo Rol'}>
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Permisos</label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-lg p-3">
              {permisos.map((perm) => (
                <label key={perm.idpermiso} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedPermisos.includes(perm.idpermiso)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedPermisos([...selectedPermisos, perm.idpermiso])
                      } else {
                        setSelectedPermisos(selectedPermisos.filter((id) => id !== perm.idpermiso))
                      }
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{perm.nombre}</span>
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

      {/* Permisos-only Modal */}
      <Modal isOpen={permisosModalOpen} onClose={() => setPermisosModalOpen(false)} title={`Permisos: ${editing?.nombre}`}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto border rounded-lg p-3">
            {permisos.map((perm) => (
              <label key={perm.idpermiso} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedPermisos.includes(perm.idpermiso)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedPermisos([...selectedPermisos, perm.idpermiso])
                    } else {
                      setSelectedPermisos(selectedPermisos.filter((id) => id !== perm.idpermiso))
                    }
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">{perm.nombre}</span>
                  <span className="block text-xs text-gray-400">{perm.codigo}</span>
                </div>
              </label>
            ))}
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setPermisosModalOpen(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition">
              Cancelar
            </button>
            <button onClick={handleSavePermisos} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
              Guardar Permisos
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
