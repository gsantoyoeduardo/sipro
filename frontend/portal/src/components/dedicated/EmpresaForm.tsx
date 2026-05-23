interface EmpresaFormProps {
  form: Record<string, string>
  onChange: (field: string, value: string) => void
  onContinuar: () => void
}

const inputClass = 'w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-gray-700'

export default function EmpresaForm({ form, onChange, onContinuar }: EmpresaFormProps) {
  return (
    <div className="space-y-4 sm:space-y-5">
      <h2 className="font-semibold text-gray-700 border-b pb-2 text-sm sm:text-base">Datos de la Empresa</h2>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Razón Social *</label>
        <input type="text" value={form.razonsocial} onChange={(e) => onChange('razonsocial', e.target.value)} className={inputClass} required />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Comercial</label>
        <input type="text" value={form.nombrecomercial} onChange={(e) => onChange('nombrecomercial', e.target.value)} className={inputClass} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">RUC *</label>
          <input type="text" value={form.ruc} onChange={(e) => onChange('ruc', e.target.value)} className={inputClass} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Correo Empresarial *</label>
          <input type="email" value={form.correo} onChange={(e) => onChange('correo', e.target.value)} className={inputClass} required />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
        <input type="text" value={form.telefono} onChange={(e) => onChange('telefono', e.target.value)} className={inputClass} />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
        <textarea value={form.direccion} onChange={(e) => onChange('direccion', e.target.value)} className={inputClass} rows={2} />
      </div>
      <button type="button" onClick={onContinuar} className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition">
        Continuar
      </button>
    </div>
  )
}
