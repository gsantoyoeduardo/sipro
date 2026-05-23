/**
 * Componente gen\u00e9rico DataTable.
 * Renderiza una tabla HTML con soporte para columnas personalizadas,
 * renderizaci\u00f3n personalizada de celdas, acciones por fila,
 * estado de carga y mensaje de vac\u00edo.
 */
interface Column<T> {
  key: string
  header: string
  render?: (item: T) => React.ReactNode
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  onRowClick?: (item: T) => void
  actions?: (item: T) => React.ReactNode
  emptyMessage?: string
}

export default function DataTable<T>({
  columns,
  data,
  loading = false,
  onRowClick,
  actions,
  emptyMessage = 'No hay datos disponibles',
}: DataTableProps<T>) {
  // Muestra un spinner mientras se cargan los datos
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  // Muestra mensaje cuando no hay datos
  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">{emptyMessage}</div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        {/* Cabecera de la tabla con los nombres de columna */}
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                {col.header}
              </th>
            ))}
            {actions && (
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            )}
          </tr>
        </thead>
        {/* Cuerpo de la tabla con los datos */}
        <tbody className="bg-white divide-y divide-gray-200">
          {data.map((item, idx) => (
            <tr
              key={idx}
              className={hover:bg-gray-50 }
              onClick={() => onRowClick?.(item)}
            >
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-sm text-gray-700">
                  {col.render ? col.render(item) : String((item as Record<string, unknown>)[col.key] ?? '')}
                </td>
              ))}
              {actions && (
                <td className="px-4 py-3 text-sm text-right" onClick={(e) => e.stopPropagation()}>
                  <div className="flex justify-end gap-2">{actions(item)}</div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
