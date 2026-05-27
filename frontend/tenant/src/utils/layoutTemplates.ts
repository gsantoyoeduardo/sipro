export interface LayoutTemplate {
  id: string
  nombre: string
  descripcion: string
  dimensiones: { ancho: number; alto: number }
  zonas: Array<{
    tipo: string
    nombre: string
    x: number
    y: number
    ancho: number
    alto: number
    color: string
  }>
  estantes: {
    filas: number
    columnas: number
    niveles: number
    ancho: number
    alto: number
    profundidad: number
    espaciadoX: number
    espaciadoY: number
  }
  pasillos: {
    principal: number
    secundario: number
  }
  nodos: Array<{ tipo: string; x: number; y: number }>
}

export const LAYOUT_TEMPLATES: LayoutTemplate[] = [
  {
    id: 'small',
    nombre: 'Almacén Pequeño',
    descripcion: 'Ideal para negocios pequeños. 1 zona de almacenamiento, 4 estantes, 12 ubicaciones.',
    dimensiones: { ancho: 600, alto: 400 },
    zonas: [
      { tipo: 'recepcion', nombre: 'Recepción', x: 0, y: 0, ancho: 150, alto: 100, color: '#4CAF50' },
      { tipo: 'almacenamiento', nombre: 'Almacenamiento', x: 0, y: 120, ancho: 600, alto: 200, color: '#2196F3' },
      { tipo: 'despacho', nombre: 'Despacho', x: 450, y: 0, ancho: 150, alto: 100, color: '#FF9800' },
    ],
    estantes: { filas: 2, columnas: 2, niveles: 3, ancho: 240, alto: 120, profundidad: 60, espaciadoX: 280, espaciadoY: 100 },
    pasillos: { principal: 300, secundario: 200 },
    nodos: [
      { tipo: 'entrada', x: 50, y: 50 },
      { tipo: 'salida', x: 550, y: 50 },
      { tipo: 'esquina', x: 50, y: 350 },
      { tipo: 'esquina', x: 550, y: 350 },
    ],
  },
  {
    id: 'medium',
    nombre: 'Almacén Mediano',
    descripcion: 'Para operaciones medianas. 3 zonas, 8 estantes, 32 ubicaciones.',
    dimensiones: { ancho: 1000, alto: 600 },
    zonas: [
      { tipo: 'recepcion', nombre: 'Recepción', x: 0, y: 0, ancho: 200, alto: 150, color: '#4CAF50' },
      { tipo: 'almacenamiento', nombre: 'Almacenamiento A', x: 0, y: 170, ancho: 500, alto: 350, color: '#2196F3' },
      { tipo: 'almacenamiento', nombre: 'Almacenamiento B', x: 520, y: 170, ancho: 480, alto: 350, color: '#1976D2' },
      { tipo: 'despacho', nombre: 'Despacho', x: 800, y: 0, ancho: 200, alto: 150, color: '#FF9800' },
      { tipo: 'picking', nombre: 'Picking', x: 220, y: 0, ancho: 560, alto: 150, color: '#9C27B0' },
    ],
    estantes: { filas: 4, columnas: 2, niveles: 4, ancho: 240, alto: 150, profundidad: 60, espaciadoX: 260, espaciadoY: 90 },
    pasillos: { principal: 300, secundario: 200 },
    nodos: [
      { tipo: 'entrada', x: 50, y: 50 },
      { tipo: 'salida', x: 950, y: 50 },
      { tipo: 'esquina', x: 50, y: 550 },
      { tipo: 'esquina', x: 950, y: 550 },
      { tipo: 'interseccion', x: 500, y: 300 },
      { tipo: 'punto_recogida', x: 250, y: 300 },
      { tipo: 'punto_recogida', x: 750, y: 300 },
    ],
  },
  {
    id: 'large',
    nombre: 'Almacén Grande',
    descripcion: 'Operación industrial. 5 zonas, 20+ estantes, 100+ ubicaciones.',
    dimensiones: { ancho: 1400, alto: 800 },
    zonas: [
      { tipo: 'recepcion', nombre: 'Recepción', x: 0, y: 0, ancho: 300, alto: 200, color: '#4CAF50' },
      { tipo: 'almacenamiento', nombre: 'Almacén A', x: 0, y: 220, ancho: 400, alto: 500, color: '#2196F3' },
      { tipo: 'almacenamiento', nombre: 'Almacén B', x: 420, y: 220, ancho: 400, alto: 500, color: '#1976D2' },
      { tipo: 'almacenamiento', nombre: 'Almacén C', x: 840, y: 220, ancho: 400, alto: 500, color: '#1565C0' },
      { tipo: 'despacho', nombre: 'Despacho', x: 1100, y: 0, ancho: 300, alto: 200, color: '#FF9800' },
      { tipo: 'picking', nombre: 'Picking', x: 320, y: 0, ancho: 760, alto: 200, color: '#9C27B0' },
      { tipo: 'devoluciones', nombre: 'Devoluciones', x: 0, y: 740, ancho: 300, alto: 60, color: '#F44336' },
    ],
    estantes: { filas: 5, columnas: 4, niveles: 5, ancho: 240, alto: 180, profundidad: 60, espaciadoX: 100, espaciadoY: 100 },
    pasillos: { principal: 350, secundario: 250 },
    nodos: [
      { tipo: 'entrada', x: 50, y: 50 },
      { tipo: 'salida', x: 1350, y: 50 },
      { tipo: 'esquina', x: 50, y: 750 },
      { tipo: 'esquina', x: 1350, y: 750 },
      { tipo: 'interseccion', x: 200, y: 400 },
      { tipo: 'interseccion', x: 600, y: 400 },
      { tipo: 'interseccion', x: 1000, y: 400 },
      { tipo: 'interseccion', x: 1200, y: 400 },
      { tipo: 'punto_recogida', x: 200, y: 200 },
      { tipo: 'punto_recogida', x: 600, y: 200 },
      { tipo: 'punto_recogida', x: 1000, y: 200 },
    ],
  },
]

export function getTemplate(id: string): LayoutTemplate | undefined {
  return LAYOUT_TEMPLATES.find((t) => t.id === id)
}
