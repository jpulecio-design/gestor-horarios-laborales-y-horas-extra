require("dotenv").config({ quiet: true });

const repositorio = require("../repositorios/repositorioBackups");
const controlador = require("../controladores/controladorBackups");
const regla = require("../servicios/reglaBackups");

const INTERVALO_REVISION_MS = 60 * 60 * 1000;

let enEjecucion = false;

function verificarYEjecutar(ahora) {
    if (ahora === undefined) {
        ahora = new Date();
    }

    if (enEjecucion) {
        return Promise.resolve({ ejecutado: false, motivo: "Ya hay un backup automático en curso." });
    }
    enEjecucion = true;

    return repositorio.obtenerUltimoExitoso()
        .then(function (ultimo) {
            let fechaUltimo = null;
            if (ultimo !== null) {
                fechaUltimo = regla.textoAFecha(ultimo.fechaHora);
            }

            if (!regla.necesitaBackup(fechaUltimo, ahora)) {
                return {
                    ejecutado: false,
                    motivo: "Aún no toca: el último respaldo es del " + ultimo.fechaHora + "."
                };
            }

            console.log("[Backup automático] Han pasado " + regla.DIAS_ENTRE_BACKUPS +
                " días o más (o no hay respaldos). Generando...");

            return controlador.generarBackupAutomatico()
                .then(function (resultado) {
                    return { ejecutado: true, motivo: resultado.mensaje, resultado: resultado };
                });
        })
        .catch(function (error) {
            console.log("[Backup automático] No se pudo verificar el último respaldo: " + error.message);
            return { ejecutado: false, motivo: error.message };
        })
        .finally(function () {
            enEjecucion = false;
        });
}

function iniciar() {
    if (process.env.BACKUP_AUTOMATICO === "false") {
        console.log("[Backup automático] Desactivado (BACKUP_AUTOMATICO=false).");
        return null;
    }

    console.log("[Backup automático] Activo: se revisa al arrancar y cada hora (RN24: cada " +
        regla.DIAS_ENTRE_BACKUPS + " días).");

    module.exports.verificarYEjecutar();

    let temporizador = setInterval(function () {
        module.exports.verificarYEjecutar();
    }, INTERVALO_REVISION_MS);

    temporizador.unref();

    return temporizador;
}

module.exports = {
    INTERVALO_REVISION_MS: INTERVALO_REVISION_MS,
    verificarYEjecutar: verificarYEjecutar,
    iniciar: iniciar
};
