import { useEffect, useState } from 'react'
import { apiHorarios } from '../api'
import { useEmpleados } from '../hooks/useEmpleados'
import { useAuth } from '../context/useAuth'
import { Alerta, Cargando, SinDatos, Tarjeta } from '../components/Comunes'
import { aTexto, nombreCompleto } from '../util/formato'

const DIA_OPCIONES = [
  { valor: 1, nombre: 'Lunes' },
  { valor: 2, nombre: 'Martes' },
  { valor: 3, nombre: 'Miércoles' },
  { valor: 4, nombre: 'Jueves' },
  { valor: 5, nombre: 'Viernes' },
  { valor: 6, nombre: 'Sábado' },
  { valor: 7, nombre: 'Domingo' },
]

const TURNO_VACIO = { nombre: '', horaEntrada: '08:00', horaSalida: '17:00', dias: [1, 2, 3, 4, 5] }
const ASIGNACION_VACIA = { empleadoId: '', turnoId: '', fechaDesde: aTexto(new Date()), fechaHasta: '' }

function Horarios() {
  const { usuario } = useAuth()
  const esEmpleado = usuario?.rol === 'Empleado'
  const { empleados } = useEmpleados({ activo: !esEmpleado })
  const [turnos, setTurnos] = useState([])
  const [cargandoTurnos, setCargandoTurnos] = useState(true)
  const [errorTurnos, setErrorTurnos] = useState('')
  const [formTurno, setFormTurno] = useState(TURNO_VACIO)
  const [formAsignacion, setFormAsignacion] = useState(ASIGNACION_VACIA)
  const [empleadoVer, setEmpleadoVer] = useState('')
  const [semana, setSemana] = useState(null)
  const [asignaciones, setAsignaciones] = useState([])
  const [mensaje, setMensaje] = useState(null)

  async function cargarTurnos() {
    setCargandoTurnos(true)
    setErrorTurnos('')
    try {
      setTurnos(await apiHorarios.listarTurnos())
    } catch (err) {
      setErrorTurnos(err.message)
    } finally {
      setCargandoTurnos(false)
    }
  }

  useEffect(() => {
    cargarTurnos()
  }, [])

  useEffect(() => {
    if (esEmpleado && usuario?.id) {
      verHorario(usuario.id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [esEmpleado, usuario?.id])

  function alternarDia(dia) {
    setFormTurno((previo) => {
      const existe = previo.dias.includes(dia)
      return {
        ...previo,
        dias: existe ? previo.dias.filter((d) => d !== dia) : [...previo.dias, dia].sort(),
      }
    })
  }

  async function crearTurno(evento) {
    evento.preventDefault()
    setMensaje(null)
    try {
      if (formTurno.dias.length === 0) {
        throw new Error('Selecciona al menos un día para el turno.')
      }
      await apiHorarios.crearTurno({ ...formTurno, dias: formTurno.dias.join(',') })
      setMensaje({ tipo: 'exito', texto: `Turno "${formTurno.nombre}" creado.` })
      setFormTurno(TURNO_VACIO)
      await cargarTurnos()
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message })
    }
  }

  async function asignar(evento) {
    evento.preventDefault()
    setMensaje(null)
    try {
      await apiHorarios.asignar(formAsignacion)
      setMensaje({
        tipo: 'exito',
        texto: formAsignacion.fechaHasta
          ? `Turno especial asignado: reemplaza el horario base del ${formAsignacion.fechaDesde} al ${formAsignacion.fechaHasta}, y después el horario base vuelve solo.`
          : 'Horario base asignado correctamente.',
      })
      setFormAsignacion({ ...ASIGNACION_VACIA, empleadoId: formAsignacion.empleadoId })
      if (String(empleadoVer) === String(formAsignacion.empleadoId)) {
        verHorario(formAsignacion.empleadoId)
      }
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message })
    }
  }

  async function verHorario(id) {
    if (!id) {
      setSemana(null)
      setAsignaciones([])
      return
    }
    setMensaje(null)
    try {
      const [datosSemana, datosAsignaciones] = await Promise.all([
        apiHorarios.semana(id),
        apiHorarios.porEmpleado(id),
      ])
      setSemana(datosSemana)
      setAsignaciones(datosAsignaciones)
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message })
    }
  }

  async function eliminarTurno(dia) {
    const turno = dia.turno
    const esProgramacion = turno.origen === 'Programación'
    const esEspecial = turno.tipoAsignacion === 'Especial'

    let pregunta = `¿Eliminar el turno programado del ${dia.fecha}?`
    if (!esProgramacion) {
      pregunta = esEspecial
        ? `Se desactivará el turno especial "${turno.nombre}" en todas sus fechas, no solo el ${dia.fecha}. El horario base volverá a aplicarse. ¿Continuar?`
        : `¿Quitar el turno "${turno.nombre}" del ${dia.fecha}? Solo se quita ese día; los demás días del horario base no cambian.`
    }
    if (!window.confirm(pregunta)) return

    setMensaje(null)
    try {
      let r
      if (esProgramacion) {
        r = await apiHorarios.eliminarDia(empleadoVer, dia.fecha)
      } else if (esEspecial) {
        r = await apiHorarios.desactivarAsignacion(turno.asignacionId)
      } else {
        r = await apiHorarios.quitarDiaBase(empleadoVer, dia.fecha)
      }
      await verHorario(empleadoVer)
      setMensaje({ tipo: 'exito', texto: r.mensaje })
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message })
    }
  }

  async function cambiarAsignacion(accion, id) {
    setMensaje(null)
    try {
      const r = await accion(id)
      await verHorario(empleadoVer)
      setMensaje({ tipo: 'exito', texto: r.mensaje })
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message })
    }
  }

  return (
    <div>
      <h1>Horarios y turnos</h1>

      {mensaje && <Alerta tipo={mensaje.tipo}>{mensaje.texto}</Alerta>}

      {!esEmpleado && (
        <>
      <Tarjeta titulo="Crear turno">
        <form className="formulario" onSubmit={crearTurno}>
          <label className="campo">
            Nombre
            <input
              value={formTurno.nombre}
              onChange={(e) => setFormTurno({ ...formTurno, nombre: e.target.value })}
              required
            />
          </label>
          <label className="campo">
            Hora de entrada
            <input
              type="time"
              value={formTurno.horaEntrada}
              onChange={(e) => setFormTurno({ ...formTurno, horaEntrada: e.target.value })}
              required
            />
          </label>
          <label className="campo">
            Hora de salida
            <input
              type="time"
              value={formTurno.horaSalida}
              onChange={(e) => setFormTurno({ ...formTurno, horaSalida: e.target.value })}
              required
            />
          </label>
          <div className="campo campo-ancho">
            Días
            <div className="dias-semana">
              {DIA_OPCIONES.map((dia) => (
                <label key={dia.valor}>
                  <input
                    type="checkbox"
                    checked={formTurno.dias.includes(dia.valor)}
                    onChange={() => alternarDia(dia.valor)}
                  />
                  {dia.nombre}
                </label>
              ))}
            </div>
          </div>
          <div className="formulario-acciones">
            <button type="submit">Crear turno</button>
          </div>
        </form>
      </Tarjeta>

      <Tarjeta titulo="Turnos disponibles">
        {cargandoTurnos && <Cargando />}
        {errorTurnos && <Alerta tipo="error">{errorTurnos}</Alerta>}
        {!cargandoTurnos && turnos.length === 0 && <SinDatos />}
        {turnos.length > 0 && (
          <div className="tabla-envoltura">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Id</th>
                  <th>Nombre</th>
                  <th>Entrada</th>
                  <th>Salida</th>
                  <th>Días</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {turnos.map((turno) => (
                  <tr key={turno.id}>
                    <td>{turno.id}</td>
                    <td>{turno.nombre}</td>
                    <td>{turno.horaEntrada}</td>
                    <td>{turno.horaSalida}</td>
                    <td>{turno.dias}</td>
                    <td>{turno.estado}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Tarjeta>

      <Tarjeta titulo="Asignar turno a un empleado">
        <form className="formulario" onSubmit={asignar}>
          <label className="campo">
            Empleado
            <select
              value={formAsignacion.empleadoId}
              onChange={(e) => setFormAsignacion({ ...formAsignacion, empleadoId: e.target.value })}
              required
            >
              <option value="">Selecciona…</option>
              {empleados.map((empleado) => (
                <option key={empleado.usuario.id} value={empleado.usuario.id}>
                  {empleado.usuario.id} - {nombreCompleto(empleado)}
                </option>
              ))}
            </select>
          </label>
          <label className="campo">
            Turno
            <select
              value={formAsignacion.turnoId}
              onChange={(e) => setFormAsignacion({ ...formAsignacion, turnoId: e.target.value })}
              required
            >
              <option value="">Selecciona…</option>
              {turnos.map((turno) => (
                <option key={turno.id} value={turno.id}>
                  {turno.nombre} ({turno.horaEntrada}-{turno.horaSalida})
                </option>
              ))}
            </select>
          </label>
          <label className="campo">
            Desde
            <input
              type="date"
              value={formAsignacion.fechaDesde}
              onChange={(e) => setFormAsignacion({ ...formAsignacion, fechaDesde: e.target.value })}
              required
            />
          </label>
          <label className="campo">
            Hasta (vacío = horario base)
            <input
              type="date"
              value={formAsignacion.fechaHasta}
              onChange={(e) => setFormAsignacion({ ...formAsignacion, fechaHasta: e.target.value })}
            />
          </label>
          <div className="formulario-acciones">
            <button type="submit">Asignar turno</button>
          </div>
        </form>
      </Tarjeta>
        </>
      )}

      <Tarjeta titulo="Consultar horario">
        <div className="filtros">
          {esEmpleado ? (
            <p>Tu horario asignado:</p>
          ) : (
          <label className="campo">
            Empleado
            <select
              value={empleadoVer}
              onChange={(e) => {
                setEmpleadoVer(e.target.value)
                verHorario(e.target.value)
              }}
            >
              <option value="">Selecciona…</option>
              {empleados.map((empleado) => (
                <option key={empleado.usuario.id} value={empleado.usuario.id}>
                  {empleado.usuario.id} - {nombreCompleto(empleado)}
                </option>
              ))}
            </select>
          </label>
          )}
        </div>

        {semana && (
          <>
            <p>Semana del {semana.inicio}</p>
            <div className="grilla-semana">
              {semana.dias.map((dia) => (
                <div className="dia-celda" key={dia.fecha}>
                  <h3>{dia.dia}</h3>
                  <div className="fecha">{dia.fecha}</div>
                  {dia.turno ? (
                    <>
                      <div className="turno">
                        {dia.turno.nombre}
                        {dia.turno.tipoAsignacion === 'Especial' && ' (especial)'}
                      </div>
                      <div>
                        {dia.turno.horaEntrada} - {dia.turno.horaSalida}
                      </div>
                      {!esEmpleado && (
                        <button type="button" onClick={() => eliminarTurno(dia)}>
                          Eliminar
                        </button>
                      )}
                    </>
                  ) : (
                    <div className="libre">Sin turno</div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {semana && (
          <div style={{ marginTop: 24 }}>
            <h3>Asignaciones registradas</h3>
            {asignaciones.length === 0 ? (
              <SinDatos />
            ) : (
              <div className="tabla-envoltura">
                <table className="tabla">
                  <thead>
                    <tr>
                      <th>Id</th>
                      <th>Turno</th>
                      <th>Tipo</th>
                      <th>Desde</th>
                      <th>Hasta</th>
                      <th>Estado</th>
                      {!esEmpleado && <th></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {asignaciones.map((asignacion) => (
                      <tr key={asignacion.id}>
                        <td>{asignacion.id}</td>
                        <td>{asignacion.turno.nombre}</td>
                        <td>
                          {asignacion.estado === 'Descanso'
                            ? 'Día libre'
                            : asignacion.fechaHasta
                              ? 'Especial'
                              : 'Base'}
                        </td>
                        <td>{asignacion.fechaDesde}</td>
                        <td>{asignacion.fechaHasta || 'Sin límite'}</td>
                        <td>{asignacion.estado === 'Inactivo' ? 'Desactivado' : 'Activado'}</td>
                        {!esEmpleado && (
                          <td>
                            {asignacion.estado === 'Descanso' && (
                              <button
                                type="button"
                                onClick={() => cambiarAsignacion(apiHorarios.desactivarAsignacion, asignacion.id)}
                              >
                                Restaurar día
                              </button>
                            )}
                            {asignacion.estado === 'Inactivo' && (
                              <button
                                type="button"
                                onClick={() => cambiarAsignacion(apiHorarios.reactivarAsignacion, asignacion.id)}
                              >
                                Reactivar
                              </button>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </Tarjeta>
    </div>
  )
}

export default Horarios
