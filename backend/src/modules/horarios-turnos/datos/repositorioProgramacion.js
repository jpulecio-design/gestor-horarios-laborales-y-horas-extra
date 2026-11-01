const database = require("../../../config/database");

// Programacion diaria (CU04) sobre la tabla HORARIO_ASIGNADO:
//   id_horario, id_empleado, id_plantilla_origen, fecha,
//   hora_entrada_prog, hora_salida_prog, tipo_turno
// Regla del modulo: un turno por empleado y fecha. Guardar una fecha que ya
// existe la ACTUALIZA (no crea un duplicado).

const COLUMNAS =
    "id_horario, id_empleado, TO_CHAR(fecha, 'YYYY-MM-DD') AS fecha, " +
    "hora_entrada_prog, hora_salida_prog, tipo_turno";

function diaDesdeFila(fila) {
    return {
        id: fila.ID_HORARIO,
        empleadoId: fila.ID_EMPLEADO,
        fecha: fila.FECHA,
        horaEntrada: fila.HORA_ENTRADA_PROG,
        horaSalida: fila.HORA_SALIDA_PROG,
        tipoTurno: fila.TIPO_TURNO
    };
}

// Dias programados de un empleado entre dos fechas "AAAA-MM-DD" (inclusive).
function obtenerPorEmpleadoEntre(empleadoId, desde, hasta) {
    let sql =
        "SELECT " + COLUMNAS + " FROM HORARIO_ASIGNADO " +
        "WHERE id_empleado = :empleadoId " +
        "  AND fecha BETWEEN TO_DATE(:desde, 'YYYY-MM-DD') AND TO_DATE(:hasta, 'YYYY-MM-DD') " +
        "ORDER BY fecha, hora_entrada_prog";

    return database.ejecutar(sql, { empleadoId: empleadoId, desde: desde, hasta: hasta })
        .then(function (resultado) {
            return resultado.rows.map(diaDesdeFila);
        });
}

// Guarda una lista de dias [{ empleadoId, fecha, horaEntrada, horaSalida, tipoTurno }]
// en UNA transaccion se guardan todos o ninguno 
// Devuelve { insertados, actualizados }.
function guardarDias(dias) {
    let sqlActualizar =
        "UPDATE HORARIO_ASIGNADO SET " +
        "  hora_entrada_prog = :horaEntrada, hora_salida_prog = :horaSalida, tipo_turno = :tipoTurno " +
        "WHERE id_empleado = :empleadoId AND fecha = TO_DATE(:fecha, 'YYYY-MM-DD')";

    let sqlInsertar =
        "INSERT INTO HORARIO_ASIGNADO " +
        "  (id_empleado, fecha, hora_entrada_prog, hora_salida_prog, tipo_turno) " +
        "VALUES (:empleadoId, TO_DATE(:fecha, 'YYYY-MM-DD'), :horaEntrada, :horaSalida, :tipoTurno)";

    return database.transaccion(async function (ejecutarEn) {
        let insertados = 0;
        let actualizados = 0;

        for (let i = 0; i < dias.length; i++) {
            let d = dias[i];
            let parametros = {
                empleadoId: d.empleadoId,
                fecha: d.fecha,
                horaEntrada: d.horaEntrada,
                horaSalida: d.horaSalida,
                tipoTurno: d.tipoTurno
            };

            let resultado = await ejecutarEn(sqlActualizar, parametros);
            if (resultado.rowsAffected > 0) {
                actualizados = actualizados + 1;
            } else {
                await ejecutarEn(sqlInsertar, parametros);
                insertados = insertados + 1;
            }
        }

        return { insertados: insertados, actualizados: actualizados };
    });
}

// Quita el turno de un dia (queda como descanso). Devuelve true si habia algo que borrar.
function eliminarDia(empleadoId, fecha) {
    let sql =
        "DELETE FROM HORARIO_ASIGNADO " +
        "WHERE id_empleado = :empleadoId AND fecha = TO_DATE(:fecha, 'YYYY-MM-DD')";

    return database.ejecutar(sql, { empleadoId: empleadoId, fecha: fecha })
        .then(function (resultado) {
            return resultado.rowsAffected > 0;
        });
}

module.exports = {
    obtenerPorEmpleadoEntre: obtenerPorEmpleadoEntre,
    guardarDias: guardarDias,
    eliminarDia: eliminarDia
};
