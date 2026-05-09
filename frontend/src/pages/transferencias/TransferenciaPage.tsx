import { useState, useEffect } from 'react'
import DataTable from '../../components/DataTable'
import Modal from '../../components/Modal'
import { almacenService } from '../../api/empresa'
import { productoService } from '../../api/inventario'
import { transferenciaService } from '../../api/transferencia'
import type { Almacen, Producto, Transferencia, DetalleTransferenciaItem } from '../../types'

export default function TransferenciaPage() {
  const [items, setItems] = useState<Transferencia[]>([])
  const [almacenes, setAlmacenes] = useState<Almacen[]>([])
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [detalleModalOpen, setDetalleModalOpen] = useState(false)
  const [selectedTr, setSelectedTr] = useState<Transferencia | null>(null)
  const [detalles, setDetalles] = useState<DetalleTransferenciaItem[]>([])
  const [filterEstado, setFilterEstado] = useState('')
  const [form, setForm] = useState({ idalmacen_origen: '', idalmacen_destino: '', numero_transferencia: '', notas: '' })
  const [detalleForm, setDetalleForm] = useState({ idproducto: '', idlote: '', cantidad: '0' })

  const fetchData = async () => {
    try {
      const [tRes, aRes, pRes] = await Promise.all([
        transferenciaService.list(filterEstado || undefined),
        almacenService.list(),
        productoService.list(),
      ])
      setItems(tRes.data.results); setAlmacenes(aRes.data.results); setProductos(pRes.data.results)
    } catch {} finally { setLoading(false) }
  }
  useEffect(() => { fetchData() }, [filterEstado])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await transferenciaService.create(form)
      setModalOpen(false); fetchData()
    } catch {}
  }

  const openDetalles = async (tr: Transferencia) => {
    setSelectedTr(tr)
    try {
      const { data } = await transferenciaService.getDetalles(tr.idtransferencia)
      setDetalles(data)
    } catch { setDetalles([]) }
    setDetalleModalOpen(true)
  }

  const handleAddDetalle = async () => {
    if (!selectedTr) return
    try {
      await transferenciaService.createDetalle(selectedTr.idtransferencia, { ...detalleForm, cantidad: Number(detalleForm.cantidad), idlote: detalleForm.idlote || null })
      openDetalles(selectedTr)
      setDetalleForm({ idproducto: '', idlote: '', cantidad: '0' })
    } catch {}
  }

  const columns = [
    { key: 'numero_transferencia', header: 'Transferencia' },
    { key: 'origen_nombre', header: 'Origen' },
    { key: 'destino_nombre', header: 'Destino' },
    { key: 'total_items', header: 'Items' },
    { key: 'estado', header: 'Estado', render: (item: Transferencia) => {
      const colors: Record<string, string> = { pendiente: 'bg-yellow-100 text-yellow-800', en_transito: 'bg-blue-100 text-blue-800', completado: 'bg-green-100 text-green-800', rechazado: 'bg-red-100 text-red-800' }
      return <span className={`px-2 py-1 text-xs rounded-full ${colors[item.estado]}`}>{item.estado}</span>
    }},
    { key: 'fecha_creacion', header: 'Fecha' },
  ]

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-800">Transferencias</h1>
          <select value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)} className="px-3 py-1 border rounded-lg text-sm">
            <option value="">Todos los estados</option>
            {['pendiente','en_transito','completado','rechazado'].map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
        <button onClick={() => { setForm({ idalmacen_origen: '', idalmacen_destino: '', numero_transferencia: `T-${Date.now()}`, notas: '' }); setModalOpen(true) }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Nueva Transferencia</button>
      </div>

      <DataTable columns={columns} data={items} loading={loading}
        actions={(item) => (
          <>
            <button onClick={() => openDetalles(item)} className="text-blue-600 hover:text-blue-800">Detalles</button>
            {item.estado === 'pendiente' && <button onClick={() => transferenciaService.enviar(item.idtransferencia).then(fetchData)} className="text-indigo-600 hover:text-indigo-800">Enviar</button>}
            {item.estado === 'en_transito' && <button onClick={() => transferenciaService.recibir(item.idtransferencia).then(fetchData)} className="text-green-600 hover:text-green-800">Recibir</button>}
            {item.estado !== 'completado' && item.estado !== 'rechazado' && <button onClick={() => transferenciaService.rechazar(item.idtransferencia).then(fetchData)} className="text-red-600 hover:text-red-800">Rechazar</button>}
          </>
        )} />

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Nueva Transferencia">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">Almacén Origen *</label>
              <select value={form.idalmacen_origen} onChange={(e) => setForm({ ...form, idalmacen_origen: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required>
                <option value="">Seleccionar</option>
                {almacenes.map((a) => <option key={a.idalmacen} value={a.idalmacen}>{a.nombre}</option>)}
              </select>
            </div>
            <div><label className="block text-sm font-medium mb-1">Almacén Destino *</label>
              <select value={form.idalmacen_destino} onChange={(e) => setForm({ ...form, idalmacen_destino: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required>
                <option value="">Seleccionar</option>
                {almacenes.map((a) => <option key={a.idalmacen} value={a.idalmacen}>{a.nombre}</option>)}
              </select>
            </div>
          </div>
          <div><label className="block text-sm font-medium mb-1">Número Transferencia *</label><input type="text" value={form.numero_transferencia} onChange={(e) => setForm({ ...form, numero_transferencia: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required /></div>
          <div><label className="block text-sm font-medium mb-1">Notas</label><textarea value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} className="w-full px-3 py-2 border rounded-lg" rows={2} /></div>
          <div className="flex justify-end gap-3"><button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border rounded-lg">Cancelar</button><button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">Crear</button></div>
        </form>
      </Modal>

      <Modal isOpen={detalleModalOpen} onClose={() => setDetalleModalOpen(false)} title={`Detalles: ${selectedTr?.numero_transferencia}`} size="lg">
        <div className="space-y-4">
          <div className="flex text-sm gap-4">
            <span>Origen: <strong>{selectedTr?.origen_nombre}</strong></span>
            <span>Destino: <strong>{selectedTr?.destino_nombre}</strong></span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${selectedTr?.estado === 'completado' ? 'bg-green-100 text-green-800' : selectedTr?.estado === 'rechazado' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>{selectedTr?.estado}</span>
          </div>

          {detalles.map((det) => (
            <div key={det.iddetalletransferencia} className="border rounded-lg p-3 flex justify-between items-center">
              <div>
                <p className="font-medium text-sm">{det.producto_codigo} — {det.producto_nombre}</p>
                <p className="text-xs text-gray-500">Lote: {det.lote_numero || '—'}</p>
              </div>
              <span className="font-bold text-sm">{det.cantidad}</span>
            </div>
          ))}

          {selectedTr && selectedTr.estado === 'pendiente' && (
            <div className="border-t pt-4">
              <h4 className="font-medium text-sm mb-2">Agregar Producto</h4>
              <div className="grid grid-cols-3 gap-2">
                <select value={detalleForm.idproducto} onChange={(e) => setDetalleForm({ ...detalleForm, idproducto: e.target.value })} className="px-3 py-2 border rounded-lg text-sm">
                  <option value="">Producto</option>
                  {productos.map((p) => <option key={p.idproducto} value={p.idproducto}>{p.nombre}</option>)}
                </select>
                <input type="text" value={detalleForm.idlote} onChange={(e) => setDetalleForm({ ...detalleForm, idlote: e.target.value })} placeholder="ID Lote" className="px-3 py-2 border rounded-lg text-sm" />
                <div className="flex gap-1">
                  <input type="number" step="0.01" value={detalleForm.cantidad} onChange={(e) => setDetalleForm({ ...detalleForm, cantidad: e.target.value })} placeholder="Cant" className="flex-1 px-3 py-2 border rounded-lg text-sm" />
                  <button onClick={handleAddDetalle} className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg">+</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}
