const ExcelJS = require("exceljs");

const comparador = require("./comparadorBackup");
const regla = require("./reglaBackups");

const FORMATO_FECHA_ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

const MAX_NOMBRE_HOJA = 31;

function valorParaCelda(valor) {
    if (valor === null || valor === undefined) {
        return "";
    }
    if (typeof valor === "string" && FORMATO_FECHA_ISO.test(valor)) {
        return regla.fechaATexto(new Date(valor));
    }
    return valor;
}

function columnasDe(filas) {
    let columnas = [];
    for (let i = 0; i < filas.length; i++) {
        for (let campo in filas[i]) {
            if (columnas.indexOf(campo) === -1 && comparador.CAMPOS_OCULTOS.indexOf(campo) === -1) {
                columnas.push(campo);
            }
        }
    }
    return columnas;
}

function darFormatoEncabezado(hoja) {
    let encabezado = hoja.getRow(1);
    encabezado.font = { bold: true, color: { argb: "FFFFFFFF" } };
    encabezado.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1F4E79" } };
    hoja.views = [{ state: "frozen", ySplit: 1 }];
}

function agregarHojaResumen(libro, contenido, nombreArchivo) {
    let hoja = libro.addWorksheet("Resumen");
    hoja.columns = [
        { header: "Tabla", key: "tabla", width: 28 },
        { header: "Registros", key: "registros", width: 12 }
    ];

    let nombres = Object.keys(contenido.tablas);
    for (let i = 0; i < nombres.length; i++) {
        hoja.addRow({ tabla: nombres[i], registros: contenido.tablas[nombres[i]].filas.length });
    }
    darFormatoEncabezado(hoja);

    hoja.addRow([]);
    hoja.addRow(["Archivo de respaldo", nombreArchivo]);
    hoja.addRow(["Fecha del respaldo", valorParaCelda(contenido.fechaGeneracion)]);
    hoja.addRow(["Nota", "Por seguridad, las contraseñas no se incluyen en este Excel."]);
}

function agregarHojaTabla(libro, nombre, tabla) {
    let hoja = libro.addWorksheet(nombre.slice(0, MAX_NOMBRE_HOJA));
    let columnas = columnasDe(tabla.filas);

    if (columnas.length === 0) {
        hoja.addRow(["Sin registros en el momento del respaldo."]);
        return;
    }

    hoja.columns = columnas.map(function (campo) {
        return { header: campo, key: campo, width: Math.max(12, campo.length + 2) };
    });

    for (let i = 0; i < tabla.filas.length; i++) {
        let fila = {};
        for (let j = 0; j < columnas.length; j++) {
            fila[columnas[j]] = valorParaCelda(tabla.filas[i][columnas[j]]);
        }
        hoja.addRow(fila);
    }

    darFormatoEncabezado(hoja);
}

function crearLibro(contenido, nombreArchivo) {
    let libro = new ExcelJS.Workbook();
    libro.creator = "Gestor de Horarios Laborales - Seguridad y Backups";
    libro.created = new Date(contenido.fechaGeneracion);

    agregarHojaResumen(libro, contenido, nombreArchivo);

    for (let nombre in contenido.tablas) {
        agregarHojaTabla(libro, nombre, contenido.tablas[nombre]);
    }

    return libro;
}

module.exports = {
    crearLibro: crearLibro
};
