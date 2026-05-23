import { useAuthStore } from '../../store/authStore'

interface HeaderProps {
  titulo?: string
  onNavigate: (path: string) => void
  onLogout: () => void
  children?: React.ReactNode
}

export default function Header({ titulo = 'SIPRO Admin', onNavigate, onLogout, children }: HeaderProps) {
  const user = useAuthStore((state) => state.user)
  const userName = user ? `${user.nombres} ${user.apellidos}` : 'Administrador'

  return (
    <header className="bg-slate-900 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <button onClick={() => onNavigate('/admin')} className="flex items-center gap-3 hover:text-blue-300 transition">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="font-bold text-lg hidden sm:inline">{titulo}</span>
          </button>
          <div className="flex items-center gap-4">
            <span className="text-sm text-slate-300 hidden sm:inline">{userName}</span>
            {children}
            <button
              onClick={onLogout}
              className="text-slate-400 hover:text-white text-sm transition flex items-center gap-1"
            >
              <span className="hidden sm:inline">Salir</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
