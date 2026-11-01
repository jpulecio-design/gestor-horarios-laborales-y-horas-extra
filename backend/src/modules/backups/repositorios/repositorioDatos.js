const database = require("../../../config/database");

// Tablas de db/esquema.sql que entran en el respaldo (BACKUP_HISTORIAL no,
// porque es el propio registro de los respaldos).
const TABLAS_RESPALDO = [
    { nombre: "EMPLEADO", pk: "ID_EMPLEADO" },
    { nombre: "CONTACTO_EMERGENCIA", pk: "ID_CONTACTO" },
    { nombre: "TURNO", pk: "ID_TURNO" },
    { nombre: "ASIGNACION_HORARIO", pk: "ID_ASIGNACION" },
    { nombre: "HORARIO_ASIGNADO", pk: "ID_HORARIO" },
    { nombre: "SOLICITUD_RELEVO", pk: "ID_SOLICITUD" },
    { nombre: "ASISTENCIA", pk: "ID_ASISTENCIA" },
    { nombre: "HORA_EXTRA", pk: "ID_HORA_EXTRA" },
    { nombre: "NOMINA", pk: "ID_NOMINA" }
];

function buscarTabla(nombre) {
    for (let i = 0; i < TABLAS_RESPALDO.length; i++) {
        if (TABLAS_RESPALDO[i].nombre === nombre) {
            return TABLAS_RESPALDO[i];
        }
    }
    return null;
}

function leerTabla(nombre) {
    let tabla = buscarTabla(nombre);

    if (tabla === null) {
        return Promise.reject(new Error("La tabla " + nombre + " no está permitida en el respaldo."));
    }

    let sql = "SELECT * FROM " + tabla.nombre + " ORDER BY " + tabla.pk;

    return database.ejecutar(sql, {})
        .then(function (resultado) {
            return resultado.rows;
        });
}

function leerTodasLasTablas() {
    let tablas = {};

    function leerDesde(i) {
        if (i === TABLAS_RESPALDO.length) {
            return Promise.resolve(tablas);
        }

        let tabla = TABLAS_RESPALDO[i];

        return module.exports.leerTabla(tabla.nombre)
            .then(function (filas) {
                tablas[tabla.nombre] = { pk: tabla.pk, filas: filas };
                return leerDesde(i + 1);
            });
    }

    return leerDesde(0);
}

module.exports = {
    TABLAS_RESPALDO: TABLAS_RESPALDO,
    leerTabla: leerTabla,
    leerTodasLasTablas: leerTodasLasTablas
};
