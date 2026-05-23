import Modal from '../common/Modal'
import StatusBadge from '../common/StatusBadge'
import type { EmpresaDetalle } from '../../api/empresa'

interface EmpresaDetailModalProps {
  detalle: EmpresaDetalle | null
  onCerrar: () => void
}

export default function EmpresaDetailModal({ detalle, onCerrar }: EmpresaDetailModalProps) {
  if (!detalle) return null

  return (
    <Modal abierto={!!detalle} onCerrar={onCerrar} titulo="Detalles de Empresa">
      <div className="p-6 space-y-4">
        <div>
          <h3 className="text-sm font-medium text-gray-500">Razón Social</h3>
          <p className="text-gray-800 font-semibold">{detalle.empresa.razonsocial}</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="text-sm font-medium text-gray-500">RUC</h3>
            <p className="text-gray-800">{detalle.empresa.ruc}</p>
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">Nombre Comercial</h3>
            <p className="text-gray-800">{detalle.empresa.nombrecomercial || '-'}</p>
          </div>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500">Correo</h3>
          <p className="text-gray-800">{detalle.empresa.correo}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500">Estado</h3>
          <StatusBadge activo={detalle.empresa.estado} />
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-500">Fecha de Creación</h3>
          <p className="text-gray-800">{new Date(detalle.empresa.fechacreacion).toLocaleDateString('es-PE')}</p>
        </div>
        {detalle.admin_usuario && (
          <div className="border-t border-gray-100 pt-4">
            <h3 className="text-sm font-medium text-gray-500 mb-2">Administrador de la Empresa</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-1">
              <p className="text-gray-800 font-medium">{detalle.admin_usuario.nombres} {detalle.admin_usuario.apellidos}</p>
              <p className="text-gray-600 text-sm">Usuario: {detalle.admin_usuario.usuario}</p>
              <p className="text-gray-600 text-sm">Correo: {detalle.admin_usuario.correo}</p>
            </div>
          </div>
        )}
        <div className="border-t border-gray-100 pt-4">
          <h3 className="text-sm font-medium text-gray-500">Total de Usuarios</h3>
          <p className="text-2xl font-bold text-purple-600">{detalle.total_usuarios}</p>
        </div>
      </div>
      <div className="p-6 border-t border-gray-100">
        <button
          onClick={onCerrar}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
        >
          Cerrar
        </button>
      </div>
    </Modal>
  )
}
