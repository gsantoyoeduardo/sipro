import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import CrearEmpresaPage from './pages/CrearEmpresaPage'
import EmpresaListPage from './pages/EmpresaListPage'
import MainLayout from './components/layout/MainLayout'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = localStorage.getItem('access_token') !== null
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route
          path="/admin"
          element={<PrivateRoute><MainLayout /></PrivateRoute>}
        >
          <Route index element={<AdminDashboardPage />} />
          <Route path="crear" element={<CrearEmpresaPage />} />
          <Route path="empresas" element={<EmpresaListPage />} />
          <Route path="usuarios" element={<div className="text-[#64748B] p-8 text-center">Módulo de Usuarios — Próximamente</div>} />
          <Route path="roles" element={<div className="text-[#64748B] p-8 text-center">Módulo de Roles — Próximamente</div>} />
          <Route path="auditoria" element={<div className="text-[#64748B] p-8 text-center">Módulo de Auditoría — Próximamente</div>} />
        </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
