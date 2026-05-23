import { useState, useEffect, useRef } from 'react'
import { Stage, Layer, Rect, Circle, Line, Text as KonvaText } from 'react-konva'
import { almacenService } from '../../api/empresa'
import { zonaService, nodoService, conexionService, rutaService } from '../../api/layout'
import type { Almacen, Zona, Nodo, Conexion, RutaResult } from '../../types'

// Colores para los distintos tipos de zonas en el mapa
const TIPO_COLORS: Record<string, string> = {
  recepcion: '#E8F5E9', almacenamiento: '#E3F2FD', despacho: '#FFF3E0',
  picking: '#F3E5F5', devoluciones: '#FFEBEE',
}

// Colores para los distintos tipos de nodos (entrada, salida, esquina, etc.)
const NODO_COLORS: Record<string, string> = {
  entrada: '#4CAF50', salida: '#F44336', esquina: '#607D8B',
  interseccion: '#FF9800', punto_recogida: '#2196F3',
}

/**
 * Página de Rutas Inteligentes (algoritmo Dijkstra).
 * Permite seleccionar un almacén, elegir nodo origen y destino, y calcular la ruta
 * más corta sobre el grafo de nodos y conexiones del layout.
 *
 * Estado:
 *   - almacenes / selectedAlmacen: lista y selección de almacén.
 *   - zonas, nodos, conexiones: datos del layout del almacén seleccionado.
 *   - origenId / destinoId: IDs de los nodos elegidos para la ruta.
 *   - rutaResult: resultado devuelto por el backend (distancia, camino, etc.).
 *   - error / loading: control de estados de carga y error.
 *
 * Llamadas API:
 *   - almacenService.list() — lista de almacenes.
 *   - zonaService.list(), nodoService.list(), conexionService.list() — layout.
 *   - rutaService.calcular(origen, destino) — ejecuta Dijkstra en backend.
 *
 * Renderiza:
 *   - Formulario de selección (almacén, origen, destino, botón).
 *   - Resultado de la ruta (distancia total, nodos visitados, camino paso a paso).
 *   - Lienzo Konva con zonas, conexiones y nodos; los nodos de la ruta se resaltan.
 */
export default function RutasPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 800, height: 500 })
  const [almacenes, setAlmacenes] = useState<Almacen[]>([])
  const [selectedAlmacen, setSelectedAlmacen] = useState('')
  const [zonas, setZonas] = useState<Zona[]>([])
  const [nodos, setNodos] = useState<Nodo[]>([])
  const [conexiones, setConexiones] = useState<Conexion[]>([])
  const [origenId, setOrigenId] = useState('')
  const [destinoId, setDestinoId] = useState('')
  const [rutaResult, setRutaResult] = useState<RutaResult | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Ajusta el tamaño del contenedor Konva al ancho disponible y al resize de la ventana
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setSize({ width: containerRef.current.offsetWidth, height: 500 })
      }
    }
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  // Carga la lista de almacenes al montar el componente
  useEffect(() => {
    almacenService.list().then(({ data }) => setAlmacenes(data.results)).catch(() => {})
  }, [])

  // Al cambiar el almacén seleccionado, carga su layout (zonas, nodos, conexiones)
  useEffect(() => {
    if (!selectedAlmacen) return
    setLoading(true)
    setRutaResult(null); setError('')
    Promise.all([
      zonaService.list(selectedAlmacen),
      nodoService.list(selectedAlmacen),
      conexionService.list(),
    ]).then(([zRes, nRes, cRes]) => {
      setZonas(zRes.data.results)
      setNodos(nRes.data.results)
      setConexiones(cRes.data.results)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [selectedAlmacen])

  // Filtra nodos pertenecientes al almacén actual
  const nodosFiltrados = nodos.filter((n) => n.idalmacen === selectedAlmacen)
  const escala = 2.5

  /**
   * Ejecuta el cálculo de la ruta entre origenId y destinoId
   * llamando al endpoint rutaService.calcular (Dijkstra).
   */
  const handleCalcularRuta = async () => {
    if (!origenId || !destinoId) return
    setError('')
    setRutaResult(null)
    setLoading(true)
    try {
      const { data } = await rutaService.calcular(origenId, destinoId)
      setRutaResult(data)
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } }
      setError(axiosErr.response?.data?.error || 'Error al calcular la ruta')
    } finally { setLoading(false) }
  }

  // Conjunto de IDs de nodos que forman parte de la ruta calculada, para resaltarlos en el canvas
  const rutaIds = new Set(rutaResult?.ruta.map((n) => n.idnodo) || [])

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-4">Rutas Inteligentes (Dijkstra)</h1>

      {/* Formulario: selección de almacén, nodo origen, nodo destino y botón calcular */}
      <div className="bg-white rounded-lg shadow p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-sm font-medium mb-1">Almacén</label>
            <select value={selectedAlmacen} onChange={(e) => { setSelectedAlmacen(e.target.value); setRutaResult(null); setError('') }}
              className="w-full px-3 py-2 border rounded-lg">
              <option value="">Seleccionar</option>
              {almacenes.map((a) => <option key={a.idalmacen} value={a.idalmacen}>{a.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Nodo Origen</label>
            <select value={origenId} onChange={(e) => setOrigenId(e.target.value)} className="w-full px-3 py-2 border rounded-lg" disabled={!selectedAlmacen}>
              <option value="">Seleccionar</option>
              {nodosFiltrados.map((n) => <option key={n.idnodo} value={n.idnodo}>{n.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Nodo Destino</label>
            <select value={destinoId} onChange={(e) => setDestinoId(e.target.value)} className="w-full px-3 py-2 border rounded-lg" disabled={!selectedAlmacen}>
              <option value="">Seleccionar</option>
              {nodosFiltrados.map((n) => <option key={n.idnodo} value={n.idnodo}>{n.nombre}</option>)}
            </select>
          </div>
          <button onClick={handleCalcularRuta} disabled={!origenId || !destinoId || loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition">
            {loading ? 'Calculando...' : 'Calcular Ruta'}
          </button>
        </div>
      </div>

      {/* Mensaje de error si la ruta no pudo calcularse */}
      {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}

      {/* Resultado de la ruta: distancia total, nodos visitados y secuencia paso a paso */}
      {rutaResult && (
        <div className="mb-4">
          <span className="font-semibold">Distancia total: {rutaResult.distancia_total}m</span>
          <span className="mx-2 text-gray-400">|</span>
          <span className="text-gray-600">Nodos visitados: {rutaResult.nodos_visitados}</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {rutaResult.ruta.map((n, i) => (
              <span key={n.idnodo} className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                <span className="font-bold">{i + 1}.</span> {n.nombre}
                <span className="text-blue-400">({n.distancia_acumulada}m)</span>
                {i < rutaResult.ruta.length - 1 && <span className="text-gray-400 ml-1">→</span>}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Lienzo Konva: muestra zonas, conexiones y nodos del almacén.
          Las conexiones y nodos que forman parte de la ruta se resaltan en azul. */}
      {selectedAlmacen && (
        <div ref={containerRef} className="bg-gray-50 rounded-lg border overflow-hidden">
          <Stage width={size.width} height={size.height}>
            <Layer>
              {/* Renderiza zonas como rectángulos coloreados según su tipo */}
              {zonas.map((zona) => (
                <Rect
                  key={zona.idzona}
                  x={zona.x * escala} y={zona.y * escala}
                  width={zona.ancho * escala} height={zona.alto * escala}
                  fill={TIPO_COLORS[zona.tipo] || '#f0f0f0'}
                  stroke="#ccc" strokeWidth={1}
                />
              ))}

              {/* Renderiza conexiones entre nodos; las que pertenecen a la ruta se pintan azul grueso */}
              {conexiones.filter((c) => {
                const from = nodos.find((n) => n.idnodo === c.idnodoorigen)
                const to = nodos.find((n) => n.idnodo === c.idnododestino)
                return from && to && from.idalmacen === selectedAlmacen && to.idalmacen === selectedAlmacen
              }).map((conex) => {
                const origen = nodos.find((n) => n.idnodo === conex.idnodoorigen)!
                const destino = nodos.find((n) => n.idnodo === conex.idnododestino)!
                const isInRoute = rutaIds.has(conex.idnodoorigen) && rutaIds.has(conex.idnododestino)
                return (
                  <Line
                    key={conex.idconexion}
                    points={[origen.coordenada_x * escala, origen.coordenada_y * escala, destino.coordenada_x * escala, destino.coordenada_y * escala]}
                    stroke={isInRoute ? '#2196F3' : '#ccc'}
                    strokeWidth={isInRoute ? 3 : 1}
                    opacity={isInRoute ? 1 : 0.5}
                    listening={false}
                  />
                )
              })}

              {/* Renderiza nodos como círculos; los de la ruta, origen y destino tienen tamaño y color especiales */}
              {nodosFiltrados.map((nodo) => {
                const isInRoute = rutaIds.has(nodo.idnodo)
                const isStart = nodo.idnodo === origenId
                const isEnd = nodo.idnodo === destinoId
                return (
                  <Circle
                    key={nodo.idnodo}
                    x={nodo.coordenada_x * escala} y={nodo.coordenada_y * escala}
                    radius={isStart || isEnd ? 7 : isInRoute ? 6 : 4}
                    fill={isStart ? '#4CAF50' : isEnd ? '#F44336' : isInRoute ? '#2196F3' : NODO_COLORS[nodo.tipo] || '#999'}
                    stroke={isInRoute ? '#fff' : 'transparent'} strokeWidth={2}
                  />
                )
              })}

              {/* Etiquetas de texto para nodos de tipo entrada y salida */}
              {nodosFiltrados.filter((n) => n.tipo === 'entrada' || n.tipo === 'salida').map((nodo) => (
                <KonvaText
                  key={`label-${nodo.idnodo}`}
                  x={nodo.coordenada_x * escala - 15} y={nodo.coordenada_y * escala + 10}
                  text={nodo.nombre} fontSize={9} fill="#333" fontStyle="bold"
                />
              ))}
            </Layer>
          </Stage>
        </div>
      )}
    </div>
  )
}
