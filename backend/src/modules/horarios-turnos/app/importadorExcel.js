const ExcelJS = require("exceljs");

const COLUMNAS = ["empleadoId", "fecha", "horaEntrada", "horaSalida", "tipoTurno"];

function archivoInvalido(mensaje) {
    let error = new Error(mensaje);
    error.esArchivoInvalido = true;
    return error;
}

function dosDigitos(n) {
    return String(n).padStart(2, "0");
}

function textoFecha(valor) {
    if (valor instanceof Date) {
        return valor.getUTCFullYear() + "-" + dosDigitos(valor.getUTCMonth() + 1) + "-" + dosDigitos(valor.getUTCDate());
    }
    return null;
}

function textoHora(valor) {
    if (valor instanceof Date) {
        return dosDigitos(valor.getUTCHours()) + ":" + dosDigitos(valor.getUTCMinutes());
    }
    if (typeof valor === "number" && valor >= 0 && valor < 1) {
        let minutos = Math.round(valor * 24 * 60);
        return dosDigitos(Math.floor(minutos / 60)) + ":" + dosDigitos(minutos % 60);
    }
    return null;
}

function textoDeCelda(celda, columna) {
    let valor = celda.value;
    if (columna === "fecha" && textoFecha(valor) !== null) {
        return textoFecha(valor);
    }
    if ((columna === "horaEntrada" || columna === "horaSalida") && textoHora(valor) !== null) {
        return textoHora(valor);
    }
    return celda.text === undefined || celda.text === null ? "" : String(celda.text).trim();
}

async function leerFilas(buffer) {
    let libro = new ExcelJS.Workbook();
    try {
        await libro.xlsx.load(buffer);
    } catch (error) {
        throw archivoInvalido("No se pudo leer el archivo Excel: " + error.message);
    }

    let hoja = libro.worksheets[0];
    if (!hoja) {
        throw archivoInvalido("El archivo Excel no tiene hojas.");
    }

    let encabezados = {};
    hoja.getRow(1).eachCell(function (celda, indice) {
        let nombre = String(celda.text || "").trim().toLowerCase();
        let columna = COLUMNAS.find(function (c) { return c.toLowerCase() === nombre; });
        if (columna !== undefined) {
            encabezados[columna] = { indice: indice, letra: celda.address.replace(/\d+/g, "") };
        }
    });

    let letras = {};
    Object.keys(encabezados).forEach(function (c) { letras[c] = encabezados[c].letra; });

    let faltantes = COLUMNAS.filter(function (c) { return !encabezados[c]; });
    if (faltantes.length > 0) {
        return {
            filas: [],
            letras: letras,
            errores: [{ fila: 1, columna: "-", mensaje: "Faltan las columnas obligatorias: " + faltantes.join(", ") +
                ". La fila 1 debe tener: " + COLUMNAS.join(", ") + "." }]
        };
    }

    let filas = [];
    hoja.eachRow(function (fila, numero) {
        if (numero === 1) {
            return;
        }
        let datos = { fila: numero };
        COLUMNAS.forEach(function (c) {
            datos[c] = textoDeCelda(fila.getCell(encabezados[c].indice), c);
        });
        if (COLUMNAS.every(function (c) { return datos[c] === ""; })) {
            return;
        }
        filas.push(datos);
    });

    let errores = [];
    if (filas.length === 0) {
        errores.push({ fila: 2, columna: "-", mensaje: "El archivo no tiene filas de datos." });
    }

    return { filas: filas, errores: errores, letras: letras };
}

module.exports = {
    COLUMNAS: COLUMNAS,
    leerFilas: leerFilas
};
