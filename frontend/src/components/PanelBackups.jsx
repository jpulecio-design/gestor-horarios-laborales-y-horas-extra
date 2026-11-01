import { useEffect, useState } from 'react'
import { apiBackups } from '../api'
import { Alerta, Cargando, SinDatos, Tarjeta } from './Comunes'
import { guardarBlob } from '../util/descargas'
import { formatearNumero } from '../util/formato'

function formatearTamano(bytes) {
  if (bytes === null || bytes === undefined) return '-'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${formatearNumero(bytes / 1024)} KB`
  return `${formatearNumero(bytes / (1024 * 1024))} MB`
}

function mostrarValor(valor) {
  if (valor === null || valor === undefined || valor === '') return '-'
  if (typeof valor === 'object') return JSON.stringify(valor)
  return String(valor)
}

function totalCambios(tabla) {
  return tabla.nuevos.length + tabla.eliminados.length + tabla.modificados.length
}

// CU11: copias de seguridad (solo Administrador).
function PanelBackups() {
  const [estado, setEstado] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [mensaje, setMensaje] = useState(null)
  const [generando, setGenerando] = useState(false)
  const [comparando, setComparando] = useState(null)
  const [comparacion, setComparacion] = useState(null)

  async function cargar() {
    setError('')
    try {
      setEstado(await apiBackups.estado())
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargar()
  }, [])

  async function generar() {
    setMensaje(null)
    setGenerando(true)
    try {
      const backup = await apiBackups.crear()
      setMensaje({ tipo: 'exito', texto: `Respaldo #${backup.id} generado: ${backup.nombreArchivo}.` })
      await cargar()
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message })
    } finally {
      setGenerando(false)
    }
  }

  async function descargar(backup, formato) {
    setMensaje(null)
    try {
      if (formato === 'excel') {
        const blob = await apiBackups.descargarExcel(backup.id)
        guardarBlob(blob, backup.nombreArchivo.replace(/\.json$/, '.xlsx'))
      } else {
        const blob = await apiBackups.descargarJson(backup.id)
        guardarBlob(blob, backup.nombreArchivo)
      }
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message })
    }
  }

  async function comparar(backup) {
    setMensaje(null)
    setComparando(backup.id)
    try {
      setComparacion(await apiBackups.comparar(backup.id))
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message })
    } finally {
      setComparando(null)
    }
  }

  return (
    <>
      <Tarjeta
        titulo="Copias de seguridad"
        acciones={
          <button type="button" onClick={generar} disabled={generando}>
            {generando ? 'Generando…' : 'Generar respaldo ahora'}
          </button>
        }
      >
        {mensaje && <Alerta tipo={mensaje.tipo}>{mensaje.texto}</Alerta>}
        {error && <Alerta tipo="error">{error}</Alerta>}

        {cargando ? (
          <Cargando />
        ) : (
          estado && (
            <>
              <div className="resumen-linea">
                <span>Último respaldo exitoso</span>
                <span>{estado.ultimoRespaldo ? estado.ultimoRespaldo.fechaHora : 'Ninguno'}</span>
              </div>
              <div className="resumen-linea">
                <span>Días desde el último</span>
                <span>{estado.diasDesdeUltimo ?? '-'}</span>
              </div>
              <div className="resumen-linea">
                <span>Próximo automático</span>
                <span>{estado.proximoAutomatico}</span>
              </div>
            </>
          )
        )}
      </Tarjeta>

      {estado && (
        <Tarjeta titulo="Historial de respaldos">
          {estado.historial.length === 0 ? (
            <SinDatos>Aún no hay respaldos registrados.</SinDatos>
          ) : (
            <div className="tabla-envoltura">
              <table className="tabla">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Fecha</th>
                    <th>Tipo</th>
                    <th>Estado</th>
                    <th>Generado por</th>
                    <th className="numerico">Intentos</th>
                    <th className="numerico">Tamaño</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {estado.historial.map((backup) => (
                    <tr key={backup.id}>
                      <td>{backup.id}</td>
                      <td>{backup.fechaHora}</td>
                      <td>{backup.tipo}</td>
                      <td>
                        <span
                          className={`etiqueta ${
                            backup.estado === 'Exitoso' ? 'etiqueta-activo' : 'etiqueta-anulado'
                          }`}
                        >
                          {backup.estado}
                        </span>
                      </td>
                      <td>{backup.generadoPor || 'Sistema'}</td>
                      <td className="numerico">{backup.intentos}</td>
                      <td className="numerico">{formatearTamano(backup.tamanoBytes)}</td>
                      <td>
                        {backup.estado === 'Exitoso' ? (
                          <div className="tarjeta-acciones">
                            <button
                              type="button"
                              className="boton-secundario boton-mini"
                              onClick={() => descargar(backup, 'json')}
                            >
                              JSON
                            </button>
                            <button
                              type="button"
                              className="boton-secundario boton-mini"
                              onClick={() => descargar(backup, 'excel')}
                            >
                              Excel
                            </button>
                            <button
                              type="button"
                              className="boton-mini"
                              disabled={comparando !== null}
                              onClick={() => comparar(backup)}
                            >
                              {comparando === backup.id ? 'Comparando…' : 'Comparar'}
                            </button>
                          </div>
                        ) : (
                          <span className="sin-datos">{backup.detalleError || 'Sin archivo'}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Tarjeta>
      )}

      {comparacion && (
        <Tarjeta
          titulo={`Comparación con el respaldo #${comparacion.respaldo.id}`}
          acciones={
            <button
              type="button"
              className="boton-secundario boton-mini"
              onClick={() => setComparacion(null)}
            >
              Cerrar
            </button>
          }
        >
          <p className="sin-datos">
            Respaldo del {comparacion.respaldo.fechaHora} frente a los datos actuales (
            {comparacion.fechaComparacion}).
          </p>

          {!comparacion.hayDiferencias ? (
            <Alerta tipo="exito">Sin diferencias: los datos actuales coinciden con el respaldo.</Alerta>
          ) : (
            <>
              <div className="resumen-linea">
                <span>Registros nuevos</span>
                <span>{comparacion.totales.nuevos}</span>
              </div>
              <div className="resumen-linea">
                <span>Registros eliminados</span>
                <span>{comparacion.totales.eliminados}</span>
              </div>
              <div className="resumen-linea">
                <span>Registros modificados</span>
                <span>{comparacion.totales.modificados}</span>
              </div>

              {comparacion.tablas
                .filter((tabla) => totalCambios(tabla) > 0)
                .map((tabla) => (
                  <details key={tabla.tabla} className="detalle-tabla">
                    <summary>
                      {tabla.tabla}: {tabla.nuevos.length} nuevo(s), {tabla.eliminados.length}{' '}
                      eliminado(s), {tabla.modificados.length} modificado(s)
                    </summary>

                    {tabla.nuevos.length > 0 && (
                      <p>
                        <strong>Nuevos ({tabla.pk}):</strong>{' '}
                        {tabla.nuevos.map((registro) => registro.id).join(', ')}
                      </p>
                    )}
                    {tabla.eliminados.length > 0 && (
                      <p>
                        <strong>Eliminados ({tabla.pk}):</strong>{' '}
                        {tabla.eliminados.map((registro) => registro.id).join(', ')}
                      </p>
                    )}
                    {tabla.modificados.length > 0 && (
                      <div className="tabla-envoltura">
                        <table className="tabla">
                          <thead>
                            <tr>
                              <th>{tabla.pk}</th>
                              <th>Campo</th>
                              <th>Antes</th>
                              <th>Después</th>
                            </tr>
                          </thead>
                          <tbody>
                            {tabla.modificados.flatMap((registro) =>
                              registro.campos.map((cambio) => (
                                <tr key={`${registro.id}-${cambio.campo}`}>
                                  <td>{registro.id}</td>
                                  <td>{cambio.campo}</td>
                                  <td>{mostrarValor(cambio.antes)}</td>
                                  <td>{mostrarValor(cambio.despues)}</td>
                                </tr>
                              )),
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </details>
                ))}
            </>
          )}
        </Tarjeta>
      )}
    </>
  )
}

export default PanelBackups
