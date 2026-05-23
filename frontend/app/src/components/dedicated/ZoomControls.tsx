interface ZoomControlsProps {
  scale: number
  onZoomIn: () => void
  onZoomOut: () => void
  onReset: () => void
}

export default function ZoomControls({ scale, onZoomIn, onZoomOut, onReset }: ZoomControlsProps) {
  return (
    <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-white rounded-lg border shadow-sm px-2 py-1">
      <button onClick={onZoomOut} className="px-2 py-1 text-sm font-bold hover:bg-gray-100 rounded">−</button>
      <span className="text-xs px-1 min-w-[3rem] text-center">{Math.round(scale * 100)}%</span>
      <button onClick={onZoomIn} className="px-2 py-1 text-sm font-bold hover:bg-gray-100 rounded">+</button>
      <button onClick={onReset} className="ml-1 px-2 py-1 text-xs text-gray-500 hover:bg-gray-100 rounded">Ajustar</button>
    </div>
  )
}
