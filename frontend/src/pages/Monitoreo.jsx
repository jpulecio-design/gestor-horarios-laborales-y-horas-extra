import { useEffect, useState } from 'react'
import { apiMonitoreo } from '../api'
import { useEmpleados } from '../hooks/useEmpleados'
import { Alerta, Cargando, SinDatos, Tarjeta } from '../components/Comunes'
import { aTexto, formatearMoneda, formatearNumero, nombreCompleto, primerDiaDelMes } from '../util/formato'

function Monitoreo() {
  const { empleados } = useEmpleados()
  const [desde, setDesde] = useState(primerDiaDelMes())
  const [hasta, setHasta] = useState(aTexto(new Date()))
  const [general, setGeneral] = useState(null)
  const [cargandoGeneral, setCargandoGeneral] = useState(false)
  const [empleadoSel, setEmpleadoSel] = useState('')
  const [empleadoData, setEmpleadoData] = useState(null)
  const [cargandoEmpleado, setCargandoEmpleado] = useState(false)
  const [mensaje, setMensaje] = useState(null)

  async function consultarGeneral() {
    setCargandoGeneral(true)
    setMensaje(null)
    try {
      setGeneral(await apiMonitoreo.general({ desde, hasta }))
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message })
    } finally {
      setCargandoGeneral(false)
    }
  }

  useEffect(() => {
    consultarGeneral()
  }, [])

  async function verEmpleado(id) {
    setEmpleadoSel(id)
    setEmpleadoData(null)
    if (!id) return
    setCargandoEmpleado(true)
    setMensaje(null)
    try {
      setEmpleadoData(await apiMonitoreo.porEmpleado(id, { desde, hasta }))
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message })
    } finally {
      setCargandoEmpleado(false)
    }
  }

  return (
    <div>
      <h1>Monitoreo</h1>

      {mensaje && <Alerta tipo={mensaje.tipo}>{mensaje.texto}</Alerta>}

      <Tarjeta titulo="Periodo">
        <div className="filtros">
          <label className="campo">
            Desde
            <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
          </label>
          <label className="campo">
            Hasta
            <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
          </label>
          <button type="button" onClick={consultarGeneral}>
            Consultar
          </button>
        </div>
      </Tarjeta>

      <Tarjeta titulo="Resumen general">
        {cargandoGeneral && <Cargando />}
        {!cargandoGeneral && general && general.empleados.length === 0 && <SinDatos />}
        {!cargandoGeneral && general && general.empleados.length > 0 && (
          <div className="tabla-envoltura">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Empleado</th>
                  <th className="numerico">Días</th>
                  <th className="numerico">Horas trabajadas</th>
                  <th className="numerico">Jornadas incompletas</th>
                  <th className="numerico">Horas extra</th>
                  <th className="numerico">Valor horas extra</th>
                </tr>
              </thead>
              <tbody>
                {general.empleados.map((fila) => (
                  <tr key={fila.empleado.id}>
                    <td>{`${fila.empleado.nombre} ${fila.empleado.apellido}`}</td>
                    <td className="numerico">{fila.asistencia.dias}</td>
                    <td className="numerico">{formatearNumero(fila.asistencia.horasTrabajadas)}</td>
                    <td className="numerico">{fila.asistencia.jornadasIncompletas}</td>
                    <td className="numerico">{formatearNumero(fila.horasExtra.totalHoras)}</td>
                    <td className="numerico">{formatearMoneda(fila.horasExtra.totalValor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Tarjeta>

      <Tarjeta titulo="Detalle por empleado">
        <div className="filtros">
          <label className="campo">
            Empleado
            <select value={empleadoSel} onChange={(e) => verEmpleado(e.target.value)}>
              <option value="">Selecciona…</option>
              {empleados.map((empleado) => (
                <option key={empleado.usuario.id} value={empleado.usuario.id}>
                  {empleado.usuario.id} - {nombreCompleto(empleado)}
                </option>
              ))}
            </select>
          </label>
        </div>

        {cargandoEmpleado && <Cargando />}
        {empleadoData && (
          <>
            <div className="resumen-linea">
              <span>Días con marcajes</span>
              <span>{empleadoData.asistencia.dias}</span>
            </div>
            <div className="resumen-linea">
              <span>Horas trabajadas</span>
              <span>{formatearNumero(empleadoData.asistencia.horasTrabajadas)}</span>
            </div>
            <div className="resumen-linea">
              <span>Jornadas incompletas</span>
              <span>{empleadoData.asistencia.jornadasIncompletas}</span>
            </div>
            <div className="resumen-linea">
              <span>Horas extra</span>
              <span>{formatearNumero(empleadoData.horasExtra.totalHoras)}</span>
            </div>
            <div className="resumen-linea">
              <span>Valor horas extra</span>
              <span>{formatearMoneda(empleadoData.horasExtra.totalValor)}</span>
            </div>

            <h3 style={{ marginTop: 24 }}>Jornadas</h3>
            {empleadoData.asistencia.detalle.length === 0 ? (
              <SinDatos />
            ) : (
              <div className="tabla-envoltura">
                <table className="tabla">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Entrada</th>
                      <th>Salida</th>
                      <th className="numerico">Horas</th>
                      <th>Completa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {empleadoData.asistencia.detalle.map((jornada, indice) => (
                      <tr key={`${jornada.fecha}-${indice}`}>
                        <td>{jornada.fecha}</td>
                        <td>{jornada.entrada || '-'}</td>
                        <td>{jornada.salida || '-'}</td>
                        <td className="numerico">{formatearNumero(jornada.minutos / 60)}</td>
                        <td>{jornada.completa ? 'Sí' : 'No'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </Tarjeta>
    </div>
  )
}

export default Monitoreo
