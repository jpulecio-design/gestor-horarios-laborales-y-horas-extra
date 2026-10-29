import { useCallback, useMemo, useState } from 'react'
import { AuthContext } from './authContext'
import { apiAuth } from '../api'

function leerUsuarioGuardado() {
  const guardado = localStorage.getItem('usuario')
  const token = localStorage.getItem('token')
  if (!guardado || !token) return null
  try {
    return JSON.parse(guardado)
  } catch {
    localStorage.removeItem('usuario')
    localStorage.removeItem('token')
    return null
  }
}

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(leerUsuarioGuardado)

  const iniciarSesion = useCallback(async (username, password) => {
    const resultado = await apiAuth.iniciarSesion(username, password)
    if (resultado.exito) {
      setUsuario(resultado.usuario)
      localStorage.setItem('usuario', JSON.stringify(resultado.usuario))
      localStorage.setItem('token', resultado.token)
    }
    return resultado
  }, [])

  const cerrarSesion = useCallback(() => {
    setUsuario(null)
    localStorage.removeItem('usuario')
    localStorage.removeItem('token')
  }, [])

  // true si el usuario actual tiene alguno de los roles recibidos.
  const tieneRol = useCallback(
    (...roles) => {
      if (!usuario || !usuario.rol) return false
      return roles.includes(usuario.rol)
    },
    [usuario],
  )

  const valor = useMemo(
    () => ({ usuario, iniciarSesion, cerrarSesion, tieneRol }),
    [usuario, iniciarSesion, cerrarSesion, tieneRol],
  )

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}