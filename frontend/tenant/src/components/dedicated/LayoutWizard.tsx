import { useState } from 'react'
import { useToastStore } from '../../store/toastStore'
import { LAYOUT_TEMPLATES, type LayoutTemplate } from '../../utils/layoutTemplates'
import { zonaService, estanteService, nivelService, ubicacionService, nodoService, conexionService } from '../../api/layout'

interface WizardProps {
  idalmacen: string
  idsucursal: string
  onComplete: () => void
  onCancel: () => void
}

type Step = 1 | 2 | 3 | 4 | 5

export default function LayoutWizard({ idalmacen, idsucursal, onComplete, onCancel }: WizardProps) {
  const [step, setStep] = useState<Step>(1)
  const [selectedTemplate, setSelectedTemplate] = useState<string>('medium')
  const [customName, setCustomName] = useState('')
  const [customDims, setCustomDims] = useState({ ancho: 800, alto: 600 })
  const [customEstantes, setCustomEstantes] = useState({ filas: 3, columnas: 2, niveles: 3, ancho: 240, alto: 120, profundidad: 60 })
  const [customPasillo, setCustomPasillo] = useState({ principal: 300, secundario: 200 })
  const [loading, setLoading] = useState(false)
  const addToast = useToastStore((state) => state.addToast)

  const template = LAYOUT_TEMPLATES.find((t) => t.id === selectedTemplate)

  const handleNext = () => {
    if (step < 5) setStep((s) => (s + 1) as Step)
  }
  const handlePrev = () => {
    if (step > 1) setStep((s) => (s - 1) as Step)
  }

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const tpl = template!
      const dims = selectedTemplate === 'custom' ? customDims : tpl.dimensiones
      const estCfg = selectedTemplate === 'custom' ? customEstantes : tpl.estantes
      const pasCfg = selectedTemplate === 'custom' ? customPasillo : tpl.pasillos
      const zonas = selectedTemplate === 'custom'
        ? [
            { tipo: 'recepcion', nombre: 'Recepción', x: 0, y: 0, ancho: dims.ancho * 0.2, alto: dims.alto * 0.2, color: '#4CAF50' },
            { tipo: 'almacenamiento', nombre: 'Almacenamiento', x: 0, y: dims.alto * 0.25, ancho: dims.ancho, alto: dims.alto * 0.6, color: '#2196F3' },
            { tipo: 'despacho', nombre: 'Despacho', x: dims.ancho * 0.8, y: 0, ancho: dims.ancho * 0.2, alto: dims.alto * 0.2, color: '#FF9800' },
          ]
        : tpl.zonas

      // Paso 1: Crear zonas
      const zonasCreadas: Array<{ id: string; x: number; y: number; ancho: number; alto: number }> = []
      for (const z of zonas) {
        const res = await zonaService.create({
          nombre: z.nombre,
          codigo: z.nombre.substring(0, 3).toUpperCase() + '-' + zonasCreadas.length,
          tipo: z.tipo,
          idalmacen,
          idsucursal,
          x: z.x,
          y: z.y,
          z_base: 0,
          z_techo: 300,
          color: z.color,
        })
        zonasCreadas.push({ id: res.data.idzona, x: z.x, y: z.y, ancho: z.ancho, alto: z.alto })
      }

      // Paso 2: Crear estantes dentro de la zona de almacenamiento
      const zonaAlmac = zonasCreadas.find((z, i) => zonas[i]?.tipo === 'almacenamiento') || zonasCreadas[0]
      const estantesCreados: string[] = []
      let estCount = 0
      for (let fila = 0; fila < estCfg.filas; fila++) {
        for (let col = 0; col < estCfg.columnas; col++) {
          estCount++
          const ex = zonaAlmac.x + 20 + col * (estCfg.ancho + estCfg.espaciadoX)
          const ey = zonaAlmac.y + 20 + fila * (estCfg.alto + estCfg.espaciadoY)
          const estRes = await estanteService.create({
            nombre: `Estante ${estCount}`,
            codigo: `E-${String(estCount).padStart(2, '0')}`,
            idzona: zonaAlmac.id,
            x: ex,
            y: ey,
            z_base: 0,
            rotacion: 0,
            ancho: estCfg.ancho,
            alto: estCfg.alto,
            profundidad: estCfg.profundidad,
            cantidadniveles: estCfg.niveles,
          })
          estantesCreados.push(estRes.data.idestante)

          // Paso 3: Crear niveles y ubicaciones para cada estante
          for (let n = 1; n <= estCfg.niveles; n++) {
            const nivRes = await nivelService.create({
              nombre: `Nivel ${n}`,
              idestante: estRes.data.idestante,
              numero: n,
              altura: estCfg.alto / estCfg.niveles,
            })
            // Crear ubicaciones en este nivel
            const ubicacionesPorNivel = Math.max(2, Math.floor(estCfg.ancho / 60))
            for (let u = 1; u <= ubicacionesPorNivel; u++) {
              await ubicacionService.create({
                codigo: `E${String(estCount).padStart(2, '0')}-N${n}-U${String(u).padStart(2, '0')}`,
                idnivel: nivRes.data.idnivel,
                estado_ubicacion: 'disponible',
                x: ex + (u - 1) * 60,
                y: ey,
              })
            }
          }
        }
      }

      // Paso 4: Crear nodos
      const nodosCfg = selectedTemplate === 'custom'
        ? [
            { tipo: 'entrada', x: 50, y: 50 },
            { tipo: 'salida', x: dims.ancho - 50, y: 50 },
            { tipo: 'esquina', x: 50, y: dims.alto - 50 },
            { tipo: 'esquina', x: dims.ancho - 50, y: dims.alto - 50 },
          ]
        : tpl.nodos

      const nodosCreados: string[] = []
      for (const n of nodosCfg) {
        const nRes = await nodoService.create({
          nombre: `Nodo ${n.tipo} ${nodosCreados.length + 1}`,
          tipo: n.tipo,
          idalmacen,
          idsucursal,
          coordenada_x: n.x,
          coordenada_y: n.y,
          coordenada_z: 0,
        })
        nodosCreados.push(nRes.data.idnodo)
      }

      // Paso 5: Crear conexiones entre nodos consecutivos
      for (let i = 0; i < nodosCreados.length - 1; i++) {
        const origen = nodosCreados[i]
        const destino = nodosCreados[i + 1]
        const dx = nodosCfg[i + 1].x - nodosCfg[i].x
        const dy = nodosCfg[i + 1].y - nodosCfg[i].y
        const dist = Math.sqrt(dx * dx + dy * dy)
        await conexionService.create({
          idnodoorigen: origen,
          idnododestino: destino,
          distancia: Math.round(dist * 100) / 100,
          ancho: pasCfg.principal,
          tipo: 'pasillo',
          bidireccional: true,
        })
      }

      addToast('success', `Layout generado: ${zonasCreadas.length} zonas, ${estantesCreados.length} estantes, ${nodosCreados.length} nodos`)
      onComplete()
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Error al generar layout'
      addToast('error', msg)
    } finally {
      setLoading(false)
    }
  }

  const steps = [
    { num: 1, label: 'Template' },
    { num: 2, label: 'Zonas' },
    { num: 3, label: 'Estantes' },
    { num: 4, label: 'Nodos' },
    { num: 5, label: 'Generar' },
  ]

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">Crear Layout de Almacén</h2>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-2 mb-8">
        {steps.map((s) => (
          <div key={s.num} className="flex items-center flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
              s.num < step ? 'bg-green-500 text-white' : s.num === step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
            }`}>
              {s.num < step ? '✓' : s.num}
            </div>
            <span className={`ml-2 text-xs font-medium hidden sm:inline ${s.num === step ? 'text-blue-600' : 'text-gray-400'}`}>{s.label}</span>
            {s.num < 5 && <div className={`flex-1 h-0.5 mx-2 ${s.num < step ? 'bg-green-500' : 'bg-gray-200'}`} />}
          </div>
        ))}
      </div>

      {/* Step 1: Template */}
      {step === 1 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Elige un template o crea uno personalizado</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            {LAYOUT_TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedTemplate(t.id)}
                className={`p-4 rounded-xl border-2 text-left transition ${
                  selectedTemplate === t.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-semibold text-gray-800">{t.nombre}</div>
                <div className="text-xs text-gray-500 mt-1">{t.descripcion}</div>
                <div className="text-xs text-gray-400 mt-2">
                  {t.zonas.length} zonas · {t.estantes.filas * t.estantes.columnas} estantes · {t.estantes.niveles} niveles
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Zonas preview */}
      {step === 2 && template && (
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Zonas que se crearán</h3>
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="relative border-2 border-gray-300 rounded-lg overflow-hidden" style={{ width: '100%', paddingBottom: `${(template.dimensiones.alto / template.dimensiones.ancho) * 100}%` }}>
              {template.zonas.map((z, i) => (
                <div
                  key={i}
                  className="absolute flex items-center justify-center text-white text-xs font-medium rounded"
                  style={{
                    left: `${(z.x / template.dimensiones.ancho) * 100}%`,
                    top: `${(z.y / template.dimensiones.alto) * 100}%`,
                    width: `${(z.ancho / template.dimensiones.ancho) * 100}%`,
                    height: `${(z.alto / template.dimensiones.alto) * 100}%`,
                    backgroundColor: z.color,
                  }}
                >
                  {z.nombre}
                </div>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            {template.zonas.map((z, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <div className="w-4 h-4 rounded" style={{ backgroundColor: z.color }} />
                <span className="font-medium">{z.nombre}</span>
                <span className="text-gray-400 capitalize">({z.tipo})</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Estantes config */}
      {step === 3 && template && (
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Configuración de estantes</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Filas</label>
              <input type="number" value={template.estantes.filas} readOnly className="w-full px-3 py-2 border rounded-lg bg-gray-50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Columnas</label>
              <input type="number" value={template.estantes.columnas} readOnly className="w-full px-3 py-2 border rounded-lg bg-gray-50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Niveles por estante</label>
              <input type="number" value={template.estantes.niveles} readOnly className="w-full px-3 py-2 border rounded-lg bg-gray-50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Total ubicaciones estimadas</label>
              <input type="text" value={template.estantes.filas * template.estantes.columnas * template.estantes.niveles * Math.max(2, Math.floor(template.estantes.ancho / 60))} readOnly className="w-full px-3 py-2 border rounded-lg bg-green-50 text-green-700 font-semibold" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Ancho (cm)</label>
              <input type="number" value={template.estantes.ancho} readOnly className="w-full px-3 py-2 border rounded-lg bg-gray-50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Alto (cm)</label>
              <input type="number" value={template.estantes.alto} readOnly className="w-full px-3 py-2 border rounded-lg bg-gray-50" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Profundidad (cm)</label>
              <input type="number" value={template.estantes.profundidad} readOnly className="w-full px-3 py-2 border rounded-lg bg-gray-50" />
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Nodos preview */}
      {step === 4 && template && (
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Nodos y conexiones</h3>
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="relative border-2 border-gray-300 rounded-lg overflow-hidden" style={{ width: '100%', paddingBottom: `${(template.dimensiones.alto / template.dimensiones.ancho) * 100}%` }}>
              {template.zonas.map((z, i) => (
                <div
                  key={i}
                  className="absolute opacity-30 rounded"
                  style={{
                    left: `${(z.x / template.dimensiones.ancho) * 100}%`,
                    top: `${(z.y / template.dimensiones.alto) * 100}%`,
                    width: `${(z.ancho / template.dimensiones.ancho) * 100}%`,
                    height: `${(z.alto / template.dimensiones.alto) * 100}%`,
                    backgroundColor: z.color,
                  }}
                />
              ))}
              {template.nodos.map((n, i) => (
                <div
                  key={i}
                  className="absolute w-4 h-4 rounded-full border-2 border-white shadow"
                  style={{
                    left: `${(n.x / template.dimensiones.ancho) * 100}%`,
                    top: `${(n.y / template.dimensiones.alto) * 100}%`,
                    transform: 'translate(-50%, -50%)',
                    backgroundColor: n.tipo === 'entrada' ? '#4CAF50' : n.tipo === 'salida' ? '#F44336' : '#607D8B',
                  }}
                  title={n.tipo}
                />
              ))}
              {/* Líneas de conexión */}
              {template.nodos.slice(0, -1).map((n, i) => {
                const next = template.nodos[i + 1]
                const x1 = (n.x / template.dimensiones.ancho) * 100
                const y1 = (n.y / template.dimensiones.alto) * 100
                const x2 = (next.x / template.dimensiones.ancho) * 100
                const y2 = (next.y / template.dimensiones.alto) * 100
                const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2))
                const angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI)
                return (
                  <div
                    key={`line-${i}`}
                    className="absolute bg-gray-400"
                    style={{
                      left: `${x1}%`,
                      top: `${y1}%`,
                      width: `${length}%`,
                      height: '3px',
                      transformOrigin: '0 50%',
                      transform: `rotate(${angle}deg)`,
                    }}
                  />
                )
              })}
            </div>
          </div>
          <div className="space-y-2">
            {template.nodos.map((n, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: n.tipo === 'entrada' ? '#4CAF50' : n.tipo === 'salida' ? '#F44336' : '#607D8B' }} />
                <span className="capitalize font-medium">{n.tipo.replace('_', ' ')}</span>
                <span className="text-gray-400">({n.x}, {n.y})</span>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
            Se crearán {template.nodos.length - 1} conexiones (pasillos) entre nodos consecutivos con ancho de {template.pasillos.principal}cm.
          </div>
        </div>
      )}

      {/* Step 5: Generate */}
      {step === 5 && template && (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Todo listo para generar</h3>
          <p className="text-gray-500 text-sm mb-6">
            Se crearán {template.zonas.length} zonas, {template.estantes.filas * template.estantes.columnas} estantes con {template.estantes.niveles} niveles cada uno,
            {template.nodos.length} nodos y {template.nodos.length - 1} conexiones.
          </p>
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 font-semibold"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                Generando...
              </span>
            ) : 'Generar Layout Completo'}
          </button>
        </div>
      )}

      {/* Navigation buttons */}
      {step !== 5 && (
        <div className="flex justify-between mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={step === 1 ? onCancel : handlePrev}
            className="px-6 py-2 border rounded-lg hover:bg-gray-50 transition text-gray-600"
          >
            {step === 1 ? 'Cancelar' : 'Anterior'}
          </button>
          <button
            onClick={handleNext}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  )
}
