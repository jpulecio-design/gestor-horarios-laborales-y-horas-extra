// Dominio de reportes (CU13): arma las filas (sin saber de Excel) para cada hoja.
// Funciones puras: reciben los datos ya leidos y no tocan la base de datos.

const monitoreo = require("../../monitoreo/dominio/monitoreo");

function redondear(valor) {
    return Math.round(valor * 100) / 100;
}

function nombreCompleto(empleado) {
    return (String(empleado.nombre) + " " + String(empleado.apellido)).trim();
}

// Cada elemento de "datos" es { empleado:{id,nombre,apellido}, marcajes, extras }.

// Hoja 1: resumen por empleado.
function filasResumen(datos) {
    return datos.map(function (d) {
        let a = monitoreo.resumirAsistencia(d.marcajes);
        let h = monitoreo.resumirHorasExtra(d.extras);

        return [
            d.empleado.id,
            nombreCompleto(d.empleado),
            a.dias,
            a.horasTrabajadas,
            a.jornadasIncompletas,
            h.totalHoras,
            h.totalValor,
            redondear(a.horasTrabajadas + h.totalHoras)
        ];
    });
}

// Hoja 2: detalle de horas extra del periodo.
function filasHorasExtra(datos) {
    let filas = [];

    for (let i = 0; i < datos.length; i++) {
        let d = datos[i];

        for (let j = 0; j < d.extras.length; j++) {
            let h = d.extras[j];
            filas.push([
                d.empleado.id,
                nombreCompleto(d.empleado),
                h.fecha,
                h.tipo,
                h.cantidadHoras,
                h.valor
            ]);
        }
    }

    return filas;
}

// Hoja 3: detalle de jornadas (asistencia) del periodo.
function filasAsistencia(datos) {
    let filas = [];

    for (let i = 0; i < datos.length; i++) {
        let d = datos[i];
        let a = monitoreo.resumirAsistencia(d.marcajes);

        for (let j = 0; j < a.detalle.length; j++) {
            let jornada = a.detalle[j];
            filas.push([
                d.empleado.id,
                nombreCompleto(d.empleado),
                jornada.fecha,
                jornada.entrada === null ? "" : jornada.entrada.slice(11),
                jornada.salida === null ? "" : jornada.salida.slice(11),
                redondear(jornada.minutos / 60),
                jornada.completa ? "Sí" : "No"
            ]);
        }
    }

    return filas;
}

module.exports = {
    filasResumen: filasResumen,
    filasHorasExtra: filasHorasExtra,
    filasAsistencia: filasAsistencia
};
