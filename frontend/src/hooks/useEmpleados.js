import { useCallback, useEffect, useState } from 'react'
import { apiEmpleados } from '../api'

// Permite desactivar la carga cuando el usuario no puede listar empleados
// (el rol Empleado solo ve su propia información).
export function useEmpleados({ activo = true } = {}) {
  const [empleados, setEmpleados] = useState([])
  const [cargando, setCargando] = useState(activo)
  const [error, setError] = useState('')

  const recargar = useCallback(async () => {
    setCargando(true)
    setError('')
    try {
      const datos = await apiEmpleados.listar()
      setEmpleados(Array.isArray(datos) ? datos : [])
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    if (activo) {
      recargar()
    }
  }, [recargar, activo])

  return { empleados, cargando, error, recargar }
}