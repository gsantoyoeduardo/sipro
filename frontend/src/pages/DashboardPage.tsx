import { useAuthStore } from '../store/authStore'

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user)

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Bienvenido, {user?.nombres}
      </h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Empresas', value: '—', color: 'bg-blue-500' },
          { label: 'Sucursales', value: '—', color: 'bg-green-500' },
          { label: 'Almacenes', value: '—', color: 'bg-yellow-500' },
          { label: 'Usuarios', value: '—', color: 'bg-purple-500' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-lg shadow p-6">
            <div className={`w-10 h-10 rounded-lg ${stat.color} mb-4`} />
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
