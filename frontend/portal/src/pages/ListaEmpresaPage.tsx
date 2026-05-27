import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { empresaService, type Empresa } from '../api/empresa'
import Cargando from '../components/common/Cargando'
import Modal from '../components/common/Modal'
import DialogoConfirmacion from '../components/common/DialogoConfirmacion'
import TablaEmpresas from '../components/dedicated/empresa/TablaEmpresas'
import ModalEditarEmpresa from '../components/dedicated/empresa/ModalEditarEmpresa'
import ModalCambiarPassword from '../components/dedicated/empresa/ModalCambiarPassword'

interface EmpresaFormState {
  razonsocial: string
  nombrecomercial: string
  ruc: string
  correo: string
  telefono: string
  direccion: string
}

interface AdminFormState {
  admin_usuario: string
  admin_nombres: string
  admin_apellidos: string
  admin_correo: string
  admin_password: string
}

const initialEmpresaState: EmpresaFormState = {
  razonsocial: '', nombrecomercial: '', ruc: '', correo: '', telefono: '', direccion: '',
}
const initialAdminState: AdminFormState = {
  admin_usuario: '', admin_nombres: '', admin_apellidos: '', admin_correo: '', admin_password: '',
}

export default function ListaEmpresaPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const [crearModalAbierto, setCrearModalAbierto] = useState(false)
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [empresaForm, setEmpresaForm] = useState<EmpresaFormState>(initialEmpresaState)
  const [adminForm, setAdminForm] = useState<AdminFormState>(initialAdminState)

  const [editEmpresa, setEditEmpresa] = useState<Empresa | null>(null)
  const [changePassword, setChangePassword] = useState<{ idempresa: string; userId: string } | null>(null)
  const [confirmToggle, setConfirmToggle] = useState<{
    abierto: boolean; idempresa: string; activo: boolean
  }>({ abierto: false, idempresa: '', activo: false })
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<'todas' | 'activas' | 'inactivas'>('todas')

  const fetchEmpresas = async () => {
    try {
      setLoading(true)
      const { data } = await empresaService.listar()
      setEmpresas(data.results || data || [])
    } catch (err) {
      console.error('[EmpresaList] Error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchEmpresas() }, [])

  const empresasFiltradas = empresas.filter(emp => {
    const coincideBusqueda = busqueda === '' ||
      emp.razonsocial.toLowerCase().includes(busqueda.toLowerCase()) ||
      emp.ruc.includes(busqueda) ||
      emp.correo.toLowerCase().includes(busqueda.toLowerCase())
    const coincideEstado = filtroEstado === 'todas' ||
      (filtroEstado === 'activas' && emp.estado) ||
      (filtroEstado === 'inactivas' && !emp.estado)
    return coincideBusqueda && coincideEstado
  })

  const refreshData = () => { fetchEmpresas() }

  const openCrearModal = () => {
    setEmpresaForm(initialEmpresaState)
    setAdminForm(initialAdminState)
    setStep(1)
    setError('')
    setCrearModalAbierto(true)
  }

  const handleToggleClick = (idempresa: string) => {
    const emp = empresas.find(e => e.idempresa === idempresa)
    if (!emp) return
    setConfirmToggle({ abierto: true, idempresa, activo: emp.estado })
  }

  const handleToggleConfirm = async () => {
    try {
      await empresaService.desactivar(confirmToggle.idempresa)
      setConfirmToggle({ abierto: false, idempresa: '', activo: false })
      refreshData()
    } catch (err) {
      console.error('[EmpresaList] Error al cambiar estado:', err)
    }
  }

  const handleVerDetalle = async (idempresa: string) => {
    navigate(`/admin/empresas/${idempresa}`)
  }

  const handleEditar = (idempresa: string) => {
    const emp = empresas.find(e => e.idempresa === idempresa)
    if (emp) setEditEmpresa(emp)
  }

  const handleChangePassword = (idempresa: string, userId: string) => {
    setChangePassword({ idempresa, userId })
  }

  const handleCrearEmpresa = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      await empresaService.registrar({ ...empresaForm, ...adminForm })
      setCrearModalAbierto(false)
      refreshData()
    } catch (err: any) {
      const fields = err.response?.data?.fields
      if (fields) {
        setError(Object.values(fields).join(', '))
      } else {
        setError(err.response?.data?.error || 'Error al crear la empresa')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-texto">Empresas</h1>
          <p className="text-texto-secundario text-sm mt-1">Gestión de empresas clientes del sistema</p>
        </div>
        <button onClick={openCrearModal} className="bg-accion text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-accion/90 transition shadow-lg shadow-accion/25 shrink-0">
          + Nueva Empresa
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="flex-1 relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-texto-secundario" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por empresa, RUC o correo..."
            className="w-full pl-10 pr-4 py-2.5 border border-borde rounded-lg focus:ring-2 focus:ring-accion focus:border-accion focus:outline-none text-sm"
          />
        </div>
        <select
          value={filtroEstado}
          onChange={(e) => setFiltroEstado(e.target.value as 'todas' | 'activas' | 'inactivas')}
          className="px-4 py-2.5 border border-borde rounded-lg focus:ring-2 focus:ring-accion focus:outline-none text-sm bg-white"
        >
          <option value="todas">Todas</option>
          <option value="activas">Activas</option>
          <option value="inactivas">Inactivas</option>
        </select>
      </div>

      <div className="bg-fondo-blanco rounded-xl shadow-sm border border-borde-suave overflow-hidden">
        {loading ? (
          <Cargando mensaje="Cargando empresas..." />
        ) : (
          <TablaEmpresas
            empresas={empresasFiltradas}
            total={empresas.length}
            onVerDetalle={handleVerDetalle}
            onToggleEstado={handleToggleClick}
            onEditar={handleEditar}
            onNavegarCrear={openCrearModal}
          />
        )}
      </div>

      <ModalEditarEmpresa
        empresa={editEmpresa}
        abierto={!!editEmpresa}
        onCerrar={() => setEditEmpresa(null)}
        onGuardado={refreshData}
      />

      <ModalCambiarPassword
        idempresa={changePassword?.idempresa || ''}
        userId={changePassword?.userId || ''}
        abierto={!!changePassword}
        onCerrar={() => setChangePassword(null)}
        onGuardado={refreshData}
      />

      <DialogoConfirmacion
        abierto={confirmToggle.abierto}
        titulo={confirmToggle.activo ? 'Desactivar Empresa' : 'Activar Empresa'}
        mensaje={confirmToggle.activo ? '¿Está seguro de desactivar esta empresa? Quedará inaccesible para todos sus usuarios.' : '¿Está seguro de reactivar esta empresa?'}
        onConfirmar={handleToggleConfirm}
        onCerrar={() => setConfirmToggle({ abierto: false, idempresa: '', activo: false })}
        variant={confirmToggle.activo ? 'danger' : 'primary'}
      />

      <Modal abierto={crearModalAbierto} onCerrar={() => setCrearModalAbierto(false)} titulo="Nueva Empresa" size="lg">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className={`flex-1 h-2 rounded-full ${step >= 1 ? 'bg-primario' : 'bg-fondo-sutil'}`} />
            <div className={`flex-1 h-2 rounded-full ${step >= 2 ? 'bg-primario' : 'bg-fondo-sutil'}`} />
          </div>
          {error && (
            <div className="bg-peligro-suave text-peligro-texto p-4 rounded-lg mb-6 text-sm">{error}</div>
          )}
          <form onSubmit={handleCrearEmpresa}>
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="font-semibold text-texto border-b border-borde-suave pb-2 text-sm">Datos de la Empresa</h2>
                <div>
                  <label className="block text-sm font-medium text-texto mb-1">Razón Social *</label>
                  <input type="text" value={empresaForm.razonsocial} onChange={e => setEmpresaForm({...empresaForm, razonsocial: e.target.value})} className="w-full px-4 py-3 border border-borde rounded-lg focus:ring-2 focus:ring-accion focus:outline-none text-sm" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-texto mb-1">Nombre Comercial</label>
                  <input type="text" value={empresaForm.nombrecomercial} onChange={e => setEmpresaForm({...empresaForm, nombrecomercial: e.target.value})} className="w-full px-4 py-3 border border-borde rounded-lg focus:ring-2 focus:ring-accion focus:outline-none text-sm" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-texto mb-1">RUC *</label>
                    <input type="text" value={empresaForm.ruc} onChange={e => setEmpresaForm({...empresaForm, ruc: e.target.value})} className="w-full px-4 py-3 border border-borde rounded-lg focus:ring-2 focus:ring-accion focus:outline-none text-sm" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-texto mb-1">Correo Empresarial *</label>
                    <input type="email" value={empresaForm.correo} onChange={e => setEmpresaForm({...empresaForm, correo: e.target.value})} className="w-full px-4 py-3 border border-borde rounded-lg focus:ring-2 focus:ring-accion focus:outline-none text-sm" required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-texto mb-1">Teléfono</label>
                  <input type="text" value={empresaForm.telefono} onChange={e => setEmpresaForm({...empresaForm, telefono: e.target.value})} className="w-full px-4 py-3 border border-borde rounded-lg focus:ring-2 focus:ring-accion focus:outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-texto mb-1">Dirección</label>
                  <textarea value={empresaForm.direccion} onChange={e => setEmpresaForm({...empresaForm, direccion: e.target.value})} className="w-full px-4 py-3 border border-borde rounded-lg focus:ring-2 focus:ring-accion focus:outline-none text-sm" rows={2} />
                </div>
                <button type="button" onClick={() => setStep(2)} className="w-full bg-accion text-white py-3 rounded-lg font-semibold hover:bg-accion/90 transition">Continuar</button>
              </div>
            )}
            {step === 2 && (
              <div className="space-y-4">
                <h2 className="font-semibold text-texto border-b border-borde-suave pb-2 text-sm">Datos del Administrador</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-texto mb-1">Nombres *</label>
                    <input type="text" value={adminForm.admin_nombres} onChange={e => setAdminForm({...adminForm, admin_nombres: e.target.value})} className="w-full px-4 py-3 border border-borde rounded-lg focus:ring-2 focus:ring-accion focus:outline-none text-sm" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-texto mb-1">Apellidos *</label>
                    <input type="text" value={adminForm.admin_apellidos} onChange={e => setAdminForm({...adminForm, admin_apellidos: e.target.value})} className="w-full px-4 py-3 border border-borde rounded-lg focus:ring-2 focus:ring-accion focus:outline-none text-sm" required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-texto mb-1">Nombre de Usuario *</label>
                  <input type="text" value={adminForm.admin_usuario} onChange={e => setAdminForm({...adminForm, admin_usuario: e.target.value})} className="w-full px-4 py-3 border border-borde rounded-lg focus:ring-2 focus:ring-accion focus:outline-none text-sm" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-texto mb-1">Correo Electrónico *</label>
                  <input type="email" value={adminForm.admin_correo} onChange={e => setAdminForm({...adminForm, admin_correo: e.target.value})} className="w-full px-4 py-3 border border-borde rounded-lg focus:ring-2 focus:ring-accion focus:outline-none text-sm" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-texto mb-1">Contraseña *</label>
                  <input type="password" value={adminForm.admin_password} onChange={e => setAdminForm({...adminForm, admin_password: e.target.value})} className="w-full px-4 py-3 border border-borde rounded-lg focus:ring-2 focus:ring-accion focus:outline-none text-sm" required minLength={6} />
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button type="button" onClick={() => setStep(1)} className="flex-1 px-4 py-3 border border-borde rounded-lg hover:bg-fondo-sutil transition font-semibold text-sm">Atrás</button>
                  <button type="submit" disabled={isSubmitting} className="flex-1 bg-accion text-white py-3 rounded-lg font-semibold hover:bg-accion/90 transition disabled:opacity-50 flex items-center justify-center gap-2 text-sm">
                    {isSubmitting && (
                      <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    )}
                    {isSubmitting ? 'Creando...' : 'Crear Empresa'}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>
      </Modal>
    </div>
  )
}
