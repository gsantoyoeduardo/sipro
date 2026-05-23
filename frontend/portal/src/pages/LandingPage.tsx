import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

/**
 * Página de aterrizaje (ruta raíz "/").
 * Verifica si el usuario está autenticado y redirige
 * automáticamente al dashboard (/admin) o al login (/login).
 * Mientras tanto, muestra un indicador visual de redirección.
 */
export default function LandingPage() {
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  // Redirige según el estado de autenticación al montar el componente
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin')
    } else {
      navigate('/login')
    }
  }, [isAuthenticated, navigate])

  return (
    // Pantalla de carga/redirección con el logo de SIPRO
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-blue-900 rounded-xl flex items-center justify-center mx-auto mb-4">
          <span className="text-white font-bold text-2xl">S</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">SIPRO Admin</h1>
        <p className="text-gray-500">Redirigiendo...</p>
      </div>
    </div>
  )
}
