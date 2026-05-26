import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ListaEmpresaPage from './pages/ListaEmpresaPage'
import DetalleEmpresaPage from './pages/DetalleEmpresaPage'
import CrearEmpresaPage from './pages/CrearEmpresaPage'
import ListaUsuariosPage from './pages/usuarios/ListaUsuariosPage'
import ListaRolesPage from './pages/roles/ListaRolesPage'
import AuditoriaPage from './pages/auditoria/AuditoriaPage'
import LayoutPrincipal from './layout/LayoutPrincipal'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = localStorage.getItem('access_token') !== null
  return isAuthenticated ? <>{children}</> : <Navigate to="/iniciar-sesion" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/iniciar-sesion" element={<LoginPage />} />
        <Route path="/" element={<Navigate to="/iniciar-sesion" replace />} />
        <Route
          path="/admin"
          element={<PrivateRoute><LayoutPrincipal /></PrivateRoute>}
        >
          <Route index element={<DashboardPage />} />
          <Route path="empresas" element={<ListaEmpresaPage />} />
          <Route path="empresas/:id" element={<DetalleEmpresaPage />} />
          <Route path="crear" element={<CrearEmpresaPage />} />
          <Route path="usuarios" element={<ListaUsuariosPage />} />
          <Route path="roles" element={<ListaRolesPage />} />
          <Route path="auditoria" element={<AuditoriaPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/iniciar-sesion" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
