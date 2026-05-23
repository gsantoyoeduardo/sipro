import { useState, useEffect } from 'react'
import DataTable from '../../components/DataTable'
import ConfirmDialog from '../../components/ConfirmDialog'
import Modal from '../../components/Modal'
import { almacenService } from '../../api/empresa'
import { productoService } from '../../api/inventario'
import { transferenciaService } from '../../api/transferencia'
import { useSubmit } from '../../hooks/useSubmit'
import { useToastStore } from '../../store/toastStore'
import { validateRequired, validateNotEqual, validatePositive } from '../../utils/validators'
import type { Almacen, Producto, Transferencia, DetalleTransferenciaItem } from '../../types'
import type { FieldError } from '../../utils/validators'

// Componente SVG reutilizable para spinner de carga
const SPINNER = (
  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
)

/**
 * Página de Transferencias entre almacenes.
 * Permite crear transferencias, agregar productos como detalle, y ejecutar
 * el flujo de estados: pendiente → enviar → en_tránsito → recibir → completado,
 * o bien rechazar desde pendiente o en_tránsito.
 *
 * Estado:
 *   - items: lista de transferencias.
 *   - almacenes / productos: datos auxiliares para selects.
 *   - filterEstado: filtro por estado.
 *   - form: datos del formulario de creación.
 *   - detalleForm: datos para agregar productos a una transferencia.
 *   - confirmAction: controla el ConfirmDialog para enviar/recibir/rechazar.
 *   - selectedTr / detalles: transferencia seleccionada y sus detalle.
 *
 * Llamadas API:
 *   - transferenciaService.list(), .create(), .enviar(), .recibir(), .rechazar()
 *   - transferenciaService.getDetalles(), .createDetalle()
 *   - almacenService.list(), productoService.list()
 */
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
  const [fieldErrors, setFieldErrors] = useState<FieldError>({})
  const [detalleFieldErrors, setDetalleFieldErrors] = useState<FieldError>({})
  const [confirmAction, setConfirmAction] = useState<{ tr: Transferencia; action: string } | null>(null)
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [detalleSubmitting, setDetalleSubmitting] = useState(false)
  const addToast = useToastStore((state) => state.addToast)

  // Carga principal: transferencias, almacenes y productos (se refiltra al cambiar filterEstado)
  const fetchData = async () => {
    try {
      const [tRes, aRes, pRes] = await Promise.all([
        transferenciaService.list(filterEstado || undefined),
        almacenService.list(),
        productoService.list(),
      ])
      setItems(tRes.data.results); setAlmacenes(aRes.data.results); setProductos(pRes.data.results)
    } catch {
      addToast('error', 'Error al cargar datos')
    } finally { setLoading(false) }
  }
  useEffect(() => { fetchData() }, [filterEstado])

  // Helper para aplicar clase de error en inputs
  const ic = (field: string, errors: FieldError) =>
    errors[field] ? 'border-red-500' : 'border-gray-300'

  // Validación del formulario principal: origen, destino (distintos), número
  const validateForm = (): boolean => {
    const errors: FieldError = {}
    errors['idalmacen_origen'] = validateRequired(form.idalmacen_origen, 'Almac\u00e9n origen')
    errors['idalmacen_destino'] = validateRequired(form.idalmacen_destino, 'Almac\u00e9n destino')
    errors['numero_transferencia'] = validateRequired(form.numero_transferencia, 'N\u00famero transferencia')
    if (form.idalmacen_origen && form.idalmacen_destino) {
      errors['idalmacen_origen'] = validateNotEqual(form.idalmacen_origen, form.idalmacen_destino, 'Almac\u00e9n origen', 'Almac\u00e9n destino')
    }
    setFieldErrors(errors)
    return !Object.values(errors).some(Boolean)
  }

  // Envía el formulario de creación de transferencia
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return
    setFormSubmitting(true)
    try {
      await transferenciaService.create(form)
      addToast('success', 'Transferencia creada')
      setModalOpen(false); fetchData()
    } catch {
      addToast('error', 'Error al crear transferencia')
    } finally { setFormSubmitting(false) }
  }

  // Confirmación de acciones: enviar, recibir, rechazar
  const { submit: handleConfirmAction, isSubmitting: confirmLoading } = useSubmit(
    async () => {
      if (!confirmAction) return
      const { tr, action } = confirmAction
      if (action === 'enviar') await transferenciaService.enviar(tr.idtransferencia)
      else if (action === 'recibir') await transferenciaService.recibir(tr.idtransferencia)
      else if (action === 'rechazar') await transferenciaService.rechazar(tr.idtransferencia)
    },
    { successMessage: 'Acci\u00f3n ejecutada', onSuccess: () => { setConfirmAction(null); fetchData() } }
  )

  // Abre el modal de detalles y carga los productos asociados a la transferencia
  const openDetalles = async (tr: Transferencia) => {
    setSelectedTr(tr)
    try {
      const { data } = await transferenciaService.getDetalles(tr.idtransferencia)
      setDetalles(data)
    } catch {
      addToast('error', 'Error al cargar detalles')
      setDetalles([])
    }
    setDetalleModalOpen(true)
  }

  // Validación del formulario de detalle: producto obligatorio, cantidad positiva
  const validateDetalle = (): boolean => {
    const errors: FieldError = {}
    errors['idproducto'] = validateRequired(detalleForm.idproducto, 'Producto')
    errors['cantidad'] = validatePositive(detalleForm.cantidad, 'Cantidad')
    setDetalleFieldErrors(errors)
    return !Object.values(errors).some(Boolean)
  }

  // Agrega un producto como detalle a la transferencia seleccionada
  const handleAddDetalle = async () => {
    if (!selectedTr || !validateDetalle()) return
    setDetalleSubmitting(true)
    try {
      await transferenciaService.createDetalle(selectedTr.idtransferencia, { ...detalleForm, cantidad: Number(detalleForm.cantidad), idlote: detalleForm.idlote || null })
      addToast('success', 'Producto agregado')
      openDetalles(selectedTr)
      setDetalleForm({ idproducto: '', idlote: '', cantidad: '0' })
      setDetalleFieldErrors({})
    } catch {
      addToast('error', 'Error al agregar producto')
    } finally { setDetalleSubmitting(false) }
  }

  // Definición de columnas de la tabla principal
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
      {/* Encabezado: título, filtro por estado y botón nueva transferencia */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-800">Transferencias</h1>
          <select value={filterEstado} onChange={(e) => setFilterEstado(e.target.value)} className="px-3 py-1 border rounded-lg text-sm">
            <option value="">Todos los estados</option>
            {['pendiente','en_transito','completado','rechazado'].map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
        <button onClick={() => { setForm({ idalmacen_origen: '', idalmacen_destino: '', numero_transferencia: `T-${Date.now()}`, notas: '' }); setFieldErrors({}); setModalOpen(true) }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Nueva Transferencia</button>
      </div>

      {/* Tabla principal de transferencias con acciones: Detalles, Enviar, Recibir, Rechazar */}
      <DataTable columns={columns} data={items} loading={loading}
        actions={(item) => (
          <>
            <button onClick={() => openDetalles(item)} className="text-blue-600 hover:text-blue-800">Detalles</button>
            {item.estado === 'pendiente' && <button onClick={() => setConfirmAction({ tr: item, action: 'enviar' })} className="text-indigo-600 hover:text-indigo-800">Enviar</button>}
            {item.estado === 'en_transito' && <button onClick={() => setConfirmAction({ tr: item, action: 'recibir' })} className="text-green-600 hover:text-green-800">Recibir</button>}
            {item.estado !== 'completado' && item.estado !== 'rechazado' && <button onClick={() => setConfirmAction({ tr: item, action: 'rechazar' })} className="text-red-600 hover:text-red-800">Rechazar</button>}
          </>
        )} />

      {/* Modal de creación de transferencia: origen, destino, número, notas */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Nueva Transferencia">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Almac\u00e9n Origen *</label>
              <select
                value={form.idalmacen_origen}
                onChange={(e) => { setForm({ ...form, idalmacen_origen: e.target.value }); setFieldErrors(prev => ({ ...prev, idalmacen_origen: undefined })) }}
                className={`w-full px-3 py-2 border rounded-lg ${ic('idalmacen_origen', fieldErrors)}`}
              >
                <option value="">Seleccionar</option>
                {almacenes.map((a) => <option key={a.idalmacen} value={a.idalmacen}>{a.nombre}</option>)}
              </select>
              {fieldErrors.idalmacen_origen && <p className="text-red-500 text-xs mt-1">{fieldErrors.idalmacen_origen}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Almac\u00e9n Destino *</label>
              <select
                value={form.idalmacen_destino}
                onChange={(e) => { setForm({ ...form, idalmacen_destino: e.target.value }); setFieldErrors(prev => ({ ...prev, idalmacen_destino: undefined })) }}
                className={`w-full px-3 py-2 border rounded-lg ${ic('idalmacen_destino', fieldErrors)}`}
              >
                <option value="">Seleccionar</option>
                {almacenes.map((a) => <option key={a.idalmacen} value={a.idalmacen}>{a.nombre}</option>)}
              </select>
              {fieldErrors.idalmacen_destino && <p className="text-red-500 text-xs mt-1">{fieldErrors.idalmacen_destino}</p>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">N\u00famero Transferencia *</label>
            <input
              type="text"
              value={form.numero_transferencia}
              onChange={(e) => { setForm({ ...form, numero_transferencia: e.target.value }); setFieldErrors(prev => ({ ...prev, numero_transferencia: undefined })) }}
              className={`w-full px-3 py-2 border rounded-lg ${ic('numero_transferencia', fieldErrors)}`}
            />
            {fieldErrors.numero_transferencia && <p className="text-red-500 text-xs mt-1">{fieldErrors.numero_transferencia}</p>}
          </div>
          <div><label className="block text-sm font-medium mb-1">Notas</label><textarea value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} className="w-full px-3 py-2 border rounded-lg" rows={2} /></div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border rounded-lg">Cancelar</button>
            <button type="submit" disabled={formSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 flex items-center gap-2">{formSubmitting && SPINNER}Crear</button>
          </div>
        </form>
      </Modal>

      {/* Modal de detalles: muestra productos de la transferencia y permite agregar más si está pendiente */}
      <Modal isOpen={detalleModalOpen} onClose={() => setDetalleModalOpen(false)} title={`Detalles: ${selectedTr?.numero_transferencia}`} size="lg">
        <div className="space-y-4">
          {/* Información resumen: origen, destino, estado */}
          <div className="flex text-sm gap-4">
            <span>Origen: <strong>{selectedTr?.origen_nombre}</strong></span>
            <span>Destino: <strong>{selectedTr?.destino_nombre}</strong></span>
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${selectedTr?.estado === 'completado' ? 'bg-green-100 text-green-800' : selectedTr?.estado === 'rechazado' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>{selectedTr?.estado}</span>
          </div>

          {/* Lista de productos/detalles de la transferencia */}
          {detalles.map((det) => (
            <div key={det.iddetalletransferencia} className="border rounded-lg p-3 flex justify-between items-center">
              <div>
                <p className="font-medium text-sm">{det.producto_codigo} — {det.producto_nombre}</p>
                <p className="text-xs text-gray-500">Lote: {det.lote_numero || '\u2014'}</p>
              </div>
              <span className="font-bold text-sm">{det.cantidad}</span>
            </div>
          ))}

          {/* Formulario para agregar productos solo si la transferencia está pendiente */}
          {selectedTr && selectedTr.estado === 'pendiente' && (
            <div className="border-t pt-4">
              <h4 className="font-medium text-sm mb-2">Agregar Producto</h4>
              <div className="grid grid-cols-3 gap-2">
                <select
                  value={detalleForm.idproducto}
                  onChange={(e) => { setDetalleForm({ ...detalleForm, idproducto: e.target.value }); setDetalleFieldErrors(prev => ({ ...prev, idproducto: undefined })) }}
                  className={`px-3 py-2 border rounded-lg text-sm ${ic('idproducto', detalleFieldErrors)}`}
                >
                  <option value="">Producto</option>
                  {productos.map((p) => <option key={p.idproducto} value={p.idproducto}>{p.nombre}</option>)}
                </select>
                <input type="text" value={detalleForm.idlote} onChange={(e) => setDetalleForm({ ...detalleForm, idlote: e.target.value })} placeholder="ID Lote" className="px-3 py-2 border rounded-lg text-sm" />
                <div className="flex gap-1">
                  <input
                    type="number"
                    step="0.01"
                    value={detalleForm.cantidad}
                    onChange={(e) => { setDetalleForm({ ...detalleForm, cantidad: e.target.value }); setDetalleFieldErrors(prev => ({ ...prev, cantidad: undefined })) }}
                    placeholder="Cant"
                    className={`flex-1 px-3 py-2 border rounded-lg text-sm ${ic('cantidad', detalleFieldErrors)}`}
                  />
                  <button onClick={handleAddDetalle} disabled={detalleSubmitting} className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg disabled:opacity-50 flex items-center gap-1">{detalleSubmitting && SPINNER}+</button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mt-1">
                <div>
                  {detalleFieldErrors.idproducto && <p className="text-red-500 text-xs">{detalleFieldErrors.idproducto}</p>}
                </div>
                <div />
                <div>
                  {detalleFieldErrors.cantidad && <p className="text-red-500 text-xs">{detalleFieldErrors.cantidad}</p>}
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* ConfirmDialog para enviar la transferencia */}
      {confirmAction && confirmAction.action === 'enviar' && (
        <ConfirmDialog
          isOpen={!!confirmAction}
          onClose={() => setConfirmAction(null)}
          onConfirm={handleConfirmAction}
          title="Enviar Transferencia"
          message={`\u00bfConfirma enviar la transferencia ${confirmAction.tr.numero_transferencia}?`}
          confirmLabel="Enviar"
          isLoading={confirmLoading}
        />
      )}

      {/* ConfirmDialog para recibir la transferencia */}
      {confirmAction && confirmAction.action === 'recibir' && (
        <ConfirmDialog
          isOpen={!!confirmAction}
          onClose={() => setConfirmAction(null)}
          onConfirm={handleConfirmAction}
          title="Recibir Transferencia"
          message={`\u00bfConfirma recibir la transferencia ${confirmAction.tr.numero_transferencia}?`}
          confirmLabel="Recibir"
          isLoading={confirmLoading}
        />
      )}

      {/* ConfirmDialog para rechazar la transferencia */}
      {confirmAction && confirmAction.action === 'rechazar' && (
        <ConfirmDialog
          isOpen={!!confirmAction}
          onClose={() => setConfirmAction(null)}
          onConfirm={handleConfirmAction}
          title="Rechazar Transferencia"
          message={`\u00bfConfirma rechazar la transferencia ${confirmAction.tr.numero_transferencia}?`}
          confirmLabel="Rechazar"
          confirmVariant="danger"
          isLoading={confirmLoading}
        />
      )}
    </div>
  )
}
