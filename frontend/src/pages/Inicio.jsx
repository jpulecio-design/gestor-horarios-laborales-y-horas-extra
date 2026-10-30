import { useAuth } from '../context/useAuth'

function Inicio() {
  const { usuario } = useAuth()

  return (
    <div>
      <h1>Bienvenido, {usuario?.username}</h1>
      <p>
        Panel principal del gestor de horarios laborales y horas extra. Usa el
        menú lateral para administrar cada módulo.
      </p>
    </div>
  )
}

export default Inicio
