import Modal from '../../common/Modal'
import Interruptor from '../../common/Interruptor'
import type { EmpresaDetalle } from '../../../api/empresa'

interface ModalDetalleEmpresaProps {
  detalle: EmpresaDetalle | null
  onCerrar: () => void
  onToggleEstado: (idempresa: string) => void
  onEditar: (idempresa: string) => void
  onChangePassword: (idempresa: string, userId: string) => void
}

export default function ModalDetalleEmpresa({
  detalle,
  onCerrar,
  onToggleEstado,
  onEditar,
  onChangePassword,
}: ModalDetalleEmpresaProps) {
  if (!detalle) return null

  const { empresa, admin_usuario: admin } = detalle

  const handleToggle = () => {
    onToggleEstado(empresa.idempresa)
  }

  const InfoItem = ({ label, value }: { label: string; value: string }) => (
    <div className="group">
      <dt className="text-xs font-medium text-texto-secundario uppercase tracking-wider mb-1">{label}</dt>
      <dd className="text-sm text-texto font-medium break-words">{value || '\u2014'}</dd>
    </div>
  )

  return (
    <Modal abierto={!!detalle} onCerrar={onCerrar} titulo={`Detalles de ${empresa.nombrecomercial || empresa.razonsocial}`} size="xl">
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">🏢</span>
              <h3 className="text-base font-semibold text-texto">Datos de la Empresa</h3>
            </div>
            <dl className="space-y-4 bg-fondo-sutil rounded-xl p-5">
              <InfoItem label="Razón Social" value={empresa.razonsocial} />
              <InfoItem label="RUC" value={empresa.ruc} />
              <InfoItem label="Nombre Comercial" value={empresa.nombrecomercial} />
              <InfoItem label="Correo" value={empresa.correo} />
              <InfoItem label="Teléfono" value={empresa.telefono} />
              <InfoItem label="Dirección" value={empresa.direccion} />
              <InfoItem
                label="Fecha de Creación"
                value={new Date(empresa.fechacreacion).toLocaleDateString('es-PE', {
                  year: 'numeric', month: 'long', day: 'numeric',
                })}
              />
              <div>
                <dt className="text-xs font-medium text-texto-secundario uppercase tracking-wider mb-2">Estado</dt>
                <dd>
                  <Interruptor
                    activo={empresa.estado}
                    onChange={handleToggle}
                    labelActivo="Activa"
                    labelInactivo="Inactiva"
                  />
                </dd>
              </div>
            </dl>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">👤</span>
              <h3 className="text-base font-semibold text-texto">Administrador</h3>
            </div>

            {admin ? (
              <div className="bg-fondo-sutil rounded-xl p-5">
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-12 h-12 rounded-full bg-primario flex items-center justify-center text-white font-bold text-lg shrink-0">
                    {admin.nombres.charAt(0)}{admin.apellidos?.charAt(0) || ''}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-texto truncate">
                      {admin.nombres} {admin.apellidos}
                    </p>
                    <p className="text-xs text-texto-secundario">Administrador de Empresa</p>
                  </div>
                </div>

                <dl className="space-y-3">
                  <div>
                    <dt className="text-xs font-medium text-texto-secundario uppercase tracking-wider mb-1">Usuario</dt>
                    <dd className="text-sm text-texto font-mono bg-fondo-blanco rounded-lg px-3 py-2 border border-borde-suave">
                      {admin.usuario}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-texto-secundario uppercase tracking-wider mb-1">Correo</dt>
                    <dd className="text-sm text-primario bg-fondo-blanco rounded-lg px-3 py-2 border border-borde-suave break-all">
                      {admin.correo}
                    </dd>
                  </div>
                </dl>

                <button
                  type="button"
                  onClick={() => onChangePassword(empresa.idempresa, admin.idusuario)}
                  className="mt-5 w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-accion text-accion rounded-lg hover:bg-accion hover:text-white transition text-sm font-semibold"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                  Cambiar Contraseña
                </button>
              </div>
            ) : (
              <div className="bg-fondo-sutil rounded-xl p-5 text-center text-texto-secundario text-sm">
                No se encontró administrador
              </div>
            )}

            <div className="mt-6 bg-gradient-to-br from-morado-suave to-primario/10 rounded-xl p-5 border border-morado/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-morado uppercase tracking-wider">Usuarios Totales</p>
                  <p className="text-3xl font-bold text-texto mt-1">{detalle.total_usuarios}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-morado-suave flex items-center justify-center text-2xl">
                  👥
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 border-t border-borde-suave flex flex-wrap gap-3 justify-end">
        <button
          type="button"
          onClick={() => onEditar(empresa.idempresa)}
          className="px-5 py-3 border border-borde rounded-lg hover:bg-fondo-sutil transition text-sm font-medium flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          Editar Empresa
        </button>
        <button
          type="button"
          onClick={onCerrar}
          className="px-5 py-3 bg-accion text-white rounded-lg hover:bg-accion/90 transition text-sm font-semibold"
        >
          Cerrar
        </button>
      </div>
    </Modal>
  )
}
