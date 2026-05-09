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

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
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
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
