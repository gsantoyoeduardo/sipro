import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function LandingPage() {
  const navigate = useNavigate()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin')
    } else {
      navigate('/login')
    }
  }, [isAuthenticated, navigate])

  return (
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
