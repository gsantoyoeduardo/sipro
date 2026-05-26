import { useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import BarraLateral from './BarraLateral'

export default function LayoutPrincipal() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const navigate = useNavigate()
  const userName = user ? `${user.nombres} ${user.apellidos}` : 'Administrador'

  const handleLogout = () => {
    logout()
    navigate('/iniciar-sesion')
  }

  return (
    <div className="min-h-screen bg-fondo flex">
      <BarraLateral collapsed={!sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-fondo-blanco border-b border-borde-suave h-16 flex items-center px-4 sm:px-6 sticky top-0 z-10">
          <div className="flex-1" />

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-texto">{userName}</p>
              <p className="text-xs text-texto-secundario">Administrador</p>
            </div>
            <div className="w-9 h-9 bg-primario rounded-full flex items-center justify-center text-white text-sm font-semibold">
              {user?.nombres?.charAt(0) || 'A'}
            </div>
            <button
              onClick={handleLogout}
              className="text-texto-secundario hover:text-texto transition p-1"
              title="Cerrar sesión"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
