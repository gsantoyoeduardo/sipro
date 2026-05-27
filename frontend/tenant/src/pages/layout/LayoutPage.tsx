import { useState } from 'react'
import MapaSucursal from './MapaSucursal'
import TablasCRUD from './TablasCRUD'

type ViewMode = 'mapa' | 'tablas'

export default function LayoutPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('mapa')

  return (
    <div>
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setViewMode('mapa')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${viewMode === 'mapa' ? 'bg-accion text-white' : 'bg-fondo-blanco text-texto-secundario hover:bg-fondo hover:text-texto'}`}
        >
          Mapa Visual
        </button>
        <button
          onClick={() => setViewMode('tablas')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${viewMode === 'tablas' ? 'bg-accion text-white' : 'bg-fondo-blanco text-texto-secundario hover:bg-fondo hover:text-texto'}`}
        >
          Tablas CRUD
        </button>
      </div>

      {viewMode === 'mapa' && <MapaSucursal />}
      {viewMode === 'tablas' && <TablasCRUD />}
    </div>
  )
}
