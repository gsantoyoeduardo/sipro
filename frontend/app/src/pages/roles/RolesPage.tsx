import { useState, useEffect } from 'react'
import DataTable from '../../components/DataTable'
import Modal from '../../components/Modal'
import ConfirmDialog from '../../components/ConfirmDialog'
import { rolService, permisoService } from '../../api/seguridad'
import { useSubmit } from '../../hooks/useSubmit'
import { useToastStore } from '../../store/toastStore'
import { validateRequired } from '../../utils/validators'
import type { Rol, Permiso } from '../../types'

export default function RolesPage() {
  const [roles, setRoles] = useState<Rol[]>([])
  const [permisos, setPermisos] = useState<Permiso[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [permisosModalOpen, setPermisosModalOpen] = useState(false)
  const [editing, setEditing] = useState<Rol | null>(null)
  const addToast = useToastStore((state) => state.addToast)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState({ nombre: '', descripcion: '' })
  const [selectedPermisos, setSelectedPermisos] = useState<string[]>([])

  const [confirmDelete, setConfirmDelete] = useState<Rol | null>(null)
  const [confirmToggle, setConfirmToggle] = useState<Rol | null>(null)

  const fetchData = async () => {
    try {
      const [rolRes, permRes] = await Promise.all([rolService.list(), permisoService.list()])
      setRoles(rolRes.data.results)
      setPermisos(permRes.data.results)
    } catch { addToast('error', 'Error al cargar datos') } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const handleOpenCreate = () => {
    setEditing(null)
    setForm({ nombre: '', descripcion: '' })
    setSelectedPermisos([])
    setFieldErrors({})
    setModalOpen(true)
  }

  const handleOpenEdit = (item: Rol) => {
    setEditing(item)
    setForm({ nombre: item.nombre, descripcion: item.descripcion || '' })
    setSelectedPermisos(item.permisos?.map((p) => p.idpermiso) || [])
    setFieldErrors({})
    setModalOpen(true)
  }

  const handleOpenPermisos = (item: Rol) => {
    setEditing(item)
    setSelectedPermisos(item.permisos?.map((p) => p.idpermiso) || [])
    setPermisosModalOpen(true)
  }

  const validate = (): boolean => {
    const e: Record<string, string> = {}
    const v = validateRequired(form.nombre, 'Nombre'); if (v) e.nombre = v
    setFieldErrors(e)
    return Object.keys(e).length === 0
  }

  const saveFn = async () => {
    if (editing) {
      await rolService.update(editing.idrol, form)
      await rolService.asignarPermisos(editing.idrol, selectedPermisos)
    } else {
      const newRol = await rolService.create(form)
      if (selectedPermisos.length > 0) await rolService.asignarPermisos(newRol.data.idrol, selectedPermisos)
    }
  }

  const { submit: handleSave, isSubmitting } = useSubmit(saveFn, {
    successMessage: editing ? 'Rol actualizado' : 'Rol creado',
    onSuccess: () => { setModalOpen(false); fetchData() },
  })

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (validate()) handleSave() }

  const savePermisosFn = async () => {
    if (!editing) return
    await rolService.asignarPermisos(editing.idrol, selectedPermisos)
  }

  const { submit: handleSavePermisos, isSubmitting: savingPermisos } = useSubmit(savePermisosFn, {
    successMessage: 'Permisos actualizados',
    onSuccess: () => { setPermisosModalOpen(false); fetchData() },
  })

  const { submit: handleDeleteConfirm, isSubmitting: deleting } = useSubmit(
    () => rolService.remove(confirmDelete!.idrol),
    { successMessage: 'Rol eliminado', onSuccess: () => { setConfirmDelete(null); fetchData() } }
  )

  const { submit: handleToggleConfirm, isSubmitting: toggling } = useSubmit(
    () => rolService.toggleEstado(confirmToggle!.idrol),
    { successMessage: 'Estado actualizado', onSuccess: () => { setConfirmToggle(null); fetchData() } }
  )

  const ic = (key: string) => `w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none ${fieldErrors[key] ? 'border-red-500' : ''}`

  const columns = [
    { key: 'nombre', header: 'Nombre' },
    { key: 'descripcion', header: 'Descripci\u00f3n' },
    { key: 'permisos', header: 'Permisos', render: (item: Rol) => <span className="text-sm text-gray-500">{item.permisos?.length || 0} asignados</span> },
    { key: 'estado', header: 'Estado', render: (item: Rol) => (
      <span className={`px-2 py-1 text-xs rounded-full ${item.estado ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{item.estado ? 'Activo' : 'Inactivo'}</span>
    )},
  ]

  const actions = (item: Rol) => (
    <>
      <button onClick={() => handleOpenEdit(item)} className="text-blue-600 hover:text-blue-800">Editar</button>
      <button onClick={() => handleOpenPermisos(item)} className="text-green-600 hover:text-green-800">Permisos</button>
      <button onClick={() => setConfirmToggle(item)} className="text-yellow-600 hover:text-yellow-800">{item.estado ? 'Desactivar' : 'Activar'}</button>
      <button onClick={() => setConfirmDelete(item)} className="text-red-600 hover:text-red-800">Eliminar</button>
    </>
  )

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Roles</h1>
        <button onClick={handleOpenCreate} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">Nuevo Rol</button>
      </div>
      <div className="bg-white rounded-lg shadow">
        <DataTable columns={columns} data={roles} loading={loading} actions={actions} />
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Rol' : 'Nuevo Rol'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input type="text" value={form.nombre} onChange={(e) => { setForm({ ...form, nombre: e.target.value }); setFieldErrors((p) => ({ ...p, nombre: '' })) }} className={ic('nombre')} />
            {fieldErrors.nombre && <p className="text-red-500 text-xs mt-1">{fieldErrors.nombre}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripci\u00f3n</label>
            <textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" rows={3} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Permisos</label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-lg p-3">
              {permisos.map((perm) => (
                <label key={perm.idpermiso} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={selectedPermisos.includes(perm.idpermiso)} onChange={(e) => { if (e.target.checked) setSelectedPermisos([...selectedPermisos, perm.idpermiso]); else setSelectedPermisos(selectedPermisos.filter((id) => id !== perm.idpermiso)) }} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  <span className="text-sm text-gray-700">{perm.nombre}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2">
              {isSubmitting && <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
              {editing ? 'Guardar' : 'Crear'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={permisosModalOpen} onClose={() => setPermisosModalOpen(false)} title={`Permisos: ${editing?.nombre}`}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto border rounded-lg p-3">
            {permisos.map((perm) => (
              <label key={perm.idpermiso} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={selectedPermisos.includes(perm.idpermiso)} onChange={(e) => { if (e.target.checked) setSelectedPermisos([...selectedPermisos, perm.idpermiso]); else setSelectedPermisos(selectedPermisos.filter((id) => id !== perm.idpermiso)) }} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <div><span className="text-sm font-medium text-gray-700">{perm.nombre}</span><span className="block text-xs text-gray-400">{perm.codigo}</span></div>
              </label>
            ))}
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button onClick={() => setPermisosModalOpen(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition">Cancelar</button>
            <button onClick={() => handleSavePermisos()} disabled={savingPermisos} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 flex items-center gap-2">
              {savingPermisos && <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
              Guardar Permisos
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={() => handleDeleteConfirm()} title="Eliminar Rol" message={`\u00bfEst\u00e1 seguro de eliminar "${confirmDelete?.nombre}"?`} confirmLabel="Eliminar" confirmVariant="danger" isLoading={deleting} />
      <ConfirmDialog isOpen={!!confirmToggle} onClose={() => setConfirmToggle(null)} onConfirm={() => handleToggleConfirm()} title={confirmToggle?.estado ? 'Desactivar Rol' : 'Activar Rol'} message={`\u00bfEst\u00e1 seguro de ${confirmToggle?.estado ? 'desactivar' : 'activar'} "${confirmToggle?.nombre}"?`} confirmLabel={confirmToggle?.estado ? 'Desactivar' : 'Activar'} confirmVariant="primary" isLoading={toggling} />
    </div>
  )
}
