const database = require("../../../config/database");

const COLUMNAS =
    "id_nomina, id_empleado, periodo, horas_recargo_nocturno, horas_recargo_festivo, " +
    "salario_base, valor_hora, pago_recargo_nocturno, pago_recargo_festivo, " +
    "pago_horas_extra, total_devengado, salud, pension, total_deducciones, " +
    "neto_pagar, estado, TO_CHAR(fecha_creacion, 'YYYY-MM-DD HH24:MI') AS fecha_creacion";

// Convierte una fila de Oracle (columnas en mayuscula) en el objeto nomina.
function crearDesdeFila(fila) {
    return {
        id: fila.ID_NOMINA,
        empleadoId: fila.ID_EMPLEADO,
        periodo: fila.PERIODO,
        horasRecargoNocturno: fila.HORAS_RECARGO_NOCTURNO,
        horasRecargoFestivo: fila.HORAS_RECARGO_FESTIVO,
        salarioBase: fila.SALARIO_BASE,
        valorHora: fila.VALOR_HORA,
        pagoRecargoNocturno: fila.PAGO_RECARGO_NOCTURNO,
        pagoRecargoFestivo: fila.PAGO_RECARGO_FESTIVO,
        pagoHorasExtra: fila.PAGO_HORAS_EXTRA,
        totalDevengado: fila.TOTAL_DEVENGADO,
        salud: fila.SALUD,
        pension: fila.PENSION,
        totalDeducciones: fila.TOTAL_DEDUCCIONES,
        netoPagar: fila.NETO_PAGAR,
        estado: fila.ESTADO,
        fechaCreacion: fila.FECHA_CREACION
    };
}

// Inserta una nomina y devuelve la fila guardada (con su id de Oracle).
function agregarNomina(datos) {
    let sql =
        "INSERT INTO NOMINA " +
        "  (id_empleado, periodo, horas_recargo_nocturno, horas_recargo_festivo, " +
        "   salario_base, valor_hora, pago_recargo_nocturno, pago_recargo_festivo, " +
        "   pago_horas_extra, total_devengado, salud, pension, total_deducciones, neto_pagar) " +
        "VALUES " +
        "  (:empleadoId, :periodo, :horasRecargoNocturno, :horasRecargoFestivo, " +
        "   :salarioBase, :valorHora, :pagoRecargoNocturno, :pagoRecargoFestivo, " +
        "   :pagoHorasExtra, :totalDevengado, :salud, :pension, :totalDeducciones, :netoPagar) " +
        "RETURNING id_nomina INTO :id";

    let parametros = {
        empleadoId: datos.empleadoId,
        periodo: datos.periodo,
        horasRecargoNocturno: datos.horasRecargoNocturno,
        horasRecargoFestivo: datos.horasRecargoFestivo,
        salarioBase: datos.salarioBase,
        valorHora: datos.valorHora,
        pagoRecargoNocturno: datos.pagoRecargoNocturno,
        pagoRecargoFestivo: datos.pagoRecargoFestivo,
        pagoHorasExtra: datos.pagoHorasExtra,
        totalDevengado: datos.totalDevengado,
        salud: datos.salud,
        pension: datos.pension,
        totalDeducciones: datos.totalDeducciones,
        netoPagar: datos.netoPagar,
        id: { dir: database.oracledb.BIND_OUT, type: database.oracledb.NUMBER }
    };

    return database.ejecutar(sql, parametros)
        .then(function (resultado) {
            return buscarPorId(resultado.outBinds.id[0]);
        });
}

// devuelve una promesa con todas las nominas
function obtenerTodas() {
    let sql = "SELECT " + COLUMNAS + " FROM NOMINA ORDER BY id_nomina";

    return database.ejecutar(sql, {})
        .then(function (resultado) {
            return resultado.rows.map(crearDesdeFila);
        });
}

// devuelve una promesa con la nomina de ese id o null si no existe
function buscarPorId(id) {
    let sql = "SELECT " + COLUMNAS + " FROM NOMINA WHERE id_nomina = :id";

    return database.ejecutar(sql, { id: id })
        .then(function (resultado) {
            if (resultado.rows.length === 0) {
                return null;
            }
            return crearDesdeFila(resultado.rows[0]);
        });
}

// devuelve una promesa con todas las nominas de un empleado
function obtenerPorEmpleado(empleadoId) {
    let sql =
        "SELECT " + COLUMNAS + " FROM NOMINA " +
        "WHERE id_empleado = :empleadoId ORDER BY id_nomina";

    return database.ejecutar(sql, { empleadoId: empleadoId })
        .then(function (resultado) {
            return resultado.rows.map(crearDesdeFila);
        });
}

// devuelve una promesa con true si ya existe una nomina de ese empleado en ese periodo
function existePeriodoEmpleado(empleadoId, periodo) {
    let sql =
        "SELECT COUNT(*) AS total FROM NOMINA " +
        "WHERE id_empleado = :empleadoId AND periodo = :periodo";

    return database.ejecutar(sql, { empleadoId: empleadoId, periodo: periodo })
        .then(function (resultado) {
            return resultado.rows[0].TOTAL > 0;
        });
}

module.exports = {
    agregarNomina: agregarNomina,
    obtenerTodas: obtenerTodas,
    buscarPorId: buscarPorId,
    obtenerPorEmpleado: obtenerPorEmpleado,
    existePeriodoEmpleado: existePeriodoEmpleado
};
