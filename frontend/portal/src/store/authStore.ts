import { create } from 'zustand'

/** Datos del usuario autenticado */
interface User {
  idusuario: string
  tipo_usuario: string
  nombres: string
  apellidos: string
  correo: string
  usuario: string
}

/**
 * Estado global de autenticación.
 * - user: datos del usuario actual (null si no ha iniciado sesión)
 * - isAuthenticated: indica si hay un token de acceso válido
 * - setAuth: almacena usuario y tokens en localStorage y en el store
 * - logout: elimina los datos de autenticación y limpia el store
 */
interface AuthState {
  user: User | null
  isAuthenticated: boolean
  setAuth: (user: User, accessToken: string, refreshToken: string) => void
  logout: () => void
}

/**
 * Store de Zustand para la autenticación.
 * Persiste el estado en localStorage para mantener
 * la sesión entre recargas de página.
 */
export const useAuthStore = create<AuthState>((set) => ({
  // Inicializa desde localStorage (sesión persistente)
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  isAuthenticated: !!localStorage.getItem('access_token'),

  /**
   * Almacena los datos de autenticación.
   * Guarda los tokens y el usuario en localStorage
   * y actualiza el store de Zustand.
   */
  setAuth: (user, accessToken, refreshToken) => {
    localStorage.setItem('access_token', accessToken)
    localStorage.setItem('refresh_token', refreshToken)
    localStorage.setItem('user', JSON.stringify(user))
    set({ user, isAuthenticated: true })
  },

  /**
   * Cierra la sesión del usuario.
   * Elimina los datos almacenados en localStorage
   * y restablece el store al estado inicial.
   */
  logout: () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user')
    set({ user: null, isAuthenticated: false })
  },
}))
