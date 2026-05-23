import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Stage, Layer, Rect, Text, Circle, Line, Group, Transformer } from 'react-konva'
import Konva from 'konva'
import { almacenService } from '../../api/empresa'
import { zonaService, pasilloService, estanteService, nodoService, conexionService } from '../../api/layout'
import { useToastStore } from '../../store/toastStore'
import type { Almacen, Zona, Pasillo, Estante, Nodo, Conexion } from '../../types'
import MapToolbar from '../../components/dedicated/MapToolbar'
import ZoomControls from '../../components/dedicated/ZoomControls'
import PropertiesPanel from '../../components/dedicated/PropertiesPanel'

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
const ENTITY_MIN = 10

export default function LayoutMapPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 800, height: 600 })
  const [almacenes, setAlmacenes] = useState<Almacen[]>([])
  const [selectedAlmacen, setSelectedAlmacen] = useState('')
  const [almacenActual, setAlmacenActual] = useState<Almacen | null>(null)
  const [zonas, setZonas] = useState<Zona[]>([])
  const [pasillos, setPasillos] = useState<Pasillo[]>([])
  const [estantes, setEstantes] = useState<Estante[]>([])
  const [nodos, setNodos] = useState<Nodo[]>([])
  const [conexiones, setConexiones] = useState<Conexion[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedEntity, setSelectedEntity] = useState<{ type: string; id: string } | null>(null)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showNodos, setShowNodos] = useState(true)
  const [showConexiones, setShowConexiones] = useState(true)
  const [camera, setCamera] = useState({ x: 0, y: 0, scale: 1 })
  const [addingNodoType, setAddingNodoType] = useState('entrada')
  const [placingNodo, setPlacingNodo] = useState(false)
  const [isPanning, setIsPanning] = useState(false)
  const [panStart, setPanStart] = useState({ x: 0, y: 0 })
  const addToast = useToastStore((state) => state.addToast)
  const shapeRefs = useRef<Record<string, Konva.Shape>>({})
  const transformerRef = useRef<Konva.Transformer>(null)
  const stageRef = useRef<Konva.Stage>(null)

  const almAncho = almacenActual?.ancho ? Number(almacenActual.ancho) : 600
  const almAlto = almacenActual?.alto ? Number(almacenActual.alto) : 400
  const selType = selectedEntity?.type ?? null
  const selId = selectedEntity?.id ?? null

  const selectedZona = selType === 'zona' ? zonas.find((z) => z.idzona === selId) : null
  const selectedPasillo = selType === 'pasillo' ? pasillos.find((p) => p.idpasillo === selId) : null
  const selectedEstante = selType === 'estante' ? estantes.find((e) => e.idestante === selId) : null
  const selectedNodo = selType === 'nodo' ? nodos.find((n) => n.idnodo === selId) : null

  const canvasOffset = { x: 50, y: 50 }
  const almacenW = almAncho * ESCALA
  const almacenH = almAlto * ESCALA
  const ox = canvasOffset.x
  const oy = canvasOffset.y

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setSize({
          width: containerRef.current.offsetWidth,
          height: Math.max(800, window.innerHeight - 160),
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
      pasilloService.list(),
      estanteService.list(),
    ])
      .then(([zonasRes, nodosRes, conexRes, almRes, pasillosRes, estantesRes]) => {
        setZonas(zonasRes.data.results)
        setNodos(nodosRes.data.results)
        setConexiones(conexRes.data.results)
        setAlmacenActual(almRes.data)
        setPasillos(pasillosRes.data.results)
        setEstantes(estantesRes.data.results)
        if (containerRef.current) {
          const cw = containerRef.current.offsetWidth
          const ch = Math.max(800, window.innerHeight - 160)
          const aw = Number(almRes.data.ancho) || 600
          const ah = Number(almRes.data.alto) || 400
          const almW = aw * ESCALA
          const almH = ah * ESCALA
          const pad = 40
          const fit = Math.min((cw - pad * 2) / almW, (ch - pad * 2) / almH)
          setCamera({
            x: cw / 2 - (ox + almW / 2) * fit,
            y: ch / 2 - (oy + almH / 2) * fit,
            scale: Math.max(0.3, Math.min(fit, 3)),
          })
        }
      })
      .catch(() => addToast('error', 'Error al cargar layout'))
      .finally(() => setLoading(false))
  }, [selectedAlmacen])

  useEffect(() => {
    if (!transformerRef.current) return
    if (selType && selType !== 'nodo' && selId && shapeRefs.current[selType + '-' + selId]) {
      transformerRef.current.nodes([shapeRefs.current[selType + '-' + selId]])
      transformerRef.current.getLayer()?.batchDraw()
    } else {
      transformerRef.current.nodes([])
      transformerRef.current.getLayer()?.batchDraw()
    }
  }, [selectedEntity])

  const nodosFiltrados = nodos.filter((n) => n.idalmacen === selectedAlmacen)
  const conexIds = new Set<string>()
  conexiones.forEach((c) => { conexIds.add(c.idnodoorigen); conexIds.add(c.idnododestino) })
  const conexFiltradas = conexiones.filter((c) => conexIds.has(c.idnodoorigen) && conexIds.has(c.idnododestino))
  const zonasIds = new Set(zonas.map((z) => z.idzona))
  const pasillosFiltrados = pasillos.filter((p) => zonasIds.has(p.idzona))
  const pasilloIds = new Set(pasillosFiltrados.map((p) => p.idpasillo))
  const estantesFiltrados = estantes.filter((e) => pasilloIds.has(e.idpasillo))

  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault()
    const stage = e.target.getStage()
    if (!stage) return
    const oldScale = camera.scale
    const pointer = stage.getPointerPosition()
    if (!pointer) return
    const scaleBy = 1.1
    const direction = e.evt.deltaY > 0 ? -1 : 1
    const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy
    if (newScale < 0.3 || newScale > 3) return
    const mousePointTo = {
      x: (pointer.x - camera.x) / oldScale,
      y: (pointer.y - camera.y) / oldScale,
    }
    setCamera({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
      scale: newScale,
    })
  }, [camera])

  const zoomIn = () => setCamera((prev) => ({ ...prev, scale: Math.min(prev.scale * 1.2, 3) }))
  const zoomOut = () => setCamera((prev) => ({ ...prev, scale: Math.max(prev.scale / 1.2, 0.3) }))
  const zoomReset = () => setCamera({ x: 0, y: 0, scale: 1 })

  const handleMouseDown = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (placingNodo) return
    if (e.target !== e.target.getStage()) return
    setIsPanning(true)
    setPanStart({ x: e.evt.clientX, y: e.evt.clientY })
  }

  const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isPanning) return
    const dx = e.evt.clientX - panStart.x
    const dy = e.evt.clientY - panStart.y
    e.evt.preventDefault()
    setCamera((prev) => ({ ...prev, x: prev.x + dx, y: prev.y + dy }))
    setPanStart({ x: e.evt.clientX, y: e.evt.clientY })
  }

  const handleMouseUp = () => setIsPanning(false)

  const screenToWorld = (sx: number, sy: number) => {
    const wx = (sx - camera.x) / camera.scale
    const wy = (sy - camera.y) / camera.scale
    return {
      x: Math.round((wx - ox) / ESCALA),
      y: Math.round((wy - oy) / ESCALA),
    }
  }

  const handleSelect = (type: string, id: string) => {
    if (placingNodo) return
    setSelectedEntity((prev) => (prev?.type === type && prev?.id === id) ? null : { type, id })
  }

  const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val))

  const handleDragEnd = (type: string, id: string, e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target
    const newX = clamp(node.x() - ox, 0, almacenW - node.width() * node.scaleX())
    const newY = clamp(node.y() - oy, 0, almacenH - node.height() * node.scaleY())
    node.x(newX + ox)
    node.y(newY + oy)
    const ux = Math.round(newX / ESCALA)
    const uy = Math.round(newY / ESCALA)
    if (type === 'zona') setZonas((prev) => prev.map((z) => z.idzona === id ? { ...z, x: ux, y: uy } : z))
    else if (type === 'pasillo') setPasillos((prev) => prev.map((p) => p.idpasillo === id ? { ...p, x: ux, y: uy } : p))
    else if (type === 'estante') setEstantes((prev) => prev.map((e) => e.idestante === id ? { ...e, x: ux, y: uy } : e))
    setDirty(true)
  }

  const handleTransformEnd = (type: string, id: string) => {
    const key = type + '-' + id
    const node = shapeRefs.current[key]
    if (!node) return
    const scaleX = node.scaleX()
    const scaleY = node.scaleY()
    node.scaleX(1)
    node.scaleY(1)
    const rawW = node.width() * scaleX
    const rawH = node.height() * scaleY
    let w = Math.round(Math.max(rawW, ENTITY_MIN) / ESCALA)
    let h = Math.round(Math.max(rawH, ENTITY_MIN) / ESCALA)
    const rx = clamp(Math.round((node.x() - ox) / ESCALA), 0, almAncho - w)
    const ry = clamp(Math.round((node.y() - oy) / ESCALA), 0, almAlto - h)
    node.x(rx * ESCALA + ox)
    node.y(ry * ESCALA + oy)
    node.width(w * ESCALA)
    node.height(h * ESCALA)
    if (type === 'zona') setZonas((prev) => prev.map((z) => z.idzona === id ? { ...z, x: rx, y: ry, ancho: w, alto: h } : z))
    else if (type === 'pasillo') setPasillos((prev) => prev.map((p) => p.idpasillo === id ? { ...p, x: rx, y: ry, ancho: w, largo: h } : p))
    else if (type === 'estante') setEstantes((prev) => prev.map((e) => e.idestante === id ? { ...e, x: rx, y: ry, ancho: w, alto: h } : e))
    setDirty(true)
  }

  const handleNodoDragEnd = (id: string, e: Konva.KonvaEventObject<DragEvent>) => {
    const wx = clamp(Math.round((e.target.x() - ox) / ESCALA), 0, almAncho)
    const wy = clamp(Math.round((e.target.y() - oy) / ESCALA), 0, almAlto)
    e.target.x(wx * ESCALA + ox)
    e.target.y(wy * ESCALA + oy)
    setNodos((prev) => prev.map((n) => n.idnodo === id ? { ...n, coordenada_x: wx, coordenada_y: wy } : n))
    setDirty(true)
  }

  const handleAddZona = () => {
    if (!selectedAlmacen) return
    const existing = zonas.filter((z) => !z.idzona.startsWith('new-'))
    const count = existing.length + 1
    const newZona: Zona = {
      idzona: 'new-' + Date.now(), idalmacen: selectedAlmacen,
      nombre: 'Zona ' + count, codigo: 'Z-' + String(count).padStart(2, '0'),
      tipo: 'almacenamiento', x: 10 + ((count - 1) % 3) * 120, y: 10 + Math.floor((count - 1) / 3) * 100,
      ancho: 100, alto: 80, color: '#2196F3', estado: true,
    }
    setZonas((prev) => [...prev, newZona])
    setDirty(true)
    setSelectedEntity({ type: 'zona', id: newZona.idzona })
    setPlacingNodo(false)
  }

  const handleAddPasillo = () => {
    if (!selectedAlmacen || zonas.length === 0) return
    const existing = pasillos.filter((p) => !p.idpasillo.startsWith('new-'))
    const count = existing.length + 1
    const zonaId = selectedZona?.idzona || zonas[0].idzona
    const newPasillo: Pasillo = {
      idpasillo: 'new-' + Date.now(), idzona: zonaId,
      nombre: 'Pasillo ' + count, codigo: 'P-' + String(count).padStart(2, '0'),
      x: 20, y: 20 + (count - 1) * 40, ancho: 200, largo: 30,
      orientacion: 'horizontal', estado: true,
    }
    setPasillos((prev) => [...prev, newPasillo])
    setDirty(true)
    setSelectedEntity({ type: 'pasillo', id: newPasillo.idpasillo })
  }

  const handleAddEstante = () => {
    if (!selectedAlmacen || pasillos.length === 0) return
    const existing = estantes.filter((e) => !e.idestante.startsWith('new-'))
    const count = existing.length + 1
    const pasilloId = selectedPasillo?.idpasillo || pasillos[0].idpasillo
    const newEstante: Estante = {
      idestante: 'new-' + Date.now(), idpasillo: pasilloId,
      nombre: 'Estante ' + count, codigo: 'E-' + String(count).padStart(2, '0'),
      x: 20, y: 20 + (count - 1) * 90, ancho: 30, alto: 80, profundidad: 50,
      lado: 'izquierda', cantidadniveles: 4, estado: true,
    }
    setEstantes((prev) => [...prev, newEstante])
    setDirty(true)
    setSelectedEntity({ type: 'estante', id: newEstante.idestante })
  }

  const handleStartPlaceNodo = () => { setPlacingNodo(true); setSelectedEntity(null) }

  const handleStageClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!placingNodo) return
    if (e.target !== e.target.getStage()) return
    const stage = e.target.getStage()
    if (!stage) return
    const pointer = stage.getPointerPosition()
    if (!pointer) return
    const world = screenToWorld(pointer.x, pointer.y)
    const cx = clamp(world.x, 0, almAncho)
    const cy = clamp(world.y, 0, almAlto)
    const existing = nodos.filter((n) => !n.idnodo.startsWith('new-'))
    const count = existing.length + 1
    const newNodo: Nodo = {
      idnodo: 'new-' + Date.now(), idalmacen: selectedAlmacen,
      nombre: (addingNodoType.replace('_', ' ')) + ' ' + count,
      tipo: addingNodoType as Nodo['tipo'],
      coordenada_x: cx, coordenada_y: cy, idubicacion: null, estado: true,
    }
    setNodos((prev) => [...prev, newNodo])
    setDirty(true)
    setSelectedEntity({ type: 'nodo', id: newNodo.idnodo })
    setPlacingNodo(false)
  }

  const handleDeleteEntity = async () => {
    if (!selType || !selId) return
    setDeleting(true)
    try {
      if (selId.startsWith('new-')) {
        if (selType === 'zona') { setZonas((prev) => prev.filter((z) => z.idzona !== selId)); setPasillos((prev) => prev.filter((p) => p.idzona !== selId)) }
        else if (selType === 'pasillo') { setPasillos((prev) => prev.filter((p) => p.idpasillo !== selId)); setEstantes((prev) => prev.filter((e) => e.idpasillo !== selId)) }
        else if (selType === 'estante') { setEstantes((prev) => prev.filter((e) => e.idestante !== selId)) }
        else if (selType === 'nodo') { setNodos((prev) => prev.filter((n) => n.idnodo !== selId)) }
        setSelectedEntity(null); setDirty(true); return
      }
      if (selType === 'zona') { await zonaService.remove(selId); setZonas((prev) => prev.filter((z) => z.idzona !== selId)) }
      else if (selType === 'pasillo') { await pasilloService.remove(selId); setPasillos((prev) => prev.filter((p) => p.idpasillo !== selId)) }
      else if (selType === 'estante') { await estanteService.remove(selId); setEstantes((prev) => prev.filter((e) => e.idestante !== selId)) }
      else if (selType === 'nodo') { await nodoService.remove(selId); setNodos((prev) => prev.filter((n) => n.idnodo !== selId)) }
      setSelectedEntity(null)
      addToast('success', (selType === 'zona' ? 'Zona' : selType === 'pasillo' ? 'Pasillo' : selType === 'estante' ? 'Estante' : 'Nodo') + ' eliminado')
    } catch { addToast('error', 'Error al eliminar') } finally { setDeleting(false) }
  }

  const handleUpdateZona = (id: string, data: Partial<Zona>) => { setZonas((prev) => prev.map((z) => z.idzona === id ? { ...z, ...data } : z)); setDirty(true) }
  const handleUpdatePasillo = (id: string, data: Partial<Pasillo>) => { setPasillos((prev) => prev.map((p) => p.idpasillo === id ? { ...p, ...data } : p)); setDirty(true) }
  const handleUpdateEstante = (id: string, data: Partial<Estante>) => { setEstantes((prev) => prev.map((e) => e.idestante === id ? { ...e, ...data } : e)); setDirty(true) }
  const handleUpdateNodo = (id: string, data: Partial<Nodo>) => { setNodos((prev) => prev.map((n) => n.idnodo === id ? { ...n, ...data } : n)); setDirty(true) }

  const autoGenerateConexiones = async (savedNodos: Nodo[], savedPasillos: Pasillo[], savedConexiones: Conexion[]) => {
    const newConexiones: Array<{ idnodoorigen: string; idnododestino: string; tipo: string; bidireccional: boolean; distancia: number }> = []
    const existingPairs = new Set<string>()
    savedConexiones.forEach((c) => { existingPairs.add(c.idnodoorigen + '-' + c.idnododestino); existingPairs.add(c.idnododestino + '-' + c.idnodoorigen) })
    for (const pasillo of savedPasillos) {
      const pMinX = pasillo.x; const pMaxX = pasillo.x + pasillo.ancho; const pMinY = pasillo.y; const pMaxY = pasillo.y + pasillo.largo
      const nodosEnPasillo = savedNodos.filter((n) => n.coordenada_x >= pMinX && n.coordenada_x <= pMaxX && n.coordenada_y >= pMinY && n.coordenada_y <= pMaxY)
      for (let i = 0; i < nodosEnPasillo.length - 1; i++) {
        const pair = nodosEnPasillo[i].idnodo + '-' + nodosEnPasillo[i + 1].idnodo
        if (!existingPairs.has(pair)) {
          const dx = nodosEnPasillo[i].coordenada_x - nodosEnPasillo[i + 1].coordenada_x
          const dy = nodosEnPasillo[i].coordenada_y - nodosEnPasillo[i + 1].coordenada_y
          newConexiones.push({ idnodoorigen: nodosEnPasillo[i].idnodo, idnododestino: nodosEnPasillo[i + 1].idnodo, tipo: 'pasillo', bidireccional: true, distancia: Math.round(Math.sqrt(dx * dx + dy * dy)) })
        }
      }
    }
    for (let i = 0; i < savedPasillos.length; i++) {
      for (let j = i + 1; j < savedPasillos.length; j++) {
        const a = savedPasillos[i]; const b = savedPasillos[j]
        const overlap = !(a.x + a.ancho < b.x || b.x + b.ancho < a.x || a.y + a.largo < b.y || b.y + b.largo < a.y)
        if (overlap) {
          const nodesA = savedNodos.filter((n) => n.coordenada_x >= a.x && n.coordenada_x <= a.x + a.ancho && n.coordenada_y >= a.y && n.coordenada_y <= a.y + a.largo)
          const nodesB = savedNodos.filter((n) => n.coordenada_x >= b.x && n.coordenada_x <= b.x + b.ancho && n.coordenada_y >= b.y && n.coordenada_y <= b.y + b.largo)
          if (nodesA.length === 0 || nodesB.length === 0) continue
          let minDist = Infinity; let pairA = nodesA[0]; let pairB = nodesB[0]
          for (const na of nodesA) for (const nb of nodesB) { const d = (na.coordenada_x - nb.coordenada_x) ** 2 + (na.coordenada_y - nb.coordenada_y) ** 2; if (d < minDist) { minDist = d; pairA = na; pairB = nb } }
          const pairKey = pairA.idnodo + '-' + pairB.idnodo
          if (!existingPairs.has(pairKey) && pairA.idnodo !== pairB.idnodo) newConexiones.push({ idnodoorigen: pairA.idnodo, idnododestino: pairB.idnodo, tipo: 'cruce', bidireccional: true, distancia: Math.round(Math.sqrt(minDist)) })
        }
      }
    }
    for (const conex of newConexiones) { try { await conexionService.create(conex as any) } catch { /* ignore */ } }
    return newConexiones.length
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const zonaIdMap = new Map<string, string>()
      const pasilloIdMap = new Map<string, string>()
      for (const zona of zonas) {
        const payload = { idalmacen: zona.idalmacen, nombre: zona.nombre, codigo: zona.codigo, tipo: zona.tipo, x: zona.x, y: zona.y, ancho: zona.ancho, alto: zona.alto, color: zona.color || null }
        if (zona.idzona.startsWith('new-')) { const res = await zonaService.create(payload); zonaIdMap.set(zona.idzona, res.data.idzona) }
        else { await zonaService.update(zona.idzona, payload); zonaIdMap.set(zona.idzona, zona.idzona) }
      }
      for (const pasillo of pasillos) {
        const effectiveZonaId = zonaIdMap.get(pasillo.idzona) || pasillo.idzona
        const payload = { idzona: effectiveZonaId, nombre: pasillo.nombre, codigo: pasillo.codigo, x: pasillo.x, y: pasillo.y, ancho: pasillo.ancho, largo: pasillo.largo, orientacion: pasillo.orientacion }
        if (pasillo.idpasillo.startsWith('new-')) { const res = await pasilloService.create(payload); pasilloIdMap.set(pasillo.idpasillo, res.data.idpasillo) }
        else { await pasilloService.update(pasillo.idpasillo, payload); pasilloIdMap.set(pasillo.idpasillo, pasillo.idpasillo) }
      }
      for (const estante of estantes) {
        const effectivePasilloId = pasilloIdMap.get(estante.idpasillo) || estante.idpasillo
        const payload = { idpasillo: effectivePasilloId, nombre: estante.nombre, codigo: estante.codigo, x: estante.x, y: estante.y, ancho: estante.ancho, alto: estante.alto, profundidad: estante.profundidad, lado: estante.lado, cantidadniveles: estante.cantidadniveles }
        if (estante.idestante.startsWith('new-')) { await estanteService.create(payload) }
        else { await estanteService.update(estante.idestante, payload) }
      }
      for (const nodo of nodos) {
        const payload = { idalmacen: nodo.idalmacen, nombre: nodo.nombre, tipo: nodo.tipo, coordenada_x: nodo.coordenada_x, coordenada_y: nodo.coordenada_y, idubicacion: nodo.idubicacion || null }
        if (nodo.idnodo.startsWith('new-')) { await nodoService.create(payload) }
        else { await nodoService.update(nodo.idnodo, payload) }
      }
      const [nodosRes, conexRes, pasillosRes] = await Promise.all([nodoService.list(selectedAlmacen), conexionService.list(), pasilloService.list()])
      const savedNodos = nodosRes.data.results; const savedConexiones = conexRes.data.results; const savedPasillos = pasillosRes.data.results
      setNodos(savedNodos); setConexiones(savedConexiones); setPasillos(savedPasillos)
      const generated = await autoGenerateConexiones(savedNodos, savedPasillos, savedConexiones)
      await reloadData()
      setDirty(false)
      addToast('success', 'Layout guardado' + (generated > 0 ? ' (' + generated + ' conexiones generadas)' : ''))
    } catch { addToast('error', 'Error al guardar layout') } finally { setSaving(false) }
  }

  const reloadData = async () => {
    if (!selectedAlmacen) return
    const [zonasRes, nodosRes, conexRes, almRes, pasillosRes, estantesRes] = await Promise.all([
      zonaService.list(selectedAlmacen), nodoService.list(selectedAlmacen), conexionService.list(),
      almacenService.get(selectedAlmacen), pasilloService.list(), estanteService.list(),
    ])
    setZonas(zonasRes.data.results); setNodos(nodosRes.data.results); setConexiones(conexRes.data.results)
    setAlmacenActual(almRes.data); setPasillos(pasillosRes.data.results); setEstantes(estantesRes.data.results)
  }

  const handleCancel = () => { setDirty(false); setSelectedEntity(null); setPlacingNodo(false); if (selectedAlmacen) reloadData() }

  const handleAlmacenChange = (id: string) => { setSelectedAlmacen(id); setSelectedEntity(null); setDirty(false); setPlacingNodo(false) }

  const gridStep = 50 * ESCALA
  return (
    <div className="flex gap-4">
      <div className="flex-1 min-w-0">
        <MapToolbar
          almacenes={almacenes} selectedAlmacen={selectedAlmacen} onSelectAlmacen={handleAlmacenChange}
          onAddZona={handleAddZona} onAddPasillo={handleAddPasillo} onAddEstante={handleAddEstante}
          zonasCount={zonas.length} pasillosCount={pasillos.length}
          addingNodoType={addingNodoType} onNodoTypeChange={setAddingNodoType}
          onStartPlaceNodo={handleStartPlaceNodo} placingNodo={placingNodo}
          showNodos={showNodos} onToggleNodos={setShowNodos}
          showConexiones={showConexiones} onToggleConexiones={setShowConexiones}
          dirty={dirty} saving={saving} onSave={handleSave} onCancel={handleCancel}
        />

        {!selectedAlmacen ? (
          <div className="text-center py-16 text-gray-400">Seleccione un almacén</div>
        ) : loading ? (
          <div className="flex justify-center py-16"><div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full" /></div>
        ) : (
          <div ref={containerRef} className="bg-gray-50 rounded-lg border overflow-hidden relative">
            <Stage ref={stageRef} width={size.width} height={size.height}
              onWheel={handleWheel} onClick={handleStageClick}
              onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}
              style={{ cursor: isPanning ? 'grabbing' : 'grab' }}>
              <Layer x={camera.x} y={camera.y} scaleX={camera.scale} scaleY={camera.scale}>
                {(() => {
                  const step = gridStep; const w = size.width; const h = size.height; const lines: React.ReactNode[] = []
                  for (let x = 0; x < w; x += step) { lines.push(<Line key={'gv'+x} points={[x,0,x,h]} stroke="#e0e0e0" strokeWidth={0.5} listening={false} />); lines.push(<Text key={'gl'+x} x={x+2} y={2} text={String(Math.round(x/ESCALA))} fontSize={8} fill="#ccc" listening={false} />) }
                  for (let y = 0; y < h; y += step) { lines.push(<Line key={'gh'+y} points={[0,y,w,y]} stroke="#e0e0e0" strokeWidth={0.5} listening={false} />); lines.push(<Text key={'gt'+y} x={2} y={y+2} text={String(Math.round(y/ESCALA))} fontSize={8} fill="#ccc" listening={false} />) }
                  return lines
                })()}

                <Rect x={ox} y={oy} width={almacenW} height={almacenH} fill="white" stroke="#333" strokeWidth={2} dash={[6,3]} listening={false} />
                <Text x={ox+4} y={oy-14} text={(almacenActual?.nombre || 'Almacén') + ' — ' + almAncho + '×' + almAlto + ' u'} fontSize={10} fill="#666" listening={false} />

                {showConexiones && conexFiltradas.map((conex) => {
                  const origen = nodos.find((n) => n.idnodo === conex.idnodoorigen)
                  const destino = nodos.find((n) => n.idnodo === conex.idnododestino)
                  if (!origen || !destino) return null
                  return <Line key={conex.idconexion} points={[origen.coordenada_x*ESCALA+ox, origen.coordenada_y*ESCALA+oy, destino.coordenada_x*ESCALA+ox, destino.coordenada_y*ESCALA+oy]} stroke={conex.tipo === 'cruce' ? '#FF9800' : '#78909C'} strokeWidth={conex.tipo === 'pasillo' ? 2 : 1} dash={conex.tipo === 'cruce' ? [4,4] : []} opacity={0.7} listening={false} />
                })}

                {zonas.map((zona) => {
                  const isSelected = selType === 'zona' && selId === zona.idzona
                  return <Group key={zona.idzona}>
                    <Rect ref={(node) => { if (node) shapeRefs.current['zona-'+zona.idzona] = node }} x={zona.x*ESCALA+ox} y={zona.y*ESCALA+oy} width={zona.ancho*ESCALA} height={zona.alto*ESCALA} fill={zona.color || TIPO_COLORS[zona.tipo] || '#e0e0e0'} opacity={isSelected ? 0.5 : 0.3} stroke={isSelected ? '#000' : zona.color || TIPO_COLORS[zona.tipo] || '#e0e0e0'} strokeWidth={isSelected ? 2 : 1} draggable={isSelected} onClick={() => handleSelect('zona', zona.idzona)} onTap={() => handleSelect('zona', zona.idzona)} onDragEnd={(e) => handleDragEnd('zona', zona.idzona, e)} onTransformEnd={() => handleTransformEnd('zona', zona.idzona)} />
                    <Text x={zona.x*ESCALA+ox+4} y={zona.y*ESCALA+oy+4} text={zona.nombre+'\n['+zona.x+','+zona.y+'] '+zona.ancho+'×'+zona.alto} fontSize={9} fill="#333" fontStyle="bold" listening={false} />
                  </Group>
                })}

                {pasillosFiltrados.map((pasillo) => {
                  const isSelected = selType === 'pasillo' && selId === pasillo.idpasillo
                  return <Group key={pasillo.idpasillo}>
                    <Rect ref={(node) => { if (node) shapeRefs.current['pasillo-'+pasillo.idpasillo] = node }} x={pasillo.x*ESCALA+ox} y={pasillo.y*ESCALA+oy} width={pasillo.ancho*ESCALA} height={pasillo.largo*ESCALA} fill="#C8E6C9" opacity={isSelected ? 0.7 : 0.5} stroke={isSelected ? '#000' : '#66BB6A'} strokeWidth={isSelected ? 2 : 1} draggable={isSelected} onClick={() => handleSelect('pasillo', pasillo.idpasillo)} onTap={() => handleSelect('pasillo', pasillo.idpasillo)} onDragEnd={(e) => handleDragEnd('pasillo', pasillo.idpasillo, e)} onTransformEnd={() => handleTransformEnd('pasillo', pasillo.idpasillo)} />
                    <Text x={pasillo.x*ESCALA+ox+4} y={pasillo.y*ESCALA+oy+4} text={pasillo.nombre+'\n['+pasillo.x+','+pasillo.y+'] '+pasillo.ancho+'×'+pasillo.largo} fontSize={8} fill="#333" fontStyle="bold" listening={false} />
                  </Group>
                })}

                {estantesFiltrados.map((estante) => {
                  const isSelected = selType === 'estante' && selId === estante.idestante
                  return <Group key={estante.idestante}>
                    <Rect ref={(node) => { if (node) shapeRefs.current['estante-'+estante.idestante] = node }} x={estante.x*ESCALA+ox} y={estante.y*ESCALA+oy} width={estante.ancho*ESCALA} height={estante.alto*ESCALA} fill="#A1887F" opacity={isSelected ? 0.9 : 0.7} stroke={isSelected ? '#000' : '#5D4037'} strokeWidth={isSelected ? 2 : 1} draggable={isSelected} onClick={() => handleSelect('estante', estante.idestante)} onTap={() => handleSelect('estante', estante.idestante)} onDragEnd={(e) => handleDragEnd('estante', estante.idestante, e)} onTransformEnd={() => handleTransformEnd('estante', estante.idestante)} />
                    <Text x={estante.x*ESCALA+ox+2} y={estante.y*ESCALA+oy+2} text={estante.codigo} fontSize={7} fill="#fff" fontStyle="bold" listening={false} />
                  </Group>
                })}

                {showNodos && nodosFiltrados.map((nodo) => {
                  const isSelected = selType === 'nodo' && selId === nodo.idnodo
                  return <Circle key={nodo.idnodo} ref={(node) => { if (node) shapeRefs.current['nodo-'+nodo.idnodo] = node }} x={nodo.coordenada_x*ESCALA+ox} y={nodo.coordenada_y*ESCALA+oy} radius={isSelected ? 7 : 5} fill={NODO_COLORS[nodo.tipo] || '#666'} stroke={isSelected ? '#000' : '#fff'} strokeWidth={isSelected ? 2 : 1.5} opacity={0.85} draggable={isSelected} onClick={() => handleSelect('nodo', nodo.idnodo)} onTap={() => handleSelect('nodo', nodo.idnodo)} onDragEnd={(e) => handleNodoDragEnd(nodo.idnodo, e)} />
                })}

                <Transformer ref={transformerRef} boundBoxFunc={(oldBox, newBox) => {
                  if (newBox.width < ENTITY_MIN * ESCALA || newBox.height < ENTITY_MIN * ESCALA) return oldBox
                  if (newBox.x < ox || newBox.y < oy) return oldBox
                  if (newBox.x + newBox.width > ox + almacenW) return oldBox
                  if (newBox.y + newBox.height > oy + almacenH) return oldBox
                  return newBox
                }} />
              </Layer>
            </Stage>

            <ZoomControls scale={camera.scale} onZoomIn={zoomIn} onZoomOut={zoomOut} onReset={zoomReset} />

            {placingNodo && <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded-lg text-sm shadow-lg">Click en el mapa para colocar el nodo</div>}
          </div>
        )}
      </div>
      <div className="w-64 shrink-0">
        <PropertiesPanel
          selectedEntity={selectedEntity} setDirty={setDirty}
          zona={selectedZona} pasillo={selectedPasillo} estante={selectedEstante} nodo={selectedNodo}
          zonas={zonas} pasillos={pasillos}
          onUpdateZona={handleUpdateZona} onUpdatePasillo={handleUpdatePasillo}
          onUpdateEstante={handleUpdateEstante} onUpdateNodo={handleUpdateNodo}
          onDelete={handleDeleteEntity} deleting={deleting} placingNodo={placingNodo}
        />
      </div>
    </div>
  )
}
