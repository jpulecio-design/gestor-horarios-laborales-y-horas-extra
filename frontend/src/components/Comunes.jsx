import './Comunes.css'

export function Alerta({ tipo = 'info', children }) {
  if (!children) return null
  return <p className={`alerta alerta-${tipo}`}>{children}</p>
}

export function Cargando({ children = 'Cargando…' }) {
  return <p className="cargando">{children}</p>
}

export function SinDatos({ children = 'No hay registros para mostrar.' }) {
  return <p className="sin-datos">{children}</p>
}

export function Tarjeta({ titulo, acciones, children }) {
  return (
    <section className="tarjeta">
      {(titulo || acciones) && (
        <header className="tarjeta-cabecera">
          {titulo && <h2>{titulo}</h2>}
          {acciones && <div className="tarjeta-acciones">{acciones}</div>}
        </header>
      )}
      {children}
    </section>
  )
}
