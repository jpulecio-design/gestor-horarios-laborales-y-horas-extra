import { Link } from 'react-router-dom'

function NoEncontrado() {
  return (
    <div>
      <h1>404</h1>
      <p>La página que buscas no existe.</p>
      <Link to="/">Volver al inicio</Link>
    </div>
  )
}

export default NoEncontrado
