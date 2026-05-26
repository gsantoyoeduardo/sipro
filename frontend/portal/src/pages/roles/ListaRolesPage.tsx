import { useState, useEffect } from 'react'
import { rolService, type Rol, type RolFormData } from '../../api/roles'
import Modal from '../../components/common/Modal'
import DialogoConfirmacion from '../../components/common/DialogoConfirmacion'
import Cargando from '../../components/common/Cargando'

interface RolModalState {
  abierto: boolean
  mode: 'create' | 'edit'
  rol?: Rol
}

interface PermisosModalState {
  abierto: boolean
  rol?: Rol
  permisosSeleccionados: string[]
}

const PERMISOS_DISPONIBLES = [
  'ver_empresas', 'crear_empresa', 'editar_empresa', 'eliminar_empresa',
  'ver_usuarios', 'crear_usuario', 'editar_usuario', 'eliminar_usuario',
  'ver_roles', 'crear_rol', 'editar_rol', 'eliminar_rol',
  'ver_auditoria', 'ver_dashboard', 'admin_sistema',
]

export default function ListaRolesPage() {
  const [roles, setRoles] = useState<Rol[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<RolModalState>({ abierto: false, mode: 'create' })
  const [permisosModal, setPermisosModal] = useState<PermisosModalState>({ abierto: false, permisosSeleccionados: [] })
  const [confirmDelete, setConfirmDelete] = useState<{ abierto: boolean; id?: string }>({ abierto: false })
  const [form, setForm] = useState<RolFormData>({ nombre: '', descripcion: '' })

  const fetchRoles = async () => {
    try { setLoading(true); const { data } = await rolService.listar(); setRoles(data.results || data || []) }
    catch (err) { console.error('[Roles] Error:', err) }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchRoles() }, [])

  const openCreate = () => { setForm({ nombre: '', descripcion: '' }); setModal({ abierto: true, mode: 'create' }) }
  const openEdit = (r: Rol) => { setForm({ nombre: r.nombre, descripcion: r.descripcion }); setModal({ abierto: true, mode: 'edit', rol: r }) }
  const openPermisos = (r: Rol) => {
    setPermisosModal({ abierto: true, rol: r, permisosSeleccionados: r.permisos || [] })
  }

  const handleSave = async () => {
    try {
      if (modal.mode === 'create') await rolService.registrar(form)
      else if (modal.rol) await rolService.editar(modal.rol.idrol, form)
      setModal({ abierto: false, mode: 'create' }); fetchRoles()
    } catch (err) { console.error(err) }
  }

  const handleDelete = async () => {
    if (!confirmDelete.id) return
    try { await rolService.editar(confirmDelete.id, { estado: false }); setConfirmDelete({ abierto: false }); fetchRoles() }
    catch (err) { console.error(err) }
  }

  const handleGuardarPermisos = async () => {
    if (!permisosModal.rol) return
    try { await rolService.asignarPermisos(permisosModal.rol.idrol, permisosModal.permisosSeleccionados); setPermisosModal({ abierto: false, permisosSeleccionados: [] }); fetchRoles() }
    catch (err) { console.error(err) }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-texto">Roles</h1><p className="text-texto-secundario text-sm mt-1">Gestión de roles y permisos del sistema</p></div>
        <button onClick={openCreate} className="bg-primario text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primario-oscuro transition shadow-sm">+ Nuevo Rol</button>
      </div>
      <div className="bg-fondo-blanco rounded-xl shadow-sm border border-borde overflow-hidden">
        {loading ? <Cargando mensaje="Cargando roles..." /> : (
          <table className="w-full">
            <thead className="bg-fondo-sutil"><tr>
              <th className="text-left px-4 py-3 text-sm font-semibold text-texto">Nombre</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-texto">Descripción</th>
              <th className="text-center px-4 py-3 text-sm font-semibold text-texto">Estado</th>
              <th className="text-right px-4 py-3 text-sm font-semibold text-texto">Acciones</th>
            </tr></thead>
            <tbody>{roles.map((r) => (
              <tr key={r.idrol} className="border-t border-borde-suave hover:bg-fondo-sutil/50">
                <td className="px-4 py-3 text-sm font-medium text-texto">{r.nombre}</td>
                <td className="px-4 py-3 text-sm text-texto-secundario">{r.descripcion || '-'}</td>
                <td className="px-4 py-3 text-center"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${r.estado ? 'bg-exito-suave text-exito-texto' : 'bg-peligro-suave text-peligro-texto'}`}>{r.estado ? 'Activo' : 'Inactivo'}</span></td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => openEdit(r)} className="text-primario hover:text-primario-oscuro mr-2" title="Editar"><svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg></button>
                  <button onClick={() => openPermisos(r)} className="text-primario-oscuro hover:text-primario mr-2" title="Permisos"><svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg></button>
                  <button onClick={() => setConfirmDelete({ abierto: true, id: r.idrol })} className="text-peligro hover:text-peligro-texto" title="Desactivar"><svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
                </td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>

      <Modal abierto={modal.abierto} onCerrar={() => setModal({ abierto: false, mode: 'create' })} titulo={modal.mode === 'create' ? 'Nuevo Rol' : 'Editar Rol'}>
        <div className="p-6 space-y-4">
          <div><label className="block text-sm font-medium text-texto mb-1">Nombre</label><input value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} className="w-full px-3 py-2 border border-borde rounded-lg focus:ring-2 focus:ring-primario focus:outline-none text-sm" required/></div>
          <div><label className="block text-sm font-medium text-texto mb-1">Descripción</label><textarea value={form.descripcion || ''} onChange={e => setForm({...form, descripcion: e.target.value})} className="w-full px-3 py-2 border border-borde rounded-lg focus:ring-2 focus:ring-primario focus:outline-none text-sm" rows={3}/></div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModal({ abierto: false, mode: 'create' })} className="px-4 py-2 text-sm text-texto-secundario hover:text-texto">Cancelar</button>
            <button onClick={handleSave} className="px-4 py-2 text-sm bg-primario text-white rounded-lg hover:bg-primario-oscuro">{modal.mode === 'create' ? 'Crear' : 'Guardar'}</button>
          </div>
        </div>
      </Modal>

      <Modal abierto={permisosModal.abierto} onCerrar={() => setPermisosModal({ abierto: false, permisosSeleccionados: [] })} titulo={`Permisos de ${permisosModal.rol?.nombre || ''}`}>
        <div className="p-6 space-y-2 max-h-60 overflow-y-auto">
          {PERMISOS_DISPONIBLES.map((permiso) => (
            <label key={permiso} className="flex items-center gap-3 p-2 hover:bg-fondo-sutil rounded-lg cursor-pointer">
              <input type="checkbox" checked={permisosModal.permisosSeleccionados.includes(permiso)} onChange={e => setPermisosModal(prev => ({ ...prev, permisosSeleccionados: e.target.checked ? [...prev.permisosSeleccionados, permiso] : prev.permisosSeleccionados.filter(p => p !== permiso) }))} className="rounded border-borde text-primario focus:ring-primario"/>
              <span className="text-sm text-texto capitalize">{permiso.replace(/_/g, ' ')}</span>
            </label>
          ))}
        </div>
        <div className="flex justify-end gap-3 px-6 pb-6 pt-4 border-t border-borde-suave">
          <button onClick={() => setPermisosModal({ abierto: false, permisosSeleccionados: [] })} className="px-4 py-2 text-sm text-texto-secundario">Cancelar</button>
          <button onClick={handleGuardarPermisos} className="px-4 py-2 text-sm bg-primario text-white rounded-lg hover:bg-primario-oscuro">Guardar Permisos</button>
        </div>
      </Modal>

      <DialogoConfirmacion abierto={confirmDelete.abierto} titulo="Desactivar rol" mensaje="¿Está seguro de desactivar este rol?" onConfirmar={handleDelete} onCerrar={() => setConfirmDelete({ abierto: false })} />
    </div>
  )
}
