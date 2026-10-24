// ============================================================
// Utilidad de base de datos sin sqlplus.
//
//   node scripts/db.js crear      -> crea las tablas (db/esquema.sql)
//   node scripts/db.js datos      -> inserta los datos de ejemplo (db/datos.sql)
//   node scripts/db.js reiniciar  -> borra todo y vuelve a crear + datos
//   node scripts/db.js verificar  -> cuenta las filas de cada tabla
//
// Usa las mismas variables .env que el backend (DB_USER, DB_PASSWORD,
// DB_CONNECT_STRING). Requiere que el servidor Oracle este levantado.
// ============================================================

require("dotenv").config({ quiet: true });

const fs = require("fs");
const path = require("path");

const database = require("../src/config/database");

const { hashearContrasenas } = require("./hashear-contrasenas");

const CARPETA_DB = path.join(__dirname, "..", "db");

// Quita comentarios de linea (--) y separa por punto y coma.
function dividirSql(texto) {
    let sinComentarios = texto
        .split(/\r?\n/)
        .map(function (linea) { return linea.replace(/--.*$/, ""); })
        .join("\n");

    return sinComentarios
        .split(";")
        .map(function (s) { return s.trim(); })
        .filter(function (s) { return s.length > 0; });
}

// Errores que significan "ya estaba hecho" y no deben detener el script.
function esErrorIgnorable(error) {
    return error.errorNum === 955    // nombre ya usado (tabla/indice ya existe)
        || error.errorNum === 942    // tabla o vista no existe (al borrar)
        || error.errorNum === 1430;  // columna ya existe
}

async function ejecutarArchivo(nombreArchivo, ignorarExistentes) {
    let ruta = path.join(CARPETA_DB, nombreArchivo);
    let sentencias = dividirSql(fs.readFileSync(ruta, "utf8"));

    let conexion = await database.getConnection();
    let ejecutadas = 0;

    try {
        for (let i = 0; i < sentencias.length; i++) {
            try {
                await conexion.execute(sentencias[i], {}, { autoCommit: true });
                ejecutadas++;
            } catch (error) {
                if (ignorarExistentes && esErrorIgnorable(error)) {
                    continue;
                }
                throw error;
            }
        }
    } finally {
        await conexion.close();
    }

    console.log("  " + nombreArchivo + ": " + ejecutadas + " sentencia(s) ejecutada(s).");
}

async function hayDatos() {
    let resultado = await database.ejecutar("SELECT COUNT(*) AS total FROM EMPLEADO", {});
    return resultado.rows[0].TOTAL > 0;
}

async function verificar() {
    let tablas = [
        "EMPLEADO", "CONTACTO_EMERGENCIA", "TURNO", "ASIGNACION_HORARIO",
        "ASISTENCIA", "HORA_EXTRA", "NOMINA"
    ];
    console.log("\nConteo de filas:");
    for (let i = 0; i < tablas.length; i++) {
        let resultado = await database.ejecutar(
            "SELECT COUNT(*) AS total FROM " + tablas[i], {}
        );
        console.log("  " + tablas[i].padEnd(22) + resultado.rows[0].TOTAL);
    }
}

async function main() {
    let comando = (process.argv[2] || "instalar").toLowerCase();
    let forzar = process.argv.indexOf("--force") !== -1;

    if (comando === "crear" || comando === "instalar") {
        console.log("Creando tablas...");
        await ejecutarArchivo("esquema.sql", true);
    }

    if (comando === "datos" || comando === "instalar") {
        if (await hayDatos()) {
            if (!forzar) {
                console.log("Ya existen empleados: se omite la carga de datos (usa --force para forzar).");
            } else {
                console.log("Insertando datos de ejemplo (forzado)...");
                await ejecutarArchivo("datos.sql", false);
            }
        } else {
            console.log("Insertando datos de ejemplo...");
            await ejecutarArchivo("datos.sql", false);
        }
    }

    if (comando === "reiniciar") {
        console.log("Borrando tablas...");
        await ejecutarArchivo("reiniciar.sql", true);
        console.log("Creando tablas...");
        await ejecutarArchivo("esquema.sql", true);
        console.log("Insertando datos de ejemplo...");
        await ejecutarArchivo("datos.sql", false);
    }

    if (comando === "datos" || comando === "instalar" || comando === "reiniciar") {
        const migradas = await hashearContrasenas();
        if (migradas > 0) {
            console.log("Contrasenas migradas a hash scrypt: " + migradas + ".");
        }
    }

    if (comando === "verificar") {
        await verificar();
    }

    if (["crear", "datos", "instalar", "reiniciar", "verificar"].indexOf(comando) === -1) {
        console.log("Comando desconocido: " + comando);
        console.log("Usa: crear | datos | reiniciar | verificar");
        process.exitCode = 1;
        return;
    }

    console.log("\nListo.");
}

main()
    .catch(function (error) {
        console.error("\nERROR: " + error.message);
        process.exitCode = 1;
    })
    .finally(function () {
        return database.cerrar();
    });
