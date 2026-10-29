require("dotenv").config({ quiet: true });

const fs = require("fs");
const path = require("path");

const repositorioDatos = require("../repositorios/repositorioDatos");

const VERSION_FORMATO = 1;

function carpetaRespaldos() {
    if (process.env.BACKUP_DIR) {
        return path.resolve(process.env.BACKUP_DIR);
    }
    return path.join(__dirname, "..", "..", "..", "..", "respaldos");
}

function dosDigitos(numero) {
    return String(numero).padStart(2, "0");
}

function nombreParaFecha(fecha) {
    return "backup_" +
        fecha.getFullYear() + dosDigitos(fecha.getMonth() + 1) + dosDigitos(fecha.getDate()) + "_" +
        dosDigitos(fecha.getHours()) + dosDigitos(fecha.getMinutes()) + dosDigitos(fecha.getSeconds()) +
        ".json";
}

function rutaDeArchivo(nombreArchivo) {
    return path.join(carpetaRespaldos(), path.basename(nombreArchivo));
}

function verificarEspacio(carpeta, bytesNecesarios) {
    return fs.promises.statfs(carpeta)
        .then(function (info) {
            let bytesLibres = info.bavail * info.bsize;

            if (bytesLibres < bytesNecesarios * 2) {
                throw new Error(
                    "Espacio insuficiente en disco: se necesitan " + bytesNecesarios +
                    " bytes y hay " + bytesLibres + " libres."
                );
            }
        });
}

function generarArchivo() {
    let carpeta = carpetaRespaldos();
    let ahora = new Date();
    let nombreArchivo = nombreParaFecha(ahora);
    let contenido = null;

    return repositorioDatos.leerTodasLasTablas()
        .then(function (tablas) {
            contenido = JSON.stringify({
                fechaGeneracion: ahora.toISOString(),
                version: VERSION_FORMATO,
                tablas: tablas
            }, null, 2);

            return fs.promises.mkdir(carpeta, { recursive: true });
        })
        .then(function () {
            return verificarEspacio(carpeta, Buffer.byteLength(contenido));
        })
        .then(function () {
            return fs.promises.writeFile(path.join(carpeta, nombreArchivo), contenido, "utf8");
        })
        .then(function () {
            return {
                nombreArchivo: nombreArchivo,
                tamanoBytes: Buffer.byteLength(contenido)
            };
        });
}

function leerArchivo(nombreArchivo) {
    return fs.promises.readFile(rutaDeArchivo(nombreArchivo), "utf8")
        .then(function (texto) {
            return JSON.parse(texto);
        });
}

module.exports = {
    carpetaRespaldos: carpetaRespaldos,
    rutaDeArchivo: rutaDeArchivo,
    generarArchivo: generarArchivo,
    leerArchivo: leerArchivo
};
