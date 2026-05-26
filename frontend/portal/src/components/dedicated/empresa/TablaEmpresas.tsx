import Interruptor from '../../common/Interruptor'
import type { Empresa } from '../../../api/empresa'

interface TablaEmpresasProps {
  empresas: Empresa[]
  total: number
  onVerDetalle: (id: string) => void
  onToggleEstado: (id: string) => void
  onEditar: (id: string) => void
  onNavegarCrear: () => void
}

export default function TablaEmpresas({ empresas, total, onVerDetalle, onToggleEstado, onEditar, onNavegarCrear }: TablaEmpresasProps) {
  if (empresas.length === 0) {
    return (
      <div className="p-8 sm:p-12 text-center">
        <div className="text-texto-secundario/30 text-5xl mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <p className="text-texto-secundario font-medium mb-1">No se encontraron empresas</p>
        <p className="text-texto-secundario/60 text-sm mb-6">
          {total > 0 ? 'Intenta ajustar los filtros de búsqueda' : 'Registra la primera empresa para comenzar'}
        </p>
        <button
          onClick={onNavegarCrear}
          className="bg-accion text-white px-6 py-2.5 rounded-lg hover:bg-accion/90 transition shadow-lg shadow-accion/25"
        >
          Crear Primera Empresa
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="px-4 sm:px-6 py-3 border-b border-borde-suave flex items-center justify-between text-sm text-texto-secundario">
        <span>Mostrando <strong className="text-texto">{empresas.length}</strong> de <strong className="text-texto">{total}</strong> empresas</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-texto-secundario uppercase tracking-wider">Empresa</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-texto-secundario uppercase tracking-wider hidden sm:table-cell">RUC</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-texto-secundario uppercase tracking-wider hidden md:table-cell">Correo</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-texto-secundario uppercase tracking-wider hidden lg:table-cell">Fecha</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-texto-secundario uppercase tracking-wider">Estado</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-texto-secundario uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-borde-suave">
            {empresas.map((emp) => (
              <tr key={emp.idempresa} className="hover:bg-fondo-sutil/50 transition group">
                <td className="px-4 sm:px-6 py-4">
                  <div className="font-medium text-texto text-sm">{emp.razonsocial}</div>
                  {emp.nombrecomercial && emp.nombrecomercial !== emp.razonsocial && (
                    <div className="text-xs text-texto-secundario/70">{emp.nombrecomercial}</div>
                  )}
                  <div className="text-xs text-texto-secundario sm:hidden">{emp.ruc}</div>
                </td>
                <td className="px-4 py-4 text-sm text-texto-secundario font-mono hidden sm:table-cell">{emp.ruc}</td>
                <td className="px-4 py-4 text-sm text-primario-claro hidden md:table-cell">{emp.correo}</td>
                <td className="px-4 py-4 text-sm text-texto-secundario hidden lg:table-cell">
                  {new Date(emp.fechacreacion).toLocaleDateString('es-PE', {
                    year: 'numeric', month: 'short', day: 'numeric',
                  })}
                </td>
                <td className="px-4 py-4 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${emp.estado ? 'bg-exito-suave text-exito-texto' : 'bg-peligro-suave text-peligro-texto'}`}>
                      {emp.estado ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => onVerDetalle(emp.idempresa)}
                      className="p-2 text-primario-claro hover:bg-primario-claro/10 rounded-lg transition"
                      title="Ver detalles"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => onToggleEstado(emp.idempresa)}
                      className={`p-2 rounded-lg transition ${emp.estado ? 'text-peligro hover:bg-peligro-suave' : 'text-exito hover:bg-exito-suave'}`}
                      title={emp.estado ? 'Desactivar' : 'Activar'}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={emp.estado ? 'M6 18L18 6M6 6l12 12' : 'M5 13l4 4L19 7'} />
                      </svg>
                    </button>
                    <button
                      onClick={() => onEditar(emp.idempresa)}
                      className="p-2 text-accion hover:bg-advertencia-suave rounded-lg transition"
                      title="Editar empresa"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
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
  )
}
