const database = require("../../../config/database");

const COLUMNAS =
    "id_asistencia, id_empleado, tipo, " +
    "TO_CHAR(fecha_hora, 'YYYY-MM-DD HH24:MI:SS') AS fecha_hora, " +
    "origen, observacion, estado, " +
    "TO_CHAR(fecha_creacion, 'YYYY-MM-DD HH24:MI') AS fecha_creacion";

// Convierte una fila de Oracle (columnas en mayuscula) en el objeto marcaje.
function crearDesdeFila(fila) {
    return {
        id: fila.ID_ASISTENCIA,
        empleadoId: fila.ID_EMPLEADO,
        tipo: fila.TIPO,
        fechaHora: fila.FECHA_HORA,
        origen: fila.ORIGEN,
        observacion: fila.OBSERVACION,
        estado: fila.ESTADO,
        fechaCreacion: fila.FECHA_CREACION
    };
}

// Inserta un marcaje y devuelve la fila guardada (con su id de Oracle).
function agregarRegistro(datos) {
    let sql =
        "INSERT INTO ASISTENCIA (id_empleado, tipo, origen, observacion) " +
        "VALUES (:empleadoId, :tipo, :origen, :observacion) " +
        "RETURNING id_asistencia INTO :id";

    let parametros = {
        empleadoId: datos.empleadoId,
        tipo: datos.tipo,
        origen: datos.origen,
        observacion: datos.observacion,
        id: { dir: database.oracledb.BIND_OUT, type: database.oracledb.NUMBER }
    };

    return database.ejecutar(sql, parametros)
        .then(function (resultado) {
            return buscarPorId(resultado.outBinds.id[0]);
        });
}

// devuelve una promesa con todos los marcajes
function obtenerTodos() {
    let sql = "SELECT " + COLUMNAS + " FROM ASISTENCIA ORDER BY fecha_hora, id_asistencia";

    return database.ejecutar(sql, {})
        .then(function (resultado) {
            return resultado.rows.map(crearDesdeFila);
        });
}

// devuelve una promesa con el marcaje de ese id o null si no existe
function buscarPorId(id) {
    let sql = "SELECT " + COLUMNAS + " FROM ASISTENCIA WHERE id_asistencia = :id";

    return database.ejecutar(sql, { id: id })
        .then(function (resultado) {
            if (resultado.rows.length === 0) {
                return null;
            }
            return crearDesdeFila(resultado.rows[0]);
        });
}

// devuelve una promesa con todos los marcajes de un empleado
function obtenerPorEmpleado(empleadoId) {
    let sql =
        "SELECT " + COLUMNAS + " FROM ASISTENCIA " +
        "WHERE id_empleado = :empleadoId ORDER BY fecha_hora, id_asistencia";

    return database.ejecutar(sql, { empleadoId: empleadoId })
        .then(function (resultado) {
            return resultado.rows.map(crearDesdeFila);
        });
}

// devuelve una promesa con el ultimo marcaje del empleado o null si no tiene
function obtenerUltimoPorEmpleado(empleadoId) {
    let sql =
        "SELECT " + COLUMNAS + " FROM ASISTENCIA " +
        "WHERE id_empleado = :empleadoId " +
        "ORDER BY fecha_hora DESC, id_asistencia DESC " +
        "FETCH FIRST 1 ROWS ONLY";

    return database.ejecutar(sql, { empleadoId: empleadoId })
        .then(function (resultado) {
            if (resultado.rows.length === 0) {
                return null;
            }
            return crearDesdeFila(resultado.rows[0]);
        });
}

// Actualiza un marcaje existente (CU10) y devuelve la fila ya corregida.
function actualizarRegistro(id, datos) {
    let sql =
        "UPDATE ASISTENCIA SET " +
        "  tipo = :tipo, " +
        "  fecha_hora = TO_TIMESTAMP(:fechaHora, 'YYYY-MM-DD HH24:MI:SS'), " +
        "  observacion = :observacion, " +
        "  estado = :estado " +
        "WHERE id_asistencia = :id";

    let parametros = {
        tipo: datos.tipo,
        fechaHora: datos.fechaHora,
        observacion: datos.observacion,
        estado: datos.estado,
        id: id
    };

    return database.ejecutar(sql, parametros)
        .then(function () {
            return buscarPorId(id);
        });
}

module.exports = {
    agregarRegistro: agregarRegistro,
    obtenerTodos: obtenerTodos,
    buscarPorId: buscarPorId,
    obtenerPorEmpleado: obtenerPorEmpleado,
    obtenerUltimoPorEmpleado: obtenerUltimoPorEmpleado,
    actualizarRegistro: actualizarRegistro
};
