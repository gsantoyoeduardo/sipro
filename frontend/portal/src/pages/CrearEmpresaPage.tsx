import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

export default function CrearEmpresaPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    razonsocial: '',
    nombrecomercial: '',
    ruc: '',
    correo: '',
    telefono: '',
    direccion: '',
    admin_usuario: '',
    admin_nombres: '',
    admin_apellidos: '',
    admin_correo: '',
    admin_password: '',
  })

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      console.log('[CrearEmpresa] Sending data:', form)
      const response = await api.post('/portal/api/registro/', form)
      console.log('[CrearEmpresa] Response:', response.data)
      navigate('/admin?refresh=true')
    } catch (err: any) {
      console.error('[CrearEmpresa] Error:', err)
      console.error('[CrearEmpresa] Error response data:', err.response?.data)
      console.error('[CrearEmpresa] Error status:', err.response?.status)
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

  const inputClass = 'w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:outline-none text-gray-700'

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-slate-900 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <button onClick={() => navigate('/admin')} className="flex items-center gap-2 hover:text-blue-300 transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-medium">Volver al Panel</span>
            </button>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div>
              <span className="font-bold text-lg hidden sm:inline">SIPRO Admin</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Nueva Empresa</h1>
          <p className="text-gray-500 mb-6 text-sm sm:text-base">Complete los datos de la empresa y del administrador inicial</p>

          {/* Steps indicator */}
          <div className="flex items-center gap-2 mb-8">
            <div className={`flex-1 h-2 rounded-full ${step >= 1 ? 'bg-blue-600' : 'bg-gray-200'}`} />
            <div className={`flex-1 h-2 rounded-full ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <div className="space-y-4 sm:space-y-5">
                <h2 className="font-semibold text-gray-700 border-b pb-2 text-sm sm:text-base">Datos de la Empresa</h2>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Razón Social *</label>
                  <input type="text" value={form.razonsocial} onChange={(e) => handleChange('razonsocial', e.target.value)} className={inputClass} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Comercial</label>
                  <input type="text" value={form.nombrecomercial} onChange={(e) => handleChange('nombrecomercial', e.target.value)} className={inputClass} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">RUC *</label>
                    <input type="text" value={form.ruc} onChange={(e) => handleChange('ruc', e.target.value)} className={inputClass} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Correo Empresarial *</label>
                    <input type="email" value={form.correo} onChange={(e) => handleChange('correo', e.target.value)} className={inputClass} required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                  <input type="text" value={form.telefono} onChange={(e) => handleChange('telefono', e.target.value)} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                  <textarea value={form.direccion} onChange={(e) => handleChange('direccion', e.target.value)} className={inputClass} rows={2} />
                </div>
                <button type="button" onClick={() => setStep(2)} className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition">
                  Continuar
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4 sm:space-y-5">
                <h2 className="font-semibold text-gray-700 border-b pb-2 text-sm sm:text-base">Datos del Administrador</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombres *</label>
                    <input type="text" value={form.admin_nombres} onChange={(e) => handleChange('admin_nombres', e.target.value)} className={inputClass} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Apellidos *</label>
                    <input type="text" value={form.admin_apellidos} onChange={(e) => handleChange('admin_apellidos', e.target.value)} className={inputClass} required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre de Usuario *</label>
                  <input type="text" value={form.admin_usuario} onChange={(e) => handleChange('admin_usuario', e.target.value)} className={inputClass} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico *</label>
                  <input type="email" value={form.admin_correo} onChange={(e) => handleChange('admin_correo', e.target.value)} className={inputClass} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña *</label>
                  <input type="password" value={form.admin_password} onChange={(e) => handleChange('admin_password', e.target.value)} className={inputClass} required minLength={6} />
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button type="button" onClick={() => setStep(1)} className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-semibold">
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
            )}
          </form>
        </div>
      </main>
    </div>
  )
}
