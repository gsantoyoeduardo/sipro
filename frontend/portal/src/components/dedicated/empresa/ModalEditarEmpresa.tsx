import { useState, useEffect } from 'react'
import Modal from '../../common/Modal'
import type { Empresa } from '../../../api/empresa'
import { empresaService } from '../../../api/empresa'

interface ModalEditarEmpresaProps {
  empresa: Empresa | null
  abierto: boolean
  onCerrar: () => void
  onGuardado: () => void
}

export default function ModalEditarEmpresa({ empresa, abierto, onCerrar, onGuardado }: ModalEditarEmpresaProps) {
  const [form, setForm] = useState({
    razonsocial: '',
    nombrecomercial: '',
    correo: '',
    telefono: '',
    direccion: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (abierto && empresa) {
      setForm({
        razonsocial: empresa.razonsocial || '',
        nombrecomercial: empresa.nombrecomercial || '',
        correo: empresa.correo || '',
        telefono: empresa.telefono || '',
        direccion: empresa.direccion || '',
      })
      setError('')
      setSaving(false)
    }
  }, [abierto, empresa])

  if (!empresa) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await empresaService.editar(empresa.idempresa, form)
      onGuardado()
      onCerrar()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al guardar cambios')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal abierto={abierto} onCerrar={onCerrar} titulo="Editar Empresa" size="md">
      <form onSubmit={handleSubmit}>
        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-peligro-suave text-peligro-texto p-3 rounded-lg text-sm">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-texto mb-1">Razón Social</label>
            <input
              type="text"
              value={form.razonsocial}
              onChange={(e) => setForm({ ...form, razonsocial: e.target.value })}
              className="w-full px-4 py-3 border border-borde rounded-lg focus:ring-2 focus:ring-accion focus:outline-none text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-texto mb-1">Nombre Comercial</label>
            <input
              type="text"
              value={form.nombrecomercial}
              onChange={(e) => setForm({ ...form, nombrecomercial: e.target.value })}
              className="w-full px-4 py-3 border border-borde rounded-lg focus:ring-2 focus:ring-accion focus:outline-none text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-texto mb-1">Correo</label>
            <input
              type="email"
              value={form.correo}
              onChange={(e) => setForm({ ...form, correo: e.target.value })}
              className="w-full px-4 py-3 border border-borde rounded-lg focus:ring-2 focus:ring-accion focus:outline-none text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-texto mb-1">Teléfono</label>
            <input
              type="text"
              value={form.telefono}
              onChange={(e) => setForm({ ...form, telefono: e.target.value })}
              className="w-full px-4 py-3 border border-borde rounded-lg focus:ring-2 focus:ring-accion focus:outline-none text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-texto mb-1">Dirección</label>
            <textarea
              value={form.direccion}
              onChange={(e) => setForm({ ...form, direccion: e.target.value })}
              className="w-full px-4 py-3 border border-borde rounded-lg focus:ring-2 focus:ring-accion focus:outline-none text-sm"
              rows={2}
            />
          </div>
        </div>

        <div className="p-6 border-t border-borde-suave flex justify-end gap-3">
          <button
            type="button"
            onClick={onCerrar}
            className="px-5 py-3 border border-borde rounded-lg hover:bg-fondo-sutil transition text-sm font-medium"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-3 bg-accion text-white rounded-lg hover:bg-accion/90 transition text-sm font-medium disabled:opacity-50 flex items-center gap-2"
          >
            {saving && (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
