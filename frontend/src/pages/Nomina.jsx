import { useEffect, useState } from 'react'
import { apiNomina } from '../api'
import { useEmpleados } from '../hooks/useEmpleados'
import { useAuth } from '../context/useAuth'
import { Alerta, Cargando, SinDatos, Tarjeta } from '../components/Comunes'
import { formatearMoneda, formatearNumero, nombreCompleto } from '../util/formato'

function periodoActual() {
  const hoy = new Date()
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`
}

const FORM_VACIO = {
  empleadoId: '',
  periodo: periodoActual(),
  salarioBase: '',
  horasRecargoNocturno: '0',
  horasRecargoFestivo: '0',
}

function Nomina() {
  const { usuario } = useAuth()
  const esEmpleado = usuario?.rol === 'Empleado'
  const { empleados } = useEmpleados({ activo: !esEmpleado })
  const [nominas, setNominas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState(FORM_VACIO)
  const [detalle, setDetalle] = useState(null)
  const [mensaje, setMensaje] = useState(null)
  const [guardando, setGuardando] = useState(false)

  async function cargar() {
    setCargando(true)
    setError('')
    try {
      const datos = esEmpleado
        ? await apiNomina.porEmpleado(usuario.id)
        : await apiNomina.listar()
      setNominas(datos)
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

  function seleccionarEmpleado(id) {
    const empleado = empleados.find((e) => String(e.usuario.id) === String(id))
    setForm((previo) => ({
      ...previo,
      empleadoId: id,
      salarioBase: empleado && empleado.salarioBase ? empleado.salarioBase : previo.salarioBase,
    }))
  }

  async function guardar(evento) {
    evento.preventDefault()
    setGuardando(true)
    setMensaje(null)
    try {
      const creada = await apiNomina.crear(form)
      setMensaje({ tipo: 'exito', texto: `Nómina #${creada.id} registrada.` })
      setDetalle(creada)
      await cargar()
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message })
    } finally {
      setGuardando(false)
    }
  }

  const mapa = nombres()

  return (
    <div>
      <h1>Nómina</h1>

      {mensaje && <Alerta tipo={mensaje.tipo}>{mensaje.texto}</Alerta>}

      {!esEmpleado && (
        <Tarjeta titulo="Liquidar nómina">
        <form className="formulario" onSubmit={guardar}>
          <label className="campo">
            Empleado
            <select value={form.empleadoId} onChange={(e) => seleccionarEmpleado(e.target.value)} required>
              <option value="">Selecciona…</option>
              {empleados.map((empleado) => (
                <option key={empleado.usuario.id} value={empleado.usuario.id}>
                  {empleado.usuario.id} - {nombreCompleto(empleado)}
                </option>
              ))}
            </select>
          </label>
          <label className="campo">
            Periodo (AAAA-MM)
            <input
              type="month"
              value={form.periodo}
              onChange={(e) => setForm({ ...form, periodo: e.target.value })}
              required
            />
          </label>
          <label className="campo">
            Salario base
            <input
              type="number"
              min="0"
              value={form.salarioBase}
              onChange={(e) => setForm({ ...form, salarioBase: e.target.value })}
              required
            />
          </label>
          <label className="campo">
            Horas recargo nocturno
            <input
              type="number"
              min="0"
              value={form.horasRecargoNocturno}
              onChange={(e) => setForm({ ...form, horasRecargoNocturno: e.target.value })}
            />
          </label>
          <label className="campo">
            Horas recargo festivo
            <input
              type="number"
              min="0"
              value={form.horasRecargoFestivo}
              onChange={(e) => setForm({ ...form, horasRecargoFestivo: e.target.value })}
            />
          </label>
          <div className="formulario-acciones">
            <button type="submit" disabled={guardando}>
              {guardando ? 'Liquidando…' : 'Liquidar nómina'}
            </button>
          </div>
        </form>
      </Tarjeta>
      )}

      {detalle && (
        <Tarjeta
          titulo={`Detalle nómina #${detalle.id}`}
          acciones={
            <button type="button" className="boton-secundario boton-mini" onClick={() => setDetalle(null)}>
              Cerrar
            </button>
          }
        >
          <div className="resumen-linea">
            <span>Empleado</span>
            <span>{mapa[detalle.empleadoId] || detalle.empleadoId}</span>
          </div>
          <div className="resumen-linea">
            <span>Periodo</span>
            <span>{detalle.periodo}</span>
          </div>
          <div className="resumen-linea">
            <span>Valor hora</span>
            <span>{formatearMoneda(detalle.valorHora)}</span>
          </div>
          <div className="resumen-linea">
            <span>Recargo nocturno ({formatearNumero(detalle.horasRecargoNocturno)} h)</span>
            <span>{formatearMoneda(detalle.pagoRecargoNocturno)}</span>
          </div>
          <div className="resumen-linea">
            <span>Recargo festivo ({formatearNumero(detalle.horasRecargoFestivo)} h)</span>
            <span>{formatearMoneda(detalle.pagoRecargoFestivo)}</span>
          </div>
          <div className="resumen-linea">
            <span>Pago horas extra</span>
            <span>{formatearMoneda(detalle.pagoHorasExtra)}</span>
          </div>
          <div className="resumen-linea">
            <span>Total devengado</span>
            <span>{formatearMoneda(detalle.totalDevengado)}</span>
          </div>
          <div className="resumen-linea">
            <span>Deducciones (salud + pensión)</span>
            <span>-{formatearMoneda(detalle.totalDeducciones)}</span>
          </div>
          <div className="resumen-linea">
            <span>Neto a pagar</span>
            <span>{formatearMoneda(detalle.netoPagar)}</span>
          </div>
        </Tarjeta>
      )}

      <Tarjeta titulo="Nóminas registradas">
        {cargando && <Cargando />}
        {error && <Alerta tipo="error">{error}</Alerta>}
        {!cargando && !error && nominas.length === 0 && <SinDatos />}
        {nominas.length > 0 && (
          <div className="tabla-envoltura">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Id</th>
                  <th>Empleado</th>
                  <th>Periodo</th>
                  <th className="numerico">Devengado</th>
                  <th className="numerico">Deducciones</th>
                  <th className="numerico">Neto</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {nominas.map((nomina) => (
                  <tr key={nomina.id}>
                    <td>{nomina.id}</td>
                    <td>{mapa[nomina.empleadoId] || nomina.empleadoId}</td>
                    <td>{nomina.periodo}</td>
                    <td className="numerico">{formatearMoneda(nomina.totalDevengado)}</td>
                    <td className="numerico">{formatearMoneda(nomina.totalDeducciones)}</td>
                    <td className="numerico">{formatearMoneda(nomina.netoPagar)}</td>
                    <td>{nomina.estado}</td>
                    <td>
                      <button
                        type="button"
                        className="boton-secundario boton-mini"
                        onClick={() => setDetalle(nomina)}
                      >
                        Ver
                      </button>
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

export default Nomina
