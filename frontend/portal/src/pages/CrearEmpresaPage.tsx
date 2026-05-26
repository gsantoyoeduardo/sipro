import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { empresaService } from '../api/empresa'
import FormularioEmpresa from '../components/dedicated/empresa/FormularioEmpresa'
import FormularioAdmin from '../components/dedicated/empresa/FormularioAdmin'

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
      await empresaService.registrar(form)
      navigate('/admin?refresh=true')
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
      <div className="max-w-2xl mx-auto">
        <div className="bg-fondo-blanco rounded-xl shadow-sm p-6 sm:p-8">
          <h1 className="text-xl sm:text-2xl font-bold text-texto mb-2">Nueva Empresa</h1>
          <p className="text-texto-secundario mb-6 text-sm sm:text-base">
            Complete los datos de la empresa y del administrador inicial
          </p>

          <div className="flex items-center gap-2 mb-8">
            <div className={`flex-1 h-2 rounded-full ${step >= 1 ? 'bg-primario' : 'bg-fondo-sutil'}`} />
            <div className={`flex-1 h-2 rounded-full ${step >= 2 ? 'bg-primario' : 'bg-fondo-sutil'}`} />
          </div>

          {error && (
            <div className="bg-peligro-suave text-peligro-texto p-4 rounded-lg mb-6 text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <FormularioEmpresa form={form} onChange={handleChange} onContinuar={() => setStep(2)} />
            )}
            {step === 2 && (
              <FormularioAdmin
                form={form}
                onChange={handleChange}
                onAtras={() => setStep(1)}
                isSubmitting={isSubmitting}
              />
            )}
          </form>
        </div>
      </div>
    </div>
  )
}
