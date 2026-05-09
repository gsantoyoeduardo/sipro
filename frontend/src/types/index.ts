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

export interface Categoria {
  idcategoria: string
  nombre: string
  descripcion: string | null
  idcategoriapadre: string | null
  estado: boolean
  subcategorias?: Categoria[]
}

export interface Producto {
  idproducto: string
  idcategoria: string
  categoria_nombre?: string
  codigo: string
  nombre: string
  descripcion: string | null
  unidad_medida: string
  peso: number | null
  volumen: number | null
  precio_costo: number | null
  precio_venta: number | null
  stock_minimo: number
  stock_maximo: number
  maneja_lotes: boolean
  fechacreacion: string
  estado: boolean
  stock_total?: number
}

export interface Lote {
  idlote: string
  idproducto: string
  producto_codigo?: string
  numero_lote: string
  fecha_produccion: string | null
  fecha_vencimiento: string | null
  fecha_recepcion: string
  cantidad_inicial: number
  cantidad_actual: number
  estado: boolean
}

export interface InventarioItem {
  idinventario: string
  idproducto: string
  idlote: string | null
  idubicacion: string
  producto_codigo?: string
  producto_nombre?: string
  lote_numero?: string | null
  ubicacion_codigo?: string
  cantidad: number
  fecha_ultimo_conteo: string
  estado: boolean
}

export interface KardexItem {
  idkardex: string
  idproducto: string
  idlote: string | null
  idubicacion: string | null
  producto_codigo?: string
  lote_numero?: string | null
  ubicacion_codigo?: string | null
  usuario_nombre?: string | null
  tipo_movimiento: 'entrada' | 'salida' | 'ajuste' | 'transferencia'
  cantidad: number
  saldo_anterior: number
  saldo_nuevo: number
  fecha_movimiento: string
  referencia: string | null
  estado: boolean
}

export interface PickingResult {
  producto: {
    idproducto: string
    codigo: string
    nombre: string
    unidad_medida: string
    maneja_lotes: boolean
  }
  estrategia: string
  cantidad_requerida: number
  picking: Array<{
    lote: string | null
    lote_numero: string | null
    vencimiento: string | null
    ubicacion: string
    ubicacion_codigo: string
    cantidad_pickear: number
  }>
  total_pickeable: number
  faltante: number
  completo: boolean
}
