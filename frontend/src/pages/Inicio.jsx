import { useState } from 'react'
import { useAuth } from '../context/useAuth'
import { apiAuth } from '../api'
import { Alerta, Tarjeta } from '../components/Comunes'

function Inicio() {
  const { usuario } = useAuth()
  const [form, setForm] = useState({ contrasenaActual: '', contrasenaNueva: '', contrasenaNuevaConf: '' })
  const [mensaje, setMensaje] = useState(null)
  const [guardando, setGuardando] = useState(false)

  async function cambiarContrasena(e) {
    e.preventDefault()
    setMensaje(null)
    if (form.contrasenaNueva !== form.contrasenaNuevaConf) {
      setMensaje({ tipo: 'error', texto: 'Las contraseñas nuevas no coinciden.' })
      return
    }
    setGuardando(true)
    try {
      const res = await apiAuth.cambiarContrasena(form.contrasenaActual, form.contrasenaNueva)
      setMensaje({ tipo: 'exito', texto: res.mensaje || 'Contraseña actualizada correctamente.' })
      setForm({ contrasenaActual: '', contrasenaNueva: '', contrasenaNuevaConf: '' })
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div>
      <h1>Bienvenido, {usuario?.username}</h1>
      <p>
        Panel principal del gestor de horarios laborales y horas extra. Usa el
        menú lateral para administrar cada módulo.
      </p>

      <Tarjeta titulo="Cambiar contraseña">
        {mensaje && <Alerta tipo={mensaje.tipo}>{mensaje.texto}</Alerta>}
        <form className="formulario" onSubmit={cambiarContrasena}>
          <label className="campo">
            Contraseña actual
            <input
              type="password"
              value={form.contrasenaActual}
              onChange={(e) => setForm({ ...form, contrasenaActual: e.target.value })}
              required
            />
          </label>
          <label className="campo">
            Nueva contraseña
            <input
              type="password"
              value={form.contrasenaNueva}
              onChange={(e) => setForm({ ...form, contrasenaNueva: e.target.value })}
              required
              minLength={6}
            />
          </label>
          <label className="campo">
            Confirmar nueva contraseña
            <input
              type="password"
              value={form.contrasenaNuevaConf}
              onChange={(e) => setForm({ ...form, contrasenaNuevaConf: e.target.value })}
              required
              minLength={6}
            />
          </label>
          <div className="formulario-acciones">
            <button type="submit" disabled={guardando}>
              {guardando ? 'Guardando...' : 'Cambiar contraseña'}
            </button>
          </div>
        </form>
      </Tarjeta>
    </div>
  )
}

export default Inicio

