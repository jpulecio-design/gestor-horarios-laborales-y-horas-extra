import { useEffect, useState } from 'react'
import { apiAsistencia } from '../api'
import { useEmpleados } from '../hooks/useEmpleados'
import { useAuth } from '../context/useAuth'
import { Alerta, Cargando, SinDatos, Tarjeta } from '../components/Comunes'
import { nombreCompleto } from '../util/formato'

function aInputFechaHora(fechaHora) {
  if (!fechaHora) return ''
  return fechaHora.replace(' ', 'T').slice(0, 16)
}

function aFechaHoraApi(valor) {
  if (!valor) return ''
  return `${valor.replace('T', ' ')}:00`
}

function Asistencia() {
  const { usuario } = useAuth()
  const esEmpleado = usuario?.rol === 'Empleado'
  const esGestion = usuario?.rol === 'Administrador' || usuario?.rol === 'Contadora'
  const { empleados } = useEmpleados({ activo: !esEmpleado })
  const [registros, setRegistros] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [codigoQr, setCodigoQr] = useState('')
  const [mensaje, setMensaje] = useState(null)
  const [empleadoQr, setEmpleadoQr] = useState('')
  const [qr, setQr] = useState(null)
  const [corrigiendo, setCorrigiendo] = useState(null)
  const [formCorreccion, setFormCorreccion] = useState({ tipo: 'Entrada', fechaHora: '', observacion: '', estado: 'Activo' })
  const hoy = new Date()
  const hace7 = new Date(hoy.getTime() - 6 * 24 * 60 * 60 * 1000)
  const [filtroDesde, setFiltroDesde] = useState(hace7.toISOString().substring(0, 10))
  const [filtroHasta, setFiltroHasta] = useState(hoy.toISOString().substring(0, 10))
  const [empleadoCalc, setEmpleadoCalc] = useState('')
  const [reporteHoras, setReporteHoras] = useState(null)
  const [calculando, setCalculando] = useState(false)

  async function cargar() {
    setCargando(true)
    setError('')
    try {
      const datos = esEmpleado
        ? await apiAsistencia.porEmpleado(usuario.id)
        : await apiAsistencia.listar()
      setRegistros(datos)
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargar()
  }, [])

  function nombres() {
    const mapa = {}
    empleados.forEach((empleado) => {
      mapa[empleado.usuario.id] = nombreCompleto(empleado)
    })
    return mapa
  }

  async function registrarQr(evento) {
    evento.preventDefault()
    setMensaje(null)
    try {
      const marcaje = await apiAsistencia.registrarQr({ codigoQr })
      setMensaje({ tipo: 'exito', texto: `Marcaje #${marcaje.id} (${marcaje.tipo}) registrado.` })
      setCodigoQr('')
      await cargar()
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message })
    }
  }

  async function verQr(id) {
    setEmpleadoQr(id)
    setQr(null)
    if (!id) return
    try {
      setQr(await apiAsistencia.qrEmpleado(id))
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message })
    }
  }

  function iniciarCorreccion(registro) {
    setCorrigiendo(registro.id)
    setFormCorreccion({
      tipo: registro.tipo,
      fechaHora: aInputFechaHora(registro.fechaHora),
      observacion: registro.observacion || '',
      estado: registro.estado,
    })
    setMensaje(null)
  }

  async function guardarCorreccion(evento) {
    evento.preventDefault()
    setMensaje(null)
    try {
      await apiAsistencia.actualizar(corrigiendo, {
        ...formCorreccion,
        fechaHora: aFechaHoraApi(formCorreccion.fechaHora),
      })
      setMensaje({ tipo: 'exito', texto: `Marcaje #${corrigiendo} corregido.` })
      setCorrigiendo(null)
      await cargar()
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message })
    }
  }

  async function calcularHoras() {
    if (!empleadoCalc) {
      setMensaje({ tipo: 'error', texto: 'Selecciona un empleado para calcular horas trabajadas.' })
      return
    }
    setCalculando(true)
    setMensaje(null)
    try {
      const datos = await apiAsistencia.horasTrabajadas(empleadoCalc, { desde: filtroDesde, hasta: filtroHasta })
      setReporteHoras(datos)
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message })
    } finally {
      setCalculando(false)
    }
  }

  const mapa = nombres()

  return (
    <div>
      <h1>Asistencia</h1>

      {mensaje && <Alerta tipo={mensaje.tipo}>{mensaje.texto}</Alerta>}

      <Tarjeta titulo="Registrar por código QR">
        <form className="formulario" onSubmit={registrarQr}>
          <label className="campo campo-ancho">
            Código QR
            <input
              value={codigoQr}
              onChange={(e) => setCodigoQr(e.target.value)}
              placeholder="EMPQR-..."
              required
            />
          </label>
          <div className="formulario-acciones">
            <button type="submit">Registrar marcaje</button>
          </div>
        </form>
      </Tarjeta>

      {!esEmpleado && (
      <Tarjeta titulo="Código QR del empleado">
        <div className="filtros">
          <label className="campo">
            Empleado
            <select value={empleadoQr} onChange={(e) => verQr(e.target.value)}>
              <option value="">Selecciona…</option>
              {empleados.map((empleado) => (
                <option key={empleado.usuario.id} value={empleado.usuario.id}>
                  {empleado.usuario.id} - {nombreCompleto(empleado)}
                </option>
              ))}
            </select>
          </label>
        </div>
        {qr && (
          <div className="qr-caja">
            <img src={qr.imagen} alt="Código QR del empleado" />
            <code>{qr.codigoQr}</code>
          </div>
        )}
      </Tarjeta>

      <Tarjeta titulo="Cálculo automático de horas trabajadas">
        <div className="filtros">
          <label className="campo">
            Empleado
            <select value={empleadoCalc} onChange={(e) => setEmpleadoCalc(e.target.value)}>
              <option value="">Seleccionar...</option>
              {empleados.map((empleado) => (
                <option key={empleado.usuario.id} value={empleado.usuario.id}>
                  {empleado.usuario.id} - {nombreCompleto(empleado)}
                </option>
              ))}
            </select>
          </label>
          <label className="campo">
            Desde
            <input type="date" value={filtroDesde} onChange={(e) => setFiltroDesde(e.target.value)} />
          </label>
          <label className="campo">
            Hasta
            <input type="date" value={filtroHasta} onChange={(e) => setFiltroHasta(e.target.value)} />
          </label>
          <div className="formulario-acciones" style={{ alignItems: 'end' }}>
            <button type="button" onClick={calcularHoras} disabled={calculando}>
              {calculando ? 'Calculando...' : 'Calcular'}
            </button>
          </div>
        </div>
        {reporteHoras && (
          <div style={{ marginTop: '1rem' }}>
            <div className="resumen-linea"><span>Horas trabajadas</span><span>{reporteHoras.totales.horasTrabajadas} h</span></div>
            <div className="resumen-linea"><span>Horas programadas</span><span>{reporteHoras.totales.horasProgramadas} h</span></div>
            <div className="resumen-linea"><span>Tardanzas</span><span>{reporteHoras.totales.horasTarde} h ({reporteHoras.totales.minutosTarde} min)</span></div>
            <div className="resumen-linea"><span>Días completos</span><span>{reporteHoras.totales.diasCompletos}</span></div>
            <div className="resumen-linea"><span>Días ausentes</span><span>{reporteHoras.totales.diasAusentes}</span></div>
            <div className="tabla-envoltura" style={{ marginTop: '1rem' }}>
              <table className="tabla">
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Turno</th>
                    <th>Prog. Entrada/Salida</th>
                    <th>Entrada</th>
                    <th>Salida</th>
                    <th>Horas trab.</th>
                    <th>Horas prog.</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {reporteHoras.detalle.map((d) => (
                    <tr key={d.fecha}>
                      <td>{d.fecha}</td>
                      <td>{d.turno || '-'}</td>
                      <td>{d.horaEntradaProgramada || '-'} / {d.horaSalidaProgramada || '-'}</td>
                      <td>{d.entrada || '-'}</td>
                      <td>{d.salida || '-'}</td>
                      <td>{d.horasTrabajadas}</td>
                      <td>{d.horasProgramadas}</td>
                      <td>{d.estado}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Tarjeta>
      )}

      {corrigiendo && (
        <Tarjeta titulo={`Corregir marcaje #${corrigiendo}`}>
          <form className="formulario" onSubmit={guardarCorreccion}>
            <label className="campo">
              Tipo
              <select
                value={formCorreccion.tipo}
                onChange={(e) => setFormCorreccion({ ...formCorreccion, tipo: e.target.value })}
              >
                <option value="Entrada">Entrada</option>
                <option value="Salida">Salida</option>
              </select>
            </label>
            <label className="campo">
              Fecha y hora
              <input
                type="datetime-local"
                value={formCorreccion.fechaHora}
                onChange={(e) => setFormCorreccion({ ...formCorreccion, fechaHora: e.target.value })}
                required
              />
            </label>
            <label className="campo">
              Estado
              <select
                value={formCorreccion.estado}
                onChange={(e) => setFormCorreccion({ ...formCorreccion, estado: e.target.value })}
              >
                <option value="Activo">Activo</option>
                <option value="Anulado">Anulado</option>
              </select>
            </label>
            <label className="campo">
              Observación
              <input
                value={formCorreccion.observacion}
                onChange={(e) => setFormCorreccion({ ...formCorreccion, observacion: e.target.value })}
              />
            </label>
            <div className="formulario-acciones">
              <button type="submit">Guardar corrección</button>
              <button type="button" className="boton-secundario" onClick={() => setCorrigiendo(null)}>
                Cancelar
              </button>
            </div>
          </form>
        </Tarjeta>
      )}

      <Tarjeta titulo="Marcajes">
        {cargando && <Cargando />}
        {error && <Alerta tipo="error">{error}</Alerta>}
        {!cargando && !error && registros.length === 0 && <SinDatos />}
        {registros.length > 0 && (
          <div className="tabla-envoltura">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Id</th>
                  <th>Empleado</th>
                  <th>Tipo</th>
                  <th>Fecha y hora</th>
                  <th>Origen</th>
                  <th>Estado</th>
                  <th>Observación</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {registros.map((registro) => (
                  <tr key={registro.id}>
                    <td>{registro.id}</td>
                    <td>{mapa[registro.empleadoId] || registro.empleadoId}</td>
                    <td>{registro.tipo}</td>
                    <td>{registro.fechaHora}</td>
                    <td>{registro.origen}</td>
                    <td>
                      <span className={`etiqueta ${registro.estado === 'Anulado' ? 'etiqueta-anulado' : 'etiqueta-activo'}`}>
                        {registro.estado}
                      </span>
                    </td>
                    <td>{registro.observacion || '-'}</td>
                    <td>
                      {!esEmpleado && (
                        <button
                          type="button"
                          className="boton-secundario boton-mini"
                          onClick={() => iniciarCorreccion(registro)}
                        >
                          Corregir
                        </button>
                      )}
                    </td>
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

export default Asistencia
