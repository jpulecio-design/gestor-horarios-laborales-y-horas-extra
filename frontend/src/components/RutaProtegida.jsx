import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

// Protege una ruta: exige sesión y, opcionalmente, un rol permitido.
// Uso: <Route element={<RutaProtegida roles={['Administrador']} />} />
function RutaProtegida({ roles = [] }) {
  const { usuario, tieneRol } = useAuth()
  const location = useLocation()

  if (!usuario) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (roles.length > 0 && !tieneRol(...roles)) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}

export default RutaProtegida