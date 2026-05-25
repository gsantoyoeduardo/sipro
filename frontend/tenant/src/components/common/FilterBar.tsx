interface FilterOption {
  value: string
  label: string
}

interface FilterBarProps {
  filtros: {
    label: string
    value: string
    onChange: (value: string) => void
    options: FilterOption[]
    placeholder?: string
  }[]
}

export default function FilterBar({ filtros }: FilterBarProps) {
  return (
    <div className="flex flex-wrap gap-3 mb-4">
      {filtros.map((filtro) => (
        <div key={filtro.label} className="flex items-center gap-2">
          <label className="text-sm text-gray-600 font-medium">{filtro.label}:</label>
          <select
            value={filtro.value}
            onChange={(e) => filtro.onChange(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
          >
            {filtro.placeholder && <option value="">{filtro.placeholder}</option>}
            {filtro.options.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      ))}
    </div>
  )
}
