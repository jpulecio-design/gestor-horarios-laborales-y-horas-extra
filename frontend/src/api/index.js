import cliente from './cliente'

export const apiAuth = {
  iniciarSesion: (username, password) =>
    cliente.post('/auth/login', { username, password }).then((r) => r.data),
}

export const apiTest = {
  health: () => cliente.get('/test/health').then((r) => r.data),
  testDb: () => cliente.get('/test/test-db').then((r) => r.data),
}

export const apiEmpleados = {
  listar: () => cliente.get('/empleados').then((r) => r.data),
  obtener: (id) => cliente.get(`/empleados/${id}`).then((r) => r.data),
  crear: (empleado) => cliente.post('/empleados', empleado).then((r) => r.data),
  actualizar: (id, empleado) =>
    cliente.put(`/empleados/${id}`, empleado).then((r) => r.data),
}

export const apiHorasExtra = {
  listar: () => cliente.get('/horas-extra').then((r) => r.data),
  porEmpleado: (id) => cliente.get(`/horas-extra/empleado/${id}`).then((r) => r.data),
  porPeriodo: (id, periodo) =>
    cliente.get(`/horas-extra/empleado/${id}/periodo/${periodo}`).then((r) => r.data),
  crear: (registro) => cliente.post('/horas-extra', registro).then((r) => r.data),
}

export const apiNomina = {
  listar: () => cliente.get('/nomina').then((r) => r.data),
  porEmpleado: (id) => cliente.get(`/nomina/empleado/${id}`).then((r) => r.data),
  crear: (registro) => cliente.post('/nomina', registro).then((r) => r.data),
}

export const apiAsistencia = {
  listar: () => cliente.get('/asistencia').then((r) => r.data),
  registrarQr: (datos) => cliente.post('/asistencia/qr', datos).then((r) => r.data),
  actualizar: (id, datos) =>
    cliente.put(`/asistencia/${id}`, datos).then((r) => r.data),
  porEmpleado: (id) => cliente.get(`/asistencia/empleado/${id}`).then((r) => r.data),
  qrEmpleado: (id) => cliente.get(`/asistencia/empleado/${id}/qr`).then((r) => r.data),
}

export const apiHorarios = {
  listarTurnos: () => cliente.get('/horarios/turnos').then((r) => r.data),
  crearTurno: (turno) => cliente.post('/horarios/turnos', turno).then((r) => r.data),
  asignar: (asignacion) =>
    cliente.post('/horarios/asignaciones', asignacion).then((r) => r.data),
  porEmpleado: (id) => cliente.get(`/horarios/empleado/${id}`).then((r) => r.data),
  hoy: (id) => cliente.get(`/horarios/empleado/${id}/hoy`).then((r) => r.data),
  semana: (id) => cliente.get(`/horarios/empleado/${id}/semana`).then((r) => r.data),
  desactivarAsignacion: (id) =>
    cliente.delete(`/horarios/asignaciones/${id}`).then((r) => r.data),
  reactivarAsignacion: (id) =>
    cliente.put(`/horarios/asignaciones/${id}/reactivar`).then((r) => r.data),
  quitarDiaBase: (empleadoId, fecha) =>
    cliente.delete(`/horarios/base/${empleadoId}/${fecha}`).then((r) => r.data),
  eliminarDia: (empleadoId, fecha) =>
  cliente.delete(`/horarios/programacion/${empleadoId}/${fecha}`).then((r) => r.data),

}

export const apiRelevos = {
  companeros: () => cliente.get('/horarios/relevos/companeros').then((r) => r.data),
  agenda: (empleadoId, dias) =>
    cliente
      .get(`/horarios/relevos/agenda/${empleadoId}`, { params: dias ? { dias } : {} })
      .then((r) => r.data),
  enviadas: (empleadoId) => cliente.get(`/horarios/relevos/enviadas/${empleadoId}`).then((r) => r.data),
  recibidas: (empleadoId) => cliente.get(`/horarios/relevos/recibidas/${empleadoId}`).then((r) => r.data),
  obtener: (id) => cliente.get(`/horarios/relevos/${id}`).then((r) => r.data),
  solicitar: (datos) => cliente.post('/horarios/relevos', datos).then((r) => r.data),
  responder: (id, datos) => cliente.patch(`/horarios/relevos/${id}/respuesta`, datos).then((r) => r.data),
}

export const apiMonitoreo = {
  general: ({ desde, hasta } = {}) =>
    cliente.get('/monitoreo/general', { params: { desde, hasta } }).then((r) => r.data),
  porEmpleado: (id, { desde, hasta } = {}) =>
    cliente
      .get(`/monitoreo/empleado/${id}`, { params: { desde, hasta } })
      .then((r) => r.data),
}

export const apiReportes = {
  monitoreoXlsx: ({ desde, hasta } = {}) =>
    cliente
      .get('/reportes/monitoreo.xlsx', {
        params: { desde, hasta },
        responseType: 'blob',
      })
      .then((r) => r.data),
}
