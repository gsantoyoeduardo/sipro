import type { Zona, Almacen, Nodo, Conexion, Sucursal } from '../../types'

const TIPO_COLORS: Record<string, string> = {
  recepcion: '#4CAF50',
  almacenamiento: '#2196F3',
  despacho: '#FF9800',
  picking: '#9C27B0',
  devoluciones: '#F44336',
}

interface MiniMapaProps {
  sucursal: Sucursal | null
  zonas: Zona[]
  almacenes: Almacen[]
  nodos: Nodo[]
  conexiones: Conexion[]
  camera: { x: number; y: number; scale: number }
  canvasSize: { width: number; height: number }
  onNavigate: (x: number, y: number) => void
}

export default function MiniMapa({ sucursal, zonas, almacenes, nodos, conexiones, camera, canvasSize, onNavigate }: MiniMapaProps) {
  if (!sucursal) return null

  const mmW = 200
  const mmH = 150
  const planoW = Number(sucursal.ancho_plano) || 2500
  const planoH = Number(sucursal.alto_plano) || 1800
  const mmScale = Math.min(mmW / planoW, mmH / planoH)
  const offsetX = (mmW - planoW * mmScale) / 2
  const offsetY = (mmH - planoH * mmScale) / 2

  const toMini = (x: number, y: number) => ({
    x: x * mmScale + offsetX,
    y: y * mmScale + offsetY,
  })

  // Región visible
  const visX = (-camera.x / camera.scale) * mmScale + offsetX
  const visY = (-camera.y / camera.scale) * mmScale + offsetY
  const visW = (canvasSize.width / camera.scale) * mmScale
  const visH = (canvasSize.height / camera.scale) * mmScale

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    const worldX = (mx - offsetX) / mmScale
    const worldY = (my - offsetY) / mmScale
    onNavigate(worldX, worldY)
  }

  return (
    <div className="absolute bottom-14 right-2 bg-white rounded-lg border shadow-sm overflow-hidden">
      <svg width={mmW} height={mmH} onClick={handleClick} className="cursor-crosshair">
        {/* Fondo del plano */}
        <rect x={offsetX} y={offsetY} width={planoW * mmScale} height={planoH * mmScale} fill="#f8f9fa" stroke="#ddd" strokeWidth={1} />

        {/* Zonas */}
        {zonas.filter(z => !z.es_mascara).map((z) => {
          const p = toMini(z.x, z.y)
          return <rect key={z.idzona} x={p.x} y={p.y} width={(z.ancho || 100) * mmScale} height={(z.alto || 80) * mmScale} fill={z.color || TIPO_COLORS[z.tipo] || '#e0e0e0'} opacity={0.6} />
        })}

        {/* Almacenes (zonas máscara) */}
        {zonas.filter(z => z.es_mascara).map((z) => {
          const p = toMini(z.x, z.y)
          return <rect key={z.idzona} x={p.x} y={p.y} width={(z.ancho || 100) * mmScale} height={(z.alto || 80) * mmScale} fill="#1E3A5F" opacity={0.4} stroke="#1E3A5F" strokeWidth={1.5} />
        })}

        {/* Conexiones */}
        {conexiones.map((c) => {
          const origen = nodos.find(n => n.idnodo === c.idnodoorigen)
          const destino = nodos.find(n => n.idnodo === c.idnododestino)
          if (!origen || !destino) return null
          const a = toMini(origen.coordenada_x, origen.coordenada_y)
          const b = toMini(destino.coordenada_x, destino.coordenada_y)
          return <line key={c.idconexion} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="#78909C" strokeWidth={0.8} opacity={0.5} />
        })}

        {/* Nodos */}
        {nodos.map((n) => {
          const p = toMini(n.coordenada_x, n.coordenada_y)
          return <circle key={n.idnodo} cx={p.x} cy={p.y} r={2} fill="#666" />
        })}

        {/* Región visible */}
        <rect x={visX} y={visY} width={visW} height={visH} fill="none" stroke="#EF4444" strokeWidth={1.5} opacity={0.8} rx={1} />
      </svg>
    </div>
  )
}
