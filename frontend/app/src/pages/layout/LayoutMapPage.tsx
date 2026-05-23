import React, { useState, useEffect, useRef } from 'react'
import { Stage, Layer, Rect, Text, Circle, Line, Group } from 'react-konva'
import { almacenService } from '../../api/empresa'
import { zonaService, nodoService, conexionService } from '../../api/layout'
import type { Almacen, Zona, Nodo, Conexion } from '../../types'

const TIPO_COLORS: Record<string, string> = {
  recepcion: '#4CAF50',
  almacenamiento: '#2196F3',
  despacho: '#FF9800',
  picking: '#9C27B0',
  devoluciones: '#F44336',
}

const NODO_COLORS: Record<string, string> = {
  entrada: '#4CAF50',
  salida: '#F44336',
  esquina: '#607D8B',
  interseccion: '#FF9800',
  punto_recogida: '#2196F3',
}

export default function LayoutMapPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 800, height: 600 })
  const [almacenes, setAlmacenes] = useState<Almacen[]>([])
  const [selectedAlmacen, setSelectedAlmacen] = useState('')
  const [zonas, setZonas] = useState<Zona[]>([])
  const [nodos, setNodos] = useState<Nodo[]>([])
  const [conexiones, setConexiones] = useState<Conexion[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedNodo, setSelectedNodo] = useState<Nodo | null>(null)
  const [showNodos, setShowNodos] = useState(true)
  const [showConexiones, setShowConexiones] = useState(true)

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setSize({
          width: containerRef.current.offsetWidth,
          height: Math.max(600, window.innerHeight - 200),
        })
      }
    }
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  useEffect(() => {
    almacenService.list().then(({ data }) => setAlmacenes(data.results)).catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedAlmacen) return
    setLoading(true)
    Promise.all([
      zonaService.list(selectedAlmacen),
      nodoService.list(selectedAlmacen),
      conexionService.list(),
    ])
      .then(([zonasRes, nodosRes, conexRes]) => {
        setZonas(zonasRes.data.results)
        setNodos(nodosRes.data.results)
        setConexiones(conexRes.data.results)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [selectedAlmacen])

  const nodosFiltrados = nodos.filter((n) => n.idalmacen === selectedAlmacen)
  const conexIds = new Set<string>()
  conexiones.forEach((c) => {
    conexIds.add(c.idnodoorigen)
    conexIds.add(c.idnododestino)
  })
  const conexFiltradas = conexiones.filter(
    (c) => conexIds.has(c.idnodoorigen) && conexIds.has(c.idnododestino)
  )

  const escala = 2.5

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Layout del Almacén</h1>
        <div className="flex items-center gap-4">
          <select
            value={selectedAlmacen}
            onChange={(e) => setSelectedAlmacen(e.target.value)}
            className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Seleccionar almacén</option>
            {almacenes.map((a) => (
              <option key={a.idalmacen} value={a.idalmacen}>{a.nombre}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={showNodos} onChange={(e) => setShowNodos(e.target.checked)} />
            Nodos
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={showConexiones} onChange={(e) => setShowConexiones(e.target.checked)} />
            Conexiones
          </label>
        </div>
      </div>

      {!selectedAlmacen ? (
        <div className="text-center py-16 text-gray-400">
          Seleccione un almacén para visualizar su layout
        </div>
      ) : loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full" />
        </div>
      ) : (
        <div ref={containerRef} className="bg-gray-50 rounded-lg border overflow-hidden">
          <Stage width={size.width} height={size.height}>
            <Layer>
              {(() => {
                const step = 50 * escala
                const w = size.width
                const h = size.height
                const lines: React.ReactNode[] = []
                for (let x = 0; x < w; x += step) {
                  lines.push(
                    <Line key={'gv' + x} points={[x, 0, x, h]} stroke="#e0e0e0" strokeWidth={0.5} listening={false} />
                  )
                  lines.push(
                    <Text key={'gl' + x} x={x + 2} y={2} text={String(Math.round(x / escala))} fontSize={8} fill="#aaa" listening={false} />
                  )
                }
                for (let y = 0; y < h; y += step) {
                  lines.push(
                    <Line key={'gh' + y} points={[0, y, w, y]} stroke="#e0e0e0" strokeWidth={0.5} listening={false} />
                  )
                  lines.push(
                    <Text key={'gt' + y} x={2} y={y + 2} text={String(Math.round(y / escala))} fontSize={8} fill="#aaa" listening={false} />
                  )
                }
                return lines
              })()}
              <Text x={size.width - 120} y={size.height - 16} text="1 cuadro = 50 unidades" fontSize={10} fill="#999" listening={false} />

              {zonas.map((zona) => (
                <Group key={zona.idzona}>
                  <Rect
                    x={zona.x * escala}
                    y={zona.y * escala}
                    width={zona.ancho * escala}
                    height={zona.alto * escala}
                    fill={zona.color || TIPO_COLORS[zona.tipo] || '#e0e0e0'}
                    opacity={0.35}
                    stroke={zona.color || TIPO_COLORS[zona.tipo] || '#666'}
                    strokeWidth={1}
                  />
                  <Text
                    x={zona.x * escala + 4}
                    y={zona.y * escala + 4}
                    text={zona.nombre}
                    fontSize={10}
                    fill="#333"
                    fontStyle="bold"
                  />
                </Group>
              ))}

              {showConexiones &&
                conexFiltradas.map((conex) => {
                  const origen = nodos.find((n) => n.idnodo === conex.idnodoorigen)
                  const destino = nodos.find((n) => n.idnodo === conex.idnododestino)
                  if (!origen || !destino) return null
                  return (
                    <Line
                      key={conex.idconexion}
                      points={[
                        origen.coordenada_x * escala,
                        origen.coordenada_y * escala,
                        destino.coordenada_x * escala,
                        destino.coordenada_y * escala,
                      ]}
                      stroke={conex.tipo === 'cruce' ? '#FF9800' : '#78909C'}
                      strokeWidth={conex.tipo === 'pasillo' ? 2 : 1}
                      dash={conex.tipo === 'cruce' ? [4, 4] : []}
                      opacity={0.7}
                      listening={false}
                    />
                  )
                })}

              {showNodos &&
                nodosFiltrados.map((nodo) => (
                  <Circle
                    key={nodo.idnodo}
                    x={nodo.coordenada_x * escala}
                    y={nodo.coordenada_y * escala}
                    radius={5}
                    fill={NODO_COLORS[nodo.tipo] || '#666'}
                    stroke="#fff"
                    strokeWidth={1.5}
                    opacity={selectedNodo?.idnodo === nodo.idnodo ? 1 : 0.85}
                    onClick={() => setSelectedNodo(nodo)}
                    onTap={() => setSelectedNodo(nodo)}
                  />
                ))}

              {selectedNodo && (
                <>
                  <Circle
                    x={selectedNodo.coordenada_x * escala}
                    y={selectedNodo.coordenada_y * escala}
                    radius={8}
                    stroke="#000"
                    strokeWidth={2}
                    dash={[3, 3]}
                    listening={false}
                  />
                  <Text
                    x={selectedNodo.coordenada_x * escala + 10}
                    y={selectedNodo.coordenada_y * escala - 8}
                    text={selectedNodo.nombre}
                    fontSize={10}
                    fill="#000"
                    fontStyle="bold"
                  />
                </>
              )}
            </Layer>
          </Stage>
        </div>
      )}

      {selectedNodo && (
        <div className="mt-4 p-4 bg-white rounded-lg shadow text-sm">
          <p className="font-semibold">{selectedNodo.nombre}</p>
          <p className="text-gray-500">Tipo: {selectedNodo.tipo} | Pos: [{selectedNodo.coordenada_x}, {selectedNodo.coordenada_y}]</p>
        </div>
      )}
    </div>
  )
}
