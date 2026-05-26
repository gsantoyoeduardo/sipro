import { useState, useEffect } from 'react'
import { empresaService, type UsuarioEmpresa } from '../../../api/empresa'
import Cargando from '../../common/Cargando'
import Modal from '../../common/Modal'
import ModalCambiarPassword from './ModalCambiarPassword'

interface Props {
  idempresa: string
}

export default function TabUsuariosEmpresa({ idempresa }: Props) {
  const [usuarios, setUsuarios] = useState<UsuarioEmpresa[]>([])
  const [loading, setLoading] = useState(true)
  const [editUser, setEditUser] = useState<UsuarioEmpresa | null>(null)
  const [changePassword, setChangePassword] = useState<{ idempresa: string; userId: string } | null>(null)

  const fetchUsuarios = async () => {
    try {
      setLoading(true)
      const { data } = await empresaService.listarUsuarios(idempresa)
      setUsuarios(data)
    } catch {
      setUsuarios([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsuarios() }, [idempresa])

  if (loading) return <Cargando mensaje="Cargando usuarios..." />

  if (usuarios.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-texto-secundario/30 text-5xl mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <p className="text-texto-secundario font-medium">No hay usuarios registrados</p>
      </div>
    )
  }

  return (
    <div>
      <p className="text-sm text-texto-secundario mb-4">
        <strong className="text-texto">{usuarios.length}</strong> usuario{usuarios.length !== 1 ? 's' : ''} registrado{usuarios.length !== 1 ? 's' : ''}
      </p>

      <div className="bg-fondo-blanco rounded-xl border border-borde-suave overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-texto-secundario uppercase tracking-wider">Usuario</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-texto-secundario uppercase tracking-wider hidden sm:table-cell">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-texto-secundario uppercase tracking-wider hidden md:table-cell">Correo</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-texto-secundario uppercase tracking-wider">Estado</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-texto-secundario uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-borde-suave">
              {usuarios.map((user) => (
                <tr key={user.idusuario} className="hover:bg-fondo-sutil/50 transition">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primario flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {user.nombres?.charAt(0) || user.usuario?.charAt(0) || '?'}{user.apellidos?.charAt(0) || ''}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-texto">{user.usuario}</p>
                        <p className="text-xs text-texto-secundario sm:hidden">{user.nombres} {user.apellidos}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 text-sm text-texto hidden sm:table-cell">{user.nombres} {user.apellidos}</td>
                  <td className="px-4 py-4 text-sm text-primario-claro hidden md:table-cell">{user.correo}</td>
                  <td className="px-4 py-4 text-center">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      user.estado ? 'bg-exito-suave text-exito-texto' : 'bg-peligro-suave text-peligro-texto'
                    }`}>
                      {user.estado ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => setEditUser(user)}
                        className="p-2 text-accion hover:bg-advertencia-suave rounded-lg transition"
                        title="Editar usuario"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setChangePassword({ idempresa, userId: user.idusuario })}
                        className="p-2 text-primario-claro hover:bg-primario-claro/10 rounded-lg transition"
                        title="Cambiar contraseña"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ModalEditarUsuario
        user={editUser}
        idempresa={idempresa}
        onCerrar={() => setEditUser(null)}
        onGuardado={fetchUsuarios}
      />

      <ModalCambiarPassword
        idempresa={changePassword?.idempresa || ''}
        userId={changePassword?.userId || ''}
        abierto={!!changePassword}
        onCerrar={() => setChangePassword(null)}
        onGuardado={() => {}}
      />
    </div>
  )
}

function ModalEditarUsuario({ user, idempresa, onCerrar, onGuardado }: {
  user: UsuarioEmpresa | null
  idempresa: string
  onCerrar: () => void
  onGuardado: () => void
}) {
  const [form, setForm] = useState({ nombres: '', apellidos: '', correo: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user) {
      setForm({ nombres: user.nombres, apellidos: user.apellidos, correo: user.correo })
      setError('')
    }
  }, [user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setError('')
    setSaving(true)
    try {
      await empresaService.editarUsuario(idempresa, user.idusuario, form)
      onGuardado()
      onCerrar()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  if (!user) return null

  return (
    <Modal abierto={!!user} onCerrar={onCerrar} titulo="Editar Usuario" size="sm">
      <form onSubmit={handleSubmit}>
        <div className="p-6 space-y-4">
          {error && <div className="bg-peligro-suave text-peligro-texto p-3 rounded-lg text-sm">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-texto mb-1">Nombres *</label>
            <input type="text" value={form.nombres} onChange={e => setForm({ ...form, nombres: e.target.value })}
              className="w-full px-4 py-2.5 border border-borde rounded-lg focus:ring-2 focus:ring-accion focus:outline-none text-sm" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-texto mb-1">Apellidos *</label>
            <input type="text" value={form.apellidos} onChange={e => setForm({ ...form, apellidos: e.target.value })}
              className="w-full px-4 py-2.5 border border-borde rounded-lg focus:ring-2 focus:ring-accion focus:outline-none text-sm" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-texto mb-1">Correo *</label>
            <input type="email" value={form.correo} onChange={e => setForm({ ...form, correo: e.target.value })}
              className="w-full px-4 py-2.5 border border-borde rounded-lg focus:ring-2 focus:ring-accion focus:outline-none text-sm" required />
          </div>
        </div>
        <div className="px-6 py-4 border-t border-borde-suave flex justify-end gap-3">
          <button type="button" onClick={onCerrar}
            className="px-5 py-2.5 border border-borde rounded-lg hover:bg-fondo-sutil transition text-sm font-medium">Cancelar</button>
          <button type="submit" disabled={saving}
            className="px-5 py-2.5 bg-accion text-white rounded-lg hover:bg-accion/90 transition text-sm font-medium disabled:opacity-50 flex items-center gap-2">
            {saving && <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
