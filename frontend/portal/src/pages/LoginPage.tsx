import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../api/auth'
import { useAuthStore } from '../store/authStore'
import PanelFormulario from '../components/dedicated/login/PanelFormulario'

export default function LoginPage() {
  const [usuario, setUsuario] = useState('')
  const [password, setPassword] = useState('')
  const [recordarme, setRecordarme] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)
    try {
      const { data } = await authService.login(usuario, password)
      setAuth(data.user, data.access, data.refresh)
      navigate('/admin')
    } catch (err: any) {
      const status = err.response?.status
      if (status === 429) {
        setError('Demasiados intentos. Espere 5 minutos para volver a intentar.')
      } else {
        setError(err.response?.data?.error || 'Credenciales inválidas')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primario-mas-oscuro via-primario-oscuro to-primario flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8">
          <div className="text-center mb-6">
            <img
              src="/sipro.png"
              alt="SIPRO"
              className="w-48 mx-auto mb-6"
            />
            <p className="text-texto-secundario text-sm">Ingresa tus credenciales para continuar</p>
          </div>

          <PanelFormulario
            usuario={usuario}
            password={password}
            error={error}
            isSubmitting={isSubmitting}
            recordarme={recordarme}
            onUsuarioChange={setUsuario}
            onPasswordChange={setPassword}
            onRecordarmeChange={setRecordarme}
            onSubmit={handleSubmit}
          />
        </div>

        <p className="text-center text-white/50 mt-6 text-xs">
          SIPRO WMS &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
