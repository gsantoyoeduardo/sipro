import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { empresaService } from '../api/empresa'
import Header from '../components/common/Header'
import EmpresaForm from '../components/dedicated/EmpresaForm'
import AdminUserForm from '../components/dedicated/AdminUserForm'

/**
 * Página de creación de una nueva empresa en el sistema.
 * El flujo se divide en dos pasos:
 *   1. Datos de la empresa (razón social, RUC, etc.)
 *   2. Datos del usuario administrador inicial
 * Al completar el formulario, envía los datos a la API y
 * redirige al dashboard forzando la recarga de la lista.
 */
export default function CrearEmpresaPage() {
  const navigate = useNavigate()

  // Estados del formulario y la navegación entre pasos
  const [step, setStep] = useState(1)              // Paso actual (1 o 2)
  const [isSubmitting, setIsSubmitting] = useState(false) // Indica si se está enviando
  const [error, setError] = useState('')            // Mensaje de error

  // Estado único que agrupa todos los campos del formulario
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

  /**
   * Actualiza un campo específico del formulario.
   * @param field - Nombre del campo a actualizar
   * @param value - Nuevo valor del campo
   */
  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  /**
   * Envía el formulario completo a la API para crear la empresa.
   * Si ocurre un error, extrae los mensajes de validación
   * del backend y los muestra al usuario.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      await empresaService.crear(form)
      // Redirige al dashboard con refresh=true para recargar la lista
      navigate('/admin?refresh=true')
    } catch (err: any) {
      // Si el backend devuelve errores por campo, los concatenamos
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

  /** Redirige al login (cierre de sesión) */
  const handleLogout = () => {
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header
        onNavigate={(path) => path === '/admin' ? navigate('/admin') : navigate(path)}
        onLogout={handleLogout}
      />

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8">
          {/* Título y descripción */}
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Nueva Empresa</h1>
          <p className="text-gray-500 mb-6 text-sm sm:text-base">
            Complete los datos de la empresa y del administrador inicial
          </p>

          {/* Barra de progreso con dos pasos */}
          <div className="flex items-center gap-2 mb-8">
            <div className={`flex-1 h-2 rounded-full ${step >= 1 ? 'bg-blue-600' : 'bg-gray-200'}`} />
            <div className={`flex-1 h-2 rounded-full ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`} />
          </div>

          {/* Alerta de error global */}
          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-lg mb-6 text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Paso 1: Datos de la empresa */}
            {step === 1 && (
              <EmpresaForm form={form} onChange={handleChange} onContinuar={() => setStep(2)} />
            )}
            {/* Paso 2: Datos del administrador */}
            {step === 2 && (
              <AdminUserForm
                form={form}
                onChange={handleChange}
                onAtras={() => setStep(1)}
                isSubmitting={isSubmitting}
              />
            )}
          </form>
        </div>
      </main>
    </div>
  )
}
