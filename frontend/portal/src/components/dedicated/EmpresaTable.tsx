import StatusBadge from '../common/StatusBadge'
import type { Empresa } from '../../api/empresa'

interface EmpresaTableProps {
  empresas: Empresa[]
  onVerDetalle: (id: string) => void
  onToggleEstado: (id: string) => void
  onNavegarCrear: () => void
}

export default function EmpresaTable({ empresas, onVerDetalle, onToggleEstado, onNavegarCrear }: EmpresaTableProps) {
  if (empresas.length === 0) {
    return (
      <div className="p-8 sm:p-12 text-center">
        <div className="text-gray-400 text-5xl mb-4">🏢</div>
        <p className="text-gray-500 mb-4">No hay empresas registradas</p>
        <button
          onClick={onNavegarCrear}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          Crear Primera Empresa
        </button>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Empresa</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">RUC</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Correo</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Fecha</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {empresas.map((emp) => (
            <tr key={emp.idempresa} className="hover:bg-gray-50 transition">
              <td className="px-4 sm:px-6 py-4">
                <div className="font-medium text-gray-800 text-sm">{emp.razonsocial}</div>
                <div className="text-xs text-gray-500 sm:hidden">{emp.ruc}</div>
              </td>
              <td className="px-4 py-4 text-sm text-gray-600 hidden sm:table-cell">{emp.ruc}</td>
              <td className="px-4 py-4 text-sm text-gray-600 hidden md:table-cell">{emp.correo}</td>
              <td className="px-4 py-4 text-sm text-gray-500 hidden lg:table-cell">
                {new Date(emp.fechacreacion).toLocaleDateString('es-PE')}
              </td>
              <td className="px-4 py-4">
                <StatusBadge activo={emp.estado} />
              </td>
              <td className="px-4 py-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onVerDetalle(emp.idempresa)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    title="Ver detalles"
                  >
                    👁
                  </button>
                  <button
                    onClick={() => onToggleEstado(emp.idempresa)}
                    className={`text-sm font-medium ${emp.estado ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'}`}
                    title={emp.estado ? 'Desactivar' : 'Activar'}
                  >
                    {emp.estado ? '⏸' : '▶'}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
