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
    descripcion: 'Recepción + Almacenamiento + Despacho. 4 estantes, 24 ubicaciones.',
    dimensiones: { ancho: 600, alto: 400 },
    zonas: [
      { tipo: 'recepcion', nombre: 'Recepción', x: 0, y: 0, ancho: 150, alto: 120, color: '#FF9800' },
      { tipo: 'almacenamiento', nombre: 'Almacenamiento', x: 0, y: 130, ancho: 600, alto: 200, color: '#2196F3' },
      { tipo: 'despacho', nombre: 'Despacho', x: 450, y: 0, ancho: 150, alto: 120, color: '#4CAF50' },
    ],
    estantes: { filas: 2, columnas: 2, niveles: 3, ancho: 240, alto: 120, profundidad: 60, espaciadoX: 280, espaciadoY: 100 },
    pasillos: { principal: 300, secundario: 200 },
    nodos: [
      { tipo: 'entrada', x: 50, y: 50 },
      { tipo: 'esquina', x: 50, y: 350 },
      { tipo: 'esquina', x: 550, y: 350 },
      { tipo: 'salida', x: 550, y: 50 },
    ],
  },
  {
    id: 'medium',
    nombre: 'Almacén Mediano',
    descripcion: 'Recepción + 2 zonas almacenamiento + Despacho. 8 estantes, 64 ubicaciones.',
    dimensiones: { ancho: 1000, alto: 600 },
    zonas: [
      { tipo: 'recepcion', nombre: 'Recepción', x: 0, y: 0, ancho: 220, alto: 160, color: '#FF9800' },
      { tipo: 'almacenamiento', nombre: 'Almacenamiento Norte', x: 0, y: 170, ancho: 500, alto: 360, color: '#2196F3' },
      { tipo: 'almacenamiento', nombre: 'Almacenamiento Sur', x: 520, y: 170, ancho: 480, alto: 360, color: '#1976D2' },
      { tipo: 'despacho', nombre: 'Despacho', x: 780, y: 0, ancho: 220, alto: 160, color: '#4CAF50' },
    ],
    estantes: { filas: 4, columnas: 2, niveles: 4, ancho: 240, alto: 150, profundidad: 60, espaciadoX: 260, espaciadoY: 90 },
    pasillos: { principal: 300, secundario: 200 },
    nodos: [
      { tipo: 'entrada', x: 50, y: 50 },
      { tipo: 'interseccion', x: 260, y: 300 },
      { tipo: 'punto_recogida', x: 500, y: 300 },
      { tipo: 'interseccion', x: 740, y: 300 },
      { tipo: 'salida', x: 950, y: 50 },
      { tipo: 'esquina', x: 50, y: 550 },
      { tipo: 'esquina', x: 950, y: 550 },
    ],
  },
  {
    id: 'large',
    nombre: 'Almacén Grande',
    descripcion: 'Recepción + Picking + 3 zonas almacenamiento + Despacho. 20 estantes, 200 ubicaciones.',
    dimensiones: { ancho: 1400, alto: 800 },
    zonas: [
      { tipo: 'recepcion', nombre: 'Recepción', x: 0, y: 0, ancho: 300, alto: 200, color: '#FF9800' },
      { tipo: 'picking', nombre: 'Picking', x: 320, y: 0, ancho: 760, alto: 200, color: '#9C27B0' },
      { tipo: 'despacho', nombre: 'Despacho', x: 1100, y: 0, ancho: 300, alto: 200, color: '#4CAF50' },
      { tipo: 'almacenamiento', nombre: 'Almacenamiento Norte', x: 0, y: 220, ancho: 440, alto: 520, color: '#2196F3' },
      { tipo: 'almacenamiento', nombre: 'Almacenamiento Centro', x: 460, y: 220, ancho: 480, alto: 520, color: '#1976D2' },
      { tipo: 'almacenamiento', nombre: 'Almacenamiento Sur', x: 960, y: 220, ancho: 440, alto: 520, color: '#1565C0' },
    ],
    estantes: { filas: 5, columnas: 4, niveles: 5, ancho: 240, alto: 180, profundidad: 60, espaciadoX: 100, espaciadoY: 100 },
    pasillos: { principal: 350, secundario: 250 },
    nodos: [
      { tipo: 'entrada', x: 50, y: 50 },
      { tipo: 'interseccion', x: 300, y: 450 },
      { tipo: 'interseccion', x: 700, y: 450 },
      { tipo: 'interseccion', x: 1100, y: 450 },
      { tipo: 'salida', x: 1350, y: 50 },
      { tipo: 'esquina', x: 50, y: 750 },
      { tipo: 'esquina', x: 1350, y: 750 },
      { tipo: 'punto_recogida', x: 300, y: 200 },
      { tipo: 'punto_recogida', x: 700, y: 200 },
      { tipo: 'punto_recogida', x: 1100, y: 200 },
    ],
  },
]

export function getTemplate(id: string): LayoutTemplate | undefined {
  return LAYOUT_TEMPLATES.find((t) => t.id === id)
}
