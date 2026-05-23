interface AdminUserFormProps {
  form: Record<string, string>
  onChange: (field: string, value: string) => void
  onAtras: () => void
  isSubmitting: boolean
}

const inputClass = 'w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-gray-700'

export default function AdminUserForm({ form, onChange, onAtras, isSubmitting }: AdminUserFormProps) {
  return (
    <div className="space-y-4 sm:space-y-5">
      <h2 className="font-semibold text-gray-700 border-b pb-2 text-sm sm:text-base">Datos del Administrador</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombres *</label>
          <input type="text" value={form.admin_nombres} onChange={(e) => onChange('admin_nombres', e.target.value)} className={inputClass} required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Apellidos *</label>
          <input type="text" value={form.admin_apellidos} onChange={(e) => onChange('admin_apellidos', e.target.value)} className={inputClass} required />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de Usuario *</label>
        <input type="text" value={form.admin_usuario} onChange={(e) => onChange('admin_usuario', e.target.value)} className={inputClass} required />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico *</label>
        <input type="email" value={form.admin_correo} onChange={(e) => onChange('admin_correo', e.target.value)} className={inputClass} required />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña *</label>
        <input type="password" value={form.admin_password} onChange={(e) => onChange('admin_password', e.target.value)} className={inputClass} required minLength={6} />
      </div>
      <div className="flex flex-col sm:flex-row gap-3">
        <button type="button" onClick={onAtras} className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-semibold">
          Atrás
        </button>
        <button type="submit" disabled={isSubmitting} className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2">
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
  )
}
