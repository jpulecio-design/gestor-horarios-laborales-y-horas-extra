import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import './Layout.css'

const enlaces = [
  { to: '/', etiqueta: 'Inicio', end: true, roles: ['Administrador', 'Contadora', 'Empleado'] },
  { to: '/empleados', etiqueta: 'Empleados', roles: ['Administrador', 'Contadora'] },
  { to: '/horarios', etiqueta: 'Horarios y turnos', roles: ['Administrador', 'Contadora', 'Empleado'] },
  { to: '/horas-extra', etiqueta: 'Horas extra', roles: ['Administrador', 'Contadora', 'Empleado'] },
  { to: '/asistencia', etiqueta: 'Asistencia', roles: ['Administrador', 'Contadora', 'Empleado'] },
  { to: '/nomina', etiqueta: 'Nómina', roles: ['Administrador', 'Contadora', 'Empleado'] },
  { to: '/monitoreo', etiqueta: 'Monitoreo', roles: ['Administrador', 'Contadora'] },
  { to: '/reportes', etiqueta: 'Reportes', roles: ['Administrador', 'Contadora'] },
]

function Layout() {
  const { usuario, tieneRol, cerrarSesion } = useAuth()
  const navigate = useNavigate()

  function salir() {
    cerrarSesion()
    navigate('/login')
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <h2 className="marca">Gestor de Horarios</h2>
        <nav>
          {enlaces.filter((enlace) => tieneRol(...enlace.roles)).map((enlace) => (
            <NavLink
              key={enlace.to}
              to={enlace.to}
              end={enlace.end}
              className={({ isActive }) => (isActive ? 'activo' : '')}
            >
              {enlace.etiqueta}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="contenido">
        <header className="topbar">
          <span>
            {usuario ? `${usuario.username} (${usuario.rol})` : 'Invitado'}
          </span>
          <button type="button" onClick={salir}>
            Cerrar sesión
          </button>
        </header>
        <main className="pagina">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout
