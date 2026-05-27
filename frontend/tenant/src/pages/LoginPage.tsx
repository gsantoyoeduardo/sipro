import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useAuthStore } from '../store/authStore'
import { useSubmit } from '../hooks/useSubmit'
import { validateRequired, validateMinLength } from '../utils/validators'

export default function LoginPage() {
  const [ruc, setRuc] = useState('')
  const [usuario, setUsuario] = useState('')
  const [password, setPassword] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)

  const handleLogin = async () => {
    const payload = { ruc, usuario, password }
    try {
      const res = await api.post('/tenant/auth/', payload)
      setAuth(res.data.user, res.data.access, res.data.refresh, res.data.user.idempresa)
      return true
    } catch (err: any) {
      console.error('[LOGIN] Error:', err.response?.data || err.message)
      throw err
    }
  }

  const { submit: doLogin, isSubmitting, error } = useSubmit(handleLogin)

  const validate = (): boolean => {
    const errors: Record<string, string> = {}
    const r = validateRequired(ruc, 'RUC') || validateMinLength(ruc, 11, 'RUC')
    if (r) errors.ruc = r
    const u = validateRequired(usuario, 'Usuario') || validateMinLength(usuario, 3, 'Usuario')
    if (u) errors.usuario = u
    const p = validateRequired(password, 'Contraseña') || validateMinLength(password, 6, 'Contraseña')
    if (p) errors.password = p
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    const result = await doLogin()
    if (result) navigate('/')
  }

  return (
    <div className="min-h-screen flex bg-fondo">
      {/* Left panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primario-mas-oscuro via-primario-oscuro to-primario flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-72 h-72 bg-accion rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-primario-claro rounded-full blur-3xl" />
        </div>
        <div className="relative z-10 text-center">
          <img src="/sipro.png" alt="SIPRO" className="h-20 mx-auto mb-8 brightness-0 invert" />
          <p className="text-white/70 text-lg max-w-md">Sistema integral de gestión de almacenes. Controla tu inventario, picking y transferencias desde un solo lugar.</p>
          <div className="mt-12 grid grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-accion">99.9%</div>
              <div className="text-white/50 text-sm mt-1">Uptime</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-accion">24/7</div>
              <div className="text-white/50 text-sm mt-1">Disponible</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-accion">100%</div>
              <div className="text-white/50 text-sm mt-1">Seguro</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel - Login form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md animate-fade-in">
          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-8">
            <img src="/sipro.png" alt="SIPRO" className="h-14" />
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-texto">Bienvenido</h2>
            <p className="text-texto-secundario mt-2">Ingresa tus credenciales para acceder al sistema</p>
          </div>

          {error && (
            <div className="bg-peligro-suave text-peligro-texto p-4 rounded-xl mb-6 text-sm flex items-center gap-3">
              <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-texto mb-2">RUC de la Empresa</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-texto-secundario" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={ruc}
                  onChange={(e) => { setRuc(e.target.value); setFieldErrors((p) => ({ ...p, ruc: '' })) }}
                  placeholder="20123456789"
                  className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-accion focus:border-transparent text-sm transition ${fieldErrors.ruc ? 'border-peligro' : 'border-borde'}`}
                />
              </div>
              {fieldErrors.ruc && <p className="text-peligro text-xs mt-1.5">{fieldErrors.ruc}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-texto mb-2">Usuario</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-texto-secundario" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={usuario}
                  onChange={(e) => { setUsuario(e.target.value); setFieldErrors((p) => ({ ...p, usuario: '' })) }}
                  placeholder="tu-usuario"
                  className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-accion focus:border-transparent text-sm transition ${fieldErrors.usuario ? 'border-peligro' : 'border-borde'}`}
                />
              </div>
              {fieldErrors.usuario && <p className="text-peligro text-xs mt-1.5">{fieldErrors.usuario}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-texto mb-2">Contraseña</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-texto-secundario" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setFieldErrors((p) => ({ ...p, password: '' })) }}
                  placeholder="••••••••"
                  className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-accion focus:border-transparent text-sm transition ${fieldErrors.password ? 'border-peligro' : 'border-borde'}`}
                />
              </div>
              {fieldErrors.password && <p className="text-peligro text-xs mt-1.5">{fieldErrors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-accion text-white py-3 rounded-xl hover:bg-accion-hover transition disabled:opacity-50 flex items-center justify-center gap-2 font-semibold text-sm shadow-lg shadow-accion/25"
            >
              {isSubmitting && (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {isSubmitting ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>

          <p className="text-center text-texto-secundario text-xs mt-8">v2.0 &copy; 2026</p>
        </div>
      </div>
    </div>
  )
}
