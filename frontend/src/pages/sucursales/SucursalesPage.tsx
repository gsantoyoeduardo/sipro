import { useState, useEffect } from 'react'
import DataTable from '../../components/DataTable'
import Modal from '../../components/Modal'
import ConfirmDialog from '../../components/ConfirmDialog'
import { sucursalService, empresaService } from '../../api/empresa'
import { useSubmit } from '../../hooks/useSubmit'
import { useToastStore } from '../../store/toastStore'
import { validateRequired } from '../../utils/validators'
import type { Sucursal, Empresa } from '../../types'

export default function SucursalesPage() {
  const [sucursales, setSucursales] = useState<Sucursal[]>([])
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Sucursal | null>(null)
  const [filterEmpresa, setFilterEmpresa] = useState('')
  const addToast = useToastStore((state) => state.addToast)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState({
    idempresa: '',
    nombre: '',
    codigo: '',
    direccion: '',
    telefono: '',
  })

  const [confirmDelete, setConfirmDelete] = useState<Sucursal | null>(null)
  const [confirmToggle, setConfirmToggle] = useState<Sucursal | null>(null)

  const fetchData = async () => {
    try {
      const [sucRes, empRes] = await Promise.all([
        sucursalService.list(),
        empresaService.list(),
      ])
      setSucursales(sucRes.data.results)
      setEmpresas(empRes.data.results)
    } catch {
      addToast('error', 'Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const filteredSucursales = filterEmpresa
    ? sucursales.filter((s) => s.idempresa === filterEmpresa)
    : sucursales

  const getEmpresaName = (idempresa: string) =>
    empresas.find((e) => e.idempresa === idempresa)?.razonsocial || '\u2014'

  const handleOpenCreate = () => {
    setEditing(null)
    setForm({ idempresa: filterEmpresa || '', nombre: '', codigo: '', direccion: '', telefono: '' })
    setFieldErrors({})
    setModalOpen(true)
  }

  const handleOpenEdit = (item: Sucursal) => {
    setEditing(item)
    setForm({
      idempresa: item.idempresa,
      nombre: item.nombre,
      codigo: item.codigo,
      direccion: item.direccion || '',
      telefono: item.telefono || '',
    })
    setFieldErrors({})
    setModalOpen(true)
  }

  const validate = (): boolean => {
    const e: Record<string, string> = {}
    const v1 = validateRequired(form.idempresa, 'Empresa')
    if (v1) e.idempresa = v1
    const v2 = validateRequired(form.nombre, 'Nombre')
    if (v2) e.nombre = v2
    const v3 = validateRequired(form.codigo, 'C\u00f3digo')
    if (v3) e.codigo = v3
    setFieldErrors(e)
    return Object.keys(e).length === 0
  }

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

  const { submit: handleDeleteConfirm, isSubmitting: deleting } = useSubmit(
    () => sucursalService.remove(confirmDelete!.idsucursal),
    { successMessage: 'Sucursal eliminada', onSuccess: () => { setConfirmDelete(null); fetchData() } }
  )

  const { submit: handleToggleConfirm, isSubmitting: toggling } = useSubmit(
    () => sucursalService.toggleEstado(confirmToggle!.idsucursal),
    { successMessage: 'Estado actualizado', onSuccess: () => { setConfirmToggle(null); fetchData() } }
  )

  const columns = [
    { key: 'nombre', header: 'Nombre' },
    { key: 'codigo', header: 'C\u00f3digo' },
    { key: 'idempresa', header: 'Empresa', render: (item: Sucursal) => getEmpresaName(item.idempresa) },
    { key: 'direccion', header: 'Direcci\u00f3n' },
    { key: 'estado', header: 'Estado', render: (item: Sucursal) => (
      <span className={`px-2 py-1 text-xs rounded-full ${item.estado ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
        {item.estado ? 'Activo' : 'Inactivo'}
      </span>
    )},
  ]

  const actions = (item: Sucursal) => (
    <>
      <button onClick={() => handleOpenEdit(item)} className="text-blue-600 hover:text-blue-800">Editar</button>
      <button onClick={() => setConfirmToggle(item)} className="text-yellow-600 hover:text-yellow-800">
        {item.estado ? 'Desactivar' : 'Activar'}
      </button>
      <button onClick={() => setConfirmDelete(item)} className="text-red-600 hover:text-red-800">Eliminar</button>
    </>
  )

  const ic = (key: string) =>
    `w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none ${fieldErrors[key] ? 'border-red-500' : ''}`

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Sucursales</h1>
        <button onClick={handleOpenCreate} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">Nueva Sucursal</button>
      </div>
      <div className="mb-4">
        <select value={filterEmpresa} onChange={(e) => setFilterEmpresa(e.target.value)} className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none">
          <option value="">Todas las empresas</option>
          {empresas.map((emp) => <option key={emp.idempresa} value={emp.idempresa}>{emp.razonsocial}</option>)}
        </select>
      </div>
      <div className="bg-white rounded-lg shadow">
        <DataTable columns={columns} data={filteredSucursales} loading={loading} actions={actions} />
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Sucursal' : 'Nueva Sucursal'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Empresa *</label>
            <select value={form.idempresa} onChange={(e) => { setForm({ ...form, idempresa: e.target.value }); setFieldErrors((p) => ({ ...p, idempresa: '' })) }} className={ic('idempresa')}>
              <option value="">Seleccionar empresa</option>
              {empresas.map((emp) => <option key={emp.idempresa} value={emp.idempresa}>{emp.razonsocial}</option>)}
            </select>
            {fieldErrors.idempresa && <p className="text-red-500 text-xs mt-1">{fieldErrors.idempresa}</p>}
          </div>
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
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Direcci\u00f3n</label>
            <textarea value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" rows={2} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tel\u00e9fono</label>
            <input type="text" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2">
              {isSubmitting && <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
              {editing ? 'Guardar' : 'Crear'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} onConfirm={() => handleDeleteConfirm()} title="Eliminar Sucursal" message={`\u00bfEst\u00e1 seguro de eliminar "${confirmDelete?.nombre}"?`} confirmLabel="Eliminar" confirmVariant="danger" isLoading={deleting} />
      <ConfirmDialog isOpen={!!confirmToggle} onClose={() => setConfirmToggle(null)} onConfirm={() => handleToggleConfirm()} title={confirmToggle?.estado ? 'Desactivar Sucursal' : 'Activar Sucursal'} message={`\u00bfEst\u00e1 seguro de ${confirmToggle?.estado ? 'desactivar' : 'activar'} "${confirmToggle?.nombre}"?`} confirmLabel={confirmToggle?.estado ? 'Desactivar' : 'Activar'} confirmVariant="primary" isLoading={toggling} />
    </div>
  )
}
