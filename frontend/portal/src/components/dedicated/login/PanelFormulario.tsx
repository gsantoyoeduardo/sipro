interface Props {
  usuario: string
  password: string
  error: string
  isSubmitting: boolean
  recordarme: boolean
  onUsuarioChange: (v: string) => void
  onPasswordChange: (v: string) => void
  onRecordarmeChange: (v: boolean) => void
  onSubmit: (e: React.FormEvent) => void
}

export default function PanelFormulario({
  usuario,
  password,
  error,
  isSubmitting,
  recordarme,
  onUsuarioChange,
  onPasswordChange,
  onRecordarmeChange,
  onSubmit,
}: Props) {
  return (
    <div className="bg-white">
      {error && (
        <div className="bg-peligro-suave text-peligro-texto p-3 rounded-lg mb-6 text-sm border border-peligro/20">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-texto mb-1.5">Usuario</label>
          <input
            type="text"
            value={usuario}
            onChange={(e) => onUsuarioChange(e.target.value)}
            className="w-full px-0 py-2 border-0 border-b-2 border-borde bg-transparent focus:border-primario-claro focus:ring-0 focus:outline-none transition text-texto placeholder-texto-secundario"
            placeholder="Ingrese su usuario"
            required
            autoComplete="username"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-texto mb-1.5">Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            className="w-full px-0 py-2 border-0 border-b-2 border-borde bg-transparent focus:border-primario-claro focus:ring-0 focus:outline-none transition text-texto placeholder-texto-secundario"
            placeholder="Ingrese su contraseña"
            required
            autoComplete="current-password"
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={recordarme}
              onChange={(e) => onRecordarmeChange(e.target.checked)}
              className="w-4 h-4 rounded border-borde text-accion focus:ring-accion"
            />
            <span className="text-sm text-texto-secundario">Recordarme</span>
          </label>
          <a
            href="#"
            onClick={(e) => e.preventDefault()}
            className="text-sm text-primario-claro hover:underline"
          >
            ¿Olvidaste tu contraseña?
          </a>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-accion text-white py-3 rounded-lg font-semibold hover:bg-accion/90 transition disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-accion/25"
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
  )
}
