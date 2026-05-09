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

export interface Zona {
  idzona: string
  idalmacen: string
  nombre: string
  codigo: string
  tipo: 'recepcion' | 'almacenamiento' | 'despacho' | 'picking' | 'devoluciones'
  x: number
  y: number
  ancho: number
  alto: number
  color: string | null
  estado: boolean
  pasillos?: PasilloSummary[]
  pasillos_count?: number
}

export interface PasilloSummary {
  idpasillo: string
  idzona: string
  nombre: string
  codigo: string
  x: number
  y: number
  ancho: number
  largo: number
  orientacion: string
  estado: boolean
  estantes_count?: number
}

export interface Pasillo {
  idpasillo: string
  idzona: string
  nombre: string
  codigo: string
  x: number
  y: number
  ancho: number
  largo: number
  orientacion: 'horizontal' | 'vertical'
  estado: boolean
  estantes?: EstanteSummary[]
  estantes_count?: number
}

export interface EstanteSummary {
  idestante: string
  idpasillo: string
  nombre: string
  codigo: string
  x: number
  y: number
  ancho: number
  alto: number
  lado: string
  cantidadniveles: number
  estado: boolean
  niveles_count?: number
}

export interface Estante {
  idestante: string
  idpasillo: string
  nombre: string
  codigo: string
  x: number
  y: number
  ancho: number
  alto: number
  profundidad: number
  lado: 'izquierda' | 'derecha'
  cantidadniveles: number
  estado: boolean
  niveles?: Nivel[]
  niveles_count?: number
}

export interface Nivel {
  idnivel: string
  idestante: string
  nombre: string
  numero: number
  altura: number
  estado: boolean
}

export interface Ubicacion {
  idubicacion: string
  idnivel: string
  codigo: string
  capacidadpeso: number | null
  capacidadvolumen: number | null
  estado_ubicacion: 'disponible' | 'ocupada' | 'reservada' | 'bloqueada'
  x: number
  y: number
  estado: boolean
}

export interface Nodo {
  idnodo: string
  idalmacen: string
  nombre: string
  tipo: 'entrada' | 'salida' | 'esquina' | 'interseccion' | 'punto_recogida'
  coordenada_x: number
  coordenada_y: number
  idubicacion: string | null
  estado: boolean
  conexiones_count?: number
}

export interface Conexion {
  idconexion: string
  idnodoorigen: string
  idnododestino: string
  distancia: number
  tipo: 'pasillo' | 'cruce' | 'acceso'
  bidireccional: boolean
  estado: boolean
  origen_nombre?: string
  destino_nombre?: string
}

export interface RutaResult {
  ruta: Array<{
    idnodo: string
    nombre: string
    tipo: string
    coordenada_x: number
    coordenada_y: number
    distancia_acumulada: number
  }>
  distancia_total: number
  nodos_visitados: number
}
