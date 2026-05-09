import { useAuthStore } from '../store/authStore'

export default function DashboardPage() {
  const logout = useAuthStore((state) => state.logout)

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">SIPRO WMS</h1>
          <button
            onClick={logout}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
          >
            Cerrar Sesión
          </button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-700">Dashboard</h2>
          <p className="text-gray-500 mt-2">Bienvenido a SIPRO WMS</p>
        </div>
      </main>
    </div>
  )
}
