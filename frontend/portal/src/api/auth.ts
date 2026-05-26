import api from './axios'

export interface LoginResponse {
  user: {
    idusuario: string
    tipo_usuario: string
    nombres: string
    apellidos: string
    correo: string
    usuario: string
  }
  access: string
  refresh: string
}

export const authService = {
  login: (usuario: string, password: string) =>
    api.post('/portal/auth/iniciar-sesion/', { usuario, password }),
  logout: (refresh: string) =>
    api.post('/portal/auth/cerrar-sesion/', { refresh }),
}
