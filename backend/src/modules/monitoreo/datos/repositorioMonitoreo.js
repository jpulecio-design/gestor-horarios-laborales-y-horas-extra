const database = require("../../../config/database");

// Marcajes de un empleado dentro de un rango de fechas (inclusive).
function marcajesDesdeFila(fila) {
    return {
        id: fila.ID_ASISTENCIA,
        empleadoId: fila.ID_EMPLEADO,
        tipo: fila.TIPO,
        fechaHora: fila.FECHA_HORA,
        estado: fila.ESTADO
    };
}

function obtenerMarcajes(empleadoId, desde, hasta) {
    let sql =
        "SELECT id_asistencia, id_empleado, tipo, " +
        "       TO_CHAR(fecha_hora, 'YYYY-MM-DD HH24:MI:SS') AS fecha_hora, estado " +
        "FROM ASISTENCIA " +
        "WHERE id_empleado = :empleadoId " +
        "  AND fecha_hora >= TO_DATE(:desde, 'YYYY-MM-DD') " +
        "  AND fecha_hora <  TO_DATE(:hasta, 'YYYY-MM-DD') + 1 " +
        "ORDER BY fecha_hora, id_asistencia";

    return database.ejecutar(sql, { empleadoId: empleadoId, desde: desde, hasta: hasta })
        .then(function (resultado) {
            return resultado.rows.map(marcajesDesdeFila);
        });
}

// Horas extra de un empleado dentro de un rango de fechas (inclusive).
function horasExtraDesdeFila(fila) {
    return {
        id: fila.ID_HORA_EXTRA,
        empleadoId: fila.ID_EMPLEADO,
        fecha: fila.FECHA,
        tipo: fila.TIPO,
        cantidadHoras: fila.CANTIDAD_HORAS,
        valor: fila.VALOR,
        estado: fila.ESTADO
    };
}

function obtenerHorasExtra(empleadoId, desde, hasta) {
    let sql =
        "SELECT id_hora_extra, id_empleado, TO_CHAR(fecha, 'YYYY-MM-DD') AS fecha, " +
        "       tipo, cantidad_horas, valor, estado " +
        "FROM HORA_EXTRA " +
        "WHERE id_empleado = :empleadoId " +
        "  AND fecha >= TO_DATE(:desde, 'YYYY-MM-DD') " +
        "  AND fecha <= TO_DATE(:hasta, 'YYYY-MM-DD') " +
        "ORDER BY fecha, id_hora_extra";

    return database.ejecutar(sql, { empleadoId: empleadoId, desde: desde, hasta: hasta })
        .then(function (resultado) {
            return resultado.rows.map(horasExtraDesdeFila);
        });
}

module.exports = {
    obtenerMarcajes: obtenerMarcajes,
    obtenerHorasExtra: obtenerHorasExtra
};
