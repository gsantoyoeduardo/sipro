import { useNavigate, useLocation } from 'react-router-dom'

const menuItems = [
  { path: '/admin', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { path: '/admin/empresas', label: 'Empresas', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
  { path: '/admin/usuarios', label: 'Usuarios', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z' },
  { path: '/admin/roles', label: 'Roles', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
  { path: '/admin/auditoria', label: 'Auditoría', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
]

export default function BarraLateral({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <>
      {!collapsed && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={onToggle} />
      )}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 bg-barra-lateral text-white flex flex-col transition-all duration-300 ${
          collapsed ? 'w-0 lg:w-16 overflow-hidden' : 'w-64'
        }`}
      >
        <div className="flex items-center justify-center px-4 h-16 border-b border-white/10 shrink-0">
          {collapsed ? (
            <img src="/s.png" alt="S" className="w-8 h-8 brightness-0 invert" />
          ) : (
            <img src="/sipro.png" alt="SIPRO" className="h-10 max-w-[140px] object-contain brightness-0 invert" />
          )}
        </div>

        <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path + '/'))
            return (
              <button
                key={item.path}
                onClick={() => { navigate(item.path); if (window.innerWidth < 1024) onToggle() }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
                  isActive
                    ? 'bg-accion text-white border-l-2 border-accion rounded-l-none'
                    : 'text-white/70 hover:bg-barra-lateral-hover hover:text-white'
                }`}
              >
                <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={item.icon} />
                </svg>
                {!collapsed && <span>{item.label}</span>}
              </button>
            )
          })}
        </nav>

        <button
          onClick={onToggle}
          className="hidden lg:flex items-center justify-center gap-2 px-4 py-3 border-t border-white/10 text-white/60 hover:text-white hover:bg-barra-lateral-hover transition text-sm shrink-0"
          title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
        >
          <svg
            className={`w-4 h-4 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
          {!collapsed && <span>Colapsar</span>}
        </button>

        <div className="px-4 py-3 border-t border-white/10 text-xs text-white/40 text-center shrink-0">
          {!collapsed && <>SIPRO WMS v2.0</>}
        </div>
      </aside>
    </>
  )
}
