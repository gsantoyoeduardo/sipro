import { useState } from 'react'
import Modal from '../../common/Modal'
import { empresaService } from '../../../api/empresa'

interface ModalCambiarPasswordProps {
  idempresa: string
  userId: string
  abierto: boolean
  onCerrar: () => void
  onGuardado: () => void
}

export default function ModalCambiarPassword({ idempresa, userId, abierto, onCerrar, onGuardado }: ModalCambiarPasswordProps) {
  const [password, setPassword] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }
    if (password !== confirmar) {
      setError('Las contraseñas no coinciden')
      return
    }

    setSaving(true)
    try {
      await empresaService.editarUsuario(idempresa, userId, { password })
      onGuardado()
      onCerrar()
      setPassword('')
      setConfirmar('')
    } catch (err: any) {
      setError(err.response?.data?.error || 'Error al cambiar la contraseña')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal abierto={abierto} onCerrar={onCerrar} titulo="Cambiar Contraseña" size="sm">
      <form onSubmit={handleSubmit}>
        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-peligro-suave text-peligro-texto p-3 rounded-lg text-sm">{error}</div>
          )}

          <div>
            <label className="block text-sm font-medium text-texto mb-1">Nueva Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-borde rounded-lg focus:ring-2 focus:ring-primario focus:outline-none text-sm"
              required
              minLength={6}
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-texto mb-1">Confirmar Contraseña</label>
            <input
              type="password"
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
              className="w-full px-4 py-3 border border-borde rounded-lg focus:ring-2 focus:ring-primario focus:outline-none text-sm"
              required
              minLength={6}
              placeholder="Repite la contraseña"
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
            className="px-5 py-3 bg-primario text-white rounded-lg hover:bg-primario-oscuro transition text-sm font-medium disabled:opacity-50 flex items-center gap-2"
          >
            {saving && (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            )}
            {saving ? 'Cambiando...' : 'Cambiar Contraseña'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
