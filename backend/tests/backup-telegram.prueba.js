const path = require("path");

const controlador = require("../src/modules/backups/controladores/controladorBackups");

let modo = process.argv[2];

if (modo !== "exito" && modo !== "fallo") {
    console.log("Indica el modo: node tests/backup-telegram.prueba.js exito   (o  fallo)");
    process.exitCode = 1;
    return;
}

if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) {
    console.log("Falta TELEGRAM_BOT_TOKEN o TELEGRAM_CHAT_ID en el archivo .env.");
    console.log("Primero prueba la conexión con:  node tests/telegram.prueba.js");
    process.exitCode = 1;
    return;
}

if (modo === "fallo") {
    process.env.BACKUP_DIR = path.join(__filename, "no_es_una_carpeta");
    console.log("Simulando FA1: los 3 intentos van a fallar (espera 2 s entre intentos)...");
} else {
    console.log("Generando un backup automático real...");
}

controlador.generarBackupAutomatico({ esperaMs: 2000 })
    .then(function (resultado) {
        console.log("\nResultado: " + resultado.mensaje);
        console.log(resultado.notificado
            ? "Revisa tu Telegram: debe haber llegado el aviso."
            : "El aviso de Telegram NO se pudo enviar (revisa el mensaje de arriba).");
        process.exitCode = resultado.notificado ? 0 : 1;
    })
    .catch(function (error) {
        console.log("ERROR: " + error.message);
        process.exitCode = 1;
    });
