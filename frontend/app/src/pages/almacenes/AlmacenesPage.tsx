/**
 * P\u00e1gina de administraci\u00f3n de Almacenes.
 * Gestiona el CRUD completo de almacenes: listar, crear, editar,
 * eliminar y activar/desactivar. Permite filtrar por sucursal.
 */
import { useState, useEffect } from 'react'
import DataTable from '../../components/DataTable'
import Modal from '../../components/Modal'
import ConfirmDialog from '../../components/ConfirmDialog'
import { almacenService, sucursalService } from '../../api/empresa'
import { useSubmit } from '../../hooks/useSubmit'
import { useToastStore } from '../../store/toastStore'
import { validateRequired, validateNonNegative } from '../../utils/validators'
import type { Almacen, Sucursal } from '../../types'

export default function AlmacenesPage() {
  // Estado de almacenes y sucursales disponibles
  const [almacenes, setAlmacenes] = useState<Almacen[]>([])
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [loading, setLoading] = useState(true)
  // Control del modal de creaci\u00f3n/edici\u00f3n
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Almacen | null>(null)
  // Filtro por sucursal
  const [filterSucursal, setFilterSucursal] = useState('')
  const addToast = useToastStore((state) => state.addToast)
  // Errores de validaci\u00f3n por campo
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  // Datos del formulario
  const [form, setForm] = useState({
    idsucursal: '', nombre: '', codigo: '', descripcion: '',
    ancho: '', alto: '', capacidadmaxima: '',
  })

  // Confirmaciones para eliminar o activar/desactivar almac\u00e9n
  const [confirmDelete, setConfirmDelete] = useState<Almacen | null>(null)
  const [confirmToggle, setConfirmToggle] = useState<Almacen | null>(null)

  // Carga inicial de almacenes y sucursales desde la API
  const fetchData = async () => {
    try {
      const [almRes, sucRes] = await Promise.all([almacenService.list(), sucursalService.list()])
      setAlmacenes(almRes.data.results)
      setSucursales(sucRes.data.results)
    } catch { addToast('error', 'Error al cargar datos') } finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  // Lista de almacenes filtrada por sucursal seleccionada
  const filtered = filterSucursal ? almacenes.filter((a) => a.idsucursal === filterSucursal) : almacenes
  // Obtiene el nombre de una sucursal por su ID
  const getSucName = (id: string) => sucursales.find((s) => s.idsucursal === id)?.nombre || '\u2014'

  // Prepara el formulario para crear un nuevo almac\u00e9n
  const handleOpenCreate = () => {
    setEditing(null)
    setForm({ idsucursal: filterSucursal || '', nombre: '', codigo: '', descripcion: '', ancho: '', alto: '', capacidadmaxima: '' })
    setFieldErrors({})
    setModalOpen(true)
  }

  // Prepara el formulario para editar un almac\u00e9n existente
  const handleOpenEdit = (item: Almacen) => {
    setEditing(item)
    setForm({
      idsucursal: item.idsucursal, nombre: item.nombre, codigo: item.codigo,
      descripcion: item.descripcion || '', ancho: item.ancho?.toString() || '',
      alto: item.alto?.toString() || '', capacidadmaxima: item.capacidadmaxima?.toString() || '',
    })
    setFieldErrors({})
    setModalOpen(true)
  }

  // Valida campos obligatorios (sucursal, nombre, c\u00f3digo) y num\u00e9ricos no negativos
  const validate = (): boolean => {
    const e: Record<string, string> = {}
    const v1 = validateRequired(form.idsucursal, 'Sucursal'); if (v1) e.idsucursal = v1
    const v2 = validateRequired(form.nombre, 'Nombre'); if (v2) e.nombre = v2
    const v3 = validateRequired(form.codigo, 'C\u00f3digo'); if (v3) e.codigo = v3
    const v4 = validateNonNegative(form.ancho, 'Ancho'); if (v4) e.ancho = v4
    const v5 = validateNonNegative(form.alto, 'Alto'); if (v5) e.alto = v5
    const v6 = validateNonNegative(form.capacidadmaxima, 'Capacidad M\u00e1x.'); if (v6) e.capacidadmaxima = v6
    setFieldErrors(e)
    return Object.keys(e).length === 0
  }

  // Convierte los valores del formulario al formato esperado por la API
  const buildData = () => ({
    idsucursal: form.idsucursal, nombre: form.nombre, codigo: form.codigo,
    descripcion: form.descripcion || null,
    ancho: form.ancho ? parseFloat(form.ancho) : null,
    alto: form.alto ? parseFloat(form.alto) : null,
    capacidadmaxima: form.capacidadmaxima ? parseFloat(form.capacidadmaxima) : null,
  })

  // Crea o actualiza el almac\u00e9n seg\u00fan corresponda
  const saveFn = async () => {
    const data = buildData()
    if (editing) await almacenService.update(editing.idalmacen, data)
    else await almacenService.create(data)
  }

  const { submit: handleSave, isSubmitting } = useSubmit(saveFn, {
    successMessage: editing ? 'Almac\u00e9n actualizado' : 'Almac\u00e9n creado',
    onSuccess: () => { setModalOpen(false); fetchData() },
  })

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (validate()) handleSave() }

  // Confirmaci\u00f3n de eliminaci\u00f3n de almac\u00e9n
  const { submit: handleDeleteConfirm, isSubmitting: deleting } = useSubmit(
    () => almacenService.remove(confirmDelete!.idalmacen),
    { successMessage: 'Almac\u00e9n eliminado', onSuccess: () => { setConfirmDelete(null); fetchData() } }
  )

  // Confirmaci\u00f3n de activaci\u00f3n/desactivaci\u00f3n de almac\u00e9n
  const { submit: handleToggleConfirm, isSubmitting: toggling } = useSubmit(
    () => almacenService.toggleEstado(confirmToggle!.idalmacen),
    { successMessage: 'Estado actualizado', onSuccess: () => { setConfirmToggle(null); fetchData() } }
  )

  // Genera clases CSS condicionales para inputs con error
  const ic = (key: string) => w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none 

  // Columnas de la tabla de almacenes
  const columns = [
    { key: 'nombre', header: 'Nombre' },
    { key: 'codigo', header: 'C\u00f3digo' },
    { key: 'idsucursal', header: 'Sucursal', render: (item: Almacen) => getSucName(item.idsucursal) },
    { key: 'capacidadmaxima', header: 'Capacidad M\u00e1x.', render: (item: Almacen) => item.capacidadmaxima ? ${item.capacidadmaxima} m\u00b3 : '\u2014' },
    { key: 'estado', header: 'Estado', render: (item: Almacen) => (
      <span className={px-2 py-1 text-xs rounded-full }>{item.estado ? 'Activo' : 'Inactivo'}</span>
    )},
  ]

  // Botones de acci\u00f3n por fila (editar, activar/desactivar, eliminar)
  const actions = (item: Almacen) => (
    <>
      <button onClick={() => handleOpenEdit(item)} className="text-blue-600 hover:text-blue-800">Editar</button>
      <button onClick={() => setConfirmToggle(item)} className="text-yellow-600 hover:text-yellow-800">{item.estado ? 'Desactivar' : 'Activar'}</button>
      <button onClick={() => setConfirmDelete(item)} className="text-red-600 hover:text-red-800">Eliminar</button>
    </>
  )

  return (
    <div>
      {/* Encabezado con t\u00edtulo y bot\u00f3n de nuevo almac\u00e9n */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Almacenes</h1>
        <button onClick={handleOpenCreate} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">Nuevo Almac\u00e9n</button>
      </div>
      {/* Filtro por sucursal */}
      <div className="mb-4">
        <select value={filterSucursal} onChange={(e) => setFilterSucursal(e.target.value)} className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none">
          <option value="">Todas las sucursales</option>
          {sucursales.map((s) => <option key={s.idsucursal} value={s.idsucursal}>{s.nombre}</option>)}
        </select>
      </div>
      {/* Tabla de almacenes */}
      <div className="bg-white rounded-lg shadow">
        <DataTable columns={columns} data={filtered} loading={loading} actions={actions} />
      </div>

      {/* Modal de creaci\u00f3n/edici\u00f3n de almac\u00e9n */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Almac\u00e9n' : 'Nuevo Almac\u00e9n'} size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Selector de sucursal (obligatorio) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sucursal *</label>
            <select value={form.idsucursal} onChange={(e) => { setForm({ ...form, idsucursal: e.target.value }); setFieldErrors((p) => ({ ...p, idsucursal: '' })) }} className={ic('idsucursal')}>
              <option value="">Seleccionar sucursal</option>
              {sucursales.map((s) => <option key={s.idsucursal} value={s.idsucursal}>{s.nombre}</option>)}
            </select>
            {fieldErrors.idsucursal && <p className="text-red-500 text-xs mt-1">{fieldErrors.idsucursal}</p>}
          </div>
          {/* Campos de nombre y c\u00f3digo (obligatorios) */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
              <input type="text" value={form.nombre} onChange={(e) => { setForm({ ...form, nombre: e.target.value }); setFieldErrors((p) => ({ ...p, nombre: '' })) }} className={ic('nombre')} />
              {fieldErrors.nombre && <p className="text-red-500 text-xs mt-1">{fieldErrors.nombre}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">C\u00f3digo *</label>
              <input type="text" value={form.codigo} onChange={(e) => { setForm({ ...form, codigo: e.target.value }); setFieldErrors((p) => ({ ...p, codigo: '' })) }} className={ic('codigo')} />
              {fieldErrors.codigo && <p className="text-red-500 text-xs mt-1">{fieldErrors.codigo}</p>}
            </div>
          </div>
          {/* Descripci\u00f3n (opcional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripci\u00f3n</label>
            <textarea value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" rows={2} />
          </div>
          {/* Dimensiones (ancho, alto, capacidad m\u00e1xima) - valores no negativos */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ancho (m)</label>
              <input type="number" step="0.01" value={form.ancho} onChange={(e) => { setForm({ ...form, ancho: e.target.value }); setFieldErrors((p) => ({ ...p, ancho: '' })) }} className={ic('ancho')} />
              {fieldErrors.ancho && <p className="text-red-500 text-xs mt-1">{fieldErrors.ancho}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Alto (m)</label>
              <input type="number" step="0.01" value={form.alto} onChange={(e) => { setForm({ ...form, alto: e.target.value }); setFieldErrors((p) => ({ ...p, alto: '' })) }} className={ic('alto')} />
              {fieldErrors.alto && <p className="text-red-500 text-xs mt-1">{fieldErrors.alto}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Capacidad M\u00e1x. (m\u00b3)</label>
              <input type="number" step="0.01" value={form.capacidadmaxima} onChange={(e) => { setForm({ ...form, capacidadmaxima: e.target.value }); setFieldErrors((p) => ({ ...p, capacidadmaxima: '' })) }} className={ic('capacidadmaxima')} />
              {fieldErrors.capacidadmaxima && <p className="text-red-500 text-xs mt-1">{fieldErrors.capacidadmaxima}</p>}
            </div>
          </div>
          {/* Botones de acci\u00f3n del formulario */}
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2">
              {isSubmitting && <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
              {editing ? 'Guardar' : 'Crear'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Di\u00e1logos de confirmaci\u00f3n para eliminar y activar/desactivar almac\u00e9n */}
      <ConfirmDialog isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={() => handleDeleteConfirm()} title="Eliminar Almac\u00e9n" message={\u00bfEst\u00e1 seguro de eliminar ""?} confirmLabel="Eliminar" confirmVariant="danger" isLoading={deleting} />
      <ConfirmDialog isOpen={!!confirmToggle} onClose={() => setConfirmToggle(null)} onConfirm={() => handleToggleConfirm()} title={confirmToggle?.estado ? 'Desactivar Almac\u00e9n' : 'Activar Almac\u00e9n'} message={\u00bfEst\u00e1 seguro de  ""?} confirmLabel={confirmToggle?.estado ? 'Desactivar' : 'Activar'} confirmVariant="primary" isLoading={toggling} />
    </div>
  )
}
