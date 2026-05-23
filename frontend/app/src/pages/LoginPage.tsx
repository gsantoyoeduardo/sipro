/**
 * P\u00e1gina de inicio de sesi\u00f3n (Login).
 * Autentica al usuario mediante RUC de empresa, usuario y contrase\u00f1a.
 * Al \u00e9xito, almacena tokens y datos del usuario en el store y redirige al dashboard.
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useAuthStore } from '../store/authStore'
import { useSubmit } from '../hooks/useSubmit'
import { validateRequired, validateMinLength } from '../utils/validators'

export default function LoginPage() {
  // Estado de los campos del formulario
  const [ruc, setRuc] = useState('')
  const [usuario, setUsuario] = useState('')
  const [password, setPassword] = useState('')
  // Errores de validaci\u00f3n por campo
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const navigate = useNavigate()
  // Obtiene la funci\u00f3n setAuth del store de autenticaci\u00f3n
  const setAuth = useAuthStore((state) => state.setAuth)

  // Funci\u00f3n que realiza la petici\u00f3n de login a la API
  const handleLogin = async () => {
    const res = await api.post('/tenant/auth/', { ruc, usuario, password })
    setAuth(res.data.user, res.data.access, res.data.refresh)
    return true
  }

  // Hook que maneja el env\u00edo con estado de carga y error
  const { submit: doLogin, isSubmitting, error } = useSubmit(handleLogin)

  // Valida los campos del formulario antes de enviar
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

  // Maneja el env\u00edo del formulario: valida, autentica y redirige
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    const result = await doLogin()
    if (result) navigate('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      {/* Formulario de inicio de sesi\u00f3n */}
      <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-xl shadow-lg w-full max-w-sm sm:max-w-md">
        {/* Logo de la aplicaci\u00f3n */}
        <div className="flex justify-center mb-4 sm:mb-6">
          <img src="/logo.png" alt="SIPRO" className="h-24 sm:h-32" />
        </div>
        {/* Mensaje de error del servidor */}
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-lg mb-4 text-sm">{error}</div>
        )}
        {/* Campo RUC de la empresa */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">RUC de la Empresa</label>
          <input
            type="text"
            value={ruc}
            onChange={(e) => { setRuc(e.target.value); setFieldErrors((p) => ({ ...p, ruc: '' })) }}
            className={w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 }
            required
          />
          {fieldErrors.ruc && <p className="text-red-500 text-xs mt-1">{fieldErrors.ruc}</p>}
        </div>
        {/* Campo de usuario */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
          <input
            type="text"
            value={usuario}
            onChange={(e) => { setUsuario(e.target.value); setFieldErrors((p) => ({ ...p, usuario: '' })) }}
            className={w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 }
            required
          />
          {fieldErrors.usuario && <p className="text-red-500 text-xs mt-1">{fieldErrors.usuario}</p>}
        </div>
        {/* Campo de contrase\u00f1a */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
          <input
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setFieldErrors((p) => ({ ...p, password: '' })) }}
            className={w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 }
            required
          />
          {fieldErrors.password && <p className="text-red-500 text-xs mt-1">{fieldErrors.password}</p>}
        </div>
        {/* Bot\u00f3n de env\u00edo con indicador de carga */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2 font-medium"
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
    </div>
  )
}
