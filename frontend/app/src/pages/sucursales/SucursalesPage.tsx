/**
 * P\u00e1gina de administraci\u00f3n de Sucursales.
 * Gestiona el CRUD completo de sucursales: listar, crear, editar,
 * eliminar y activar/desactivar el estado de cada sucursal.
 */
import { useState, useEffect } from 'react'
import DataTable from '../../components/DataTable'
import Modal from '../../components/Modal'
import ConfirmDialog from '../../components/ConfirmDialog'
import { sucursalService } from '../../api/empresa'
import { useSubmit } from '../../hooks/useSubmit'
import { useToastStore } from '../../store/toastStore'
import { validateRequired } from '../../utils/validators'
import type { Sucursal } from '../../types'

export default function SucursalesPage() {
  // Estado de la lista de sucursales
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [loading, setLoading] = useState(true)
  // Control del modal de creaci\u00f3n/edici\u00f3n
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Sucursal | null>(null)
  const addToast = useToastStore((state) => state.addToast)
  // Errores de validaci\u00f3n por campo
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  // Datos del formulario
  const [form, setForm] = useState({
    nombre: '',
    codigo: '',
    direccion: '',
    telefono: '',
  })

  // Confirmaciones para eliminar o activar/desactivar sucursal
  const [confirmDelete, setConfirmDelete] = useState<Sucursal | null>(null)
  const [confirmToggle, setConfirmToggle] = useState<Sucursal | null>(null)

  // Carga inicial de sucursales desde la API
  const fetchData = async () => {
    try {
      const { data } = await sucursalService.list()
      setSucursales(data.results)
    } catch {
      addToast('error', 'Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  // Prepara el formulario para crear una nueva sucursal
  const handleOpenCreate = () => {
    setEditing(null)
    setForm({ nombre: '', codigo: '', direccion: '', telefono: '' })
    setFieldErrors({})
    setModalOpen(true)
  }

  // Prepara el formulario para editar una sucursal existente
  const handleOpenEdit = (item: Sucursal) => {
    setEditing(item)
    setForm({
      nombre: item.nombre,
      codigo: item.codigo,
      direccion: item.direccion || '',
      telefono: item.telefono || '',
    })
    setFieldErrors({})
    setModalOpen(true)
  }

  // Valida que nombre y c\u00f3digo sean obligatorios
  const validate = (): boolean => {
    const e: Record<string, string> = {}
    const v1 = validateRequired(form.nombre, 'Nombre')
    if (v1) e.nombre = v1
    const v2 = validateRequired(form.codigo, 'C\u00f3digo')
    if (v2) e.codigo = v2
    setFieldErrors(e)
    return Object.keys(e).length === 0
  }

  // Crea o actualiza la sucursal seg\u00fan corresponda
  const saveFn = async (data: typeof form) => {
    if (editing) {
      await sucursalService.update(editing.idsucursal, data)
    } else {
      await sucursalService.create(data)
    }
  }

  const { submit: handleSave, isSubmitting } = useSubmit(saveFn, {
    successMessage: editing ? 'Sucursal actualizada' : 'Sucursal creada',
    onSuccess: () => { setModalOpen(false); fetchData() },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    handleSave(form)
  }

  // Confirmaci\u00f3n de eliminaci\u00f3n de sucursal
  const { submit: handleDeleteConfirm, isSubmitting: deleting } = useSubmit(
    () => sucursalService.remove(confirmDelete!.idsucursal),
    { successMessage: 'Sucursal eliminada', onSuccess: () => { setConfirmDelete(null); fetchData() } }
  )

  // Confirmaci\u00f3n de activaci\u00f3n/desactivaci\u00f3n de sucursal
  const { submit: handleToggleConfirm, isSubmitting: toggling } = useSubmit(
    () => sucursalService.toggleEstado(confirmToggle!.idsucursal),
    { successMessage: 'Estado actualizado', onSuccess: () => { setConfirmToggle(null); fetchData() } }
  )

  // Columnas de la tabla de sucursales
  const columns = [
    { key: 'nombre', header: 'Nombre' },
    { key: 'codigo', header: 'C\u00f3digo' },
    { key: 'direccion', header: 'Direcci\u00f3n' },
    { key: 'estado', header: 'Estado', render: (item: Sucursal) => (
      <span className={px-2 py-1 text-xs rounded-full }>
        {item.estado ? 'Activo' : 'Inactivo'}
      </span>
    )},
  ]

  // Botones de acci\u00f3n por fila (editar, activar/desactivar, eliminar)
  const actions = (item: Sucursal) => (
    <>
      <button onClick={() => handleOpenEdit(item)} className="text-blue-600 hover:text-blue-800">Editar</button>
      <button onClick={() => setConfirmToggle(item)} className="text-yellow-600 hover:text-yellow-800">
        {item.estado ? 'Desactivar' : 'Activar'}
      </button>
      <button onClick={() => setConfirmDelete(item)} className="text-red-600 hover:text-red-800">Eliminar</button>
    </>
  )

  // Genera clases CSS condicionales para inputs con error
  const ic = (key: string) =>
    w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none 

  return (
    <div>
      {/* Encabezado con t\u00edtulo y bot\u00f3n de nueva sucursal */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Sucursales</h1>
        <button onClick={handleOpenCreate} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">Nueva Sucursal</button>
      </div>
      {/* Tabla de sucursales */}
      <div className="bg-white rounded-lg shadow">
        <DataTable columns={columns} data={sucursales} loading={loading} actions={actions} />
      </div>

      {/* Modal de creaci\u00f3n/edici\u00f3n de sucursal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Sucursal' : 'Nueva Sucursal'}>
        <form onSubmit={handleSubmit} className="space-y-4">
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
          {/* Direcci\u00f3n (opcional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Direcci\u00f3n</label>
            <textarea value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" rows={2} />
          </div>
          {/* Tel\u00e9fono (opcional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tel\u00e9fono</label>
            <input type="text" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
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

      {/* Di\u00e1logos de confirmaci\u00f3n para eliminar y activar/desactivar sucursal */}
      <ConfirmDialog isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={() => handleDeleteConfirm()} title="Eliminar Sucursal" message={\u00bfEst\u00e1 seguro de eliminar ""?} confirmLabel="Eliminar" confirmVariant="danger" isLoading={deleting} />
      <ConfirmDialog isOpen={!!confirmToggle} onClose={() => setConfirmToggle(null)} onConfirm={() => handleToggleConfirm()} title={confirmToggle?.estado ? 'Desactivar Sucursal' : 'Activar Sucursal'} message={\u00bfEst\u00e1 seguro de  ""?} confirmLabel={confirmToggle?.estado ? 'Desactivar' : 'Activar'} confirmVariant="primary" isLoading={toggling} />
    </div>
  )
}
