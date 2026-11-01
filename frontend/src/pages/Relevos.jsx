import { useEffect, useState } from 'react'
import { apiRelevos } from '../api'
import { useAuth } from '../context/useAuth'
import { Alerta, Cargando, SinDatos, Tarjeta } from '../components/Comunes'

function Relevos() {
  const { usuario } = useAuth()
  const empleadoId = usuario?.id
  const esEmpleado = usuario?.rol === 'Empleado'
  const [agenda, setAgenda] = useState([])
  const [enviadas, setEnviadas] = useState([])
  const [recibidas, setRecibidas] = useState([])
  const [companeros, setCompaneros] = useState([])
  const [todas, setTodas] = useState([])
  const [cargando, setCargando] = useState(false)
  const [mensaje, setMensaje] = useState(null)
  const [form, setForm] = useState({ fecha: '', idCompanero: '' })

  async function cargar() {
    if (!empleadoId) return
    setCargando(true)
    setMensaje(null)
    try {
      // administrador y contadora no tienen turnos: solo ven todos los cambios
      if (!esEmpleado) {
        setTodas((await apiRelevos.todas()) || [])
        return
      }
      const [a, e, r, listaCompaneros] = await Promise.all([
        apiRelevos.agenda(empleadoId, 14),
        apiRelevos.enviadas(empleadoId),
        apiRelevos.recibidas(empleadoId),
        apiRelevos.companeros(),
      ])
      setAgenda(a || [])
      setEnviadas(e || [])
      setRecibidas(r || [])
      setCompaneros(listaCompaneros || [])
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message })
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empleadoId])

  async function solicitar(evento) {
    evento.preventDefault()
    if (!empleadoId) return
    setMensaje(null)
    try {
      const res = await apiRelevos.solicitar({
        fecha: form.fecha,
        idSolicitante: empleadoId,
        idCompanero: Number(form.idCompanero),
      })
      setMensaje({ tipo: 'exito', texto: res?.mensaje || 'Solicitud enviada.' })
      setForm({ fecha: '', idCompanero: '' })
      await cargar()
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message })
    }
  }

  async function responder(idSolicitud, respuesta) {
    if (!empleadoId) return
    setMensaje(null)
    try {
      const res = await apiRelevos.responder(idSolicitud, { idEmpleado: empleadoId, respuesta })
      setMensaje({ tipo: 'exito', texto: res?.mensaje || 'Respuesta registrada.' })
      await cargar()
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message })
    }
  }

  // vista de administrador y contadora: quien le cedio el turno a quien
  if (!esEmpleado) {
    return (
      <div>
        <h1>Relevos y solicitudes de turno</h1>
        {mensaje && <Alerta tipo={mensaje.tipo}>{mensaje.texto}</Alerta>}
        {cargando && <Cargando />}

        <Tarjeta titulo="Cambios de turno de los empleados">
          {todas.length === 0 && !cargando ? <SinDatos /> : null}
          {todas.length > 0 && (
            <div className="tabla-envoltura">
              <table className="tabla">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Fecha del turno</th>
                    <th>Turno</th>
                    <th>Horario</th>
                    <th>Cede</th>
                    <th>Cubre</th>
                    <th>Estado</th>
                    <th>Solicitada</th>
                    <th>Respondida</th>
                  </tr>
                </thead>
                <tbody>
                  {todas.map((s) => (
                    <tr key={s.id}>
                      <td>{s.id}</td>
                      <td>{s.horario?.fecha}</td>
                      <td>{s.horario?.tipoTurno}</td>
                      <td>
                        {s.horario?.horaEntrada} - {s.horario?.horaSalida}
                      </td>
                      <td>
                        {s.solicitante?.nombre} {s.solicitante?.apellido}
                      </td>
                      <td>
                        {s.companero?.nombre} {s.companero?.apellido}
                      </td>
                      <td>{s.estado}</td>
                      <td>{s.fechaSolicitud}</td>
                      <td>{s.fechaRespuesta || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Tarjeta>
      </div>
    )
  }

  return (
    <div>
      <h1>Relevos y solicitudes de turno</h1>
      {mensaje && <Alerta tipo={mensaje.tipo}>{mensaje.texto}</Alerta>}
      {cargando && <Cargando />}

      <Tarjeta titulo="Mi agenda (próximos días)">
        {agenda.length === 0 && !cargando ? <SinDatos /> : null}
        {agenda.length > 0 && (
          <div className="tabla-envoltura">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Turno</th>
                  <th>Entrada</th>
                  <th>Salida</th>
                  <th>Origen</th>
                </tr>
              </thead>
              <tbody>
                {agenda.map((a) => (
                  <tr key={a.fecha + a.id}>
                    <td>{a.fecha}</td>
                    <td>{a.tipoTurno || '-'}</td>
                    <td>{a.horaEntrada}</td>
                    <td>{a.horaSalida}</td>
                    <td>{a.origen || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Tarjeta>

      {esEmpleado && (
        <Tarjeta titulo="Solicitar relevo de turno">
          <form className="formulario" onSubmit={solicitar}>
            <label className="campo">
              Turno a ceder
              <select
                value={form.fecha}
                onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                required
              >
                <option value="">
                  {agenda.length ? 'Selecciona un turno…' : 'No tienes turnos disponibles'}
                </option>
                {agenda.map((turno) => (
                  <option key={turno.fecha} value={turno.fecha}>
                    {turno.fecha} - {turno.tipoTurno || 'Turno'} ({turno.horaEntrada} - {turno.horaSalida})
                  </option>
                ))}
              </select>
            </label>
            <label className="campo">
              Compañero a cubrir
              <select
                value={form.idCompanero}
                onChange={(e) => setForm({ ...form, idCompanero: e.target.value })}
                required
              >
                <option value="">
                  {companeros.length ? 'Selecciona una persona…' : 'No hay compañeros disponibles'}
                </option>
                {companeros.map((companero) => (
                  <option key={companero.id} value={companero.id}>
                    {companero.nombre} {companero.apellido}
                  </option>
                ))}
              </select>
            </label>
            <div className="formulario-acciones">
              <button type="submit">Enviar solicitud</button>
            </div>
          </form>
        </Tarjeta>
      )}

      <Tarjeta titulo="Solicitudes recibidas (para cubrir)">
        {recibidas.length === 0 && !cargando ? <SinDatos /> : null}
        {recibidas.length > 0 && (
          <div className="tabla-envoltura">
            <table className="tabla">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Solicitante</th>
                  <th>Fecha</th>
                  <th>Turno</th>
                  <th>Horario</th>
                  <th>Estado</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {recibidas.map((s) => (
                  <tr key={s.id}>
                    <td>{s.id}</td>
                    <td>
                      {s.solicitante?.nombre} {s.solicitante?.apellido}
                    </td>
                    <td>{s.horario?.fecha}</td>
                    <td>{s.horario?.tipoTurno}</td>
                    <td>
                      {s.horario?.horaEntrada} - {s.horario?.horaSalida}
                    </td>
                    <td>{s.estado}</td>
                    <td>
                      {s.estado === 'Pendiente' && (
                        <>
                          <button type="button" onClick={() => responder(s.id, 'Confirmado')}>
                            Aceptar
                          </button>{' '}
                          <button type="button" onClick={() => responder(s.id, 'Rechazado')}>
                            Rechazar
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Tarjeta>

      <Tarjeta titulo="Solicitudes enviadas">
        {enviadas.length === 0 && !cargando ? <SinDatos /> : null}
        {enviadas.length > 0 && (
          <div className="tabla-envoltura">
            <table className="tabla">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Compañero</th>
                  <th>Fecha</th>
                  <th>Turno</th>
                  <th>Horario</th>
                  <th>Estado</th>
                  <th>Respuesta</th>
                </tr>
              </thead>
              <tbody>
                {enviadas.map((s) => (
                  <tr key={s.id}>
                    <td>{s.id}</td>
                    <td>
                      {s.companero?.nombre} {s.companero?.apellido}
                    </td>
                    <td>{s.horario?.fecha}</td>
                    <td>{s.horario?.tipoTurno}</td>
                    <td>
                      {s.horario?.horaEntrada} - {s.horario?.horaSalida}
                    </td>
                    <td>{s.estado}</td>
                    <td>{s.fechaRespuesta || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Tarjeta>
    </div>
  )
}

export default Relevos
