const database = require("../../../config/database");

const COLUMNAS =
    "id_hora_extra, id_empleado, TO_CHAR(fecha, 'YYYY-MM-DD') AS fecha, tipo, " +
    "cantidad_horas, valor_hora_base, factor_recargo, valor, estado, " +
    "estado_aprobacion, aprobado_por, " +
    "TO_CHAR(fecha_aprobacion, 'YYYY-MM-DD HH24:MI') AS fecha_aprobacion, " +
    "observacion_aprobacion, " +
    "TO_CHAR(fecha_creacion, 'YYYY-MM-DD HH24:MI') AS fecha_creacion";

// Convierte una fila de Oracle (columnas en mayuscula) en el objeto hora extra.
function crearDesdeFila(fila) {
    return {
        id: fila.ID_HORA_EXTRA,
        empleadoId: fila.ID_EMPLEADO,
        fecha: fila.FECHA,
        tipo: fila.TIPO,
        cantidadHoras: fila.CANTIDAD_HORAS,
        valorHoraBase: fila.VALOR_HORA_BASE,
        factorRecargo: fila.FACTOR_RECARGO,
        valor: fila.VALOR,
        estado: fila.ESTADO,
        estadoAprobacion: fila.ESTADO_APROBACION || 'Pendiente',
        aprobadoPor: fila.APROBADO_POR || null,
        fechaAprobacion: fila.FECHA_APROBACION || null,
        observacionAprobacion: fila.OBSERVACION_APROBACION || null,
        fechaCreacion: fila.FECHA_CREACION
    };
}

// Inserta una hora extra y devuelve la fila guardada (con su id de Oracle).
function agregarHoraExtra(datos) {
    let sql =
        "INSERT INTO HORA_EXTRA " +
        "  (id_empleado, fecha, tipo, cantidad_horas, valor_hora_base, factor_recargo, valor) " +
        "VALUES " +
        "  (:empleadoId, TO_DATE(:fecha, 'YYYY-MM-DD'), :tipo, :cantidadHoras, " +
        "   :valorHoraBase, :factorRecargo, :valor) " +
        "RETURNING id_hora_extra INTO :id";

    let parametros = {
        empleadoId: datos.empleadoId,
        fecha: datos.fecha,
        tipo: datos.tipo,
        cantidadHoras: datos.cantidadHoras,
        valorHoraBase: datos.valorHoraBase,
        factorRecargo: datos.factorRecargo,
        valor: datos.valor,
        id: { dir: database.oracledb.BIND_OUT, type: database.oracledb.NUMBER }
    };

    return database.ejecutar(sql, parametros)
        .then(function (resultado) {
            return buscarPorId(resultado.outBinds.id[0]);
        });
}

// devuelve una promesa con todas las horas extra
function obtenerTodas() {
    let sql = "SELECT " + COLUMNAS + " FROM HORA_EXTRA ORDER BY id_hora_extra";

    return database.ejecutar(sql, {})
        .then(function (resultado) {
            return resultado.rows.map(crearDesdeFila);
        });
}

// devuelve una promesa con la hora extra de ese id o null si no existe
function buscarPorId(id) {
    let sql = "SELECT " + COLUMNAS + " FROM HORA_EXTRA WHERE id_hora_extra = :id";

    return database.ejecutar(sql, { id: id })
        .then(function (resultado) {
            if (resultado.rows.length === 0) {
                return null;
            }
            return crearDesdeFila(resultado.rows[0]);
        });
}

// devuelve una promesa con todas las horas extra de un empleado
function obtenerPorEmpleado(empleadoId) {
    let sql =
        "SELECT " + COLUMNAS + " FROM HORA_EXTRA " +
        "WHERE id_empleado = :empleadoId ORDER BY id_hora_extra";

    return database.ejecutar(sql, { empleadoId: empleadoId })
        .then(function (resultado) {
            return resultado.rows.map(crearDesdeFila);
        });
}

// devuelve las horas extra de un empleado dentro de un periodo "AAAA-MM"
function obtenerPorEmpleadoPeriodo(empleadoId, periodo) {
    let sql =
        "SELECT " + COLUMNAS + " FROM HORA_EXTRA " +
        "WHERE id_empleado = :empleadoId AND TO_CHAR(fecha, 'YYYY-MM') = :periodo " +
        "ORDER BY id_hora_extra";

    return database.ejecutar(sql, { empleadoId: empleadoId, periodo: periodo })
        .then(function (resultado) {
            return resultado.rows.map(crearDesdeFila);
        });
}

// Obtiene horas extra por estado de aprobación
function obtenerPorEstadoAprobacion(estadoAprobacion) {
    let sql = "SELECT " + COLUMNAS + " FROM HORA_EXTRA WHERE estado_aprobacion = :estadoAprobacion ORDER BY id_hora_extra";
    return database.ejecutar(sql, { estadoAprobacion: estadoAprobacion })
        .then(function (resultado) {
            return resultado.rows.map(crearDesdeFila);
        });
}

// Aprueba una hora extra
function aprobarHoraExtra(idHoraExtra, aprobadoPor, observacion) {
    let sql =
        "UPDATE HORA_EXTRA SET estado_aprobacion = 'Aprobado', " +
        "aprobado_por = :aprobadoPor, fecha_aprobacion = SYSTIMESTAMP, " +
        "observacion_aprobacion = :observacion WHERE id_hora_extra = :id";
    return database.ejecutar(sql, { id: idHoraExtra, aprobadoPor: aprobadoPor, observacion: observacion || null })
        .then(function () {
            return buscarPorId(idHoraExtra);
        });
}

// Rechaza una hora extra
function rechazarHoraExtra(idHoraExtra, aprobadoPor, observacion) {
    let sql =
        "UPDATE HORA_EXTRA SET estado_aprobacion = 'Rechazado', " +
        "aprobado_por = :aprobadoPor, fecha_aprobacion = SYSTIMESTAMP, " +
        "observacion_aprobacion = :observacion WHERE id_hora_extra = :id";
    return database.ejecutar(sql, { id: idHoraExtra, aprobadoPor: aprobadoPor, observacion: observacion || null })
        .then(function () {
            return buscarPorId(idHoraExtra);
        });
}

module.exports = {
    agregarHoraExtra: agregarHoraExtra,
    obtenerTodas: obtenerTodas,
    buscarPorId: buscarPorId,
    obtenerPorEmpleado: obtenerPorEmpleado,
    obtenerPorEmpleadoPeriodo: obtenerPorEmpleadoPeriodo,
    obtenerPorEstadoAprobacion: obtenerPorEstadoAprobacion,
    aprobarHoraExtra: aprobarHoraExtra,
    rechazarHoraExtra: rechazarHoraExtra
};
