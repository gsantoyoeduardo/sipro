import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../api/auth'
import { useAuthStore } from '../store/authStore'

export default function LoginPage() {
  const [usuario, setUsuario] = useState('')
  const [password, setPassword] = useState('')
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
      setError(err.response?.data?.error || 'Credenciales inválidas')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0511F2] via-[#0A31A6] to-[#0D0D0D] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <img
            src="/logo.png"
            alt="SIPRO"
            className="w-20 h-20 mx-auto mb-4 brightness-0 invert"
          />
          <h1 className="text-2xl font-bold text-white">SIPRO Portal</h1>
          <p className="text-[#38F2F2] mt-1 text-sm">Panel de Administración</p>
        </div>

        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 sm:p-8 border border-white/10">
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm border border-red-200">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-[#0D0D0D] mb-1.5">Usuario</label>
              <input
                type="text"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0785F2] focus:border-[#0785F2] focus:outline-none transition"
                placeholder="Ingrese su usuario"
                required
                autoComplete="username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#0D0D0D] mb-1.5">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#0785F2] focus:border-[#0785F2] focus:outline-none transition"
                placeholder="Ingrese su contraseña"
                required
                autoComplete="current-password"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#0785F2] text-white py-3 rounded-xl font-semibold hover:bg-[#0A31A6] transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-[#0785F2]/25"
            >
              {isSubmitting && (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {isSubmitting ? 'Ingresando...' : 'Iniciar Sesión'}
            </button>
          </form>
        </div>

        <p className="text-center text-white/50 mt-6 text-xs">
          SIPRO WMS &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
