import { useEffect, useState } from 'react'
import { apiHorasExtra } from '../api'
import { useEmpleados } from '../hooks/useEmpleados'
import { useAuth } from '../context/useAuth'
import { Alerta, Cargando, SinDatos, Tarjeta } from '../components/Comunes'
import { aTexto, formatearMoneda, formatearNumero, nombreCompleto } from '../util/formato'

const FACTORES = { Diurna: 1.25, Nocturna: 1.75, Festiva: 2.0 }

const FORM_VACIO = {
  empleadoId: '',
  fecha: aTexto(new Date()),
  tipo: 'Diurna',
  cantidadHoras: '',
  valorHoraBase: '',
}

function HorasExtra() {
  const { usuario } = useAuth()
  const esEmpleado = usuario?.rol === 'Empleado'
  const { empleados } = useEmpleados({ activo: !esEmpleado })
  const [registros, setRegistros] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState(FORM_VACIO)
  const [filtroEmpleado, setFiltroEmpleado] = useState('')
  const [mensaje, setMensaje] = useState(null)
  const [guardando, setGuardando] = useState(false)

  async function cargar() {
    setCargando(true)
    setError('')
    try {
      const datos = esEmpleado
        ? await apiHorasExtra.porEmpleado(usuario.id)
        : await apiHorasExtra.listar()
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

  function mapaEmpleados() {
    const mapa = {}
    empleados.forEach((empleado) => {
      mapa[empleado.usuario.id] = nombreCompleto(empleado)
    })
    return mapa
  }

  function seleccionarEmpleado(id) {
    const empleado = empleados.find((e) => String(e.usuario.id) === String(id))
    const sugerido =
      empleado && Number(empleado.salarioBase) > 0
        ? (Number(empleado.salarioBase) / 240).toFixed(2)
        : form.valorHoraBase
    setForm((previo) => ({ ...previo, empleadoId: id, valorHoraBase: sugerido }))
  }

  const valorCalculado =
    Number(form.valorHoraBase) > 0 && Number(form.cantidadHoras) > 0
      ? Number(form.valorHoraBase) * FACTORES[form.tipo] * Number(form.cantidadHoras)
      : 0

  async function guardar(evento) {
    evento.preventDefault()
    setGuardando(true)
    setMensaje(null)
    try {
      await apiHorasExtra.crear(form)
      setMensaje({ tipo: 'exito', texto: 'Hora extra registrada correctamente.' })
      setForm({ ...FORM_VACIO, empleadoId: form.empleadoId, valorHoraBase: form.valorHoraBase })
      await cargar()
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message })
    } finally {
      setGuardando(false)
    }
  }

  const nombres = mapaEmpleados()
  const visibles = filtroEmpleado
    ? registros.filter((r) => String(r.empleadoId) === String(filtroEmpleado))
    : registros

  return (
    <div>
      <h1>Horas extra</h1>

      {mensaje && <Alerta tipo={mensaje.tipo}>{mensaje.texto}</Alerta>}

      {!esEmpleado && (
        <Tarjeta titulo="Registrar hora extra">
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
            Fecha
            <input
              type="date"
              value={form.fecha}
              onChange={(e) => setForm({ ...form, fecha: e.target.value })}
              required
            />
          </label>
          <label className="campo">
            Tipo
            <select value={form.tipo} onChange={(e) => setForm({ ...form, tipo: e.target.value })}>
              <option value="Diurna">Diurna (+25%)</option>
              <option value="Nocturna">Nocturna (+75%)</option>
              <option value="Festiva">Festiva (+100%)</option>
            </select>
          </label>
          <label className="campo">
            Cantidad de horas
            <input
              type="number"
              min="0"
              step="0.5"
              value={form.cantidadHoras}
              onChange={(e) => setForm({ ...form, cantidadHoras: e.target.value })}
              required
            />
          </label>
          <label className="campo">
            Valor hora base
            <input
              type="number"
              min="0"
              value={form.valorHoraBase}
              onChange={(e) => setForm({ ...form, valorHoraBase: e.target.value })}
              required
            />
          </label>
          <div className="formulario-acciones">
            <button type="submit" disabled={guardando}>
              {guardando ? 'Guardando…' : 'Registrar'}
            </button>
            <span className="cargando" style={{ alignSelf: 'center' }}>
              Valor calculado: {formatearMoneda(valorCalculado)}
            </span>
          </div>
        </form>
      </Tarjeta>
      )}

      <Tarjeta
        titulo="Registros"
        acciones={
          !esEmpleado && (
          <label className="campo">
            Filtrar por empleado
            <select value={filtroEmpleado} onChange={(e) => setFiltroEmpleado(e.target.value)}>
              <option value="">Todos</option>
              {empleados.map((empleado) => (
                <option key={empleado.usuario.id} value={empleado.usuario.id}>
                  {nombreCompleto(empleado)}
                </option>
              ))}
            </select>
          </label>
          )
        }
      >
        {cargando && <Cargando />}
        {error && <Alerta tipo="error">{error}</Alerta>}
        {!cargando && !error && visibles.length === 0 && <SinDatos />}
        {visibles.length > 0 && (
          <div className="tabla-envoltura">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Id</th>
                  <th>Empleado</th>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th className="numerico">Horas</th>
                  <th className="numerico">Valor hora</th>
                  <th className="numerico">Factor</th>
                  <th className="numerico">Valor</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((registro) => (
                  <tr key={registro.id}>
                    <td>{registro.id}</td>
                    <td>{nombres[registro.empleadoId] || registro.empleadoId}</td>
                    <td>{registro.fecha}</td>
                    <td>{registro.tipo}</td>
                    <td className="numerico">{formatearNumero(registro.cantidadHoras)}</td>
                    <td className="numerico">{formatearMoneda(registro.valorHoraBase)}</td>
                    <td className="numerico">{registro.factorRecargo}</td>
                    <td className="numerico">{formatearMoneda(registro.valor)}</td>
                    <td>{registro.estado}</td>
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

export default HorasExtra
