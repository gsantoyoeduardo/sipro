/**
 * Componente de Layout principal de la aplicaci\u00f3n.
 * Renderiza un sidebar de navegaci\u00f3n con grupos de men\u00fa, un header superior
 * con informaci\u00f3n del usuario y bot\u00f3n de cierre de sesi\u00f3n, y un \u00e1rea
 * de contenido donde se renderizan las rutas hijas mediante <Outlet />.
 */
import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

// Grupos de navegaci\u00f3n del men\u00fa lateral con sus rutas e iconos SVG
const gruposMenu = [
  {
    label: 'Principal',
    items: [
      { label: 'Dashboard', path: '/', icon: DashboardIcon },
    ],
  },
  {
    label: 'Configuraci\u00f3n',
    items: [
      { label: 'Empresas', path: '/empresas', icon: BuildingIcon },
      { label: 'Sucursales', path: '/sucursales', icon: StoreIcon },
      { label: 'Almacenes', path: '/almacenes', icon: WarehouseIcon },
      { label: 'Usuarios', path: '/usuarios', icon: UsersIcon },
      { label: 'Roles', path: '/roles', icon: ShieldIcon },
    ],
  },
  {
    label: 'Operaciones',
    items: [
      { label: 'Layout', path: '/layout', icon: MapIcon },
      { label: 'Nodos', path: '/nodos', icon: NodeIcon },
      { label: 'Rutas', path: '/rutas', icon: RouteIcon },
      { label: 'Inventario', path: '/inventario', icon: BoxesIcon },
      { label: 'Picking', path: '/picking', icon: CheckIcon },
      { label: 'Transferencias', path: '/transferencias', icon: TruckIcon },
    ],
  },
]

// Obtiene las iniciales del nombre del usuario (m\u00e1ximo 2 caracteres)
function getInitials(nombre: string): string {
  return nombre
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.logout)
  const userName = user ? ${user.nombres}  : 'Usuario'
  const initials = getInitials(user?.nombres || 'U')
  // Determina si el usuario es admin_sistema (ve la secci\u00f3n Empresas)
  const esAdminSistema = user?.tipo_usuario === 'admin_sistema'

  // Filtra los items del men\u00fa seg\u00fan el tipo de usuario
  const menuFiltrado = gruposMenu.map((grupo) => ({
    ...grupo,
    items: grupo.items.filter((item) => {
      if (item.path === '/empresas' && !esAdminSistema) return false
      return true
    }),
  }))

  // Determina la etiqueta de la p\u00e1gina actual para mostrar en el header
  const paginaActual = gruposMenu
    .flatMap((g) => g.items)
    .find((item) => location.pathname === item.path || location.pathname.startsWith(item.path + '/'))
    ?.label || 'SIPRO WMS'

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Overlay para cerrar sidebar en m\u00f3vil */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar de navegaci\u00f3n */}
      <aside
        className={ixed lg:static inset-y-0 left-0 z-30 bg-slate-900 text-white flex flex-col w-72 transition-transform duration-300
          }
      >
        {/* Logo */}
        <div className="flex items-center justify-center h-20 px-6 border-b border-slate-700/50">
          <img src="/logoborde.png" alt="SIPRO" className="h-12" />
        </div>

        {/* Men\u00fa de navegaci\u00f3n con grupos e items */}
        <nav className="flex-1 py-6 px-3 overflow-y-auto space-y-6">
          {menuFiltrado.map((grupo) => (
            <div key={grupo.label}>
              <p className="px-4 mb-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                {grupo.label}
              </p>
              <div className="space-y-0.5">
                {grupo.items.map((item) => {
                  const isActive = location.pathname === item.path
                    || (item.path !== '/' && location.pathname.startsWith(item.path + '/'))
                  return (
                    <button
                      key={item.path}
                      onClick={() => {
                        navigate(item.path)
                        setMobileOpen(false)
                      }}
                      className={w-full flex items-center gap-3 px-4 py-2.5 text-sm rounded-lg transition-all duration-200 group
                        }
                    >
                      <span className={w-5 h-5 flex-shrink-0 }>
                        <item.icon />
                      </span>
                      <span className="font-medium truncate">{item.label}</span>
                      {isActive && (
                        <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-400" />
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Secci\u00f3n inferior con datos del usuario */}
        <div className="border-t border-slate-700/50 p-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold text-white flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate">{userName}</p>
              <p className="text-xs text-slate-500 truncate">{user?.correo}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* \u00c1rea principal de contenido */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header superior con t\u00edtulo de p\u00e1gina y opciones de usuario */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 flex-shrink-0">
          <div className="flex items-center gap-4">
            {/* Bot\u00f3n de men\u00fa hamburguesa para m\u00f3vil */}
            <button
              onClick={() => setMobileOpen(true)}
              className="lg:hidden text-gray-500 hover:text-gray-700"
            >
              <MenuHamburguesa />
            </button>
            <h2 className="text-lg font-semibold text-gray-800">{paginaActual}</h2>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500 hidden sm:block">{userName}</span>
            {/* Bot\u00f3n de cierre de sesi\u00f3n */}
            <button
              onClick={() => logout()}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-red-600 font-medium transition-colors"
            >
              <LogoutIcon />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </header>

        {/* Contenido de la p\u00e1gina (rutas hijas) */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

/* SVG Icons */
function DashboardIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  )
}

function BuildingIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <line x1="9" y1="6" x2="9" y2="6.01" />
      <line x1="15" y1="6" x2="15" y2="6.01" />
      <line x1="9" y1="10" x2="9" y2="10.01" />
      <line x1="15" y1="10" x2="15" y2="10.01" />
      <line x1="9" y1="14" x2="9" y2="14.01" />
      <line x1="15" y1="14" x2="15" y2="14.01" />
      <path d="M9 18h6v4H9z" />
    </svg>
  )
}

function StoreIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11h18v9a2 2 0 01-2 2H5a2 2 0 01-2-2v-9z" />
      <path d="M3 11V7a4 4 0 018 0v4" />
      <path d="M13 11V7a4 4 0 018 0v4" />
    </svg>
  )
}

function WarehouseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11h18v9a2 2 0 01-2 2H5a2 2 0 01-2-2v-9z" />
      <path d="M3 11V7a2 2 0 012-2h14a2 2 0 012 2v4" />
      <line x1="8" y1="15" x2="16" y2="15" />
      <line x1="8" y1="19" x2="12" y2="19" />
    </svg>
  )
}

function UsersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  )
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  )
}

function MapIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
      <line x1="8" y1="2" x2="8" y2="18" />
      <line x1="16" y1="6" x2="16" y2="22" />
    </svg>
  )
}

function NodeIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="5" r="2" />
      <circle cx="5" cy="12" r="2" />
      <circle cx="12" cy="19" r="2" />
      <circle cx="19" cy="12" r="2" />
      <line x1="12" y1="7" x2="12" y2="17" />
      <line x1="10.2" y1="10.2" x2="6.8" y2="13.8" />
      <line x1="13.8" y1="10.2" x2="17.2" y2="13.8" />
    </svg>
  )
}

function RouteIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  )
}

function BoxesIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" />
      <path d="M12 12l8-4.5" />
      <path d="M12 12v9" />
      <path d="M12 12L4 7.5" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 11 12 14 22 4" />
      <path d="M22 12v7a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h11" />
    </svg>
  )
}

function TruckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13" rx="1" />
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  )
}

function LogoutIcon() {
  return (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}

function MenuHamburguesa() {
  return (
    <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  )
}
