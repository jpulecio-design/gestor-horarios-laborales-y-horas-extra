const database = require("../../../config/database");

const modeloBackup = require("../modelos/backup");

const COLUMNAS_BACKUP =
    "b.id_backup, b.nombre_archivo, b.tipo, b.estado, b.id_empleado, " +
    "b.intentos, b.tamano_bytes, b.detalle_error, e.correo AS generado_por, " +
    "TO_CHAR(b.fecha_hora, 'YYYY-MM-DD HH24:MI:SS') AS fecha_hora";

const DESDE_BACKUP =
    "FROM BACKUP_HISTORIAL b " +
    "LEFT JOIN EMPLEADO e ON e.id_empleado = b.id_empleado ";

function filasABackups(resultado) {
    let lista = [];
    for (let i = 0; i < resultado.rows.length; i++) {
        lista.push(modeloBackup.crearBackupDesdeFila(resultado.rows[i]));
    }
    return lista;
}

function obtenerTodos() {
    let sql =
        "SELECT " + COLUMNAS_BACKUP + " " + DESDE_BACKUP +
        "ORDER BY b.fecha_hora DESC, b.id_backup DESC";

    return database.ejecutar(sql, {})
        .then(filasABackups);
}

function buscarPorId(id) {
    let sql =
        "SELECT " + COLUMNAS_BACKUP + " " + DESDE_BACKUP +
        "WHERE b.id_backup = :id";

    return database.ejecutar(sql, { id: id })
        .then(function (resultado) {
            let lista = filasABackups(resultado);
            if (lista.length === 0) {
                return null;
            }
            return lista[0];
        });
}

function obtenerUltimoExitoso() {
    let sql =
        "SELECT " + COLUMNAS_BACKUP + " " + DESDE_BACKUP +
        "WHERE b.estado = 'Exitoso' " +
        "ORDER BY b.fecha_hora DESC, b.id_backup DESC " +
        "FETCH FIRST 1 ROWS ONLY";

    return database.ejecutar(sql, {})
        .then(function (resultado) {
            let lista = filasABackups(resultado);
            if (lista.length === 0) {
                return null;
            }
            return lista[0];
        });
}

function insertarBackup(datos) {
    let sql =
        "INSERT INTO BACKUP_HISTORIAL " +
        "  (nombre_archivo, tipo, estado, id_empleado, intentos, tamano_bytes, detalle_error) " +
        "VALUES " +
        "  (:nombreArchivo, :tipo, :estado, :idEmpleado, :intentos, :tamanoBytes, :detalleError) " +
        "RETURNING id_backup INTO :id";

    let parametros = {
        nombreArchivo: datos.nombreArchivo || null,
        tipo: datos.tipo,
        estado: datos.estado,
        idEmpleado: datos.idEmpleado || null,
        intentos: datos.intentos || 1,
        tamanoBytes: datos.tamanoBytes || null,
        detalleError: datos.detalleError ? String(datos.detalleError).slice(0, 255) : null,
        id: { dir: database.oracledb.BIND_OUT, type: database.oracledb.NUMBER }
    };

    return database.ejecutar(sql, parametros)
        .then(function (resultado) {
            return resultado.outBinds.id[0];
        });
}

module.exports = {
    obtenerTodos: obtenerTodos,
    buscarPorId: buscarPorId,
    obtenerUltimoExitoso: obtenerUltimoExitoso,
    insertarBackup: insertarBackup
};
