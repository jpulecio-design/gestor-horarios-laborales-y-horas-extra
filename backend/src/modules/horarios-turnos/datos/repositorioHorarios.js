const database = require("../../../config/database");

// ===================== TURNOS =====================

const COLUMNAS_TURNO =
    "id_turno, nombre, hora_entrada, hora_salida, dias, estado, " +
    "TO_CHAR(fecha_creacion, 'YYYY-MM-DD HH24:MI') AS fecha_creacion";

function turnoDesdeFila(fila) {
    return {
        id: fila.ID_TURNO,
        nombre: fila.NOMBRE,
        horaEntrada: fila.HORA_ENTRADA,
        horaSalida: fila.HORA_SALIDA,
        dias: fila.DIAS,
        estado: fila.ESTADO,
        fechaCreacion: fila.FECHA_CREACION
    };
}

// Inserta un turno y devuelve la fila guardada (con su id de Oracle).
function agregarTurno(datos) {
    let sql =
        "INSERT INTO TURNO (nombre, hora_entrada, hora_salida, dias) " +
        "VALUES (:nombre, :horaEntrada, :horaSalida, :dias) " +
        "RETURNING id_turno INTO :id";

    let parametros = {
        nombre: datos.nombre,
        horaEntrada: datos.horaEntrada,
        horaSalida: datos.horaSalida,
        dias: datos.dias,
        id: { dir: database.oracledb.BIND_OUT, type: database.oracledb.NUMBER }
    };

    return database.ejecutar(sql, parametros)
        .then(function (resultado) {
            return buscarTurnoPorId(resultado.outBinds.id[0]);
        });
}

function obtenerTurnos() {
    let sql = "SELECT " + COLUMNAS_TURNO + " FROM TURNO ORDER BY id_turno";

    return database.ejecutar(sql, {})
        .then(function (resultado) {
            return resultado.rows.map(turnoDesdeFila);
        });
}

function buscarTurnoPorId(id) {
    let sql = "SELECT " + COLUMNAS_TURNO + " FROM TURNO WHERE id_turno = :id";

    return database.ejecutar(sql, { id: id })
        .then(function (resultado) {
            if (resultado.rows.length === 0) {
                return null;
            }
            return turnoDesdeFila(resultado.rows[0]);
        });
}

// true si ya existe un turno con ese nombre
function existeNombreTurno(nombre) {
    let sql = "SELECT COUNT(*) AS total FROM TURNO WHERE nombre = :nombre";

    return database.ejecutar(sql, { nombre: nombre })
        .then(function (resultado) {
            return resultado.rows[0].TOTAL > 0;
        });
}

// ===================== ASIGNACIONES =====================

const COLUMNAS_ASIGNACION =
    "a.id_asignacion, a.id_empleado, a.id_turno, " +
    "TO_CHAR(a.fecha_desde, 'YYYY-MM-DD') AS fecha_desde, " +
    "TO_CHAR(a.fecha_hasta, 'YYYY-MM-DD') AS fecha_hasta, a.estado, " +
    "t.nombre AS turno_nombre, t.hora_entrada, t.hora_salida, t.dias AS turno_dias";

function asignacionDesdeFila(fila) {
    return {
        id: fila.ID_ASIGNACION,
        empleadoId: fila.ID_EMPLEADO,
        turnoId: fila.ID_TURNO,
        fechaDesde: fila.FECHA_DESDE,
        fechaHasta: fila.FECHA_HASTA,
        estado: fila.ESTADO,
        turno: {
            id: fila.ID_TURNO,
            nombre: fila.TURNO_NOMBRE,
            horaEntrada: fila.HORA_ENTRADA,
            horaSalida: fila.HORA_SALIDA,
            dias: fila.TURNO_DIAS
        }
    };
}

// Asigna un turno a un empleado y devuelve la asignacion guardada.
function agregarAsignacion(datos) {
    let sql =
        "INSERT INTO ASIGNACION_HORARIO (id_empleado, id_turno, fecha_desde, fecha_hasta) " +
        "VALUES (:empleadoId, :turnoId, TO_DATE(:fechaDesde, 'YYYY-MM-DD'), " +
        "        TO_DATE(:fechaHasta, 'YYYY-MM-DD')) " +
        "RETURNING id_asignacion INTO :id";

    let parametros = {
        empleadoId: datos.empleadoId,
        turnoId: datos.turnoId,
        fechaDesde: datos.fechaDesde,
        fechaHasta: datos.fechaHasta,
        id: { dir: database.oracledb.BIND_OUT, type: database.oracledb.NUMBER }
    };

    return database.ejecutar(sql, parametros)
        .then(function (resultado) {
            return buscarAsignacionPorId(resultado.outBinds.id[0]);
        });
}

function buscarAsignacionPorId(id) {
    let sql =
        "SELECT " + COLUMNAS_ASIGNACION + " " +
        "FROM ASIGNACION_HORARIO a JOIN TURNO t ON t.id_turno = a.id_turno " +
        "WHERE a.id_asignacion = :id";

    return database.ejecutar(sql, { id: id })
        .then(function (resultado) {
            if (resultado.rows.length === 0) {
                return null;
            }
            return asignacionDesdeFila(resultado.rows[0]);
        });
}

// devuelve una promesa con las asignaciones (con su turno) de un empleado
function obtenerAsignacionesPorEmpleado(empleadoId) {
    let sql =
        "SELECT " + COLUMNAS_ASIGNACION + " " +
        "FROM ASIGNACION_HORARIO a JOIN TURNO t ON t.id_turno = a.id_turno " +
        "WHERE a.id_empleado = :empleadoId " +
        "ORDER BY a.fecha_desde, a.id_asignacion";

    return database.ejecutar(sql, { empleadoId: empleadoId })
        .then(function (resultado) {
            return resultado.rows.map(asignacionDesdeFila);
        });
}

module.exports = {
    agregarTurno: agregarTurno,
    obtenerTurnos: obtenerTurnos,
    buscarTurnoPorId: buscarTurnoPorId,
    existeNombreTurno: existeNombreTurno,
    agregarAsignacion: agregarAsignacion,
    buscarAsignacionPorId: buscarAsignacionPorId,
    obtenerAsignacionesPorEmpleado: obtenerAsignacionesPorEmpleado
};
