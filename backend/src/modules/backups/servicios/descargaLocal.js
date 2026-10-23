require("dotenv").config({ quiet: true });

const fs = require("fs");
const os = require("os");
const path = require("path");

function carpetaDescargas() {
    if (process.env.CARPETA_DESCARGAS) {
        return path.resolve(process.env.CARPETA_DESCARGAS);
    }
    return path.join(os.homedir(), "Downloads");
}

function rutaSinRepetir(carpeta, nombreArchivo) {
    let extension = path.extname(nombreArchivo);
    let base = path.basename(nombreArchivo, extension);
    let ruta = path.join(carpeta, nombreArchivo);
    let numero = 1;

    while (fs.existsSync(ruta)) {
        ruta = path.join(carpeta, base + " (" + numero + ")" + extension);
        numero = numero + 1;
    }

    return ruta;
}

module.exports = {
    carpetaDescargas: carpetaDescargas,
    rutaSinRepetir: rutaSinRepetir
};
