/**
 * Página de administración de Usuarios.
 * Gestiona el CRUD completo de usuarios del sistema: listar, crear, editar,
 * eliminar, activar/desactivar, resetear contraseña y asignar roles.
 */
import { useState, useEffect } from 'react'
import DataTable from '../../components/DataTable'
import Modal from '../../components/Modal'
import ConfirmDialog from '../../components/ConfirmDialog'
import { usuarioService, rolService } from '../../api/seguridad'
import { useSubmit } from '../../hooks/useSubmit'
import { useToastStore } from '../../store/toastStore'
import { validateRequired, validateEmail, validatePasswordStrength } from '../../utils/validators'
import type { Usuario, Rol } from '../../types'

export default function UsuariosPage() {
  // Estado de la lista de usuarios y roles disponibles
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [roles, setRoles] = useState<Rol[]>([])
  const [loading, setLoading] = useState(true)
  // Control del modal de creación/edición
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Usuario | null>(null)
  const addToast = useToastStore((state) => state.addToast)
  // Errores de validación por campo
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  // Datos del formulario
  const [form, setForm] = useState({ nombres: '', apellidos: '', correo: '', usuario: '', telefono: '', idempresa: '', password: '' })
  // Roles seleccionados en el formulario
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])

  // Confirmaciones para acciones destructivas
  const [confirmDelete, setConfirmDelete] = useState<Usuario | null>(null)
  const [confirmToggle, setConfirmToggle] = useState<Usuario | null>(null)
  const [confirmResetPassword, setConfirmResetPassword] = useState<Usuario | null>(null)

  // Carga inicial de usuarios y roles desde la API
  const fetchData = async () => {
    try {
      const [usrRes, rolRes] = await Promise.all([usuarioService.list(), rolService.list()])
      setUsuarios(usrRes.data.results)
      setRoles(rolRes.data.results)
    } catch { addToast('error', 'Error al cargar datos') } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  // Prepara el formulario para crear un nuevo usuario
  const handleOpenCreate = () => {
    setEditing(null)
    setForm({ nombres: '', apellidos: '', correo: '', usuario: '', telefono: '', idempresa: '', password: '' })
    setSelectedRoles([])
    setFieldErrors({})
    setModalOpen(true)
  }

  // Prepara el formulario para editar un usuario existente
  const handleOpenEdit = (item: Usuario) => {
    setEditing(item)
    setForm({ nombres: item.nombres, apellidos: item.apellidos, correo: item.correo, usuario: item.usuario, telefono: item.telefono || '', idempresa: item.idempresa || '', password: '' })
    setSelectedRoles(item.roles?.map((r) => r.idrol) || [])
    setFieldErrors({})
    setModalOpen(true)
  }

  // Valida los campos del formulario antes de enviar
  const validate = (): boolean => {
    const e: Record<string, string> = {}
    const r = validateRequired(form.nombres, 'Nombres'); if (r) e.nombres = r
    const r2 = validateRequired(form.apellidos, 'Apellidos'); if (r2) e.apellidos = r2
    const r3 = validateRequired(form.usuario, 'Usuario'); if (r3) e.usuario = r3
    const r4 = validateRequired(form.correo, 'Correo') || validateEmail(form.correo); if (r4) e.correo = r4
    if (!editing) {
      const r5 = validateRequired(form.password, 'Contrase\u00f1a') || validatePasswordStrength(form.password); if (r5) e.password = r5
    }
    setFieldErrors(e)
    return Object.keys(e).length === 0
  }

  // Función que persiste el usuario (crea o actualiza según corresponda)
  const saveFn = async () => {
    if (editing) {
      const { password, ...updateData } = form
      await usuarioService.update(editing.idusuario, updateData)
      if (selectedRoles.length > 0) await usuarioService.asignarRoles(editing.idusuario, selectedRoles)
    } else {
      const newUser = await usuarioService.create(form)
      if (selectedRoles.length > 0) await usuarioService.asignarRoles(newUser.data.idusuario, selectedRoles)
    }
  }

  // Hook que maneja el envío con estado de carga, éxito y error
  const { submit: handleSave, isSubmitting } = useSubmit(saveFn, {
    successMessage: editing ? 'Usuario actualizado' : 'Usuario creado',
    onSuccess: () => { setModalOpen(false); fetchData() },
  })

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (validate()) handleSave() }

  // Confirmación y ejecución de eliminación de usuario
  const { submit: handleDeleteConfirm, isSubmitting: deleting } = useSubmit(
    () => usuarioService.remove(confirmDelete!.idusuario),
    { successMessage: 'Usuario eliminado', onSuccess: () => { setConfirmDelete(null); fetchData() } }
  )

  // Confirmación y ejecución de activación/desactivación de usuario
  const { submit: handleToggleConfirm, isSubmitting: toggling } = useSubmit(
    () => usuarioService.toggleEstado(confirmToggle!.idusuario),
    { successMessage: 'Estado actualizado', onSuccess: () => { setConfirmToggle(null); fetchData() } }
  )

  // Confirmación y ejecución de reseteo de contraseña
  const { submit: handleResetConfirm, isSubmitting: resetting } = useSubmit(
    () => usuarioService.resetPassword(confirmResetPassword!.idusuario),
    { successMessage: 'Contrase\u00f1a reseteada exitosamente', onSuccess: () => setConfirmResetPassword(null) }
  )

  // Genera clases CSS condicionales para inputs con error
  const ic = (key: string) => `w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none ${fieldErrors[key] ? 'border-red-500' : ''}`

  // Columnas de la tabla de usuarios
  const columns = [
    { key: 'nombre', header: 'Nombre', render: (item: Usuario) => `${item.nombres} ${item.apellidos}` },
    { key: 'usuario', header: 'Usuario' },
    { key: 'correo', header: 'Correo' },
    { key: 'telefono', header: 'Tel\u00e9fono' },
    { key: 'estado', header: 'Estado', render: (item: Usuario) => (
      <span className={`px-2 py-1 text-xs rounded-full ${item.estado ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{item.estado ? 'Activo' : 'Inactivo'}</span>
    )},
  ]

  // Botones de acción por fila (editar, activar/desactivar, reset pass, eliminar)
  const actions = (item: Usuario) => (
    <>
      <button onClick={() => handleOpenEdit(item)} className="text-blue-600 hover:text-blue-800">Editar</button>
      <button onClick={() => setConfirmToggle(item)} className="text-yellow-600 hover:text-yellow-800">{item.estado ? 'Desactivar' : 'Activar'}</button>
      <button onClick={() => setConfirmResetPassword(item)} className="text-orange-600 hover:text-orange-800">Reset Pass</button>
      <button onClick={() => setConfirmDelete(item)} className="text-red-600 hover:text-red-800">Eliminar</button>
    </>
  )

  return (
    <div>
      {/* Encabezado con título y botón de nuevo usuario */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Usuarios</h1>
        <button onClick={handleOpenCreate} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">Nuevo Usuario</button>
      </div>
      {/* Tabla de usuarios */}
      <div className="bg-white rounded-lg shadow">
        <DataTable columns={columns} data={usuarios} loading={loading} actions={actions} />
      </div>

      {/* Modal de creación/edición de usuario */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Usuario' : 'Nuevo Usuario'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Campos de nombres y apellidos */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombres *</label>
              <input type="text" value={form.nombres} onChange={(e) => { setForm({ ...form, nombres: e.target.value }); setFieldErrors((p) => ({ ...p, nombres: '' })) }} className={ic('nombres')} />
              {fieldErrors.nombres && <p className="text-red-500 text-xs mt-1">{fieldErrors.nombres}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Apellidos *</label>
              <input type="text" value={form.apellidos} onChange={(e) => { setForm({ ...form, apellidos: e.target.value }); setFieldErrors((p) => ({ ...p, apellidos: '' })) }} className={ic('apellidos')} />
              {fieldErrors.apellidos && <p className="text-red-500 text-xs mt-1">{fieldErrors.apellidos}</p>}
            </div>
          </div>
          {/* Campos de usuario y correo */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Usuario *</label>
              <input type="text" value={form.usuario} onChange={(e) => { setForm({ ...form, usuario: e.target.value }); setFieldErrors((p) => ({ ...p, usuario: '' })) }} className={ic('usuario')} />
              {fieldErrors.usuario && <p className="text-red-500 text-xs mt-1">{fieldErrors.usuario}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Correo *</label>
              <input type="email" value={form.correo} onChange={(e) => { setForm({ ...form, correo: e.target.value }); setFieldErrors((p) => ({ ...p, correo: '' })) }} className={ic('correo')} />
              {fieldErrors.correo && <p className="text-red-500 text-xs mt-1">{fieldErrors.correo}</p>}
            </div>
          </div>
          {/* Campos de teléfono y contraseña (solo en creación) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tel\u00e9fono</label>
              <input type="text" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            </div>
            {!editing && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contrase\u00f1a *</label>
                <input type="password" value={form.password} onChange={(e) => { setForm({ ...form, password: e.target.value }); setFieldErrors((p) => ({ ...p, password: '' })) }} className={ic('password')} />
                {fieldErrors.password && <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>}
              </div>
            )}
          </div>
          {/* Selector de roles multiselección */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Roles</label>
            <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-lg p-3">
              {roles.map((rol) => (
                <label key={rol.idrol} className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={selectedRoles.includes(rol.idrol)} onChange={(e) => { if (e.target.checked) setSelectedRoles([...selectedRoles, rol.idrol]); else setSelectedRoles(selectedRoles.filter((id) => id !== rol.idrol)) }} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                  <span className="text-sm text-gray-700">{rol.nombre}</span>
                </label>
              ))}
            </div>
          </div>
          {/* Botones de acción del formulario */}
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2">
              {isSubmitting && <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
              {editing ? 'Guardar' : 'Crear'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Diálogos de confirmación para eliminar, activar/desactivar y resetear contraseña */}
      <ConfirmDialog isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={() => handleDeleteConfirm()} title="Eliminar Usuario" message={`\u00bfEst\u00e1 seguro de eliminar a "${confirmDelete?.nombres}"?`} confirmLabel="Eliminar" confirmVariant="danger" isLoading={deleting} />
      <ConfirmDialog isOpen={!!confirmToggle} onClose={() => setConfirmToggle(null)} onConfirm={() => handleToggleConfirm()} title={confirmToggle?.estado ? 'Desactivar Usuario' : 'Activar Usuario'} message={`\u00bfEst\u00e1 seguro de ${confirmToggle?.estado ? 'desactivar' : 'activar'} a "${confirmToggle?.nombres}"?`} confirmLabel={confirmToggle?.estado ? 'Desactivar' : 'Activar'} confirmVariant="primary" isLoading={toggling} />
      <ConfirmDialog isOpen={!!confirmResetPassword} onClose={() => setConfirmResetPassword(null)} onConfirm={() => handleResetConfirm()} title="Resetear Contrase\u00f1a" message={`\u00bfEst\u00e1 seguro de resetear la contrase\u00f1a de "${confirmResetPassword?.nombres}"?`} confirmLabel="Resetear" confirmVariant="primary" isLoading={resetting} />
    </div>
  )
}
