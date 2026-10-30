import { useState } from 'react'
import { Link } from 'react-router-dom'
import { apiAuth } from '../api'
import './Login.css'

function RecuperarContrasena() {
  const [correo, setCorreo] = useState('')
  const [codigo, setCodigo] = useState('')
  const [contrasenaNueva, setContrasenaNueva] = useState('')
  const [confirmacion, setConfirmacion] = useState('')
  const [codigoEnviado, setCodigoEnviado] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)

  async function solicitarCodigo(evento) {
    evento.preventDefault()
    setMensaje('')
    setError('')
    setEnviando(true)
    try {
      const resultado = await apiAuth.solicitarRecuperacion(correo)
      setMensaje(resultado.mensaje)
      setCodigoEnviado(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setEnviando(false)
    }
  }

  async function restablecerContrasena(evento) {
    evento.preventDefault()
    setMensaje('')
    setError('')
    if (contrasenaNueva !== confirmacion) {
      setError('Las contraseñas nuevas no coinciden.')
      return
    }
    setEnviando(true)
    try {
      const resultado = await apiAuth.restablecerContrasena(correo, codigo, contrasenaNueva)
      setMensaje(resultado.mensaje)
      setCodigoEnviado(false)
      setCodigo('')
      setContrasenaNueva('')
      setConfirmacion('')
    } catch (err) {
      setError(err.message)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="login">
      <form
        className="login-caja"
        onSubmit={codigoEnviado ? restablecerContrasena : solicitarCodigo}
      >
        <h1>Recuperar contraseña</h1>
        {mensaje && <p>{mensaje}</p>}
        {!codigoEnviado ? (
          <>
            <p>Te enviaremos un código al correo registrado en tu cuenta.</p>
            <label>
              Correo electrónico
              <input
                type="email"
                value={correo}
                onChange={(evento) => setCorreo(evento.target.value)}
                required
                autoComplete="email"
              />
            </label>
            <button type="submit" disabled={enviando}>
              {enviando ? 'Enviando...' : 'Enviar código'}
            </button>
          </>
        ) : (
          <>
            <label>
              Código de 6 dígitos
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                value={codigo}
                onChange={(evento) => setCodigo(evento.target.value)}
                required
                autoComplete="one-time-code"
              />
            </label>
            <label>
              Nueva contraseña
              <input
                type="password"
                value={contrasenaNueva}
                onChange={(evento) => setContrasenaNueva(evento.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </label>
            <label>
              Confirmar nueva contraseña
              <input
                type="password"
                value={confirmacion}
                onChange={(evento) => setConfirmacion(evento.target.value)}
                required
                minLength={6}
                autoComplete="new-password"
              />
            </label>
            <button type="submit" disabled={enviando}>
              {enviando ? 'Actualizando...' : 'Restablecer contraseña'}
            </button>
          </>
        )}
        {error && <p className="error">{error}</p>}
        <Link className="login-enlace" to="/login">
          Volver al inicio de sesión
        </Link>
      </form>
    </div>
  )
}

export default RecuperarContrasena
