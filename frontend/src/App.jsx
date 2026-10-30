import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import RutaProtegida from './components/RutaProtegida'
import Login from './pages/Login'
import RecuperarContrasena from './pages/RecuperarContrasena'
import Inicio from './pages/Inicio'
import Empleados from './pages/Empleados'
import Horarios from './pages/Horarios'
import HorasExtra from './pages/HorasExtra'
import Asistencia from './pages/Asistencia'
import Nomina from './pages/Nomina'
import Monitoreo from './pages/Monitoreo'
import Reportes from './pages/Reportes'
import Relevos from './pages/Relevos'
import NoEncontrado from './pages/NoEncontrado'

// Roles con acceso de gestión (todas las operaciones).
const GESTION = ['Administrador', 'Contadora']

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/recuperar-contrasena" element={<RecuperarContrasena />} />

      <Route element={<RutaProtegida />}>
        <Route element={<Layout />}>
          <Route index element={<Inicio />} />

          {/* Solo roles de gestión */}
          <Route element={<RutaProtegida roles={GESTION} />}>
            <Route path="empleados" element={<Empleados />} />
            <Route path="monitoreo" element={<Monitoreo />} />
            <Route path="reportes" element={<Reportes />} />
          </Route>

          {/* Accesibles también por el propio empleado */}
          <Route path="horarios" element={<Horarios />} />
          <Route path="relevos" element={<Relevos />} />
          <Route path="horas-extra" element={<HorasExtra />} />
          <Route path="asistencia" element={<Asistencia />} />
          <Route path="nomina" element={<Nomina />} />

          <Route path="*" element={<NoEncontrado />} />
        </Route>
      </Route>
    </Routes>
  )
}

export default App