import { useState, useEffect } from 'react'
import DataTable from '../../components/DataTable'
import Modal from '../../components/Modal'
import { almacenService } from '../../api/empresa'
import { productoService } from '../../api/inventario'
import { pickingService, detallePickingService } from '../../api/picking'
import type { Almacen, Producto, OrdenPicking, DetallePickingItem } from '../../types'

type TabView = 'panel' | 'ordenes' | 'detalles'

export default function PickingPage() {
  const [view, setView] = useState<TabView>('panel')

  return (
    <div>
      <div className="flex gap-2 mb-4">
        {[
          { key: 'panel', label: 'Panel Kanban' },
          { key: 'ordenes', label: 'Órdenes' },
          { key: 'detalles', label: 'Detalles' },
        ].map((tab) => (
          <button key={tab.key} onClick={() => setView(tab.key as TabView)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${view === tab.key ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            {tab.label}
          </button>
        ))}
      </div>
      {view === 'panel' && <KanbanPanel />}
      {view === 'ordenes' && <OrdenesABM />}
      {view === 'detalles' && <DetallesView />}
    </div>
  )
}

function KanbanPanel() {
  const [ordenes, setOrdenes] = useState<OrdenPicking[]>([])
  const [almacenes, setAlmacenes] = useState<Almacen[]>([])
  const [filterAlmacen, setFilterAlmacen] = useState('')
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedOrden, setSelectedOrden] = useState<OrdenPicking | null>(null)
  const [detalles, setDetalles] = useState<DetallePickingItem[]>([])
  const [incidenciaOpen, setIncidenciaOpen] = useState(false)
  const [incidenciaDetalle, setIncidenciaDetalle] = useState<string>('')
  const [incidenciaForm, setIncidenciaForm] = useState({ tipo: 'faltante', descripcion: '', cantidad_reportada: '0' })

  const fetchOrdenes = async () => {
    try {
      const [oRes, aRes] = await Promise.all([
        pickingService.list(filterAlmacen || undefined),
        almacenService.list(),
      ])
      setOrdenes(oRes.data.results); setAlmacenes(aRes.data.results)
    } catch {} finally { setLoading(false) }
  }
  useEffect(() => { fetchOrdenes() }, [filterAlmacen])

  const handleAction = async (orden: OrdenPicking, action: string) => {
    if (action === 'iniciar') await pickingService.iniciar(orden.idordenpicking)
    else if (action === 'completar') await pickingService.completar(orden.idordenpicking)
    else if (action === 'cancelar') await pickingService.cancelar(orden.idordenpicking)
    fetchOrdenes()
  }

  const openDetalles = async (orden: OrdenPicking) => {
    setSelectedOrden(orden)
    try {
      const { data } = await pickingService.getDetalles(orden.idordenpicking)
      setDetalles(data)
    } catch { setDetalles([]) }
    setModalOpen(true)
  }

  const handlePick = async (detalle: DetallePickingItem, cantidad: number) => {
    await detallePickingService.pick(detalle.iddetallepicking, cantidad)
    if (selectedOrden) openDetalles(selectedOrden)
    fetchOrdenes()
  }

  const handleReportar = async () => {
    if (!incidenciaDetalle) return
    try {
      await detallePickingService.reportarIncidencia(incidenciaDetalle, { ...incidenciaForm, cantidad_reportada: Number(incidenciaForm.cantidad_reportada) })
      setIncidenciaOpen(false)
      if (selectedOrden) openDetalles(selectedOrden)
      fetchOrdenes()
    } catch {}
  }

  const estados: OrdenPicking['estado'][] = ['pendiente', 'en_proceso', 'completado', 'cancelado']
  const estadoColors: Record<string, string> = { pendiente: 'bg-yellow-50 border-yellow-300', en_proceso: 'bg-blue-50 border-blue-300', completado: 'bg-green-50 border-green-300', cancelado: 'bg-red-50 border-red-300' }
  const estadoLabels = { pendiente: 'Pendientes', en_proceso: 'En Proceso', completado: 'Completadas', cancelado: 'Canceladas' }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-800">Panel de Picking</h1>
          <select value={filterAlmacen} onChange={(e) => setFilterAlmacen(e.target.value)} className="px-3 py-1 border rounded-lg text-sm">
            <option value="">Todos los almacenes</option>
            {almacenes.map((a) => <option key={a.idalmacen} value={a.idalmacen}>{a.nombre}</option>)}
          </select>
        </div>
      </div>

      {loading ? <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full" /></div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {estados.map((estado) => (
            <div key={estado} className={`rounded-lg border-2 ${estadoColors[estado]} p-3`}>
              <h3 className="font-semibold text-sm mb-3 flex justify-between">
                {estadoLabels[estado]}
                <span className="bg-white rounded-full px-2 text-xs">{ordenes.filter((o) => o.estado === estado).length}</span>
              </h3>
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {ordenes.filter((o) => o.estado === estado).map((orden) => (
                  <div key={orden.idordenpicking} className="bg-white rounded-lg shadow-sm p-3 border border-gray-100 cursor-pointer hover:shadow-md transition"
                    onClick={() => openDetalles(orden)}>
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-sm">{orden.numero_orden}</p>
                        <p className="text-xs text-gray-500">{orden.almacen_nombre}</p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${orden.prioridad > 1 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}>
                        {orden.prioridad > 1 ? `P${orden.prioridad}` : 'Normal'}
                      </span>
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-gray-500">
                      <span>{orden.total_pickeado}/{orden.total_productos} items</span>
                      <span>{orden.usuario_nombre || '—'}</span>
                    </div>
                    <div className="flex gap-1 mt-2" onClick={(e) => e.stopPropagation()}>
                      {estado === 'pendiente' && (
                        <button onClick={() => handleAction(orden, 'iniciar')} className="flex-1 text-xs bg-blue-600 text-white py-1 rounded hover:bg-blue-700">Iniciar</button>
                      )}
                      {estado === 'en_proceso' && (
                        <>
                          <button onClick={() => handleAction(orden, 'completar')} className="flex-1 text-xs bg-green-600 text-white py-1 rounded hover:bg-green-700">Completar</button>
                          <button onClick={() => handleAction(orden, 'cancelar')} className="text-xs bg-red-600 text-white py-1 px-2 rounded hover:bg-red-700">X</button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                {ordenes.filter((o) => o.estado === estado).length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-4">Sin órdenes</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={`Orden ${selectedOrden?.numero_orden}`} size="lg">
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span>Estado: <span className="font-bold">{selectedOrden?.estado}</span></span>
            <span>Prioridad: {selectedOrden?.prioridad}</span>
          </div>
          {detalles.map((det) => (
            <div key={det.iddetallepicking} className="border rounded-lg p-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-sm">{det.producto_codigo} — {det.producto_nombre}</p>
                  <p className="text-xs text-gray-500">Ubicación: {det.ubicacion_codigo} | Lote: {det.lote_numero || '—'}</p>
                </div>
                <span className={`px-2 py-0.5 text-xs rounded-full ${
                  det.estado === 'completado' ? 'bg-green-100 text-green-800' :
                  det.estado === 'incidencia' ? 'bg-red-100 text-red-800' :
                  det.estado === 'en_proceso' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
                }`}>{det.estado}</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm font-bold">{det.cantidad_pickeada}/{det.cantidad_solicitada}</span>
                {det.estado !== 'completado' && det.estado !== 'incidencia' && (
                  <div className="flex gap-1">
                    <button onClick={() => handlePick(det, 1)} className="text-xs bg-blue-600 text-white px-2 py-1 rounded">+1</button>
                    <button onClick={() => handlePick(det, det.cantidad_solicitada - det.cantidad_pickeada)} className="text-xs bg-green-600 text-white px-2 py-1 rounded">Completar</button>
                  </div>
                )}
                {det.estado !== 'completado' && det.estado !== 'incidencia' && (
                  <button onClick={() => { setIncidenciaDetalle(det.iddetallepicking); setIncidenciaOpen(true) }} className="text-xs text-red-600 hover:text-red-800">Reportar Incidencia</button>
                )}
              </div>
              {det.incidencias && det.incidencias.length > 0 && (
                <div className="mt-2 pt-2 border-t">
                  {det.incidencias.map((inc) => (
                    <div key={inc.idincidencia} className="text-xs bg-red-50 p-2 rounded">
                      <span className="font-medium text-red-700">{inc.tipo}</span>: {inc.descripcion}
                      {inc.resuelta && <span className="ml-2 text-green-600 font-bold">✓ Resuelta</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </Modal>

      <Modal isOpen={incidenciaOpen} onClose={() => setIncidenciaOpen(false)} title="Reportar Incidencia">
        <form onSubmit={(e) => { e.preventDefault(); handleReportar() }} className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">Tipo *</label>
            <select value={incidenciaForm.tipo} onChange={(e) => setIncidenciaForm({ ...incidenciaForm, tipo: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required>
              {['faltante','danado','caducado','ubicacion_vacia','otro'].map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div><label className="block text-sm font-medium mb-1">Descripción *</label><textarea value={incidenciaForm.descripcion} onChange={(e) => setIncidenciaForm({ ...incidenciaForm, descripcion: e.target.value })} className="w-full px-3 py-2 border rounded-lg" rows={3} required /></div>
          <div><label className="block text-sm font-medium mb-1">Cantidad Reportada</label><input type="number" step="0.01" value={incidenciaForm.cantidad_reportada} onChange={(e) => setIncidenciaForm({ ...incidenciaForm, cantidad_reportada: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
          <div className="flex justify-end gap-3"><button type="button" onClick={() => setIncidenciaOpen(false)} className="px-4 py-2 border rounded-lg">Cancelar</button><button type="submit" className="px-4 py-2 bg-red-600 text-white rounded-lg">Reportar</button></div>
        </form>
      </Modal>
    </div>
  )
}

function OrdenesABM() {
  const [items, setItems] = useState<OrdenPicking[]>([])
  const [almacenes, setAlmacenes] = useState<Almacen[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ idalmacen: '', numero_orden: '', prioridad: 1, notas: '' })

  const fetchData = async () => {
    try {
      const [oRes, aRes] = await Promise.all([pickingService.list(), almacenService.list()])
      setItems(oRes.data.results); setAlmacenes(aRes.data.results)
    } catch {} finally { setLoading(false) }
  }
  useEffect(() => { fetchData() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await pickingService.create(form)
      setModalOpen(false); fetchData()
    } catch {}
  }

  const columns = [
    { key: 'numero_orden', header: 'Orden' },
    { key: 'almacen_nombre', header: 'Almacén' },
    { key: 'total_productos', header: 'Productos' },
    { key: 'estado', header: 'Estado', render: (item: OrdenPicking) => {
      const colors: Record<string, string> = { pendiente: 'bg-yellow-100 text-yellow-800', en_proceso: 'bg-blue-100 text-blue-800', completado: 'bg-green-100 text-green-800', cancelado: 'bg-red-100 text-red-800' }
      return <span className={`px-2 py-1 text-xs rounded-full ${colors[item.estado]}`}>{item.estado}</span>
    }},
    { key: 'prioridad', header: 'Prioridad' },
  ]

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800">Órdenes de Picking</h2>
        <button onClick={() => { setForm({ idalmacen: '', numero_orden: `OP-${Date.now()}`, prioridad: 1, notas: '' }); setModalOpen(true) }} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Nueva Orden</button>
      </div>
      <DataTable columns={columns} data={items} loading={loading}
        actions={(item) => (
          <>
            {item.estado === 'pendiente' && <button onClick={() => pickingService.iniciar(item.idordenpicking).then(fetchData)} className="text-blue-600 hover:text-blue-800">Iniciar</button>}
            {item.estado === 'en_proceso' && <button onClick={() => pickingService.completar(item.idordenpicking).then(fetchData)} className="text-green-600 hover:text-green-800">Completar</button>}
            {item.estado !== 'completado' && item.estado !== 'cancelado' && <button onClick={() => pickingService.cancelar(item.idordenpicking).then(fetchData)} className="text-red-600 hover:text-red-800">Cancelar</button>}
          </>
        )} />
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Nueva Orden de Picking">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">Almacén *</label>
            <select value={form.idalmacen} onChange={(e) => setForm({ ...form, idalmacen: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required>
              <option value="">Seleccionar</option>
              {almacenes.map((a) => <option key={a.idalmacen} value={a.idalmacen}>{a.nombre}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">Número Orden *</label><input type="text" value={form.numero_orden} onChange={(e) => setForm({ ...form, numero_orden: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required /></div>
            <div><label className="block text-sm font-medium mb-1">Prioridad</label><input type="number" value={form.prioridad} onChange={(e) => setForm({ ...form, prioridad: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" /></div>
          </div>
          <div><label className="block text-sm font-medium mb-1">Notas</label><textarea value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} className="w-full px-3 py-2 border rounded-lg" rows={2} /></div>
          <div className="flex justify-end gap-3"><button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border rounded-lg">Cancelar</button><button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">Crear</button></div>
        </form>
      </Modal>
    </div>
  )
}

function DetallesView() {
  const [items, setItems] = useState<DetallePickingItem[]>([])
  const [ordenes, setOrdenes] = useState<OrdenPicking[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedOrden, setSelectedOrden] = useState('')
  const [form, setForm] = useState({ idproducto: '', idubicacion: '', idlote: '', cantidad_solicitada: '0' })

  const fetchData = async () => {
    try {
      const [dRes, oRes, pRes] = await Promise.all([detallePickingService.list(selectedOrden || undefined), pickingService.list(), productoService.list()])
      setItems(dRes.data.results); setOrdenes(oRes.data.results); setProductos(pRes.data.results)
    } catch {} finally { setLoading(false) }
  }
  useEffect(() => { fetchData() }, [selectedOrden])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedOrden) return
    try {
      await pickingService.createDetalle(selectedOrden, { ...form, cantidad_solicitada: Number(form.cantidad_solicitada), idlote: form.idlote || null })
      setModalOpen(false); fetchData()
    } catch {}
  }

  const columns = [
    { key: 'producto_codigo', header: 'Producto' },
    { key: 'ubicacion_codigo', header: 'Ubicación' },
    { key: 'lote_numero', header: 'Lote' },
    { key: 'cantidad_pickeada', header: 'Pickeado', render: (item: DetallePickingItem) => `${item.cantidad_pickeada}/${item.cantidad_solicitada}` },
    { key: 'estado', header: 'Estado', render: (item: DetallePickingItem) => <span className={`px-2 py-1 text-xs rounded-full ${item.estado === 'completado' ? 'bg-green-100 text-green-800' : item.estado === 'incidencia' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>{item.estado}</span> },
  ]

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold text-gray-800">Detalles de Picking</h2>
          <select value={selectedOrden} onChange={(e) => setSelectedOrden(e.target.value)} className="px-3 py-1 border rounded-lg text-sm">
            <option value="">Todas las órdenes</option>
            {ordenes.map((o) => <option key={o.idordenpicking} value={o.idordenpicking}>{o.numero_orden}</option>)}
          </select>
        </div>
        {selectedOrden && <button onClick={() => { setForm({ idproducto: '', idubicacion: '', idlote: '', cantidad_solicitada: '0' }); setModalOpen(true) }} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Agregar Producto</button>}
      </div>
      <DataTable columns={columns} data={items} loading={loading} />
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Agregar Producto a Orden">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-sm font-medium mb-1">Producto *</label>
            <select value={form.idproducto} onChange={(e) => setForm({ ...form, idproducto: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required>
              <option value="">Seleccionar</option>
              {productos.map((p) => <option key={p.idproducto} value={p.idproducto}>{p.nombre}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">Ubicación *</label><input type="text" value={form.idubicacion} onChange={(e) => setForm({ ...form, idubicacion: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required /></div>
            <div><label className="block text-sm font-medium mb-1">Lote (opcional)</label><input type="text" value={form.idlote} onChange={(e) => setForm({ ...form, idlote: e.target.value })} className="w-full px-3 py-2 border rounded-lg" /></div>
          </div>
          <div><label className="block text-sm font-medium mb-1">Cantidad Solicitada *</label><input type="number" step="0.01" value={form.cantidad_solicitada} onChange={(e) => setForm({ ...form, cantidad_solicitada: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required /></div>
          <div className="flex justify-end gap-3"><button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border rounded-lg">Cancelar</button><button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">Agregar</button></div>
        </form>
      </Modal>
    </div>
  )
}
