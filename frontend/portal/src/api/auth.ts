import api from './axios'

/**
 * Respuesta esperada del endpoint de autenticación.
 * Contiene los datos del usuario autenticado y los
 * tokens JWT de acceso y refresco.
 */
export interface LoginResponse {
  user: {
    idusuario: string
    tipo_usuario: string
    nombres: string
    apellidos: string
    correo: string
    usuario: string
  }
  access: string   // Token JWT de acceso
  refresh: string  // Token JWT de refresco
}

/** Servicio de autenticación contra la API del portal */
export const authService = {
  /**
   * Inicia sesión con credenciales de usuario.
   * Endpoint: POST /portal/auth/
   * @param usuario - Nombre de usuario
   * @param password - Contraseña del usuario
   * @returns Promesa con los datos del usuario y tokens
   */
  login: (usuario: string, password: string) =>
    api.post<LoginResponse>('/portal/auth/', { usuario, password }),
}
