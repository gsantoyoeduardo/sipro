import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { authService } from '../api/auth'
import { useAuthStore } from '../store/authStore'

/**
 * Página de inicio de sesión del panel de administración SIPRO.
 * Muestra un formulario con campos de usuario y contraseña,
 * valida las credenciales contra la API y redirige al dashboard
 * si la autenticación es exitosa. En caso de error, muestra el
 * mensaje correspondiente.
 */
export default function LoginPage() {
  // Estado local del formulario
  const [usuario, setUsuario] = useState('')           // Nombre de usuario ingresado
  const [password, setPassword] = useState('')         // Contraseña ingresada
  const [error, setError] = useState('')               // Mensaje de error a mostrar
  const [isSubmitting, setIsSubmitting] = useState(false) // Indica si se está enviando la solicitud

  const navigate = useNavigate()
  // Obtiene la función setAuth del store de autenticación
  const setAuth = useAuthStore((state) => state.setAuth)

  /**
   * Maneja el envío del formulario de login.
   * Envía las credenciales a la API y, si son correctas,
   * almacena los datos del usuario y los tokens en el store,
   * luego redirige al dashboard. Si falla, muestra el error.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')              // Limpia errores previos
    setIsSubmitting(true)     // Deshabilita el botón durante la petición
    try {
      const { data } = await authService.login(usuario, password)
      setAuth(data.user, data.access, data.refresh)
      navigate('/admin')
    } catch (err: any) {
      // Extrae el mensaje de error de la respuesta o usa uno genérico
      setError(err.response?.data?.error || 'Credenciales inválidas')
    } finally {
      setIsSubmitting(false)  // Reactiva el botón
    }
  }

  return (
    // Contenedor con fondo degradado y centrado vertical/horizontal
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo y título */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-white font-bold text-3xl">S</span>
          </div>
          <h1 className="text-2xl font-bold text-white">SIPRO Admin</h1>
          <p className="text-slate-400 mt-1">Panel de Administración</p>
        </div>

        {/* Tarjeta del formulario */}
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
          {/* Alerta de error */}
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg mb-4 text-sm">{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Campo de usuario */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
              <input
                type="text"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
                autoComplete="username"
              />
            </div>
            {/* Campo de contraseña */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
                autoComplete="current-password"
              />
            </div>
            {/* Botón de envío con indicador de carga */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {/* Spinner animado durante la carga */}
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

        {/* Enlace al sistema WMS */}
        <p className="text-center text-slate-500 mt-6 text-sm">
          <a href="http://localhost:8080" className="text-blue-400 hover:text-blue-300">
            Ir al Sistema WMS →
          </a>
        </p>
      </div>
    </div>
  )
}
