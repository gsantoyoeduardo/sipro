import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import CrearEmpresaPage from './pages/CrearEmpresaPage'

/**
 * Componente de ruta privada.
 * Verifica la existencia de un token de acceso en localStorage.
 * Si el usuario está autenticado, renderiza los hijos (children);
 * de lo contrario, redirige a la página de login.
 */
function PrivateRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = localStorage.getItem('access_token') !== null
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

/**
 * Componente raíz de la aplicación.
 * Define el enrutador principal con las rutas del portal:
 * - / : Página de aterrizaje (redirige según autenticación)
 * - /login : Inicio de sesión
 * - /admin : Dashboard (requiere autenticación)
 * - /admin/crear : Crear empresa (requiere autenticación)
 * - * : Cualquier otra ruta redirige a "/"
 */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/admin" element={<PrivateRoute><AdminDashboardPage /></PrivateRoute>} />
        <Route path="/admin/crear" element={<PrivateRoute><CrearEmpresaPage /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
