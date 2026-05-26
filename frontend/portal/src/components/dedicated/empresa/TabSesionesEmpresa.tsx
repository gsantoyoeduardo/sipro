import { useState, useEffect } from 'react'
import { empresaService } from '../../../api/empresa'
import Cargando from '../../common/Cargando'

interface Props {
  idempresa: string
}

interface Sesion {
  idsesionusuario: string
  idusuario: string
  usuariousuario: string
  usuarionombre: string
  token_hash: string
  ip: string
  dispositivo: string
  navegador: string
  fechainicio: string
  fechafin: string | null
  activa: boolean
}

export default function TabSesionesEmpresa({ idempresa }: Props) {
  const [sesiones, setSesiones] = useState<Sesion[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSesiones = async () => {
      try {
        setLoading(true)
        const { data } = await empresaService.sesiones(idempresa)
        setSesiones(data)
      } catch {
        setSesiones([])
      } finally {
        setLoading(false)
      }
    }
    fetchSesiones()
  }, [idempresa])

  if (loading) return <Cargando mensaje="Cargando sesiones..." />

  if (sesiones.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-texto-secundario/30 text-5xl mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <p className="text-texto-secundario font-medium">No hay sesiones activas</p>
        <p className="text-texto-secundario/60 text-sm mt-1">Los usuarios deben iniciar sesión para que aparezcan aquí</p>
      </div>
    )
  }

  const activas = sesiones.filter(s => s.activa).length
  const inactivas = sesiones.filter(s => !s.activa).length

  return (
    <div>
      <div className="flex items-center gap-4 mb-4">
        <div className="bg-exito-suave text-exito-texto text-sm font-medium px-3 py-1.5 rounded-lg">
          {activas} activa{activas !== 1 ? 's' : ''}
        </div>
        <div className="bg-peligro-suave text-peligro-texto text-sm font-medium px-3 py-1.5 rounded-lg">
          {inactivas} inactiva{inactivas !== 1 ? 's' : ''}
        </div>
      </div>

      <div className="space-y-3">
        {sesiones.map((sesion) => (
          <div key={sesion.idsesionusuario} className="bg-fondo-blanco rounded-xl border border-borde-suave p-4 hover:shadow-sm transition">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${sesion.activa ? 'bg-exito' : 'bg-texto-secundario/40'}`} />
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-sm text-texto">{sesion.usuarionombre || sesion.usuariousuario}</span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      sesion.activa ? 'bg-exito-suave text-exito-texto' : 'bg-fondo-sutil text-texto-secundario'
                    }`}>
                      {sesion.activa ? 'Activa' : 'Cerrada'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-xs text-texto-secundario">
                    <span>@{sesion.usuariousuario}</span>
                    {sesion.ip && <span>IP: {sesion.ip}</span>}
                    {sesion.dispositivo && <span>{sesion.dispositivo}</span>}
                    {sesion.navegador && <span>{sesion.navegador}</span>}
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-texto-secundario/70">
                    <span>Inicio: {new Date(sesion.fechainicio).toLocaleString('es-PE')}</span>
                    {sesion.fechafin && <span>Fin: {new Date(sesion.fechafin).toLocaleString('es-PE')}</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
