import { useState } from 'react'
import Modal from '../Modal'

interface IncidenciaFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: { tipo: string; descripcion: string; cantidad_reportada: number }) => Promise<void>
}

const TIPOS = ['faltante', 'danado', 'caducado', 'ubicacion_vacia', 'otro']

export default function IncidenciaFormModal({ isOpen, onClose, onSubmit }: IncidenciaFormModalProps) {
  const [tipo, setTipo] = useState('faltante')
  const [descripcion, setDescripcion] = useState('')
  const [cantidad, setCantidad] = useState('0')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const validate = () => {
    const e: Record<string, string> = {}
    if (!tipo) e.tipo = 'Tipo requerido'
    if (!descripcion.trim()) e.descripcion = 'Descripción requerida'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      await onSubmit({ tipo, descripcion, cantidad_reportada: Number(cantidad) })
      setTipo('faltante')
      setDescripcion('')
      setCantidad('0')
      setErrors({})
    } finally {
      setSubmitting(false)
    }
  }

  const ic = (key: string) => `w-full px-3 py-2 border rounded-lg ${errors[key] ? 'border-red-500' : ''}`

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Reportar Incidencia">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Tipo *</label>
          <select value={tipo} onChange={(e) => { setTipo(e.target.value); setErrors((p) => ({ ...p, tipo: '' })) }} className={ic('tipo')} required>
            {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          {errors.tipo && <p className="text-red-500 text-xs mt-1">{errors.tipo}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Descripción *</label>
          <textarea value={descripcion} onChange={(e) => { setDescripcion(e.target.value); setErrors((p) => ({ ...p, descripcion: '' })) }} className={ic('descripcion')} rows={3} required />
          {errors.descripcion && <p className="text-red-500 text-xs mt-1">{errors.descripcion}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Cantidad Reportada</label>
          <input type="number" step="0.01" value={cantidad} onChange={(e) => setCantidad(e.target.value)} className="w-full px-3 py-2 border rounded-lg" />
        </div>
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg">Cancelar</button>
          <button type="submit" disabled={submitting} className="px-4 py-2 bg-red-600 text-white rounded-lg disabled:opacity-50 flex items-center gap-2">
            {submitting && <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>}
            Reportar
          </button>
        </div>
      </form>
    </Modal>
  )
}
