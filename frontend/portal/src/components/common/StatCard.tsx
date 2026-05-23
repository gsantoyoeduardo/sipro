interface StatCardProps {
  label: string
  valor: number
  color: 'blue' | 'green' | 'red' | 'purple'
}

const colorMap = {
  blue: 'text-blue-600',
  green: 'text-green-600',
  red: 'text-red-600',
  purple: 'text-purple-600',
}

export default function StatCard({ label, valor, color }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm">
      <div className={`text-2xl sm:text-3xl font-bold ${colorMap[color]}`}>{valor}</div>
      <div className="text-xs sm:text-sm text-gray-500 mt-1">{label}</div>
    </div>
  )
}
