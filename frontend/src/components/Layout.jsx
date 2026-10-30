import { useEffect, useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { apiRelevos } from '../api'
import { useAuth } from '../context/useAuth'
import './Layout.css'

const enlaces = [
  { to: '/', etiqueta: 'Inicio', end: true, roles: ['Administrador', 'Contadora', 'Empleado'] },
  { to: '/empleados', etiqueta: 'Empleados', roles: ['Administrador', 'Contadora'] },
  { to: '/horarios', etiqueta: 'Horarios y turnos', roles: ['Administrador', 'Contadora', 'Empleado'] },
  { to: '/relevos', etiqueta: 'Relevos / Solicitudes', roles: ['Administrador', 'Contadora', 'Empleado'] },
  { to: '/horas-extra', etiqueta: 'Horas extra', roles: ['Administrador', 'Contadora', 'Empleado'] },
  { to: '/asistencia', etiqueta: 'Asistencia', roles: ['Administrador', 'Contadora', 'Empleado'] },
  { to: '/nomina', etiqueta: 'Nómina', roles: ['Administrador', 'Contadora', 'Empleado'] },
  { to: '/monitoreo', etiqueta: 'Monitoreo', roles: ['Administrador', 'Contadora'] },
  { to: '/reportes', etiqueta: 'Reportes', roles: ['Administrador', 'Contadora'] },
]

function Layout() {
  const { usuario, tieneRol, cerrarSesion } = useAuth()
  const navigate = useNavigate()
  const [notificacionesPendientes, setNotificacionesPendientes] = useState(0)
  const esEmpleado = usuario?.rol === 'Empleado'

  useEffect(() => {
    if (!esEmpleado || !usuario?.id) return undefined

    let activo = true
    async function actualizarNotificaciones() {
      try {
        const solicitudes = await apiRelevos.recibidas(usuario.id)
        if (!Array.isArray(solicitudes)) {
          throw new Error('La respuesta de solicitudes recibidas no es válida.')
        }
        if (activo) {
          setNotificacionesPendientes(
            solicitudes.filter((solicitud) => solicitud.estado === 'Pendiente').length,
          )
        }
      } catch (error) {
        console.error('No se pudieron actualizar las notificaciones de relevos:', error)
      }
    }

    actualizarNotificaciones()
    const intervalo = window.setInterval(actualizarNotificaciones, 30000)
    const actualizarAlVolver = () => {
      if (document.visibilityState === 'visible') actualizarNotificaciones()
    }
    document.addEventListener('visibilitychange', actualizarAlVolver)

    return () => {
      activo = false
      window.clearInterval(intervalo)
      document.removeEventListener('visibilitychange', actualizarAlVolver)
    }
  }, [esEmpleado, usuario?.id])

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
          <button
            className="boton-notificaciones"
            type="button"
            onClick={() => navigate('/relevos')}
            aria-label={`Notificaciones${notificacionesPendientes ? `: ${notificacionesPendientes} solicitudes pendientes` : ''}`}
          >
            <span>Notificaciones / Relevos</span>
            {esEmpleado && notificacionesPendientes > 0 && (
              <span className="contador-notificaciones" aria-live="polite">
                {notificacionesPendientes > 99 ? '99+' : notificacionesPendientes}
              </span>
            )}
          </button>
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
