import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

const menuItems = [
  { label: 'Dashboard', icon: '📊', path: '/' },
  { label: 'Empresas', icon: '🏢', path: '/empresas' },
  { label: 'Sucursales', icon: '🏬', path: '/sucursales' },
  { label: 'Almacenes', icon: '📦', path: '/almacenes' },
  { label: 'Usuarios', icon: '👥', path: '/usuarios' },
  { label: 'Roles', icon: '🔑', path: '/roles' },
  { label: 'Layout', icon: '🗺️', path: '/layout' },
  { label: 'Nodos', icon: '🔗', path: '/nodos' },
  { label: 'Rutas', icon: '🔀', path: '/rutas' },
  { label: 'Inventario', icon: '📋', path: '/inventario' },
]

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)

  const handleLogout = () => {
    logout()
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 bg-gray-900 text-white transition-all duration-300 flex flex-col
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          ${collapsed ? 'lg:w-16' : 'lg:w-64'} w-64`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-700">
          {!collapsed && (
            <span className="text-xl font-bold text-white">SIPRO WMS</span>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex items-center justify-center w-8 h-8 rounded hover:bg-gray-700 transition"
          >
            {collapsed ? '→' : '←'}
          </button>
          {collapsed && <span className="mx-auto font-bold">S</span>}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path
            return (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path)
                  setMobileOpen(false)
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition
                  ${isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }
                  ${collapsed ? 'justify-center' : ''}`}
              >
                <span className="text-lg">{item.icon}</span>
                {!collapsed && <span>{item.label}</span>}
              </button>
            )
          })}
        </nav>

        {/* User section */}
        {!collapsed && (
          <div className="border-t border-gray-700 p-4">
            <div className="text-sm text-gray-300 truncate">
              {user?.nombres} {user?.apellidos}
            </div>
            <div className="text-xs text-gray-500 truncate">{user?.correo}</div>
          </div>
        )}
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden text-gray-600 hover:text-gray-900"
            >
              ☰
            </button>
            <h2 className="text-lg font-semibold text-gray-800">
              {menuItems.find((item) => location.pathname === item.path || location.pathname.startsWith(item.path + '/'))?.label || 'SIPRO WMS'}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600 hidden sm:block">
              {user?.nombres} {user?.apellidos}
            </span>
            <button
              onClick={handleLogout}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Cerrar Sesión
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
