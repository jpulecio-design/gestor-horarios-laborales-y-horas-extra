const ExcelJS = require("exceljs");

const repositorio = require("../datos/repositorioReportes");
const reportes = require("../dominio/reportes");

const FORMATO_FECHA = /^\d{4}-\d{2}-\d{2}$/;

const HOJAS = {
    resumen: {
        nombre: "Resumen",
        encabezados: ["Id", "Empleado", "Días", "Horas trabajadas", "Jornadas incompletas",
            "Horas extra", "Valor horas extra", "Total horas"],
        anchos: [8, 28, 8, 16, 20, 12, 18, 12]
    },
    horasExtra: {
        nombre: "Horas extra",
        encabezados: ["Id", "Empleado", "Fecha", "Tipo", "Cantidad horas", "Valor"],
        anchos: [8, 28, 12, 12, 16, 14]
    },
    asistencia: {
        nombre: "Asistencia",
        encabezados: ["Id", "Empleado", "Fecha", "Entrada", "Salida", "Horas", "Completa"],
        anchos: [8, 28, 12, 10, 10, 8, 10]
    }
};

// Valida el periodo; devuelve un mensaje de error o null si esta bien.
function validarPeriodo(desde, hasta) {
    if (!FORMATO_FECHA.test(desde || "")) {
        return "ERROR: la fecha desde es obligatoria (AAAA-MM-DD).";
    }
    if (!FORMATO_FECHA.test(hasta || "")) {
        return "ERROR: la fecha hasta es obligatoria (AAAA-MM-DD).";
    }
    if (hasta < desde) {
        return "ERROR: la fecha hasta no puede ser anterior a la fecha desde.";
    }
    return null;
}

// Junta marcajes y horas extra de todos los empleados en el periodo.
async function reunirDatos(desde, hasta) {
    let empleados = await repositorio.obtenerEmpleados();
    let datos = [];

    for (let i = 0; i < empleados.length; i++) {
        let empleado = empleados[i];
        let id = empleado.usuario.id;

        let marcajes = await repositorio.obtenerMarcajes(id, desde, hasta);
        let extras = await repositorio.obtenerHorasExtra(id, desde, hasta);

        datos.push({
            empleado: { id: id, nombre: empleado.usuario.nombre, apellido: empleado.usuario.apellido },
            marcajes: marcajes,
            extras: extras
        });
    }

    return datos;
}

function agregarHoja(libro, config, filas) {
    let hoja = libro.addWorksheet(config.nombre);

    hoja.columns = config.encabezados.map(function (titulo, i) {
        return { header: titulo, key: "c" + i, width: config.anchos[i] };
    });

    for (let i = 0; i < filas.length; i++) {
        hoja.addRow(filas[i]);
    }

    hoja.getRow(1).font = { bold: true };
    return hoja;
}

// Construye el libro de Excel (3 hojas) para el periodo.
async function construirLibro(desde, hasta) {
    let datos = await reunirDatos(desde, hasta);

    let libro = new ExcelJS.Workbook();
    libro.creator = "Gestor de horarios y horas extra";
    libro.created = new Date();

    let resumen = reportes.filasResumen(datos);
    let horasExtra = reportes.filasHorasExtra(datos);
    let asistencia = reportes.filasAsistencia(datos);

    agregarHoja(libro, HOJAS.resumen, resumen);
    agregarHoja(libro, HOJAS.horasExtra, horasExtra);
    agregarHoja(libro, HOJAS.asistencia, asistencia);

    return {
        libro: libro,
        conteos: {
            empleados: resumen.length,
            horasExtra: horasExtra.length,
            jornadas: asistencia.length
        }
    };
}

// Genera el reporte en .xlsx.
// devuelve { exito:true, datos:{ buffer, nombreArchivo, conteos } } o { exito:false, mensaje }.
async function exportarReporte(desde, hasta) {
    let error = validarPeriodo(desde, hasta);
    if (error !== null) {
        return { exito: false, mensaje: error };
    }

    let construido = await construirLibro(desde, hasta);
    let buffer = await construido.libro.xlsx.writeBuffer();

    return {
        exito: true,
        datos: {
            buffer: buffer,
            nombreArchivo: "reporte-" + desde + "_a_" + hasta + ".xlsx",
            conteos: construido.conteos
        }
    };
}

module.exports = {
    validarPeriodo: validarPeriodo,
    construirLibro: construirLibro,
    exportarReporte: exportarReporte
};
