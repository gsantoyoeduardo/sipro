import { useState } from 'react'
import type { EmpresaDetalle } from '../../../api/empresa'
import { empresaService } from '../../../api/empresa'
import Modal from '../../common/Modal'
import ModalCambiarPassword from './ModalCambiarPassword'

interface Props {
  detalle: EmpresaDetalle
  onRefresh: () => void
}

export default function TabDatosEmpresa({ detalle, onRefresh }: Props) {
  const { empresa, admin_usuario: admin } = detalle
  const [editModal, setEditModal] = useState(false)
  const [changePassword, setChangePassword] = useState<{ idempresa: string; userId: string } | null>(null)

  const [editForm, setEditForm] = useState({
    razonsocial: empresa.razonsocial,
    nombrecomercial: empresa.nombrecomercial || '',
    correo: empresa.correo,
    telefono: empresa.telefono || '',
    direccion: empresa.direccion || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await empresaService.editar(empresa.idempresa, editForm)
      setEditModal(false)
      onRefresh()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al guardar cambios')
    } finally {
      setSaving(false)
    }
  }

  const InfoCard = ({ label, value }: { label: string; value: string }) => (
    <div className="bg-fondo-sutil rounded-lg p-4">
      <p className="text-xs font-medium text-texto-secundario uppercase tracking-wider mb-1">{label}</p>
      <p className="text-sm text-texto font-medium">{value || '\u2014'}</p>
    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-texto">Datos de la Empresa</h2>
        <div className="flex gap-2">
          {admin && (
            <button
              onClick={() => setChangePassword({ idempresa: empresa.idempresa, userId: admin.idusuario })}
              className="px-4 py-2 border-2 border-accion text-accion rounded-lg hover:bg-accion hover:text-white transition text-sm font-medium flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              Cambiar Contraseña
            </button>
          )}
          <button
            onClick={() => {
              setEditForm({
                razonsocial: empresa.razonsocial,
                nombrecomercial: empresa.nombrecomercial || '',
                correo: empresa.correo,
                telefono: empresa.telefono || '',
                direccion: empresa.direccion || '',
              })
              setEditModal(true)
            }}
            className="px-4 py-2 bg-accion text-white rounded-lg hover:bg-accion/90 transition text-sm font-medium flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Editar Empresa
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
        <InfoCard label="Razón Social" value={empresa.razonsocial} />
        <InfoCard label="RUC" value={empresa.ruc} />
        <InfoCard label="Nombre Comercial" value={empresa.nombrecomercial} />
        <InfoCard label="Correo" value={empresa.correo} />
        <InfoCard label="Teléfono" value={empresa.telefono} />
        <InfoCard label="Dirección" value={empresa.direccion} />
        <InfoCard
          label="Fecha de Creación"
          value={new Date(empresa.fechacreacion).toLocaleDateString('es-PE', {
            year: 'numeric', month: 'long', day: 'numeric',
          })}
        />
        <div className="bg-fondo-sutil rounded-lg p-4">
          <p className="text-xs font-medium text-texto-secundario uppercase tracking-wider mb-1">Estado</p>
          <span className={`inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1 rounded-full ${
            empresa.estado ? 'bg-exito-suave text-exito-texto' : 'bg-peligro-suave text-peligro-texto'
          }`}>
            <span className={`w-2 h-2 rounded-full ${empresa.estado ? 'bg-exito' : 'bg-peligro'}`} />
            {empresa.estado ? 'Activa' : 'Inactiva'}
          </span>
        </div>
        <div className="bg-fondo-sutil rounded-lg p-4">
          <p className="text-xs font-medium text-texto-secundario uppercase tracking-wider mb-1">Total Usuarios</p>
          <p className="text-sm text-texto font-medium">{detalle.total_usuarios} usuarios</p>
        </div>
      </div>

      {admin && (
        <div className="bg-gradient-to-br from-primario/5 to-white rounded-xl border border-primario/10 p-5">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primario flex items-center justify-center text-white font-bold text-lg shrink-0">
              {admin.nombres?.charAt(0) || admin.usuario?.charAt(0) || '?'}{admin.apellidos?.charAt(0) || ''}
            </div>
            <div>
              <p className="text-sm font-semibold text-texto">{admin.nombres} {admin.apellidos}</p>
              <p className="text-xs text-texto-secundario">Administrador de Empresa</p>
              <div className="flex gap-4 mt-1 text-xs text-texto-secundario">
                <span>@{admin.usuario}</span>
                <span>{admin.correo}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <Modal abierto={editModal} onCerrar={() => setEditModal(false)} titulo="Editar Empresa" size="md">
        <form onSubmit={handleEdit}>
          <div className="p-6 space-y-4">
            {error && <div className="bg-peligro-suave text-peligro-texto p-3 rounded-lg text-sm">{error}</div>}
            <div>
              <label className="block text-sm font-medium text-texto mb-1">Razón Social *</label>
              <input type="text" value={editForm.razonsocial} onChange={e => setEditForm({ ...editForm, razonsocial: e.target.value })}
                className="w-full px-4 py-2.5 border border-borde rounded-lg focus:ring-2 focus:ring-accion focus:outline-none text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-texto mb-1">Nombre Comercial</label>
              <input type="text" value={editForm.nombrecomercial} onChange={e => setEditForm({ ...editForm, nombrecomercial: e.target.value })}
                className="w-full px-4 py-2.5 border border-borde rounded-lg focus:ring-2 focus:ring-accion focus:outline-none text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-texto mb-1">Correo *</label>
              <input type="email" value={editForm.correo} onChange={e => setEditForm({ ...editForm, correo: e.target.value })}
                className="w-full px-4 py-2.5 border border-borde rounded-lg focus:ring-2 focus:ring-accion focus:outline-none text-sm" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-texto mb-1">Teléfono</label>
              <input type="text" value={editForm.telefono} onChange={e => setEditForm({ ...editForm, telefono: e.target.value })}
                className="w-full px-4 py-2.5 border border-borde rounded-lg focus:ring-2 focus:ring-accion focus:outline-none text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-texto mb-1">Dirección</label>
              <textarea value={editForm.direccion} onChange={e => setEditForm({ ...editForm, direccion: e.target.value })}
                className="w-full px-4 py-2.5 border border-borde rounded-lg focus:ring-2 focus:ring-accion focus:outline-none text-sm" rows={2} />
            </div>
          </div>
          <div className="px-6 py-4 border-t border-borde-suave flex justify-end gap-3">
            <button type="button" onClick={() => setEditModal(false)}
              className="px-5 py-2.5 border border-borde rounded-lg hover:bg-fondo-sutil transition text-sm font-medium">Cancelar</button>
            <button type="submit" disabled={saving}
              className="px-5 py-2.5 bg-accion text-white rounded-lg hover:bg-accion/90 transition text-sm font-medium disabled:opacity-50 flex items-center gap-2">
              {saving && <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </Modal>

      <ModalCambiarPassword
        idempresa={changePassword?.idempresa || ''}
        userId={changePassword?.userId || ''}
        abierto={!!changePassword}
        onCerrar={() => setChangePassword(null)}
        onGuardado={onRefresh}
      />
    </div>
  )
}
