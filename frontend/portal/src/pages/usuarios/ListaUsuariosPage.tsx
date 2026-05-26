import { useState, useEffect } from 'react'
import { usuarioService, type Usuario, type UsuarioFormData } from '../../api/usuarios'
import { rolService, type Rol } from '../../api/roles'
import Modal from '../../components/common/Modal'
import DialogoConfirmacion from '../../components/common/DialogoConfirmacion'
import Cargando from '../../components/common/Cargando'

interface UsuarioModalState {
  abierto: boolean
  mode: 'create' | 'edit'
  usuario?: Usuario
}

interface RolesModalState {
  abierto: boolean
  usuario?: Usuario
  rolesDisponibles: Rol[]
  rolesSeleccionados: string[]
}

export default function ListaUsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<UsuarioModalState>({ abierto: false, mode: 'create' })
  const [rolesModal, setRolesModal] = useState<RolesModalState>({ abierto: false, rolesDisponibles: [], rolesSeleccionados: [] })
  const [confirmDelete, setConfirmDelete] = useState<{ abierto: boolean; id?: string }>({ abierto: false })
  const [form, setForm] = useState<UsuarioFormData>({ usuario: '', nombres: '', apellidos: '', correo: '', password: '' })

  const fetchUsuarios = async () => {
    try { setLoading(true); const { data } = await usuarioService.listar(); setUsuarios(data.results || data || []) }
    catch (err) { console.error('[Usuarios] Error:', err) }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchUsuarios() }, [])

  const openCreate = () => { setForm({ usuario: '', nombres: '', apellidos: '', correo: '', password: '' }); setModal({ abierto: true, mode: 'create' }) }
  const openEdit = (u: Usuario) => { setForm({ usuario: u.usuario, nombres: u.nombres, apellidos: u.apellidos, correo: u.correo }); setModal({ abierto: true, mode: 'edit', usuario: u }) }
  const openRoles = async (u: Usuario) => {
    try {
      const { data } = await rolService.listar()
      const rolesDisponibles = data.results || data || []
      setRolesModal({ abierto: true, usuario: u, rolesDisponibles, rolesSeleccionados: u.roles || [] })
    } catch (err) { console.error(err) }
  }

  const handleSave = async () => {
    try {
      if (modal.mode === 'create') await usuarioService.registrar(form)
      else if (modal.usuario) await usuarioService.editar(modal.usuario.idusuario, form)
      setModal({ abierto: false, mode: 'create' }); fetchUsuarios()
    } catch (err) { console.error(err) }
  }

  const handleDelete = async () => {
    if (!confirmDelete.id) return
    try { await usuarioService.editar(confirmDelete.id, { estado: false }); setConfirmDelete({ abierto: false }); fetchUsuarios() }
    catch (err) { console.error(err) }
  }

  const handleAsignarRoles = async () => {
    if (!rolesModal.usuario) return
    try { await usuarioService.asignarRoles(rolesModal.usuario.idusuario, rolesModal.rolesSeleccionados); setRolesModal({ abierto: false, rolesDisponibles: [], rolesSeleccionados: [] }); fetchUsuarios() }
    catch (err) { console.error(err) }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-2xl font-bold text-texto">Usuarios</h1><p className="text-texto-secundario text-sm mt-1">Gestión de usuarios del sistema</p></div>
        <button onClick={openCreate} className="bg-primario text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primario-oscuro transition shadow-sm">+ Nuevo Usuario</button>
      </div>
      <div className="bg-fondo-blanco rounded-xl shadow-sm border border-borde overflow-hidden">
        {loading ? <Cargando mensaje="Cargando usuarios..." /> : (
          <table className="w-full">
            <thead className="bg-fondo-sutil"><tr>
              <th className="text-left px-4 py-3 text-sm font-semibold text-texto">Usuario</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-texto">Nombre</th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-texto">Correo</th>
              <th className="text-center px-4 py-3 text-sm font-semibold text-texto">Estado</th>
              <th className="text-right px-4 py-3 text-sm font-semibold text-texto">Acciones</th>
            </tr></thead>
            <tbody>{usuarios.map((u) => (
              <tr key={u.idusuario} className="border-t border-borde-suave hover:bg-fondo-sutil/50">
                <td className="px-4 py-3 text-sm text-texto">{u.usuario}</td>
                <td className="px-4 py-3 text-sm text-texto">{u.nombres} {u.apellidos}</td>
                <td className="px-4 py-3 text-sm text-texto-secundario">{u.correo}</td>
                <td className="px-4 py-3 text-center"><span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${u.estado ? 'bg-exito-suave text-exito-texto' : 'bg-peligro-suave text-peligro-texto'}`}>{u.estado ? 'Activo' : 'Inactivo'}</span></td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => openEdit(u)} className="text-primario hover:text-primario-oscuro mr-2" title="Editar"><svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg></button>
                  <button onClick={() => openRoles(u)} className="text-primario-oscuro hover:text-primario mr-2" title="Roles"><svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"/></svg></button>
                  <button onClick={() => setConfirmDelete({ abierto: true, id: u.idusuario })} className="text-peligro hover:text-peligro-texto" title="Desactivar"><svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
                </td>
              </tr>
            ))}</tbody>
          </table>
        )}
      </div>

      <Modal abierto={modal.abierto} onCerrar={() => setModal({ abierto: false, mode: 'create' })} titulo={modal.mode === 'create' ? 'Nuevo Usuario' : 'Editar Usuario'}>
        <div className="p-6 space-y-4">
          <div><label className="block text-sm font-medium text-texto mb-1">Usuario</label><input value={form.usuario} onChange={e => setForm({...form, usuario: e.target.value})} className="w-full px-3 py-2 border border-borde rounded-lg focus:ring-2 focus:ring-primario focus:outline-none text-sm" required/></div>
          <div><label className="block text-sm font-medium text-texto mb-1">Nombres</label><input value={form.nombres} onChange={e => setForm({...form, nombres: e.target.value})} className="w-full px-3 py-2 border border-borde rounded-lg focus:ring-2 focus:ring-primario focus:outline-none text-sm" required/></div>
          <div><label className="block text-sm font-medium text-texto mb-1">Apellidos</label><input value={form.apellidos} onChange={e => setForm({...form, apellidos: e.target.value})} className="w-full px-3 py-2 border border-borde rounded-lg focus:ring-2 focus:ring-primario focus:outline-none text-sm" required/></div>
          <div><label className="block text-sm font-medium text-texto mb-1">Correo</label><input type="email" value={form.correo} onChange={e => setForm({...form, correo: e.target.value})} className="w-full px-3 py-2 border border-borde rounded-lg focus:ring-2 focus:ring-primario focus:outline-none text-sm" required/></div>
          <div><label className="block text-sm font-medium text-texto mb-1">{modal.mode === 'create' ? 'Contraseña' : 'Nueva contraseña (opcional)'}</label><input type="password" value={form.password || ''} onChange={e => setForm({...form, password: e.target.value})} className="w-full px-3 py-2 border border-borde rounded-lg focus:ring-2 focus:ring-primario focus:outline-none text-sm"/></div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModal({ abierto: false, mode: 'create' })} className="px-4 py-2 text-sm text-texto-secundario hover:text-texto">Cancelar</button>
            <button onClick={handleSave} className="px-4 py-2 text-sm bg-primario text-white rounded-lg hover:bg-primario-oscuro">{modal.mode === 'create' ? 'Crear' : 'Guardar'}</button>
          </div>
        </div>
      </Modal>

      <Modal abierto={rolesModal.abierto} onCerrar={() => setRolesModal({ abierto: false, rolesDisponibles: [], rolesSeleccionados: [] })} titulo={`Roles de ${rolesModal.usuario?.usuario || ''}`}>
        <div className="p-6 space-y-2 max-h-60 overflow-y-auto">
          {rolesModal.rolesDisponibles.map((r) => (
            <label key={r.idrol} className="flex items-center gap-3 p-2 hover:bg-fondo-sutil rounded-lg cursor-pointer">
              <input type="checkbox" checked={rolesModal.rolesSeleccionados.includes(r.idrol)} onChange={e => setRolesModal(prev => ({ ...prev, rolesSeleccionados: e.target.checked ? [...prev.rolesSeleccionados, r.idrol] : prev.rolesSeleccionados.filter(id => id !== r.idrol) }))} className="rounded border-borde text-primario focus:ring-primario"/>
              <div><p className="text-sm font-medium text-texto">{r.nombre}</p>{r.descripcion && <p className="text-xs text-texto-secundario">{r.descripcion}</p>}</div>
            </label>
          ))}
        </div>
        <div className="flex justify-end gap-3 px-6 pb-6 pt-4 border-t border-borde-suave">
          <button onClick={() => setRolesModal({ abierto: false, rolesDisponibles: [], rolesSeleccionados: [] })} className="px-4 py-2 text-sm text-texto-secundario">Cancelar</button>
          <button onClick={handleAsignarRoles} className="px-4 py-2 text-sm bg-primario text-white rounded-lg hover:bg-primario-oscuro">Guardar Roles</button>
        </div>
      </Modal>

      <DialogoConfirmacion abierto={confirmDelete.abierto} titulo="Desactivar usuario" mensaje="¿Está seguro de desactivar este usuario?" onConfirmar={handleDelete} onCerrar={() => setConfirmDelete({ abierto: false })} />
    </div>
  )
}
