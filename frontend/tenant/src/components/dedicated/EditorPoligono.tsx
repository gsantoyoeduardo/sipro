import { useState, useRef } from 'react'
import type { FormaZona } from '../../types'

interface EditorPoligonoProps {
  isOpen: boolean
  onClose: () => void
  onSave: (forma: FormaZona) => void
  anchoZona: number
  altoZona: number
}

export default function EditorPoligono({ isOpen, onClose, onSave, anchoZona, altoZona }: EditorPoligonoProps) {
  const [puntos, setPuntos] = useState<[number, number][]>([])
  const [modo, setModo] = useState<'poligono' | 'circulo'>('poligono')
  const [circulo, setCirculo] = useState<{ centro: [number, number]; radio: number } | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)

  if (!isOpen) return null

  const svgW = 500
  const svgH = 400
  const pad = 40
  const drawW = svgW - pad * 2
  const drawH = svgH - pad * 2
  const scaleX = drawW / anchoZona
  const scaleY = drawH / altoZona
  const scale = Math.min(scaleX, scaleY)
  const offX = pad + (drawW - anchoZona * scale) / 2
  const offY = pad + (drawH - altoZona * scale) / 2

  const toSvg = (x: number, y: number) => ({
    x: x * scale + offX,
    y: y * scale + offY,
  })

  const fromSvg = (sx: number, sy: number): [number, number] => [
    Math.round((sx - offX) / scale),
    Math.round((sy - offY) / scale),
  ]

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (modo !== 'poligono') return
    const rect = e.currentTarget.getBoundingClientRect()
    const sx = e.clientX - rect.left
    const sy = e.clientY - rect.top
    const pt = fromSvg(sx, sy)
    setPuntos(prev => [...prev, pt])
  }

  const handleSvgDoubleClick = () => {
    if (modo === 'poligono' && puntos.length >= 3) {
      onSave({ tipo: 'poligono', puntos })
    }
  }

  const handleCircleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (modo !== 'circulo') return
    const rect = e.currentTarget.getBoundingClientRect()
    const sx = e.clientX - rect.left
    const sy = e.clientY - rect.top
    const pt = fromSvg(sx, sy)
    if (!circulo) {
      setCirculo({ centro: pt, radio: 0 })
    } else {
      const dx = pt[0] - circulo.centro[0]
      const dy = pt[1] - circulo.centro[1]
      const radio = Math.round(Math.sqrt(dx * dx + dy * dy))
      onSave({ tipo: 'circulo', centro: circulo.centro, radio })
    }
  }

  const poligonoPoints = puntos.map(p => {
    const s = toSvg(p[0], p[1])
    return `${s.x},${s.y}`
  }).join(' ')

  const rectSvg = toSvg(anchoZona, altoZona)

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-texto">Dibujar Forma</h3>
          <button onClick={onClose} className="text-texto-secundario hover:text-texto text-xl">&times;</button>
        </div>

        {/* Selector de modo */}
        <div className="flex gap-2 mb-4">
          <button onClick={() => { setModo('poligono'); setCirculo(null); setPuntos([]) }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${modo === 'poligono' ? 'bg-accion text-white' : 'bg-fondo text-texto-secundario'}`}>
            Polígono
          </button>
          <button onClick={() => { setModo('circulo'); setCirculo(null); setPuntos([]) }}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${modo === 'circulo' ? 'bg-accion text-white' : 'bg-fondo text-texto-secundario'}`}>
            Círculo
          </button>
        </div>

        {/* Canvas de dibujo */}
        <div className="border border-borde rounded-xl overflow-hidden bg-fondo-sutil">
          <svg ref={svgRef} width={svgW} height={svgH}
            onClick={modo === 'poligono' ? handleSvgClick : handleCircleClick}
            onDoubleClick={modo === 'poligono' ? handleSvgDoubleClick : undefined}
            className="cursor-crosshair">
            {/* Rectángulo de la zona */}
            <rect x={offX} y={offY} width={anchoZona * scale} height={altoZona * scale} fill="white" stroke="#ccc" strokeWidth={1} strokeDasharray="4,4" />

            {/* Polígono en progreso */}
            {modo === 'poligono' && poligonoPoints && (
              <polygon points={poligonoPoints} fill="rgba(33,150,243,0.2)" stroke="#2196F3" strokeWidth={2} />
            )}

            {/* Círculo en progreso */}
            {modo === 'circulo' && circulo && circulo.radio > 0 && (() => {
              const c = toSvg(circulo.centro[0], circulo.centro[1])
              return <circle cx={c.x} cy={c.y} r={circulo.radio * scale} fill="rgba(33,150,243,0.2)" stroke="#2196F3" strokeWidth={2} />
            })()}
            {modo === 'circulo' && circulo && circulo.radio === 0 && (() => {
              const c = toSvg(circulo.centro[0], circulo.centro[1])
              return <circle cx={c.x} cy={c.y} r={3} fill="#2196F3" />
            })()}

            {/* Puntos del polígono */}
            {modo === 'poligono' && puntos.map((p, i) => {
              const s = toSvg(p[0], p[1])
              return <circle key={i} cx={s.x} cy={s.y} r={4} fill="#2196F3" stroke="white" strokeWidth={1.5} />
            })}
          </svg>
        </div>

        {/* Instrucciones */}
        <p className="text-xs text-texto-secundario mt-3">
          {modo === 'poligono'
            ? `Click para agregar vértices (${puntos.length} agregados). Doble-click para cerrar (mínimo 3).`
            : circulo
              ? circulo.radio === 0
                ? 'Click para definir el centro del círculo.'
                : 'Click para definir el radio del círculo.'
              : 'Click para definir el centro del círculo.'}
        </p>

        {/* Botones */}
        <div className="flex justify-end gap-3 mt-4">
          {modo === 'poligono' && puntos.length > 0 && (
            <button onClick={() => setPuntos(prev => prev.slice(0, -1))} className="px-3 py-2 border border-borde rounded-lg text-sm hover:bg-fondo">
              Deshacer
            </button>
          )}
          {modo === 'poligono' && puntos.length >= 3 && (
            <button onClick={() => onSave({ tipo: 'poligono', puntos })} className="px-3 py-2 bg-accion text-white rounded-lg text-sm hover:bg-accion-hover">
              Cerrar forma
            </button>
          )}
          <button onClick={onClose} className="px-3 py-2 border border-borde rounded-lg text-sm hover:bg-fondo">Cancelar</button>
        </div>
      </div>
    </div>
  )
}
