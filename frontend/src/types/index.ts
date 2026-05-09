export interface Usuario {
  idusuario: string
  idempresa: string | null
  nombres: string
  apellidos: string
  correo: string
  usuario: string
  telefono: string | null
  foto: string | null
  ultimologin: string | null
  fechacreacion: string
  estado: boolean
  is_staff: boolean
  is_active: boolean
  roles?: Rol[]
}

export interface Rol {
  idrol: string
  nombre: string
  descripcion: string | null
  estado: boolean
  permisos?: Permiso[]
}

export interface Permiso {
  idpermiso: string
  codigo: string
  nombre: string
  descripcion: string | null
  estado: boolean
}

export interface Empresa {
  idempresa: string
  razonsocial: string
  nombrecomercial: string
  ruc: string
  correo: string
  telefono: string | null
  direccion: string | null
  fechacreacion: string
  estado: boolean
}

export interface Sucursal {
  idsucursal: string
  idempresa: string
  nombre: string
  codigo: string
  direccion: string | null
  telefono: string | null
  fechacreacion: string
  estado: boolean
  empresa?: Empresa
}

export interface Almacen {
  idalmacen: string
  idsucursal: string
  nombre: string
  codigo: string
  descripcion: string | null
  ancho: number | null
  alto: number | null
  capacidadmaxima: number | null
  fechacreacion: string
  estado: boolean
  sucursal?: Sucursal
}

export interface SesionUsuario {
  idsesionusuario: string
  idusuario: string
  tokenjwt: string
  refreshtoken: string | null
  ip: string | null
  dispositivo: string | null
  navegador: string | null
  fechainicio: string
  fechafin: string | null
  activa: boolean
}

export interface LoginResponse {
  user: Usuario
  access: string
  refresh: string
}

export interface ApiListResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}
