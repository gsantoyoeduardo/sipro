/**
 * P\u00e1gina de administraci\u00f3n de Nodos y Conexiones del layout.
 * Gestiona el CRUD de nodos (puntos en el mapa del almac\u00e9n) y
 * de conexiones (aristas entre nodos) con validaciones cruzadas.
 */
import { useState, useEffect } from 'react'
import DataTable from '../../components/DataTable'
import Modal from '../../components/Modal'
import ConfirmDialog from '../../components/ConfirmDialog'
import { almacenService } from '../../api/empresa'
import { nodoService, conexionService } from '../../api/layout'
import { useSubmit } from '../../hooks/useSubmit'
import { useToastStore } from '../../store/toastStore'
import { validateRequired, validatePositive, validateNotEqual } from '../../utils/validators'
import type { Almacen, Nodo, Conexion } from '../../types'

export default function NodosPage() {
  // Estado de nodos, conexiones y almacenes disponibles
  const [nodos, setNodos] = useState<Nodo[]>([])
  const [conexiones, setConexiones] = useState<Conexion[]>([])
  const [almacenes, setAlmacenes] = useState<Almacen[]>([])
  const [loading, setLoading] = useState(true)
  // Control de modales: nodo y conexi\u00f3n
  const [modalOpen, setModalOpen] = useState(false)
  const [conexModalOpen, setConexModalOpen] = useState(false)
  const [editing, setEditing] = useState<Nodo | null>(null)
  // Filtro por almac\u00e9n
  const [filterAlmacen, setFilterAlmacen] = useState('')
  const addToast = useToastStore((state) => state.addToast)
  // Errores de validaci\u00f3n por campo
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  // Datos del formulario de nodo
  const [form, setForm] = useState({
    idalmacen: '', nombre: '', tipo: 'interseccion' as string,
    coordenada_x: 0, coordenada_y: 0, idubicacion: '',
  })
  // Datos del formulario de conexi\u00f3n
  const [conexForm, setConexForm] = useState({
    idnodoorigen: '', idnododestino: '', distancia: 0, tipo: 'pasillo' as string, bidireccional: true,
  })

  // Confirmaciones para acciones destructivas (nodos y conexiones)
  const [confirmDeleteNodo, setConfirmDeleteNodo] = useState<Nodo | null>(null)
  const [confirmToggleNodo, setConfirmToggleNodo] = useState<Nodo | null>(null)
  const [confirmDeleteConex, setConfirmDeleteConex] = useState<Conexion | null>(null)
  const [confirmToggleConex, setConfirmToggleConex] = useState<Conexion | null>(null)

  // Carga inicial de nodos, conexiones y almacenes desde la API
  const fetchData = async () => {
    try {
      const [nRes, cRes, aRes] = await Promise.all([
        nodoService.list(filterAlmacen || undefined),
        conexionService.list(),
        almacenService.list(),
      ])
      setNodos(nRes.data.results)
      setConexiones(cRes.data.results)
      setAlmacenes(aRes.data.results)
    } catch { addToast('error', 'Error al cargar datos') } finally { setLoading(false) }
  }

  // Recarga datos cuando cambia el filtro de almac\u00e9n
  useEffect(() => { fetchData() }, [filterAlmacen])

  // Valida campos obligatorios del formulario de nodo
  const validateNodo = (): boolean => {
    const e: Record<string, string> = {}
    const v1 = validateRequired(form.idalmacen, 'Almacén'); if (v1) e.idalmacen = v1
    const v2 = validateRequired(form.nombre, 'Nombre'); if (v2) e.nombre = v2
    setFieldErrors(e)
    return Object.keys(e).length === 0
  }

  // Crea o actualiza el nodo, convirtiendo coordenadas a n\u00famero
  const saveNodoFn = async () => {
    const data = {
      ...form,
      coordenada_x: Number(form.coordenada_x),
      coordenada_y: Number(form.coordenada_y),
      idubicacion: form.idubicacion || null,
    }
    if (editing) await nodoService.update(editing.idnodo, data)
    else await nodoService.create(data)
  }

  const { submit: handleSaveNodo, isSubmitting: savingNodo } = useSubmit(saveNodoFn, {
    successMessage: editing ? 'Nodo actualizado' : 'Nodo creado',
    onSuccess: () => { setModalOpen(false); fetchData() },
  })

  const handleSubmitNodo = (e: React.FormEvent) => { e.preventDefault(); if (validateNodo()) handleSaveNodo() }

  // Valida la conexi\u00f3n: origen, destino, distancia positiva y nodos distintos
  const validateConex = (): boolean => {
    const e: Record<string, string> = {}
    const v1 = validateRequired(conexForm.idnodoorigen, 'Nodo Origen'); if (v1) e.idnodoorigen = v1
    const v2 = validateRequired(conexForm.idnododestino, 'Nodo Destino'); if (v2) e.idnododestino = v2
    const v3 = validatePositive(conexForm.distancia, 'Distancia'); if (v3) e.distancia = v3
    const v4 = validateNotEqual(conexForm.idnodoorigen, conexForm.idnododestino, 'Nodo Origen', 'Nodo Destino'); if (v4) e.idnododestino = v4
    setFieldErrors(e)
    return Object.keys(e).length === 0
  }

  // Crea la conexi\u00f3n con la distancia convertida a n\u00famero
  const saveConexFn = async () => {
    const data = { ...conexForm, distancia: Number(conexForm.distancia) }
    await conexionService.create(data)
  }

  const { submit: handleSaveConex, isSubmitting: savingConex } = useSubmit(saveConexFn, {
    successMessage: 'Conexión creada',
    onSuccess: () => { setConexModalOpen(false); fetchData() },
  })

  const handleSubmitConex = (e: React.FormEvent) => { e.preventDefault(); if (validateConex()) handleSaveConex() }

  // Confirmaci\u00f3n de eliminaci\u00f3n de nodo
  const { submit: handleDeleteNodoConfirm, isSubmitting: deletingNodo } = useSubmit(
    () => nodoService.remove(confirmDeleteNodo!.idnodo),
    { successMessage: 'Nodo eliminado', onSuccess: () => { setConfirmDeleteNodo(null); fetchData() } }
  )

  // Confirmaci\u00f3n de activaci\u00f3n/desactivaci\u00f3n de nodo
  const { submit: handleToggleNodoConfirm, isSubmitting: togglingNodo } = useSubmit(
    () => nodoService.toggleEstado(confirmToggleNodo!.idnodo),
    { successMessage: 'Estado actualizado', onSuccess: () => { setConfirmToggleNodo(null); fetchData() } }
  )

  // Confirmaci\u00f3n de eliminaci\u00f3n de conexi\u00f3n
  const { submit: handleDeleteConexConfirm, isSubmitting: deletingConex } = useSubmit(
    () => conexionService.remove(confirmDeleteConex!.idconexion),
    { successMessage: 'Conexión eliminada', onSuccess: () => { setConfirmDeleteConex(null); fetchData() } }
  )

  // Confirmaci\u00f3n de activaci\u00f3n/desactivaci\u00f3n de conexi\u00f3n
  const { submit: handleToggleConexConfirm, isSubmitting: togglingConex } = useSubmit(
    () => conexionService.toggleEstado(confirmToggleConex!.idconexion),
    { successMessage: 'Estado actualizado', onSuccess: () => { setConfirmToggleConex(null); fetchData() } }
  )

  // Genera clases CSS para inputs con error (sin bordes redondeados para compatibilidad)
  const ic = (key: string) => w-full px-3 py-2 border rounded-lg 

  // Columnas de la tabla de nodos
  const nodoColumns = [
    { key: 'nombre', header: 'Nombre' },
    { key: 'tipo', header: 'Tipo' },
    { key: 'coordenada_x', header: 'X' },
    { key: 'coordenada_y', header: 'Y' },
    { key: 'conexiones_count', header: 'Conexiones' },
    {
      key: 'estado', header: 'Estado',
      render: (item: Nodo) => (
        <span className={px-2 py-1 text-xs rounded-full }>
          {item.estado ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
  ]

  // Columnas de la tabla de conexiones
  const conexColumns = [
    {
      key: 'origen',
      header: 'Origen',
      render: (item: Conexion) => item.origen_nombre || item.idnodoorigen.substring(0, 8),
    },
    {
      key: 'destino',
      header: 'Destino',
      render: (item: Conexion) => item.destino_nombre || item.idnododestino.substring(0, 8),
    },
    { key: 'distancia', header: 'Distancia (m)' },
    { key: 'tipo', header: 'Tipo' },
    {
      key: 'bidireccional',
      header: 'Bidireccional',
      render: (item: Conexion) => item.bidireccional ? 'Sí' : 'No',
    },
    {
      key: 'estado', header: 'Estado',
      render: (item: Conexion) => (
        <span className={px-2 py-1 text-xs rounded-full }>
          {item.estado ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
  ]

  return (
    <div>
      {/* Encabezado de nodos con filtro por almac\u00e9n y bot\u00f3n de nuevo nodo */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-800">Nodos</h1>
          <select value={filterAlmacen} onChange={(e) => setFilterAlmacen(e.target.value)} className="px-3 py-1 border rounded-lg text-sm">
            <option value="">Todos los almacenes</option>
            {almacenes.map((a) => <option key={a.idalmacen} value={a.idalmacen}>{a.nombre}</option>)}
          </select>
        </div>
        <button
          onClick={() => { setEditing(null); setFieldErrors({}); setForm({ idalmacen: filterAlmacen, nombre: '', tipo: 'interseccion', coordenada_x: 0, coordenada_y: 0, idubicacion: '' }); setModalOpen(true) }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Nuevo Nodo
        </button>
      </div>

      {/* Tabla de nodos */}
      <div className="bg-white rounded-lg shadow mb-8">
        <DataTable columns={nodoColumns} data={nodos} loading={loading}
          actions={(item) => (
            <>
              <button onClick={() => { setEditing(item); setFieldErrors({}); setForm({ idalmacen: item.idalmacen, nombre: item.nombre, tipo: item.tipo, coordenada_x: item.coordenada_x, coordenada_y: item.coordenada_y, idubicacion: item.idubicacion || '' }); setModalOpen(true) }}
                className="text-blue-600 hover:text-blue-800">Editar</button>
              <button onClick={() => setConfirmToggleNodo(item)} className="text-yellow-600 hover:text-yellow-800">
                {item.estado ? 'Desactivar' : 'Activar'}</button>
              <button onClick={() => setConfirmDeleteNodo(item)} className="text-red-600 hover:text-red-800">Eliminar</button>
            </>
          )} />
      </div>

      {/* Encabezado de conexiones con bot\u00f3n de nueva conexi\u00f3n */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Conexiones</h2>
        <button
          onClick={() => { setFieldErrors({}); setConexForm({ idnodoorigen: '', idnododestino: '', distancia: 0, tipo: 'pasillo', bidireccional: true }); setConexModalOpen(true) }}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          Nueva Conexión
        </button>
      </div>

      {/* Tabla de conexiones */}
      <div className="bg-white rounded-lg shadow">
        <DataTable columns={conexColumns} data={conexiones} loading={loading}
          actions={(item) => (
            <>
              <button onClick={() => setConfirmToggleConex(item)} className="text-yellow-600 hover:text-yellow-800">
                {item.estado ? 'Desactivar' : 'Activar'}</button>
              <button onClick={() => setConfirmDeleteConex(item)} className="text-red-600 hover:text-red-800">Eliminar</button>
            </>
          )} />
      </div>

      {/* Modal de creaci\u00f3n/edici\u00f3n de nodo */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Nodo' : 'Nuevo Nodo'} size="lg">
        <form onSubmit={handleSubmitNodo} className="space-y-4">
          {/* Selector de almac\u00e9n (obligatorio) */}
          <div><label className="block text-sm font-medium mb-1">Almacén *</label>
            <select value={form.idalmacen} onChange={(e) => { setForm({ ...form, idalmacen: e.target.value }); setFieldErrors((p) => ({ ...p, idalmacen: '' })) }} className={ic('idalmacen')} required>
              <option value="">Seleccionar</option>
              {almacenes.map((a) => <option key={a.idalmacen} value={a.idalmacen}>{a.nombre}</option>)}
            </select>
            {fieldErrors.idalmacen && <p className="text-red-500 text-xs mt-1">{fieldErrors.idalmacen}</p>}
          </div>
          {/* Campos de nombre y tipo de nodo */}
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">Nombre *</label><input type="text" value={form.nombre} onChange={(e) => { setForm({ ...form, nombre: e.target.value }); setFieldErrors((p) => ({ ...p, nombre: '' })) }} className={ic('nombre')} required />
              {fieldErrors.nombre && <p className="text-red-500 text-xs mt-1">{fieldErrors.nombre}</p>}
            </div>
            <div><label className="block text-sm font-medium mb-1">Tipo *</label>
              <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })} className="w-full px-3 py-2 border rounded-lg" required>
                {['entrada','salida','esquina','interseccion','punto_recogida'].map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          {/* Coordenadas X e Y del nodo */}
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">Coordenada X *</label><input type="number" value={form.coordenada_x} onChange={(e) => setForm({ ...form, coordenada_x: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" required /></div>
            <div><label className="block text-sm font-medium mb-1">Coordenada Y *</label><input type="number" value={form.coordenada_y} onChange={(e) => setForm({ ...form, coordenada_y: Number(e.target.value) })} className="w-full px-3 py-2 border rounded-lg" required /></div>
          </div>
          {/* Botones de acci\u00f3n del formulario de nodo */}
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border rounded-lg">Cancelar</button>
            <button type="submit" disabled={savingNodo} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
              {savingNodo && <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
              {editing ? 'Guardar' : 'Crear'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal de creaci\u00f3n de conexi\u00f3n */}
      <Modal isOpen={conexModalOpen} onClose={() => setConexModalOpen(false)} title="Nueva Conexión">
        <form onSubmit={handleSubmitConex} className="space-y-4">
          {/* Selector de nodo origen (obligatorio) */}
          <div><label className="block text-sm font-medium mb-1">Nodo Origen *</label>
            <select value={conexForm.idnodoorigen} onChange={(e) => { setConexForm({ ...conexForm, idnodoorigen: e.target.value }); setFieldErrors((p) => ({ ...p, idnodoorigen: '' })) }} className={ic('idnodoorigen')} required>
              <option value="">Seleccionar</option>
              {nodos.map((n) => <option key={n.idnodo} value={n.idnodo}>{n.nombre}</option>)}
            </select>
            {fieldErrors.idnodoorigen && <p className="text-red-500 text-xs mt-1">{fieldErrors.idnodoorigen}</p>}
          </div>
          {/* Selector de nodo destino (obligatorio, debe ser distinto al origen) */}
          <div><label className="block text-sm font-medium mb-1">Nodo Destino *</label>
            <select value={conexForm.idnododestino} onChange={(e) => { setConexForm({ ...conexForm, idnododestino: e.target.value }); setFieldErrors((p) => ({ ...p, idnododestino: '' })) }} className={ic('idnododestino')} required>
              <option value="">Seleccionar</option>
              {nodos.map((n) => <option key={n.idnodo} value={n.idnodo}>{n.nombre}</option>)}
            </select>
            {fieldErrors.idnododestino && <p className="text-red-500 text-xs mt-1">{fieldErrors.idnododestino}</p>}
          </div>
          {/* Distancia y tipo de conexi\u00f3n */}
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium mb-1">Distancia (m) *</label><input type="number" step="0.01" value={conexForm.distancia} onChange={(e) => { setConexForm({ ...conexForm, distancia: Number(e.target.value) }); setFieldErrors((p) => ({ ...p, distancia: '' })) }} className={ic('distancia')} required />
              {fieldErrors.distancia && <p className="text-red-500 text-xs mt-1">{fieldErrors.distancia}</p>}
            </div>
            <div><label className="block text-sm font-medium mb-1">Tipo</label>
              <select value={conexForm.tipo} onChange={(e) => setConexForm({ ...conexForm, tipo: e.target.value })} className="w-full px-3 py-2 border rounded-lg">
                {['pasillo','cruce','acceso'].map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          {/* Checkbox de conexi\u00f3n bidireccional */}
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={conexForm.bidireccional} onChange={(e) => setConexForm({ ...conexForm, bidireccional: e.target.checked })} />
            Bidireccional
          </label>
          {/* Botones de acci\u00f3n del formulario de conexi\u00f3n */}
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setConexModalOpen(false)} className="px-4 py-2 border rounded-lg">Cancelar</button>
            <button type="submit" disabled={savingConex} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2">
              {savingConex && <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
              Crear Conexión
            </button>
          </div>
        </form>
      </Modal>

      {/* Di\u00e1logos de confirmaci\u00f3n para nodos y conexiones */}
      <ConfirmDialog isOpen={!!confirmDeleteNodo} onClose={() => setConfirmDeleteNodo(null)} onConfirm={() => handleDeleteNodoConfirm()} title="Eliminar Nodo" message={¿Está seguro de eliminar ""?} confirmLabel="Eliminar" confirmVariant="danger" isLoading={deletingNodo} />
      <ConfirmDialog isOpen={!!confirmToggleNodo} onClose={() => setConfirmToggleNodo(null)} onConfirm={() => handleToggleNodoConfirm()} title={confirmToggleNodo?.estado ? 'Desactivar Nodo' : 'Activar Nodo'} message={¿Está seguro de  ""?} confirmLabel={confirmToggleNodo?.estado ? 'Desactivar' : 'Activar'} confirmVariant="primary" isLoading={togglingNodo} />
      <ConfirmDialog isOpen={!!confirmDeleteConex} onClose={() => setConfirmDeleteConex(null)} onConfirm={() => handleDeleteConexConfirm()} title="Eliminar Conexión" message="¿Está seguro de eliminar la conexión?" confirmLabel="Eliminar" confirmVariant="danger" isLoading={deletingConex} />
      <ConfirmDialog isOpen={!!confirmToggleConex} onClose={() => setConfirmToggleConex(null)} onConfirm={() => handleToggleConexConfirm()} title={confirmToggleConex?.estado ? 'Desactivar Conexión' : 'Activar Conexión'} message={¿Está seguro de  la conexión?} confirmLabel={confirmToggleConex?.estado ? 'Desactivar' : 'Activar'} confirmVariant="primary" isLoading={togglingConex} />
    </div>
  )
}
