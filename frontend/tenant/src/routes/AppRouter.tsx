/**
 * Router principal de la aplicaci\u00f3n.
 * Define las rutas p\u00fablicas (login) y privadas (protegidas por PrivateRoute),
 * con un layout compartido que incluye sidebar y header.
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import Layout from '../components/Layout'
import LoginPage from '../pages/LoginPage'
import DashboardPage from '../pages/DashboardPage'
import EmpresasPage from '../pages/empresas/EmpresasPage'
import SucursalesPage from '../pages/sucursales/SucursalesPage'
import AlmacenesPage from '../pages/almacenes/AlmacenesPage'
import UsuariosPage from '../pages/usuarios/UsuariosPage'
import RolesPage from '../pages/roles/RolesPage'
import LayoutPage from '../pages/layout/LayoutPage'
import NodosPage from '../pages/layout/NodosPage'
import RutasPage from '../pages/layout/RutasPage'
import InventarioPage from '../pages/inventario/InventarioPage'
import PickingPage from '../pages/picking/PickingPage'
import TransferenciaPage from '../pages/transferencias/TransferenciaPage'

// Componente que protege rutas privadas: redirige a /login si no est\u00e1 autenticado
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta p\u00fablica de inicio de sesi\u00f3n */}
        <Route path="/login" element={<LoginPage />} />
        {/* Rutas privadas envueltas en Layout con sidebar y header */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="empresas" element={<EmpresasPage />} />
          <Route path="sucursales" element={<SucursalesPage />} />
          <Route path="almacenes" element={<AlmacenesPage />} />
          <Route path="usuarios" element={<UsuariosPage />} />
          <Route path="roles" element={<RolesPage />} />
          <Route path="layout" element={<LayoutPage />} />
          <Route path="nodos" element={<NodosPage />} />
          <Route path="rutas" element={<RutasPage />} />
          <Route path="inventario" element={<InventarioPage />} />
          <Route path="picking" element={<PickingPage />} />
          <Route path="transferencias" element={<TransferenciaPage />} />
        </Route>
        {/* Ruta comod\u00edn: redirige al inicio */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
