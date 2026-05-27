import { useState, useEffect, useRef, useCallback } from 'react'
import { Stage, Layer, Rect, Text, Circle, Line, Group, Transformer, RegularPolygon } from 'react-konva'
import Konva from 'konva'
import { almacenService, sucursalService } from '../../api/empresa'
import { zonaService, estanteService, nodoService, conexionService } from '../../api/layout'
import { useToastStore } from '../../store/toastStore'
import type { Almacen, Sucursal, Zona, Estante, Nodo, Conexion, FormaZona } from '../../types'
import BarraMapa from '../../components/dedicated/BarraMapa'
import ControlesZoom from '../../components/dedicated/ControlesZoom'
import PanelPropiedades from '../../components/dedicated/PanelPropiedades'
import MiniMapa from '../../components/dedicated/MiniMapa'
import EditorPoligono from '../../components/dedicated/EditorPoligono'

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

type NivelVista = 'sucursal' | 'almacen'

export default function MapaSucursal() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 800, height: 600 })
  const shapeRefs = useRef<Record<string, Konva.Shape>>({})
  const transformerRef = useRef<Konva.Transformer>(null)
  const stageRef = useRef<Konva.Stage>(null)

  // Selectores
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [sucursalSel, setSucursalSel] = useState('')
  const [sucursalActual, setSucursalActual] = useState<Sucursal | null>(null)

  // Nivel vista
  const [nivelVista, setNivelVista] = useState<NivelVista>('sucursal')

  // Datos nivel sucursal
  const [zonasSucursal, setZonasSucursal] = useState<Zona[]>([])
  const [mascarasAlmacen, setMascarasAlmacen] = useState<Zona[]>([])
  const [almacenes, setAlmacenes] = useState<Almacen[]>([])
  const [nodosSucursal, setNodosSucursal] = useState<Nodo[]>([])

  // Datos nivel almacén
  const [almacenSel, setAlmacenSel] = useState('')
  const [almacenActual, setAlmacenActual] = useState<Almacen | null>(null)
  const [zonasAlmacen, setZonasAlmacen] = useState<Zona[]>([])
  const [estantes, setEstantes] = useState<Estante[]>([])
  const [nodosAlmacen, setNodosAlmacen] = useState<Nodo[]>([])

  // Conexiones y UI
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
  const [editorPoligonoOpen, setEditorPoligonoOpen] = useState(false)
  const [zonaParaPoligono, setZonaParaPoligono] = useState<string | null>(null)

  const addToast = useToastStore((state) => state.addToast)

  // Dimensiones del plano actual
  const planoW = nivelVista === 'sucursal'
    ? (sucursalActual?.ancho_plano || 2500) * ESCALA
    : (almacenActual?.ancho ? Number(almacenActual.ancho) : 600) * ESCALA
  const planoH = nivelVista === 'sucursal'
    ? (sucursalActual?.alto_plano || 1800) * ESCALA
    : (almacenActual?.alto ? Number(almacenActual.alto) : 400) * ESCALA

  const canvasOffset = { x: 50, y: 50 }

  // Entidades seleccionadas
  const selType = selectedEntity?.type ?? null
  const selId = selectedEntity?.id ?? null
  const selectedZona = selType === 'zona' ? [...zonasSucursal, ...zonasAlmacen].find(z => z.idzona === selId) ?? null : null
  const selectedEstante = selType === 'estante' ? estantes.find(e => e.idestante === selId) ?? null : null
  const selectedNodo = selType === 'nodo' ? [...nodosSucursal, ...nodosAlmacen].find(n => n.idnodo === selId) ?? null : null
  const selectedAlmacen = selType === 'almacen' ? almacenActual : null

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

  // Cargar sucursales
  useEffect(() => {
    sucursalService.list().then(({ data }) => setSucursales(data.results)).catch(() => {})
  }, [])

  // Al cambiar sucursal
  useEffect(() => {
    if (!sucursalSel) {
      setMascarasAlmacen([]); setZonasSucursal([]); setNodosSucursal([]); setAlmacenes([])
      setSucursalActual(null)
      return
    }
    setLoading(true)
    const suc = sucursales.find(s => s.idsucursal === sucursalSel)
    setSucursalActual(suc || null)

    Promise.all([
      zonaService.list({ idsucursal: sucursalSel }),
      nodoService.list({ idsucursal: sucursalSel }),
      sucursalService.getAlmacenes(sucursalSel),
    ])
      .then(([zonasRes, nodosRes, almRes]) => {
        const allZonas = zonasRes.data.results
        setMascarasAlmacen(allZonas.filter(z => z.es_mascara))
        setZonasSucursal(allZonas.filter(z => !z.es_mascara))
        setNodosSucursal(nodosRes.data.results)
        setAlmacenes(almRes.data)

        // Fit camera
        if (suc && containerRef.current) {
          const cw = containerRef.current.offsetWidth
          const ch = Math.max(800, window.innerHeight - 160)
          const pw = Number(suc.ancho_plano) || 2500
          const ph = Number(suc.alto_plano) || 1800
          const pW = pw * ESCALA
          const pH = ph * ESCALA
          const pad = 40
          const fit = Math.min((cw - pad * 2) / pW, (ch - pad * 2) / pH)
          setCamera({
            x: cw / 2 - (canvasOffset.x + pW / 2) * fit,
            y: ch / 2 - (canvasOffset.y + pH / 2) * fit,
            scale: Math.max(0.1, Math.min(fit, 3)),
          })
        }
      })
      .catch(() => addToast('error', 'Error al cargar sucursal'))
      .finally(() => setLoading(false))
  }, [sucursalSel])

  // Al cambiar almacén (modo almacén)
  useEffect(() => {
    if (!almacenSel || nivelVista !== 'almacen') return
    setLoading(true)
    Promise.all([
      zonaService.list({ idalmacen: almacenSel }),
      estanteService.list(),
      nodoService.list({ idalmacen: almacenSel }),
      conexionService.list(),
      almacenService.get(almacenSel),
    ])
      .then(([zonasRes, estRes, nodosRes, conexRes, almRes]) => {
        const allZonas = zonasRes.data.results
        const allEstantes = estRes.data.results
        const zonaIds = new Set(allZonas.map(z => z.idzona))
        const filteredEstantes = allEstantes.filter(e => zonaIds.has(e.idzona))
        setZonasAlmacen(allZonas)
        setEstantes(filteredEstantes)
        setNodosAlmacen(nodosRes.data.results)
        setConexiones(conexRes.data.results)
        setAlmacenActual(almRes.data)

        if (almRes.data && containerRef.current) {
          const cw = containerRef.current.offsetWidth
          const ch = Math.max(800, window.innerHeight - 160)
          const aw = Number(almRes.data.ancho) || 600
          const ah = Number(almRes.data.alto) || 400
          const aW = aw * ESCALA
          const aH = ah * ESCALA
          const pad = 40
          const fit = Math.min((cw - pad * 2) / aW, (ch - pad * 2) / aH)
          setCamera({
            x: cw / 2 - (canvasOffset.x + aW / 2) * fit,
            y: ch / 2 - (canvasOffset.y + aH / 2) * fit,
            scale: Math.max(0.3, Math.min(fit, 3)),
          })
        }
      })
      .catch(() => addToast('error', 'Error al cargar almacén'))
      .finally(() => setLoading(false))
  }, [almacenSel, nivelVista])

  // Transformer
  useEffect(() => {
    if (!transformerRef.current) return
    if (selType && selId && shapeRefs.current[selType + '-' + selId]) {
      transformerRef.current.nodes([shapeRefs.current[selType + '-' + selId]])
      transformerRef.current.getLayer()?.batchDraw()
    } else {
      transformerRef.current.nodes([])
      transformerRef.current.getLayer()?.batchDraw()
    }
  }, [selectedEntity, selType, selId])

  // Filtrado de datos
  const zonasVisibles = nivelVista === 'sucursal' ? zonasSucursal : zonasAlmacen
  const nodosVisibles = nivelVista === 'sucursal' ? nodosSucursal : nodosAlmacen
  const conexFiltradas = conexiones.filter(c => {
    const ids = new Set(nodosVisibles.map(n => n.idnodo))
    return ids.has(c.idnodoorigen) && ids.has(c.idnododestino)
  })
  const zonasIds = new Set(zonasVisibles.map(z => z.idzona))
  const estantesFiltrados = estantes.filter(e => zonasIds.has(e.idzona))

  // Zoom
  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault()
    const stage = e.target.getStage()
    if (!stage) return
    const pointer = stage.getPointerPosition()
    if (!pointer) return
    const scaleBy = 1.1
    const direction = e.evt.deltaY > 0 ? -1 : 1
    const newScale = direction > 0 ? camera.scale * scaleBy : camera.scale / scaleBy
    if (newScale < 0.1 || newScale > 5) return
    const mousePointTo = {
      x: (pointer.x - camera.x) / camera.scale,
      y: (pointer.y - camera.y) / camera.scale,
    }
    setCamera({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
      scale: newScale,
    })
  }, [camera])

  const zoomIn = () => setCamera(p => ({ ...p, scale: Math.min(p.scale * 1.2, 5) }))
  const zoomOut = () => setCamera(p => ({ ...p, scale: Math.max(p.scale / 1.2, 0.1) }))
  const zoomReset = () => {
    const pw = nivelVista === 'sucursal' ? (sucursalActual?.ancho_plano || 2500) * ESCALA : (almacenActual?.ancho ? Number(almacenActual.ancho) : 600) * ESCALA
    const ph = nivelVista === 'sucursal' ? (sucursalActual?.alto_plano || 1800) * ESCALA : (almacenActual?.alto ? Number(almacenActual.alto) : 400) * ESCALA
    const pad = 40
    const fit = Math.min((size.width - pad * 2) / pw, (size.height - pad * 2) / ph)
    setCamera({
      x: size.width / 2 - (canvasOffset.x + pw / 2) * fit,
      y: size.height / 2 - (canvasOffset.y + ph / 2) * fit,
      scale: Math.max(0.1, Math.min(fit, 3)),
    })
  }

  // Pan
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
    setCamera(p => ({ ...p, x: p.x + dx, y: p.y + dy }))
    setPanStart({ x: e.evt.clientX, y: e.evt.clientY })
  }
  const handleMouseUp = () => setIsPanning(false)

  // Coordenadas
  const screenToWorld = (sx: number, sy: number) => {
    const wx = (sx - camera.x) / camera.scale
    const wy = (sy - camera.y) / camera.scale
    return {
      x: Math.round((wx - canvasOffset.x) / ESCALA),
      y: Math.round((wy - canvasOffset.y) / ESCALA),
    }
  }

  const handleSelect = (type: string, id: string) => {
    if (placingNodo) return
    setSelectedEntity(prev => (prev?.type === type && prev?.id === id) ? null : { type, id })
  }

  const clamp = (val: number, min: number, max: number) => Math.max(min, Math.min(max, val))

  // Drag & Transform
  const handleDragEnd = (type: string, id: string, e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target
    const newX = clamp(node.x() - canvasOffset.x, 0, planoW - node.width() * node.scaleX())
    const newY = clamp(node.y() - canvasOffset.y, 0, planoH - node.height() * node.scaleY())
    node.x(newX + canvasOffset.x)
    node.y(newY + canvasOffset.y)
    const ux = Math.round(newX / ESCALA)
    const uy = Math.round(newY / ESCALA)
    if (type === 'zona') {
      const setter = nivelVista === 'sucursal' ? setZonasSucursal : setZonasAlmacen
      setter(prev => prev.map(z => z.idzona === id ? { ...z, x: ux, y: uy } : z))
    } else if (type === 'estante') {
      setEstantes(prev => prev.map(es => es.idestante === id ? { ...es, x: ux, y: uy } : es))
    }
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
    const rx = clamp(Math.round((node.x() - canvasOffset.x) / ESCALA), 0, (nivelVista === 'sucursal' ? (sucursalActual?.ancho_plano || 2500) : (almacenActual?.ancho ? Number(almacenActual.ancho) : 600)) - w)
    const ry = clamp(Math.round((node.y() - canvasOffset.y) / ESCALA), 0, (nivelVista === 'sucursal' ? (sucursalActual?.alto_plano || 1800) : (almacenActual?.alto ? Number(almacenActual.alto) : 400)) - h)
    node.x(rx * ESCALA + canvasOffset.x)
    node.y(ry * ESCALA + canvasOffset.y)
    node.width(w * ESCALA)
    node.height(h * ESCALA)
    if (type === 'zona') {
      const setter = nivelVista === 'sucursal' ? setZonasSucursal : setZonasAlmacen
      setter(prev => prev.map(z => z.idzona === id ? { ...z, x: rx, y: ry, ancho: w, alto: h } : z))
    } else if (type === 'estante') {
      setEstantes(prev => prev.map(es => es.idestante === id ? { ...es, x: rx, y: ry, ancho: w, alto: h } : es))
    }
    setDirty(true)
  }

  const handleNodoDragEnd = (id: string, e: Konva.KonvaEventObject<DragEvent>) => {
    const wx = clamp(Math.round((e.target.x() - canvasOffset.x) / ESCALA), 0, nivelVista === 'sucursal' ? (sucursalActual?.ancho_plano || 2500) : (almacenActual?.ancho ? Number(almacenActual.ancho) : 600))
    const wy = clamp(Math.round((e.target.y() - canvasOffset.y) / ESCALA), 0, nivelVista === 'sucursal' ? (sucursalActual?.alto_plano || 1800) : (almacenActual?.alto ? Number(almacenActual.alto) : 400))
    e.target.x(wx * ESCALA + canvasOffset.x)
    e.target.y(wy * ESCALA + canvasOffset.y)
    const setter = nivelVista === 'sucursal' ? setNodosSucursal : setNodosAlmacen
    setter(prev => prev.map(n => n.idnodo === id ? { ...n, coordenada_x: wx, coordenada_y: wy } : n))
    setDirty(true)
  }

  // Agregar entidades
  const handleAgregarZona = () => {
    if (nivelVista === 'sucursal' && !sucursalSel) return
    if (nivelVista === 'almacen' && !almacenSel) return

    const existing = zonasVisibles.filter(z => !z.idzona.startsWith('new-'))
    const count = existing.length + 1
    const newZona: Zona = {
      idzona: 'new-' + Date.now(),
      idsucursal: nivelVista === 'sucursal' ? sucursalSel : null,
      idalmacen: nivelVista === 'almacen' ? almacenSel : null,
      nombre: nivelVista === 'sucursal' ? `Zona ${count}` : `Zona ${count}`,
      codigo: `Z-${String(count).padStart(2, '0')}`,
      tipo: nivelVista === 'sucursal' ? 'recepcion' : 'almacenamiento',
      x: 10 + ((count - 1) % 3) * 120,
      y: 10 + Math.floor((count - 1) / 3) * 100,
      ancho: nivelVista === 'sucursal' ? 200 : 100,
      alto: nivelVista === 'sucursal' ? 150 : 80,
      z_base: 0,
      z_techo: 300,
      poligono: null,
      color: nivelVista === 'sucursal' ? '#4CAF50' : '#2196F3',
      estado: true,
      es_mascara: false,
    }
    if (nivelVista === 'sucursal') setZonasSucursal(prev => [...prev, newZona])
    else setZonasAlmacen(prev => [...prev, newZona])
    setDirty(true)
    setSelectedEntity({ type: 'zona', id: newZona.idzona })
    setPlacingNodo(false)
  }

  const handleAgregarAlmacen = () => {
    if (!sucursalSel) return
    const existing = almacenes.filter(a => !a.idalmacen.startsWith('new-'))
    const count = existing.length + 1
    const newAlm: Almacen = {
      idalmacen: 'new-' + Date.now(),
      idsucursal: sucursalSel,
      nombre: `Almacén ${count}`,
      codigo: `ALM-${String(count).padStart(2, '0')}`,
      descripcion: null,
      ancho: 600,
      alto: 400,
      capacidadmaxima: null,
      fechacreacion: new Date().toISOString(),
      estado: true,
    }
    setAlmacenes(prev => [...prev, newAlm])

    // Crear zona máscara
    const newMascara: Zona = {
      idzona: 'new-masc-' + Date.now(),
      idsucursal: sucursalSel,
      idalmacen: newAlm.idalmacen,
      nombre: newAlm.nombre,
      codigo: `MASC-${newAlm.codigo}`,
      tipo: 'almacenamiento',
      x: 20 + ((count - 1) % 3) * 300,
      y: 20 + Math.floor((count - 1) / 3) * 250,
      ancho: 600,
      alto: 400,
      z_base: 0,
      z_techo: 300,
      poligono: null,
      color: '#1E3A5F',
      estado: true,
      es_mascara: true,
    }
    setMascarasAlmacen(prev => [...prev, newMascara])
    setDirty(true)
  }

  const handleAgregarEstante = () => {
    if (!almacenSel || zonasAlmacen.length === 0) return
    const existing = estantes.filter(e => !e.idestante.startsWith('new-'))
    const count = existing.length + 1
    const zonaId = selectedZona?.idzona || zonasAlmacen[0].idzona
    const newEstante: Estante = {
      idestante: 'new-' + Date.now(),
      idzona: zonaId,
      nombre: `Estante ${count}`,
      codigo: `E-${String(count).padStart(2, '0')}`,
      x: 20,
      y: 20 + (count - 1) * 90,
      z_base: 0,
      rotacion: 0,
      ancho: 30,
      alto: 80,
      profundidad: 50,
      cantidadniveles: 4,
      estado: true,
    }
    setEstantes(prev => [...prev, newEstante])
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
    const cx = clamp(world.x, 0, nivelVista === 'sucursal' ? (sucursalActual?.ancho_plano || 2500) : (almacenActual?.ancho ? Number(almacenActual.ancho) : 600))
    const cy = clamp(world.y, 0, nivelVista === 'sucursal' ? (sucursalActual?.alto_plano || 1800) : (almacenActual?.alto ? Number(almacenActual.alto) : 400))
    const existing = nodosVisibles.filter(n => !n.idnodo.startsWith('new-'))
    const count = existing.length + 1
    const newNodo: Nodo = {
      idnodo: 'new-' + Date.now(),
      idsucursal: nivelVista === 'sucursal' ? sucursalSel : null,
      idalmacen: nivelVista === 'almacen' ? almacenSel : null,
      nombre: `${addingNodoType.replace('_', ' ')} ${count}`,
      tipo: addingNodoType as Nodo['tipo'],
      coordenada_x: cx,
      coordenada_y: cy,
      idubicacion: null,
      estado: true,
    }
    const setter = nivelVista === 'sucursal' ? setNodosSucursal : setNodosAlmacen
    setter(prev => [...prev, newNodo])
    setDirty(true)
    setSelectedEntity({ type: 'nodo', id: newNodo.idnodo })
    setPlacingNodo(false)
  }

  // Click en máscara de almacén para entrar
  const handleMascaraClick = (idalmacen: string) => {
    if (placingNodo) return
    setAlmacenSel(idalmacen)
    setNivelVista('almacen')
    setSelectedEntity(null)
  }

  // Eliminar
  const handleDeleteEntity = async () => {
    if (!selType || !selId) return
    setDeleting(true)
    try {
      if (selId.startsWith('new-')) {
        if (selType === 'zona') {
          if (nivelVista === 'sucursal') setZonasSucursal(prev => prev.filter(z => z.idzona !== selId))
          else setZonasAlmacen(prev => prev.filter(z => z.idzona !== selId))
          setEstantes(prev => prev.filter(e => e.idzona !== selId))
        } else if (selType === 'estante') {
          setEstantes(prev => prev.filter(e => e.idestante !== selId))
        } else if (selType === 'nodo') {
          if (nivelVista === 'sucursal') setNodosSucursal(prev => prev.filter(n => n.idnodo !== selId))
          else setNodosAlmacen(prev => prev.filter(n => n.idnodo !== selId))
        } else if (selType === 'almacen') {
          setAlmacenes(prev => prev.filter(a => a.idalmacen !== selId))
          setMascarasAlmacen(prev => prev.filter(z => z.idalmacen !== selId))
        }
        setSelectedEntity(null); setDirty(true); return
      }
      if (selType === 'zona') { await zonaService.remove(selId); if (nivelVista === 'sucursal') setZonasSucursal(prev => prev.filter(z => z.idzona !== selId)); else setZonasAlmacen(prev => prev.filter(z => z.idzona !== selId)) }
      else if (selType === 'estante') { await estanteService.remove(selId); setEstantes(prev => prev.filter(e => e.idestante !== selId)) }
      else if (selType === 'nodo') { await nodoService.remove(selId); if (nivelVista === 'sucursal') setNodosSucursal(prev => prev.filter(n => n.idnodo !== selId)); else setNodosAlmacen(prev => prev.filter(n => n.idnodo !== selId)) }
      setSelectedEntity(null)
      addToast('success', `${selType === 'zona' ? 'Zona' : selType === 'estante' ? 'Estante' : selType === 'almacen' ? 'Almacén' : 'Nodo'} eliminado`)
    } catch { addToast('error', 'Error al eliminar') } finally { setDeleting(false) }
  }

  // Updates
  const handleUpdateZona = (id: string, data: Partial<Zona>) => {
    if (nivelVista === 'sucursal') setZonasSucursal(prev => prev.map(z => z.idzona === id ? { ...z, ...data } : z))
    else setZonasAlmacen(prev => prev.map(z => z.idzona === id ? { ...z, ...data } : z))
    setDirty(true)
  }
  const handleUpdateEstante = (id: string, data: Partial<Estante>) => { setEstantes(prev => prev.map(e => e.idestante === id ? { ...e, ...data } : e)); setDirty(true) }
  const handleUpdateNodo = (id: string, data: Partial<Nodo>) => {
    if (nivelVista === 'sucursal') setNodosSucursal(prev => prev.map(n => n.idnodo === id ? { ...n, ...data } : n))
    else setNodosAlmacen(prev => prev.map(n => n.idnodo === id ? { ...n, ...data } : n))
    setDirty(true)
  }
  const handleUpdateAlmacen = (id: string, data: Partial<Almacen>) => {
    setAlmacenes(prev => prev.map(a => a.idalmacen === id ? { ...a, ...data } : a))
    // También actualizar la zona máscara
    setMascarasAlmacen(prev => prev.map(z => z.idalmacen === id ? { ...z, nombre: data.nombre || z.nombre, ancho: data.ancho ? Number(data.ancho) : z.ancho, alto: data.alto ? Number(data.alto) : z.alto } : z))
    setDirty(true)
  }

  // Guardar
  const handleSave = async () => {
    setSaving(true)
    try {
      // Guardar almacenes nuevos
      for (const alm of almacenes) {
        if (alm.idalmacen.startsWith('new-')) {
          await almacenService.create({ idsucursal: sucursalSel, nombre: alm.nombre, codigo: alm.codigo, ancho: alm.ancho, alto: alm.alto, descripcion: alm.descripcion })
        } else {
          await almacenService.update(alm.idalmacen, { nombre: alm.nombre, codigo: alm.codigo, ancho: alm.ancho, alto: alm.alto, descripcion: alm.descripcion })
        }
      }

      // Guardar zonas
      for (const zona of [...zonasSucursal, ...zonasAlmacen]) {
        const payload: Record<string, unknown> = { idsucursal: zona.idsucursal, idalmacen: zona.idalmacen, nombre: zona.nombre, codigo: zona.codigo, tipo: zona.tipo, x: zona.x, y: zona.y, ancho: zona.ancho, alto: zona.alto, color: zona.color || null, z_base: zona.z_base, z_techo: zona.z_techo, poligono: zona.poligono }
        if (zona.idzona.startsWith('new-')) { await zonaService.create(payload) }
        else { await zonaService.update(zona.idzona, payload) }
      }

      // Guardar estantes (solo modo almacén)
      for (const estante of estantes) {
        const payload = { idzona: estante.idzona, nombre: estante.nombre, codigo: estante.codigo, x: estante.x, y: estante.y, ancho: estante.ancho, alto: estante.alto, profundidad: estante.profundidad, cantidadniveles: estante.cantidadniveles, z_base: estante.z_base, rotacion: estante.rotacion }
        if (estante.idestante.startsWith('new-')) { await estanteService.create(payload) }
        else { await estanteService.update(estante.idestante, payload) }
      }

      // Guardar nodos
      for (const nodo of [...nodosSucursal, ...nodosAlmacen]) {
        const payload = { idsucursal: nodo.idsucursal, idalmacen: nodo.idalmacen, nombre: nodo.nombre, tipo: nodo.tipo, coordenada_x: nodo.coordenada_x, coordenada_y: nodo.coordenada_y, idubicacion: nodo.idubicacion || null }
        if (nodo.idnodo.startsWith('new-')) { await nodoService.create(payload) }
        else { await nodoService.update(nodo.idnodo, payload) }
      }

      // Recargar
      await reloadData()
      setDirty(false)
      addToast('success', 'Mapa guardado')
    } catch { addToast('error', 'Error al guardar') } finally { setSaving(false) }
  }

  const reloadData = async () => {
    if (!sucursalSel) return
    const [zonasRes, nodosRes, almRes] = await Promise.all([
      zonaService.list({ idsucursal: sucursalSel }),
      nodoService.list({ idsucursal: sucursalSel }),
      sucursalService.getAlmacenes(sucursalSel),
    ])
    const allZonas = zonasRes.data.results
    setMascarasAlmacen(allZonas.filter(z => z.es_mascara))
    setZonasSucursal(allZonas.filter(z => !z.es_mascara))
    setNodosSucursal(nodosRes.data.results)
    setAlmacenes(almRes.data)

    if (almacenSel) {
      const [zRes, eRes, nRes, cRes, aRes] = await Promise.all([
        zonaService.list({ idalmacen: almacenSel }),
        estanteService.list(),
        nodoService.list({ idalmacen: almacenSel }),
        conexionService.list(),
        almacenService.get(almacenSel),
      ])
      const allZ = zRes.data.results
      const zIds = new Set(allZ.map(z => z.idzona))
      setZonasAlmacen(allZ)
      setEstantes(eRes.data.results.filter(e => zIds.has(e.idzona)))
      setNodosAlmacen(nRes.data.results)
      setConexiones(cRes.data.results)
      setAlmacenActual(aRes.data)
    }
  }

  const handleCancel = () => { setDirty(false); setSelectedEntity(null); setPlacingNodo(false); if (sucursalSel) reloadData() }
  const handleAlmacenChange = (id: string) => { setAlmacenSel(id); setSelectedEntity(null); setDirty(false); setPlacingNodo(false) }
  const handleSucursalChange = (id: string) => { setSucursalSel(id); setAlmacenSel(''); setNivelVista('sucursal'); setSelectedEntity(null); setDirty(false); setPlacingNodo(false) }
  const handleCambiarNivel = (nivel: 'sucursal' | 'almacen') => {
    setNivelVista(nivel)
    setSelectedEntity(null)
    setPlacingNodo(false)
    if (nivel === 'sucursal') {
      setAlmacenSel('')
      setZonasAlmacen([])
      setEstantes([])
      setNodosAlmacen([])
      setConexiones([])
      setAlmacenActual(null)
    }
  }

  // Grid
  const gridStep = 50 * ESCALA

  // Helper para renderizar forma de zona
  const renderZonaShape = (zona: Zona, isSelected: boolean, key: string) => {
    const x = zona.x * ESCALA + canvasOffset.x
    const y = zona.y * ESCALA + canvasOffset.y
    const w = (zona.ancho ?? 100) * ESCALA
    const h = (zona.alto ?? 80) * ESCALA
    const color = zona.color || TIPO_COLORS[zona.tipo] || '#e0e0e0'

    if (zona.poligono && zona.poligono.tipo === 'poligono') {
      const pts = zona.poligono.puntos.flatMap(p => [p[0] * ESCALA + canvasOffset.x, p[1] * ESCALA + canvasOffset.y])
      return (
        <Group key={key}>
          <Line ref={(node) => { if (node) shapeRefs.current[key] = node }} points={pts} closed fill={color} opacity={isSelected ? 0.5 : 0.3} stroke={isSelected ? '#000' : color} strokeWidth={isSelected ? 2 : 1} draggable={isSelected} onClick={() => handleSelect('zona', zona.idzona)} onTap={() => handleSelect('zona', zona.idzona)} onDragEnd={(e) => handleDragEnd('zona', zona.idzona, e)} />
          <Text x={x + 4} y={y + 4} text={zona.nombre} fontSize={9} fill="#333" fontStyle="bold" listening={false} />
        </Group>
      )
    }

    if (zona.poligono && zona.poligono.tipo === 'circulo') {
      const cx = zona.poligono.centro[0] * ESCALA + canvasOffset.x
      const cy = zona.poligono.centro[1] * ESCALA + canvasOffset.y
      const r = zona.poligono.radio * ESCALA
      return (
        <Group key={key}>
          <Circle ref={(node) => { if (node) shapeRefs.current[key] = node }} x={cx} y={cy} radius={r} fill={color} opacity={isSelected ? 0.5 : 0.3} stroke={isSelected ? '#000' : color} strokeWidth={isSelected ? 2 : 1} draggable={isSelected} onClick={() => handleSelect('zona', zona.idzona)} onTap={() => handleSelect('zona', zona.idzona)} onDragEnd={(e) => handleDragEnd('zona', zona.idzona, e)} />
          <Text x={cx - 20} y={cy - 4} text={zona.nombre} fontSize={9} fill="#333" fontStyle="bold" listening={false} />
        </Group>
      )
    }

    // Rectángulo (default)
    return (
      <Group key={key}>
        <Rect ref={(node) => { if (node) shapeRefs.current[key] = node }} x={x} y={y} width={w} height={h} fill={color} opacity={isSelected ? 0.5 : 0.3} stroke={isSelected ? '#000' : color} strokeWidth={isSelected ? 2 : 1} draggable={isSelected} onClick={() => handleSelect('zona', zona.idzona)} onTap={() => handleSelect('zona', zona.idzona)} onDragEnd={(e) => handleDragEnd('zona', zona.idzona, e)} onTransformEnd={() => handleTransformEnd('zona', zona.idzona)} />
        <Text x={x + 4} y={y + 4} text={zona.nombre + ' [' + zona.x + ',' + zona.y + '] ' + (zona.ancho ?? 100) + 'x' + (zona.alto ?? 80)} fontSize={9} fill="#333" fontStyle="bold" listening={false} />
      </Group>
    )
  }

  return (
    <div className="flex gap-4">
      <div className="flex-1 min-w-0">
        <BarraMapa
          sucursales={sucursales} sucursalSel={sucursalSel} onSelectSucursal={handleSucursalChange}
          almacenes={almacenes} almacenSel={almacenSel} onSelectAlmacen={handleAlmacenChange}
          nivelVista={nivelVista} onCambiarNivel={handleCambiarNivel}
          onAgregarZona={handleAgregarZona} onAgregarAlmacen={handleAgregarAlmacen} onAgregarEstante={handleAgregarEstante}
          zonasCount={zonasVisibles.length} almacenesCount={mascarasAlmacen.length} estantesCount={estantes.length} nodosCount={nodosVisibles.length}
          addingNodoType={addingNodoType} onNodoTypeChange={setAddingNodoType}
          onStartPlaceNodo={handleStartPlaceNodo} placingNodo={placingNodo}
          showNodos={showNodos} onToggleNodos={setShowNodos}
          showConexiones={showConexiones} onToggleConexiones={setShowConexiones}
          dirty={dirty} saving={saving} onSave={handleSave} onCancel={handleCancel}
        />

        {!sucursalSel ? (
          <div className="text-center py-16 text-texto-secundario">Seleccione una sucursal para comenzar</div>
        ) : loading ? (
          <div className="flex justify-center py-16"><div className="animate-spin h-8 w-8 border-b-2 border-accion rounded-full" /></div>
        ) : (
          <div ref={containerRef} className="bg-fondo rounded-xl border border-borde-suave overflow-hidden relative">
            <Stage ref={stageRef} width={size.width} height={size.height}
              onWheel={handleWheel} onClick={handleStageClick}
              onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}
              style={{ cursor: isPanning ? 'grabbing' : 'grab' }}>
              <Layer x={camera.x} y={camera.y} scaleX={camera.scale} scaleY={camera.scale}>
                {/* Grid */}
                {(() => {
                  const step = gridStep; const w = size.width; const h = size.height; const lines: React.ReactNode[] = []
                  for (let x = 0; x < w; x += step) { lines.push(<Line key={'gv' + x} points={[x, 0, x, h]} stroke="#e0e0e0" strokeWidth={0.5} listening={false} />) }
                  for (let y = 0; y < h; y += step) { lines.push(<Line key={'gh' + y} points={[0, y, w, y]} stroke="#e0e0e0" strokeWidth={0.5} listening={false} />) }
                  return lines
                })()}

                {/* Plano */}
                <Rect x={canvasOffset.x} y={canvasOffset.y} width={planoW} height={planoH} fill="white" stroke="#333" strokeWidth={2} dash={[6, 3]} listening={false} />
                <Text x={canvasOffset.x + 4} y={canvasOffset.y - 14} text={(nivelVista === 'sucursal' ? (sucursalActual?.nombre || 'Sucursal') : (almacenActual?.nombre || 'Almacén')) + ' — ' + Math.round(planoW / ESCALA) + 'x' + Math.round(planoH / ESCALA) + ' u'} fontSize={10} fill="#666" listening={false} />

                {/* Modo sucursal: zonas + máscaras */}
                {nivelVista === 'sucursal' && zonasVisibles.map(zona => renderZonaShape(zona, selType === 'zona' && selId === zona.idzona, 'zona-' + zona.idzona))}
                {nivelVista === 'sucursal' && mascarasAlmacen.map(zona => {
                  const isSelected = selType === 'almacen' && selId === zona.idalmacen
                  const x = zona.x * ESCALA + canvasOffset.x
                  const y = zona.y * ESCALA + canvasOffset.y
                  const w = (zona.ancho ?? 100) * ESCALA
                  const h = (zona.alto ?? 80) * ESCALA
                  return (
                    <Group key={'masc-' + zona.idzona}>
                      <Rect ref={(node) => { if (node) shapeRefs.current['almacen-' + zona.idalmacen] = node }} x={x} y={y} width={w} height={h} fill="#1E3A5F" opacity={isSelected ? 0.6 : 0.2} stroke={isSelected ? '#FF8800' : '#1E3A5F'} strokeWidth={isSelected ? 3 : 2} dash={[8, 4]} draggable={isSelected} onClick={() => handleMascaraClick(zona.idalmacen!)} onDragEnd={(e) => handleDragEnd('zona', zona.idzona, e)} onTransformEnd={() => handleTransformEnd('zona', zona.idzona)} />
                      <Text x={x + 4} y={y + 4} text={'🏭 ' + zona.nombre} fontSize={10} fill={isSelected ? '#FF8800' : '#1E3A5F'} fontStyle="bold" listening={false} />
                      <Text x={x + 4} y={y + 18} text={'Click para editar'} fontSize={8} fill="#666" listening={false} />
                    </Group>
                  )
                })}

                {/* Modo almacén: zonas + estantes */}
                {nivelVista === 'almacen' && zonasVisibles.map(zona => renderZonaShape(zona, selType === 'zona' && selId === zona.idzona, 'zona-' + zona.idzona))}
                {nivelVista === 'almacen' && estantesFiltrados.map(estante => {
                  const isSelected = selType === 'estante' && selId === estante.idestante
                  const x = estante.x * ESCALA + canvasOffset.x
                  const y = estante.y * ESCALA + canvasOffset.y
                  const w = estante.ancho * ESCALA
                  const h = estante.alto * ESCALA
                  return (
                    <Group key={estante.idestante}>
                      <Rect ref={(node) => { if (node) shapeRefs.current['estante-' + estante.idestante] = node }} x={x} y={y} width={w} height={h} fill="#A1887F" opacity={isSelected ? 0.9 : 0.7} stroke={isSelected ? '#000' : '#5D4037'} strokeWidth={isSelected ? 2 : 1} draggable={isSelected} onClick={() => handleSelect('estante', estante.idestante)} onTap={() => handleSelect('estante', estante.idestante)} onDragEnd={(e) => handleDragEnd('estante', estante.idestante, e)} onTransformEnd={() => handleTransformEnd('estante', estante.idestante)} />
                      <Text x={x + 2} y={y + 2} text={estante.codigo} fontSize={7} fill="#fff" fontStyle="bold" listening={false} />
                    </Group>
                  )
                })}

                {/* Conexiones (solo modo almacén) */}
                {nivelVista === 'almacen' && showConexiones && conexFiltradas.map(conex => {
                  const origen = nodosVisibles.find(n => n.idnodo === conex.idnodoorigen)
                  const destino = nodosVisibles.find(n => n.idnodo === conex.idnododestino)
                  if (!origen || !destino) return null
                  return <Line key={conex.idconexion} points={[origen.coordenada_x * ESCALA + canvasOffset.x, origen.coordenada_y * ESCALA + canvasOffset.y, destino.coordenada_x * ESCALA + canvasOffset.x, destino.coordenada_y * ESCALA + canvasOffset.y]} stroke={conex.tipo === 'cruce' ? '#FF9800' : '#78909C'} strokeWidth={conex.tipo === 'cruce' ? 2 : 1} dash={conex.tipo === 'cruce' ? [4, 4] : []} opacity={0.7} listening={false} />
                })}

                {/* Nodos */}
                {showNodos && nodosVisibles.map(nodo => {
                  const isSelected = selType === 'nodo' && selId === nodo.idnodo
                  return <Circle key={nodo.idnodo} ref={(node) => { if (node) shapeRefs.current['nodo-' + nodo.idnodo] = node }} x={nodo.coordenada_x * ESCALA + canvasOffset.x} y={nodo.coordenada_y * ESCALA + canvasOffset.y} radius={isSelected ? 7 : 5} fill={NODO_COLORS[nodo.tipo] || '#666'} stroke={isSelected ? '#000' : '#fff'} strokeWidth={isSelected ? 2 : 1.5} opacity={0.85} draggable={isSelected} onClick={() => handleSelect('nodo', nodo.idnodo)} onTap={() => handleSelect('nodo', nodo.idnodo)} onDragEnd={(e) => handleNodoDragEnd(nodo.idnodo, e)} />
                })}

                <Transformer ref={transformerRef} boundBoxFunc={(oldBox, newBox) => {
                  if (newBox.width < ENTITY_MIN * ESCALA || newBox.height < ENTITY_MIN * ESCALA) return oldBox
                  if (newBox.x < canvasOffset.x || newBox.y < canvasOffset.y) return oldBox
                  if (newBox.x + newBox.width > canvasOffset.x + planoW) return oldBox
                  if (newBox.y + newBox.height > canvasOffset.y + planoH) return oldBox
                  return newBox
                }} />
              </Layer>
            </Stage>

            <ControlesZoom scale={camera.scale} onZoomIn={zoomIn} onZoomOut={zoomOut} onReset={zoomReset} />

            {/* MiniMapa (solo modo sucursal) */}
            {nivelVista === 'sucursal' && sucursalActual && (
              <MiniMapa
                sucursal={sucursalActual}
                zonas={[...zonasSucursal, ...mascarasAlmacen]}
                almacenes={almacenes}
                nodos={nodosSucursal}
                conexiones={[]}
                camera={camera}
                canvasSize={size}
                onNavigate={(wx, wy) => {
                  setCamera(p => ({
                    ...p,
                    x: size.width / 2 - wx * ESCALA * p.scale,
                    y: size.height / 2 - wy * ESCALA * p.scale,
                  }))
                }}
              />
            )}

            {/* Botón volver a sucursal */}
            {nivelVista === 'almacen' && (
              <button onClick={() => handleCambiarNivel('sucursal')} className="absolute top-2 left-2 bg-barra-lateral text-white px-3 py-1.5 rounded-lg text-sm shadow-lg hover:bg-barra-lateral-hover transition">
                ← Volver a Sucursal
              </button>
            )}

            {placingNodo && <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-peligro text-white px-4 py-2 rounded-lg text-sm shadow-lg">Click en el mapa para colocar el nodo</div>}

            {/* Leyenda */}
            <div className="absolute bottom-2 left-2 bg-fondo-blanco/90 backdrop-blur rounded-lg border border-borde-suave p-3 text-xs">
              <p className="font-semibold text-texto mb-2">Zonas</p>
              {Object.entries(TIPO_COLORS).map(([tipo, color]) => (
                <div key={tipo} className="flex items-center gap-2 capitalize">
                  <div className="w-3 h-3 rounded" style={{ backgroundColor: color }} />
                  <span className="text-texto-secundario">{tipo}</span>
                </div>
              ))}
              {nivelVista === 'almacen' && (
                <>
                  <p className="font-semibold text-texto mt-3 mb-2">Nodos</p>
                  {Object.entries(NODO_COLORS).map(([tipo, color]) => (
                    <div key={tipo} className="flex items-center gap-2 capitalize">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                      <span className="text-texto-secundario">{tipo.replace('_', ' ')}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="w-64 shrink-0">
        <PanelPropiedades
          selectedEntity={selectedEntity} setDirty={setDirty}
          zona={selectedZona} estante={selectedEstante} nodo={selectedNodo} almacen={selectedAlmacen}
          zonas={zonasVisibles}
          onUpdateZona={handleUpdateZona} onUpdateEstante={handleUpdateEstante}
          onUpdateNodo={handleUpdateNodo} onUpdateAlmacen={handleUpdateAlmacen}
          onDelete={handleDeleteEntity} deleting={deleting} placingNodo={placingNodo}
        />
      </div>

      <EditorPoligono
        isOpen={editorPoligonoOpen}
        onClose={() => setEditorPoligonoOpen(false)}
        onSave={(forma) => {
          if (zonaParaPoligono) {
            const setter = nivelVista === 'sucursal' ? setZonasSucursal : setZonasAlmacen
            setter(prev => prev.map(z => z.idzona === zonaParaPoligono ? { ...z, poligono: forma } : z))
            setDirty(true)
          }
          setEditorPoligonoOpen(false)
          setZonaParaPoligono(null)
        }}
        anchoZona={selectedZona?.ancho ?? 100}
        altoZona={selectedZona?.alto ?? 80}
      />
    </div>
  )
}
