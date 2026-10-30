import { useState } from 'react'
import { apiEmpleados } from '../api'
import { useEmpleados } from '../hooks/useEmpleados'
import { useAuth } from '../context/useAuth'
import { Alerta, Cargando, SinDatos, Tarjeta } from '../components/Comunes'
import { formatearMoneda, nombreCompleto } from '../util/formato'

const FORM_VACIO = {
  nombre: '',
  apellido: '',
  cedula: '',
  correo: '',
  contrasena: '',
  telefono: '',
  fechaIngreso: '',
  cargo: '',
  salarioBase: '',
  telegramChatId: '',
  contactoNombre: '',
  contactoTelefono: '',
  contactoParentesco: '',
}

function Empleados() {
  const { tieneRol } = useAuth()
  const puedeEditar = tieneRol('Administrador')
  const { empleados, cargando, error, recargar } = useEmpleados()
  const [form, setForm] = useState(FORM_VACIO)
  const [editandoId, setEditandoId] = useState(null)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [mensaje, setMensaje] = useState(null)
  const [guardando, setGuardando] = useState(false)

  function cambiar(campo, valor) {
    setForm((previo) => ({ ...previo, [campo]: valor }))
  }

  function nuevo() {
    setForm(FORM_VACIO)
    setEditandoId(null)
    setMostrarForm(true)
    setMensaje(null)
  }

  // primero trae el detalle y luego abre el formulario ya lleno
  async function editar(empleado) {
    setMensaje(null)
    try {
      const detalle = await apiEmpleados.obtener(empleado.usuario.id)
      setForm({
        nombre: detalle.usuario.nombre,
        apellido: detalle.usuario.apellido,
        cedula: detalle.usuario.cedula,
        correo: detalle.usuario.correo,
        // el backend ya no envía la contraseña; vacía = se conserva la actual
        contrasena: '',
        telefono: detalle.usuario.telefono,
        fechaIngreso: detalle.fechaIngreso,
        cargo: detalle.cargo,
        salarioBase: detalle.salarioBase,
        telegramChatId: detalle.telegramChatId,
        contactoNombre: detalle.contactoEmergencia.nombre,
        contactoTelefono: detalle.contactoEmergencia.telefono,
        contactoParentesco: detalle.contactoEmergencia.parentesco,
      })
      setEditandoId(empleado.usuario.id)
      setMostrarForm(true)
      // el formulario esta arriba del listado
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message })
    }
  }

  // borrado logico: no se elimina, solo pasa a Activo / Inactivo
  async function cambiarEstado(empleado) {
    const nuevoEstado = empleado.usuario.estado === 'Activo' ? 'Inactivo' : 'Activo'
    const accion = nuevoEstado === 'Inactivo' ? 'inactivar' : 'activar'
    if (!window.confirm(`¿Seguro que deseas ${accion} a ${nombreCompleto(empleado)}?`)) {
      return
    }
    setMensaje(null)
    try {
      await apiEmpleados.cambiarEstado(empleado.usuario.id, nuevoEstado)
      setMensaje({ tipo: 'exito', texto: `Empleado ${nuevoEstado.toLowerCase()} correctamente.` })
      await recargar()
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message })
    }
  }

  async function guardar(evento) {
    evento.preventDefault()
    setGuardando(true)
    setMensaje(null)
    try {
      if (editandoId) {
        const actualizado = await apiEmpleados.actualizar(editandoId, form)
        setMensaje(
          actualizado.sinCambios
            ? { tipo: 'info', texto: 'No había cambios para guardar.' }
            : { tipo: 'exito', texto: 'Empleado actualizado correctamente.' },
        )
      } else {
        await apiEmpleados.crear(form)
        setMensaje({ tipo: 'exito', texto: 'Empleado registrado correctamente.' })
      }
      setForm(FORM_VACIO)
      setEditandoId(null)
      setMostrarForm(false)
      await recargar()
    } catch (err) {
      setMensaje({ tipo: 'error', texto: err.message })
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div>
      <h1>Empleados</h1>

      {mensaje && <Alerta tipo={mensaje.tipo}>{mensaje.texto}</Alerta>}

      <Tarjeta
        titulo={editandoId ? `Editando empleado #${editandoId}` : 'Nuevo empleado'}
        acciones={
          !mostrarForm && puedeEditar && (
            <button type="button" onClick={nuevo}>
              Nuevo empleado
            </button>
          )
        }
      >
        {mostrarForm && puedeEditar ? (
          <form className="formulario" onSubmit={guardar}>
            <label className="campo">
              Nombre *
              <input value={form.nombre} onChange={(e) => cambiar('nombre', e.target.value)} required />
            </label>
            <label className="campo">
              Apellido *
              <input value={form.apellido} onChange={(e) => cambiar('apellido', e.target.value)} required />
            </label>
            <label className="campo">
              Cédula *
              <input value={form.cedula} onChange={(e) => cambiar('cedula', e.target.value)} required />
            </label>
            <label className="campo">
              Correo *
              <input type="email" value={form.correo} onChange={(e) => cambiar('correo', e.target.value)} required />
            </label>
            <label className="campo">
              {editandoId ? 'Contraseña (vacía = sin cambios)' : 'Contraseña *'}
              <input
                type="password"
                value={form.contrasena}
                onChange={(e) => cambiar('contrasena', e.target.value)}
                required={!editandoId}
                autoComplete="new-password"
              />
            </label>
            <label className="campo">
              Teléfono
              <input value={form.telefono} onChange={(e) => cambiar('telefono', e.target.value)} />
            </label>
            <label className="campo">
              Fecha de ingreso
              <input type="date" value={form.fechaIngreso} onChange={(e) => cambiar('fechaIngreso', e.target.value)} />
            </label>
            <label className="campo">
              Cargo
              <input value={form.cargo} onChange={(e) => cambiar('cargo', e.target.value)} />
            </label>
            <label className="campo">
              Salario base
              <input type="number" min="0" value={form.salarioBase} onChange={(e) => cambiar('salarioBase', e.target.value)} />
            </label>
            <label className="campo">
              Chat ID de Telegram
              <input value={form.telegramChatId} onChange={(e) => cambiar('telegramChatId', e.target.value)} />
            </label>
            <label className="campo">
              Contacto de emergencia
              <input value={form.contactoNombre} onChange={(e) => cambiar('contactoNombre', e.target.value)} />
            </label>
            <label className="campo">
              Teléfono del contacto
              <input value={form.contactoTelefono} onChange={(e) => cambiar('contactoTelefono', e.target.value)} />
            </label>
            <label className="campo">
              Parentesco
              <input value={form.contactoParentesco} onChange={(e) => cambiar('contactoParentesco', e.target.value)} />
            </label>
            <div className="formulario-acciones">
              <button type="submit" disabled={guardando}>
                {guardando ? 'Guardando…' : 'Guardar'}
              </button>
              <button
                type="button"
                className="boton-secundario"
                onClick={() => {
                  setMostrarForm(false)
                  setEditandoId(null)
                  setForm(FORM_VACIO)
                }}
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : !puedeEditar ? (
          <p>Consulta de empleados disponible. La gestión la realiza el administrador.</p>
        ) : (
          <p>Selecciona “Nuevo empleado” o edita uno del listado.</p>
        )}
      </Tarjeta>

      <Tarjeta titulo="Listado">
        {cargando && <Cargando />}
        {error && <Alerta tipo="error">{error}</Alerta>}
        {!cargando && !error && empleados.length === 0 && <SinDatos />}
        {!cargando && empleados.length > 0 && (
          <div className="tabla-envoltura">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Id</th>
                  <th>Nombre</th>
                  <th>Cédula</th>
                  <th>Correo</th>
                  <th>Cargo</th>
                  <th className="numerico">Salario base</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {empleados.map((empleado) => (
                  <tr key={empleado.usuario.id}>
                    <td>{empleado.usuario.id}</td>
                    <td>{nombreCompleto(empleado)}</td>
                    <td>{empleado.usuario.cedula}</td>
                    <td>{empleado.usuario.correo}</td>
                    <td>{empleado.cargo || '-'}</td>
                    <td className="numerico">{formatearMoneda(empleado.salarioBase)}</td>
                    <td>
                      <span
                        className={`etiqueta ${
                          empleado.usuario.estado === 'Activo' ? 'etiqueta-activo' : 'etiqueta-anulado'
                        }`}
                      >
                        {empleado.usuario.estado}
                      </span>
                    </td>
                    <td>
                      {puedeEditar && (
                        <div className="tarjeta-acciones">
                          <button
                            type="button"
                            className="boton-secundario boton-mini"
                            onClick={() => editar(empleado)}
                          >
                            Editar
                          </button>
                          <button
                            type="button"
                            className={
                              empleado.usuario.estado === 'Activo'
                                ? 'boton-peligro boton-mini'
                                : 'boton-secundario boton-mini'
                            }
                            onClick={() => cambiarEstado(empleado)}
                          >
                            {empleado.usuario.estado === 'Activo' ? 'Inactivar' : 'Activar'}
                          </button>
                        </div>
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

export default Empleados
