const database = require("../../../config/database");
const relevo = require("../dominio/relevo");

//columnas

// los alias AS evitan que dos columnas con el mismo se contrapongan
const COLUMNAS_RELEVO =
    "s.id_solicitud, s.id_horario, s.id_empleado_solicitante, s.id_empleado_companero, s.estado, " +
    "TO_CHAR(s.fecha_solicitud, 'YYYY-MM-DD HH24:MI') AS fecha_solicitud, " +
    "TO_CHAR(s.fecha_respuesta, 'YYYY-MM-DD HH24:MI') AS fecha_respuesta, " +
    "TO_CHAR(h.fecha, 'YYYY-MM-DD') AS fecha_turno, " +
    "h.hora_entrada_prog, h.hora_salida_prog, h.tipo_turno, " +
    "sol.nombre AS solicitante_nombre, sol.apellido AS solicitante_apellido, " +
    "sol.telegram_chat_id AS solicitante_chat, " +
    "com.nombre AS companero_nombre, com.apellido AS companero_apellido, " +
    "com.telegram_chat_id AS companero_chat";

// JOIN normal: una solicitud SIEMPRE tiene turno,
// solicitante y compañero, porque las tres columnas son NOT NULL
const TABLAS_RELEVO =
    "FROM SOLICITUD_RELEVO s " +
    "JOIN HORARIO_ASIGNADO h ON h.id_horario = s.id_horario " +
    "JOIN EMPLEADO sol ON sol.id_empleado = s.id_empleado_solicitante " +
    "JOIN EMPLEADO com ON com.id_empleado = s.id_empleado_companero";

// HORARIOS

// cada fila de HORARIO_ASIGNADO es el turno de UN empleado en UN dia
// es necesario pa saber de quien es el turno antes de pedir relevo
function buscarHorarioPorId(idHorario) {
    let sql =
        "SELECT h.id_horario, h.id_empleado, " +
        "       TO_CHAR(h.fecha, 'YYYY-MM-DD') AS fecha_turno, " +
        "       h.hora_entrada_prog, h.hora_salida_prog, h.tipo_turno " +
        "FROM HORARIO_ASIGNADO h " +
        "WHERE h.id_horario = :idHorario";

    return database.ejecutar(sql, { idHorario: idHorario })
        .then(function (resultado) {
            if (resultado.rows.length === 0) {
                return null;
            }
            return relevo.horarioDesdeFila(resultado.rows[0]);
        });
}

// excepciones de un empleado entre dos fechas
// Son las filas de HORARIO_ASIGNADO 
function obtenerHorariosEntre(empleadoId, desde, hasta) {
    let sql =
        "SELECT h.id_horario, h.id_empleado, " +
        "       TO_CHAR(h.fecha, 'YYYY-MM-DD') AS fecha_turno, " +
        "       h.hora_entrada_prog, h.hora_salida_prog, h.tipo_turno " +
        "FROM HORARIO_ASIGNADO h " +
        "WHERE h.id_empleado = :empleadoId " +
        "AND h.fecha BETWEEN TO_DATE(:desde, 'YYYY-MM-DD') AND TO_DATE(:hasta, 'YYYY-MM-DD') " +
        "ORDER BY h.fecha";

    return database.ejecutar(sql, { empleadoId: empleadoId, desde: desde, hasta: hasta })
        .then(function (resultado) {
            return resultado.rows.map(relevo.horarioDesdeFila);
        });
}

// el turno materializado de un empleado en una fecha exacta
function buscarHorarioPorFecha(empleadoId, fecha) {
    let sql =
        "SELECT h.id_horario, h.id_empleado, " +
        "       TO_CHAR(h.fecha, 'YYYY-MM-DD') AS fecha_turno, " +
        "       h.hora_entrada_prog, h.hora_salida_prog, h.tipo_turno " +
        "FROM HORARIO_ASIGNADO h " +
        "WHERE h.id_empleado = :empleadoId " +
        "AND h.fecha = TO_DATE(:fecha, 'YYYY-MM-DD')";

    return database.ejecutar(sql, { empleadoId: empleadoId, fecha: fecha })
        .then(function (resultado) {
            if (resultado.rows.length === 0) {
                return null;
            }
            return relevo.horarioDesdeFila(resultado.rows[0]);
        });
}

function materializarHorario(empleadoId, turno) {
    let sql =
        "INSERT INTO HORARIO_ASIGNADO " +
        "  (id_empleado, fecha, hora_entrada_prog, hora_salida_prog, tipo_turno) " +
        "VALUES (:empleadoId, TO_DATE(:fecha, 'YYYY-MM-DD'), :horaEntrada, :horaSalida, :tipoTurno) " +
        "RETURNING id_horario INTO :id";

    let parametros = {
        empleadoId: empleadoId,
        fecha: turno.fecha,
        horaEntrada: turno.horaEntrada,
        horaSalida: turno.horaSalida,
        tipoTurno: turno.tipoTurno,
        id: { dir: database.oracledb.BIND_OUT, type: database.oracledb.NUMBER }
    };

    return database.ejecutar(sql, parametros)
        .then(function (resultado) {
            return buscarHorarioPorId(resultado.outBinds.id[0]);
        });
}

// fechas que el empleado ya confirmadas
// sirven para que esos dias dejen de aparecer en su agenda
function obtenerFechasCedidas(empleadoId, desde, hasta) {
    let sql =
        "SELECT TO_CHAR(h.fecha, 'YYYY-MM-DD') AS fecha_turno " +
        "FROM SOLICITUD_RELEVO s " +
        "JOIN HORARIO_ASIGNADO h ON h.id_horario = s.id_horario " +
        "WHERE s.id_empleado_solicitante = :empleadoId " +
        "AND s.estado = 'Confirmado' " +
        "AND h.fecha BETWEEN TO_DATE(:desde, 'YYYY-MM-DD') AND TO_DATE(:hasta, 'YYYY-MM-DD')";

    return database.ejecutar(sql, { empleadoId: empleadoId, desde: desde, hasta: hasta })
        .then(function (resultado) {
            return resultado.rows.map(function (fila) { return fila.FECHA_TURNO; });
        });
}

// turnos de un empleado desde una fecha en adelante
function obtenerHorariosDesde(empleadoId, fechaDesde) {
    let sql =
        "SELECT h.id_horario, h.id_empleado, " +
        "       TO_CHAR(h.fecha, 'YYYY-MM-DD') AS fecha_turno, " +
        "       h.hora_entrada_prog, h.hora_salida_prog, h.tipo_turno " +
        "FROM HORARIO_ASIGNADO h " +
        "WHERE h.id_empleado = :empleadoId " +
        "AND h.fecha >= TO_DATE(:fechaDesde, 'YYYY-MM-DD') " +
        "ORDER BY h.fecha";

    return database.ejecutar(sql, { empleadoId: empleadoId, fechaDesde: fechaDesde })
        .then(function (resultado) {
            return resultado.rows.map(relevo.horarioDesdeFila);
        });
}

function obtenerCompanerosActivos(empleadoId) {
    let sql =
        "SELECT e.id_empleado, e.nombre, e.apellido " +
        "FROM EMPLEADO e " +
        "WHERE e.rol = 'Empleado' " +
        "AND e.estado = 'Activo' " +
        "AND e.id_empleado <> :empleadoId " +
        "ORDER BY e.nombre, e.apellido";

    return database.ejecutar(sql, { empleadoId: empleadoId })
        .then(function (resultado) {
            return resultado.rows.map(function (fila) {
                return {
                    id: fila.ID_EMPLEADO,
                    nombre: fila.NOMBRE,
                    apellido: fila.APELLIDO
                };
            });
        });
}

// pasa SOLO ese dia al compañero
function reasignarHorario(idHorario, idNuevoEmpleado) {
    let sql =
        "UPDATE HORARIO_ASIGNADO SET id_empleado = :idNuevoEmpleado " +
        "WHERE id_horario = :idHorario";

    return database.ejecutar(sql, {
        idNuevoEmpleado: idNuevoEmpleado,
        idHorario: idHorario
    });
}

// SOLICITUDES 

// true si ese turno ya tiene una solicitud esperando respuesta
function existeSolicitudPendiente(idHorario) {
    let sql =
        "SELECT COUNT(*) AS total FROM SOLICITUD_RELEVO " +
        "WHERE id_horario = :idHorario AND estado = 'Pendiente'";

    return database.ejecutar(sql, { idHorario: idHorario })
        .then(function (resultado) {
            return resultado.rows[0].TOTAL > 0;
        });
}

// crea la solicitud y devuelve la fila guardada  con estado pendiente y echa_solicitud SYSDATE

function agregarSolicitud(datos) {
    let sql =
        "INSERT INTO SOLICITUD_RELEVO " +
        "  (id_horario, id_empleado_solicitante, id_empleado_companero) " +
        "VALUES (:idHorario, :idSolicitante, :idCompanero) " +
        "RETURNING id_solicitud INTO :id";

    let parametros = {
        idHorario: datos.idHorario,
        idSolicitante: datos.idSolicitante,
        idCompanero: datos.idCompanero,
        id: { dir: database.oracledb.BIND_OUT, type: database.oracledb.NUMBER }
    };

    return database.ejecutar(sql, parametros)
        .then(function (resultado) {
            return buscarSolicitudPorId(resultado.outBinds.id[0]);
        });
}

function buscarSolicitudPorId(idSolicitud) {
    let sql =
        "SELECT " + COLUMNAS_RELEVO + " " + TABLAS_RELEVO + " " +
        "WHERE s.id_solicitud = :idSolicitud";

    return database.ejecutar(sql, { idSolicitud: idSolicitud })
        .then(function (resultado) {
            if (resultado.rows.length === 0) {
                return null;
            }
            return relevo.relevoDesdeFila(resultado.rows[0]);
        });
}

// solicitudes que ese empleado envio
function obtenerEnviadas(empleadoId) {
    let sql =
        "SELECT " + COLUMNAS_RELEVO + " " + TABLAS_RELEVO + " " +
        "WHERE s.id_empleado_solicitante = :empleadoId " +
        "ORDER BY s.fecha_solicitud DESC";

    return database.ejecutar(sql, { empleadoId: empleadoId })
        .then(function (resultado) {
            return resultado.rows.map(relevo.relevoDesdeFila);
        });
}

// solicitudes que le pidieron cubrir a ese empleado
function obtenerRecibidas(empleadoId) {
    let sql =
        "SELECT " + COLUMNAS_RELEVO + " " + TABLAS_RELEVO + " " +
        "WHERE s.id_empleado_companero = :empleadoId " +
        "ORDER BY s.fecha_solicitud DESC";

    return database.ejecutar(sql, { empleadoId: empleadoId })
        .then(function (resultado) {
            return resultado.rows.map(relevo.relevoDesdeFila);
        });
}

// marca la solicitud como confirmado o rechazado y guarda la fecha de respuesta
function responderSolicitud(idSolicitud, estado) {
    let sql =
        "UPDATE SOLICITUD_RELEVO " +
        "SET estado = :estado, fecha_respuesta = SYSDATE " +
        "WHERE id_solicitud = :idSolicitud AND estado = 'Pendiente'";

    return database.ejecutar(sql, { estado: estado, idSolicitud: idSolicitud })
        .then(function (resultado) {
            return resultado.rowsAffected === 1;
        });
}

module.exports = {
    buscarHorarioPorId: buscarHorarioPorId,
    buscarHorarioPorFecha: buscarHorarioPorFecha,
    obtenerHorariosEntre: obtenerHorariosEntre,
    materializarHorario: materializarHorario,
    obtenerFechasCedidas: obtenerFechasCedidas,
    obtenerHorariosDesde: obtenerHorariosDesde,
    obtenerCompanerosActivos: obtenerCompanerosActivos,
    reasignarHorario: reasignarHorario,
    existeSolicitudPendiente: existeSolicitudPendiente,
    agregarSolicitud: agregarSolicitud,
    buscarSolicitudPorId: buscarSolicitudPorId,
    obtenerEnviadas: obtenerEnviadas,
    obtenerRecibidas: obtenerRecibidas,
    responderSolicitud: responderSolicitud
};