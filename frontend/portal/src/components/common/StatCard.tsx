interface StatCardProps {
  label: string
  valor: number
  color: 'blue' | 'green' | 'red' | 'purple'
}

const colorMap = {
  blue: 'bg-[#0785F2]/10 text-[#0785F2] border-[#0785F2]/20',
  green: 'bg-green-50 text-green-600 border-green-200',
  red: 'bg-red-50 text-red-600 border-red-200',
  purple: 'bg-purple-50 text-purple-600 border-purple-200',
}

export default function StatCard({ label, valor, color }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-100 hover:shadow-md transition">
      <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border text-xs font-medium mb-3 ${colorMap[color]}`}>
        {label}
      </div>
      <div className="text-3xl sm:text-4xl font-bold text-[#0D0D0D]">{valor}</div>
    </div>
  )
}
