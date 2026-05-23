import React, { useState, useEffect, useRef } from 'react'
import { Stage, Layer, Rect, Text, Circle, Line, Group, Transformer } from 'react-konva'
import Konva from 'konva'
import { almacenService } from '../../api/empresa'
import { zonaService, nodoService, conexionService } from '../../api/layout'
import { useToastStore } from '../../store/toastStore'
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

const ESCALA = 2.5
const ZONA_MIN = 30

export default function LayoutMapPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 800, height: 600 })
  const [almacenes, setAlmacenes] = useState<Almacen[]>([])
  const [selectedAlmacen, setSelectedAlmacen] = useState('')
  const [almacenActual, setAlmacenActual] = useState<Almacen | null>(null)
  const [zonas, setZonas] = useState<Zona[]>([])
  const [nodos, setNodos] = useState<Nodo[]>([])
  const [conexiones, setConexiones] = useState<Conexion[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedZona, setSelectedZona] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showNodos, setShowNodos] = useState(true)
  const [showConexiones, setShowConexiones] = useState(true)
  const [canvasOffset] = useState({ x: 50, y: 50 })
  const addToast = useToastStore((state) => state.addToast)

  const shapeRefs = useRef<Record<string, Konva.Rect>>({})
  const transformerRef = useRef<Konva.Transformer>(null)

  const almAncho = almacenActual?.ancho ? Number(almacenActual.ancho) : 600
  const almAlto = almacenActual?.alto ? Number(almacenActual.alto) : 400

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
      almacenService.get(selectedAlmacen),
    ])
      .then(([zonasRes, nodosRes, conexRes, almRes]) => {
        setZonas(zonasRes.data.results)
        setNodos(nodosRes.data.results)
        setConexiones(conexRes.data.results)
        setAlmacenActual(almRes.data)
      })
      .catch(() => addToast('error', 'Error al cargar layout'))
      .finally(() => setLoading(false))
  }, [selectedAlmacen])

  useEffect(() => {
    if (!transformerRef.current) return
    if (selectedZona && shapeRefs.current[selectedZona]) {
      transformerRef.current.nodes([shapeRefs.current[selectedZona]])
      transformerRef.current.getLayer()?.batchDraw()
    } else {
      transformerRef.current.nodes([])
      transformerRef.current.getLayer()?.batchDraw()
    }
  }, [selectedZona])

  const nodosFiltrados = nodos.filter((n) => n.idalmacen === selectedAlmacen)
  const conexIds = new Set<string>()
  conexiones.forEach((c) => { conexIds.add(c.idnodoorigen); conexIds.add(c.idnododestino) })
  const conexFiltradas = conexiones.filter((c) => conexIds.has(c.idnodoorigen) && conexIds.has(c.idnododestino))

  const almacenW = almAncho * ESCALA
  const almacenH = almAlto * ESCALA
  const ox = canvasOffset.x
  const oy = canvasOffset.y

  const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val))

  const handleDragEnd = (id: string, e: Konva.KonvaEventObject<DragEvent>) => {
    const zona = zonas.find((z) => z.idzona === id)
    if (!zona) return
    const newX = clamp(e.target.x() - ox, 0, almacenW - zona.ancho * ESCALA)
    const newY = clamp(e.target.y() - oy, 0, almacenH - zona.alto * ESCALA)
    e.target.x(newX + ox)
    e.target.y(newY + oy)
    setZonas((prev) =>
      prev.map((z) => (z.idzona === id ? { ...z, x: Math.round(newX / ESCALA), y: Math.round(newY / ESCALA) } : z))
    )
    setDirty(true)
  }

  const handleTransformEnd = (id: string) => {
    const node = shapeRefs.current[id]
    if (!node) return
    const scaleX = node.scaleX()
    const scaleY = node.scaleY()
    node.scaleX(1)
    node.scaleY(1)
    const rawW = node.width() * scaleX
    const rawH = node.height() * scaleY
    let w = Math.round(rawW / ESCALA)
    let h = Math.round(rawH / ESCALA)
    w = clamp(w, ZONA_MIN, almAncho)
    h = clamp(h, ZONA_MIN, almAlto)
    const rx = clamp(Math.round((node.x() - ox) / ESCALA), 0, almAncho - w)
    const ry = clamp(Math.round((node.y() - oy) / ESCALA), 0, almAlto - h)
    node.x(rx * ESCALA + ox)
    node.y(ry * ESCALA + oy)
    node.width(w * ESCALA)
    node.height(h * ESCALA)
    setZonas((prev) => prev.map((z) => (z.idzona === id ? { ...z, x: rx, y: ry, ancho: w, alto: h } : z)))
    setDirty(true)
  }

  const handleAddZona = () => {
    const existing = zonas.filter((z) => !z.idzona.startsWith('new-'))
    const count = existing.length + 1
    const newZona: Zona = {
      idzona: `new-${Date.now()}`,
      idalmacen: selectedAlmacen,
      nombre: `Zona ${count}`,
      codigo: `Z-${String(count).padStart(2, '0')}`,
      tipo: 'almacenamiento',
      x: 10,
      y: 10,
      ancho: 100,
      alto: 80,
      color: '#2196F3',
      estado: true,
    }
    setZonas((prev) => [...prev, newZona])
    setDirty(true)
    setSelectedZona(newZona.idzona)
  }

  const handleDeleteZona = async () => {
    if (!selectedZona) return
    const zona = zonas.find((z) => z.idzona === selectedZona)
    if (!zona) return
    if (zona.idzona.startsWith('new-')) {
      setZonas((prev) => prev.filter((z) => z.idzona !== selectedZona))
      setSelectedZona(null)
      setDirty(true)
      return
    }
    setDeleting(true)
    try {
      await zonaService.remove(zona.idzona)
      setZonas((prev) => prev.filter((z) => z.idzona !== selectedZona))
      setSelectedZona(null)
      setDirty(false)
      addToast('success', 'Zona eliminada')
    } catch {
      addToast('error', 'Error al eliminar zona')
    } finally {
      setDeleting(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      for (const zona of zonas) {
        const payload = {
          idalmacen: zona.idalmacen,
          nombre: zona.nombre,
          codigo: zona.codigo,
          tipo: zona.tipo,
          x: zona.x,
          y: zona.y,
          ancho: zona.ancho,
          alto: zona.alto,
          color: zona.color || null,
        }
        if (zona.idzona.startsWith('new-')) {
          await zonaService.create(payload)
        } else {
          await zonaService.update(zona.idzona, payload)
        }
      }
      // Reload
      const { data } = await zonaService.list(selectedAlmacen)
      setZonas(data.results)
      setDirty(false)
      addToast('success', 'Layout guardado')
    } catch {
      addToast('error', 'Error al guardar layout')
    } finally {
      setSaving(false)
    }
  }

  const handleSelectZona = (id: string) => {
    setSelectedZona(id === selectedZona ? null : id)
  }

  const selectedZonaData = zonas.find((z) => z.idzona === selectedZona)

  return (
    <div className="flex gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-4">
            <select
              value={selectedAlmacen}
              onChange={(e) => { setSelectedAlmacen(e.target.value); setSelectedZona(null); setDirty(false) }}
              className="px-3 py-2 border rounded-lg"
            >
              <option value="">Seleccionar almacén</option>
              {almacenes.map((a) => (
                <option key={a.idalmacen} value={a.idalmacen}>{a.nombre}</option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1 text-sm">
                <input type="checkbox" checked={showNodos} onChange={(e) => setShowNodos(e.target.checked)} /> Nodos
              </label>
              <label className="flex items-center gap-1 text-sm">
                <input type="checkbox" checked={showConexiones} onChange={(e) => setShowConexiones(e.target.checked)} /> Conexiones
              </label>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleAddZona} disabled={!selectedAlmacen}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm">
              + Zona
            </button>
            {dirty && (
              <>
                <button onClick={handleSave} disabled={saving}
                  className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm">
                  {saving ? 'Guardando...' : 'Guardar'}
                </button>
                <button onClick={() => { setDirty(false); setSelectedZona(null); if (selectedAlmacen) { zonaService.list(selectedAlmacen).then(({ data }) => setZonas(data.results)) } }}
                  className="px-3 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 text-sm">
                  Cancelar
                </button>
              </>
            )}
          </div>
        </div>

        {!selectedAlmacen ? (
          <div className="text-center py-16 text-gray-400">Seleccione un almacén</div>
        ) : loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full" />
          </div>
        ) : (
          <div ref={containerRef} className="bg-gray-50 rounded-lg border overflow-hidden">
            <Stage width={size.width} height={size.height}>
              <Layer>
                {/* Grid */}
                {(() => {
                  const step = 50 * ESCALA
                  const w = size.width
                  const h = size.height
                  const lines: React.ReactNode[] = []
                  for (let x = 0; x < w; x += step) {
                    lines.push(<Line key={'gv' + x} points={[x, 0, x, h]} stroke="#e0e0e0" strokeWidth={0.5} listening={false} />)
                    lines.push(<Text key={'gl' + x} x={x + 2} y={2} text={String(Math.round(x / ESCALA))} fontSize={8} fill="#ccc" listening={false} />)
                  }
                  for (let y = 0; y < h; y += step) {
                    lines.push(<Line key={'gh' + y} points={[0, y, w, y]} stroke="#e0e0e0" strokeWidth={0.5} listening={false} />)
                    lines.push(<Text key={'gt' + y} x={2} y={y + 2} text={String(Math.round(y / ESCALA))} fontSize={8} fill="#ccc" listening={false} />)
                  }
                  return lines
                })()}

                {/* Almacen boundary */}
                <Rect
                  x={ox} y={oy} width={almacenW} height={almacenH}
                  fill="white" stroke="#333" strokeWidth={2} dash={[6, 3]} listening={false}
                />
                <Text
                  x={ox + 4} y={oy - 14}
                  text={`${almacenActual?.nombre || 'Almacén'} — ${almAncho}×${almAlto} u`}
                  fontSize={10} fill="#666" listening={false}
                />

                {/* Zonas */}
                {zonas.map((zona) => (
                  <Group key={zona.idzona}>
                    <Rect
                      ref={(node) => { if (node) shapeRefs.current[zona.idzona] = node }}
                      x={zona.x * ESCALA + ox}
                      y={zona.y * ESCALA + oy}
                      width={zona.ancho * ESCALA}
                      height={zona.alto * ESCALA}
                      fill={zona.color || TIPO_COLORS[zona.tipo] || '#e0e0e0'}
                      opacity={selectedZona === zona.idzona ? 0.5 : 0.3}
                      stroke={selectedZona === zona.idzona ? '#000' : (zona.color || TIPO_COLORS[zona.tipo] || '#666')}
                      strokeWidth={selectedZona === zona.idzona ? 2 : 1}
                      draggable
                      onClick={() => handleSelectZona(zona.idzona)}
                      onTap={() => handleSelectZona(zona.idzona)}
                      onDragEnd={(e) => handleDragEnd(zona.idzona, e)}
                      onTransformEnd={() => handleTransformEnd(zona.idzona)}
                    />
                    <Text
                      x={zona.x * ESCALA + ox + 4}
                      y={zona.y * ESCALA + oy + 4}
                      text={`${zona.nombre}\n[${zona.x}, ${zona.y}] ${zona.ancho}×${zona.alto}`}
                      fontSize={9} fill="#333" fontStyle="bold" listening={false}
                    />
                  </Group>
                ))}

                <Transformer
                  ref={transformerRef}
                  boundBoxFunc={(oldBox, newBox) => {
                    if (newBox.width < ZONA_MIN * ESCALA || newBox.height < ZONA_MIN * ESCALA) return oldBox
                    if (newBox.x < ox || newBox.y < oy) return oldBox
                    if (newBox.x + newBox.width > ox + almacenW) return oldBox
                    if (newBox.y + newBox.height > oy + almacenH) return oldBox
                    return newBox
                  }}
                />

                {/* Conexiones */}
                {showConexiones && conexFiltradas.map((conex) => {
                  const origen = nodos.find((n) => n.idnodo === conex.idnodoorigen)
                  const destino = nodos.find((n) => n.idnodo === conex.idnododestino)
                  if (!origen || !destino) return null
                  return (
                    <Line key={conex.idconexion}
                      points={[origen.coordenada_x * ESCALA + ox, origen.coordenada_y * ESCALA + oy, destino.coordenada_x * ESCALA + ox, destino.coordenada_y * ESCALA + oy]}
                      stroke={conex.tipo === 'cruce' ? '#FF9800' : '#78909C'}
                      strokeWidth={conex.tipo === 'pasillo' ? 2 : 1}
                      dash={conex.tipo === 'cruce' ? [4, 4] : []}
                      opacity={0.7} listening={false}
                    />
                  )
                })}

                {/* Nodos */}
                {showNodos && nodosFiltrados.map((nodo) => (
                  <Circle key={nodo.idnodo}
                    x={nodo.coordenada_x * ESCALA + ox} y={nodo.coordenada_y * ESCALA + oy}
                    radius={5} fill={NODO_COLORS[nodo.tipo] || '#666'}
                    stroke="#fff" strokeWidth={1.5} opacity={0.85}
                    onClick={() => {}}
                  />
                ))}

                <Text x={size.width - 130} y={size.height - 16} text="1 cuadro = 50 unidades" fontSize={10} fill="#999" listening={false} />
              </Layer>
            </Stage>
          </div>
        )}
      </div>

      {/* Properties Panel */}
      {selectedZonaData && (
        <div className="w-64 bg-white rounded-lg border p-4 text-sm space-y-3 shrink-0">
          <h3 className="font-bold text-gray-800">Propiedades de Zona</h3>
          <div>
            <label className="block text-xs text-gray-500">Nombre</label>
            <input type="text" value={selectedZonaData.nombre}
              onChange={(e) => { setZonas((prev) => prev.map((z) => z.idzona === selectedZonaData.idzona ? { ...z, nombre: e.target.value } : z)); setDirty(true) }}
              className="w-full px-2 py-1 border rounded text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-500">X</label>
              <input type="number" value={selectedZonaData.x}
                onChange={(e) => { const v = parseInt(e.target.value) || 0; setZonas((prev) => prev.map((z) => z.idzona === selectedZonaData.idzona ? { ...z, x: v } : z)); setDirty(true) }}
                className="w-full px-2 py-1 border rounded text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500">Y</label>
              <input type="number" value={selectedZonaData.y}
                onChange={(e) => { const v = parseInt(e.target.value) || 0; setZonas((prev) => prev.map((z) => z.idzona === selectedZonaData.idzona ? { ...z, y: v } : z)); setDirty(true) }}
                className="w-full px-2 py-1 border rounded text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500">Ancho</label>
              <input type="number" value={selectedZonaData.ancho}
                onChange={(e) => { const v = parseInt(e.target.value) || 0; setZonas((prev) => prev.map((z) => z.idzona === selectedZonaData.idzona ? { ...z, ancho: v } : z)); setDirty(true) }}
                className="w-full px-2 py-1 border rounded text-sm" />
            </div>
            <div>
              <label className="block text-xs text-gray-500">Alto</label>
              <input type="number" value={selectedZonaData.alto}
                onChange={(e) => { const v = parseInt(e.target.value) || 0; setZonas((prev) => prev.map((z) => z.idzona === selectedZonaData.idzona ? { ...z, alto: v } : z)); setDirty(true) }}
                className="w-full px-2 py-1 border rounded text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500">Código</label>
            <input type="text" value={selectedZonaData.codigo}
              onChange={(e) => { setZonas((prev) => prev.map((z) => z.idzona === selectedZonaData.idzona ? { ...z, codigo: e.target.value } : z)); setDirty(true) }}
              className="w-full px-2 py-1 border rounded text-sm" />
          </div>
          <div>
            <label className="block text-xs text-gray-500">Tipo</label>
            <select value={selectedZonaData.tipo}
              onChange={(e) => { setZonas((prev) => prev.map((z) => z.idzona === selectedZonaData.idzona ? { ...z, tipo: e.target.value as Zona['tipo'] } : z)); setDirty(true) }}
              className="w-full px-2 py-1 border rounded text-sm">
              {['recepcion', 'almacenamiento', 'despacho', 'picking', 'devoluciones'].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-500">Color</label>
            <input type="color" value={selectedZonaData.color || '#2196F3'}
              onChange={(e) => { setZonas((prev) => prev.map((z) => z.idzona === selectedZonaData.idzona ? { ...z, color: e.target.value } : z)); setDirty(true) }}
              className="w-full h-8 border rounded" />
          </div>
          <button onClick={handleDeleteZona} disabled={deleting}
            className="w-full px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm">
            {deleting ? 'Eliminando...' : 'Eliminar Zona'}
          </button>
        </div>
      )}
    </div>
  )
}
