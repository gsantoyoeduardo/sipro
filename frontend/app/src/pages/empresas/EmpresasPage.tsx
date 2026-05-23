import { useState, useEffect } from 'react'
import DataTable from '../../components/DataTable'
import Modal from '../../components/Modal'
import ConfirmDialog from '../../components/ConfirmDialog'
import { empresaService } from '../../api/empresa'
import { useSubmit } from '../../hooks/useSubmit'
import { useToastStore } from '../../store/toastStore'
import { validateRequired, validateRUC, validateEmail } from '../../utils/validators'
import type { Empresa } from '../../types'

export default function EmpresasPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Empresa | null>(null)
  const addToast = useToastStore((state) => state.addToast)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [form, setForm] = useState({
    razonsocial: '',
    nombrecomercial: '',
    ruc: '',
    correo: '',
    telefono: '',
    direccion: '',
  })

  const [confirmDelete, setConfirmDelete] = useState<Empresa | null>(null)
  const [confirmToggle, setConfirmToggle] = useState<Empresa | null>(null)

  const fetchEmpresas = async () => {
    try {
      const { data } = await empresaService.list()
      setEmpresas(data.results)
    } catch {
      addToast('error', 'Error al cargar empresas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchEmpresas() }, [])

  const handleOpenCreate = () => {
    setEditing(null)
    setForm({ razonsocial: '', nombrecomercial: '', ruc: '', correo: '', telefono: '', direccion: '' })
    setFieldErrors({})
    setModalOpen(true)
  }

  const handleOpenEdit = (item: Empresa) => {
    setEditing(item)
    setForm({
      razonsocial: item.razonsocial,
      nombrecomercial: item.nombrecomercial,
      ruc: item.ruc,
      correo: item.correo,
      telefono: item.telefono || '',
      direccion: item.direccion || '',
    })
    setFieldErrors({})
    setModalOpen(true)
  }

  const validate = (): boolean => {
    const e: Record<string, string> = {}
    const v = validateRequired(form.razonsocial, 'Raz\u00f3n Social')
    if (v) e.razonsocial = v
    const r = validateRequired(form.ruc, 'RUC') || validateRUC(form.ruc)
    if (r) e.ruc = r
    const c = validateRequired(form.correo, 'Correo') || validateEmail(form.correo)
    if (c) e.correo = c
    setFieldErrors(e)
    return Object.keys(e).length === 0
  }

  const saveFn = async (data: typeof form) => {
    if (editing) {
      await empresaService.update(editing.idempresa, data)
    } else {
      await empresaService.create(data)
    }
  }

  const { submit: handleSave, isSubmitting } = useSubmit(saveFn, {
    successMessage: editing ? 'Empresa actualizada' : 'Empresa creada',
    onSuccess: () => { setModalOpen(false); fetchEmpresas() },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    handleSave(form)
  }

  const { submit: handleDeleteConfirm, isSubmitting: deleting } = useSubmit(
    () => empresaService.remove(confirmDelete!.idempresa),
    {
      successMessage: 'Empresa eliminada',
      onSuccess: () => { setConfirmDelete(null); fetchEmpresas() },
    }
  )

  const { submit: handleToggleConfirm, isSubmitting: toggling } = useSubmit(
    () => empresaService.toggleEstado(confirmToggle!.idempresa),
    {
      successMessage: 'Estado actualizado',
      onSuccess: () => { setConfirmToggle(null); fetchEmpresas() },
    }
  )

  const columns = [
    { key: 'razonsocial', header: 'Raz\u00f3n Social' },
    { key: 'nombrecomercial', header: 'Nombre Comercial' },
    { key: 'ruc', header: 'RUC' },
    { key: 'correo', header: 'Correo' },
    {
      key: 'estado',
      header: 'Estado',
      render: (item: Empresa) => (
        <span className={`px-2 py-1 text-xs rounded-full ${item.estado ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {item.estado ? 'Activo' : 'Inactivo'}
        </span>
      ),
    },
  ]

  const actions = (item: Empresa) => (
    <>
      <button onClick={() => handleOpenEdit(item)} className="text-blue-600 hover:text-blue-800">Editar</button>
      <button onClick={() => setConfirmToggle(item)} className="text-yellow-600 hover:text-yellow-800">
        {item.estado ? 'Desactivar' : 'Activar'}
      </button>
      <button onClick={() => setConfirmDelete(item)} className="text-red-600 hover:text-red-800">Eliminar</button>
    </>
  )

  const inputClass = (key: string) =>
    `w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none ${fieldErrors[key] ? 'border-red-500' : ''}`

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Empresas</h1>
        <button onClick={handleOpenCreate} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
          Nueva Empresa
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <DataTable columns={columns} data={empresas} loading={loading} actions={actions} />
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Empresa' : 'Nueva Empresa'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Raz\u00f3n Social *</label>
            <input type="text" value={form.razonsocial} onChange={(e) => { setForm({ ...form, razonsocial: e.target.value }); setFieldErrors((p) => ({ ...p, razonsocial: '' })) }} className={inputClass('razonsocial')} />
            {fieldErrors.razonsocial && <p className="text-red-500 text-xs mt-1">{fieldErrors.razonsocial}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Comercial</label>
            <input type="text" value={form.nombrecomercial} onChange={(e) => setForm({ ...form, nombrecomercial: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">RUC *</label>
              <input type="text" value={form.ruc} onChange={(e) => { setForm({ ...form, ruc: e.target.value }); setFieldErrors((p) => ({ ...p, ruc: '' })) }} className={inputClass('ruc')} />
              {fieldErrors.ruc && <p className="text-red-500 text-xs mt-1">{fieldErrors.ruc}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Correo *</label>
              <input type="email" value={form.correo} onChange={(e) => { setForm({ ...form, correo: e.target.value }); setFieldErrors((p) => ({ ...p, correo: '' })) }} className={inputClass('correo')} />
              {fieldErrors.correo && <p className="text-red-500 text-xs mt-1">{fieldErrors.correo}</p>}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tel\u00e9fono</label>
            <input type="text" value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Direcci\u00f3n</label>
            <textarea value={form.direccion} onChange={(e) => setForm({ ...form, direccion: e.target.value })} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" rows={2} />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2">
              {isSubmitting && (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {editing ? 'Guardar' : 'Crear'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => handleDeleteConfirm()}
        title="Eliminar Empresa"
        message={`\u00bfEst\u00e1 seguro de eliminar "${confirmDelete?.razonsocial}"? Esta acci\u00f3n no se puede deshacer.`}
        confirmLabel="Eliminar"
        confirmVariant="danger"
        isLoading={deleting}
      />

      <ConfirmDialog
        isOpen={!!confirmToggle}
        onClose={() => setConfirmToggle(null)}
        onConfirm={() => handleToggleConfirm()}
        title={confirmToggle?.estado ? 'Desactivar Empresa' : 'Activar Empresa'}
        message={`\u00bfEst\u00e1 seguro de ${confirmToggle?.estado ? 'desactivar' : 'activar'} "${confirmToggle?.razonsocial}"?`}
        confirmLabel={confirmToggle?.estado ? 'Desactivar' : 'Activar'}
        confirmVariant="primary"
        isLoading={toggling}
      />
    </div>
  )
}
