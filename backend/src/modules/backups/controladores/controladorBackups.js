const fs = require("fs");

const repositorio = require("../repositorios/repositorioBackups");

const generador = require("../servicios/generadorBackup");

const regla = require("../servicios/reglaBackups");

const repositorioDatos = require("../repositorios/repositorioDatos");

const comparador = require("../servicios/comparadorBackup");

const excel = require("../servicios/excelBackup");

const descargaLocal = require("../servicios/descargaLocal");

const mensajes = require("../servicios/mensajesBackup");

const telegram = require("../../notificaciones/telegram");

const MAX_INTENTOS_AUTOMATICO = 3;
const ESPERA_ENTRE_INTENTOS_MS = 60 * 1000;

const MENSAJE_SIN_RESPALDOS = "No hay respaldos disponibles para comparación";

function consultarEstado() {
    let estado = {};

    return repositorio.obtenerTodos()
        .then(function (historial) {
            estado.historial = historial;
            return repositorio.obtenerUltimoExitoso();
        })
        .then(function (ultimo) {
            estado.ultimoRespaldo = ultimo;
            estado.diasDesdeUltimo = null;
            estado.proximoAutomatico = "Pendiente (se generará en la próxima revisión)";

            if (ultimo !== null) {
                let ahora = new Date();
                estado.diasDesdeUltimo = regla.diasDesde(ultimo.fechaHora, ahora);

                let proximo = regla.fechaProximoBackup(regla.textoAFecha(ultimo.fechaHora));
                if (proximo > ahora) {
                    estado.proximoAutomatico = regla.fechaATexto(proximo);
                }
            }
            return estado;
        });
}

function registrarExitoso(archivo, tipo, idEmpleado, intentos) {
    return repositorio.insertarBackup({
        nombreArchivo: archivo.nombreArchivo,
        tipo: tipo,
        estado: "Exitoso",
        idEmpleado: idEmpleado,
        intentos: intentos,
        tamanoBytes: archivo.tamanoBytes
    })
        .then(function (idNuevo) {
            return repositorio.buscarPorId(idNuevo);
        });
}

function generarBackupManual(idAdministrador) {

    return generador.generarArchivo()

        .then(function (archivo) {
            return registrarExitoso(archivo, "Manual", idAdministrador, 1);
        })

        .then(function (backup) {
            console.log("Copia de seguridad generada: " + backup.nombreArchivo + ".");
            return {
                exito: true,
                mensaje: "Copia de seguridad generada con id " + backup.id + ".",
                datos: backup
            };
        })

        .catch(function (error) {
            console.log("ERROR al generar la copia de seguridad: " + error.message);

            return repositorio.insertarBackup({
                tipo: "Manual",
                estado: "Fallido",
                idEmpleado: idAdministrador,
                intentos: 1,
                detalleError: error.message
            })
                .catch(function (errorRegistro) {
                    console.log("ERROR: no se pudo registrar el fallo en el histórico: " + errorRegistro.message);
                })
                .then(function () {
                    return {
                        exito: false,
                        mensaje: "No se pudo generar la copia de seguridad: " + error.message
                    };
                });
        });
}

function esperar(ms) {
    return new Promise(function (resolver) {
        setTimeout(resolver, ms);
    });
}

function intentarGenerar(intento, opciones) {
    return generador.generarArchivo()
        .then(function (archivo) {
            return { archivo: archivo, intentos: intento };
        })
        .catch(function (error) {
            console.log("[Backup automático] Intento " + intento + " de " + opciones.maxIntentos +
                " falló: " + error.message);

            if (intento >= opciones.maxIntentos) {
                error.intentos = intento;
                throw error;
            }

            return esperar(opciones.esperaMs)
                .then(function () {
                    return intentarGenerar(intento + 1, opciones);
                });
        });
}

function registrarFalloYNotificar(error) {
    let intentos = error.intentos || 1;
    let fecha = regla.fechaATexto(new Date());

    return repositorio.insertarBackup({
        tipo: "Automatico",
        estado: "Fallido",
        intentos: intentos,
        detalleError: error.message
    })
        .catch(function (errorRegistro) {
            console.log("ERROR: no se pudo registrar el fallo en el histórico: " + errorRegistro.message);
        })
        .then(function () {
            return telegram.enviarMensaje("", mensajes.armarMensajeFallo(fecha, intentos, error.message));
        })
        .catch(function () {
            return false;
        })
        .then(function (notificado) {
            if (!notificado) {
                console.log("ERROR: no se pudo avisar al administrador por Telegram.");
            }
            return {
                exito: false,
                mensaje: "No se pudo generar el backup automático después de " + intentos +
                    " intento(s): " + error.message,
                intentos: intentos,
                notificado: notificado === true
            };
        });
}

function generarBackupAutomatico(opciones) {
    opciones = Object.assign({
        maxIntentos: MAX_INTENTOS_AUTOMATICO,
        esperaMs: ESPERA_ENTRE_INTENTOS_MS
    }, opciones);

    let intentos = 1;

    return intentarGenerar(1, opciones)

        .then(function (resultado) {
            intentos = resultado.intentos;
            return registrarExitoso(resultado.archivo, "Automatico", null, intentos);
        })

        .then(function (backup) {
            console.log("Backup automático generado: " + backup.nombreArchivo +
                " (intento " + intentos + ").");

            return telegram.enviarMensaje("", mensajes.armarMensajeExito(backup))
                .catch(function () {
                    return false;
                })
                .then(function (notificado) {
                    if (!notificado) {
                        console.log("AVISO: no se pudo notificar el backup por Telegram.");
                    }
                    return {
                        exito: true,
                        mensaje: "Backup automático generado con id " + backup.id + " en " + intentos + " intento(s).",
                        datos: backup,
                        notificado: notificado === true
                    };
                });
        })

        .catch(function (error) {
            console.log("ERROR en el backup automático: " + error.message);
            return registrarFalloYNotificar(error);
        });
}

function obtenerArchivoDescarga(idBackup) {
    let backup = null;

    return repositorio.buscarPorId(idBackup)
        .then(function (encontrado) {
            if (encontrado === null) {
                throw { codigo: 404, mensaje: "El respaldo seleccionado no existe en el histórico." };
            }
            if (encontrado.estado !== "Exitoso") {
                throw { codigo: 400, mensaje: "Ese respaldo falló: no tiene archivo para descargar." };
            }

            backup = encontrado;
            return fs.promises.access(generador.rutaDeArchivo(backup.nombreArchivo))
                .catch(function () {
                    throw { codigo: 404, mensaje: "El archivo " + backup.nombreArchivo + " ya no está en la carpeta de respaldos." };
                });
        })
        .then(function () {
            return {
                exito: true,
                ruta: generador.rutaDeArchivo(backup.nombreArchivo),
                nombreArchivo: backup.nombreArchivo
            };
        })
        .catch(function (error) {
            if (error.codigo) {
                return { exito: false, codigo: error.codigo, mensaje: error.mensaje };
            }
            throw error;
        });
}

function obtenerExcelDescarga(idBackup) {
    let nombreJson = null;

    return obtenerArchivoDescarga(idBackup)
        .then(function (resultado) {
            if (!resultado.exito) {
                return resultado;
            }

            nombreJson = resultado.nombreArchivo;
            return generador.leerArchivo(nombreJson)
                .then(function (contenido) {
                    return {
                        exito: true,
                        libro: excel.crearLibro(contenido, nombreJson),
                        nombreArchivo: nombreJson.replace(/\.json$/, ".xlsx")
                    };
                });
        });
}

function guardarEnDescargas(idBackup, formato, carpetaDestino) {
    let carpeta = carpetaDestino || descargaLocal.carpetaDescargas();
    let ruta = null;

    let obtener = formato === "excel"
        ? obtenerExcelDescarga(idBackup)
        : obtenerArchivoDescarga(idBackup);

    return obtener
        .then(function (resultado) {
            if (!resultado.exito) {
                return resultado;
            }

            return fs.promises.mkdir(carpeta, { recursive: true })
                .then(function () {
                    ruta = descargaLocal.rutaSinRepetir(carpeta, resultado.nombreArchivo);

                    if (formato === "excel") {
                        return resultado.libro.xlsx.writeFile(ruta);
                    }
                    return fs.promises.copyFile(resultado.ruta, ruta);
                })
                .then(function () {
                    return { exito: true, ruta: ruta };
                });
        });
}

function compararConRespaldo(idBackup) {
    let backup = null;
    let contenidoRespaldo = null;

    return repositorio.obtenerUltimoExitoso()
        .then(function (ultimo) {
            if (ultimo === null) {
                throw { codigo: 404, mensaje: MENSAJE_SIN_RESPALDOS };
            }
            return repositorio.buscarPorId(idBackup);
        })
        .then(function (encontrado) {
            if (encontrado === null) {
                throw { codigo: 404, mensaje: "El respaldo seleccionado no existe en el histórico." };
            }
            if (encontrado.estado !== "Exitoso") {
                throw { codigo: 400, mensaje: "Ese respaldo falló: no tiene archivo para comparar." };
            }

            backup = encontrado;
            return generador.leerArchivo(backup.nombreArchivo)
                .catch(function () {
                    throw { codigo: 404, mensaje: "El archivo " + backup.nombreArchivo + " ya no está en la carpeta de respaldos." };
                });
        })
        .then(function (contenido) {
            contenidoRespaldo = contenido;
            return repositorioDatos.leerTodasLasTablas();
        })
        .then(function (tablasActuales) {
            let actual = JSON.parse(JSON.stringify(tablasActuales));

            let informe = comparador.compararDatos(contenidoRespaldo.tablas, actual);
            informe.respaldo = backup;
            informe.fechaComparacion = regla.fechaATexto(new Date());

            return { exito: true, datos: informe };
        })
        .catch(function (error) {
            if (error.codigo) {
                return { exito: false, codigo: error.codigo, mensaje: error.mensaje };
            }
            throw error;
        });
}

module.exports = {
    MAX_INTENTOS_AUTOMATICO: MAX_INTENTOS_AUTOMATICO,
    ESPERA_ENTRE_INTENTOS_MS: ESPERA_ENTRE_INTENTOS_MS,
    MENSAJE_SIN_RESPALDOS: MENSAJE_SIN_RESPALDOS,
    consultarEstado: consultarEstado,
    generarBackupManual: generarBackupManual,
    generarBackupAutomatico: generarBackupAutomatico,
    obtenerArchivoDescarga: obtenerArchivoDescarga,
    obtenerExcelDescarga: obtenerExcelDescarga,
    guardarEnDescargas: guardarEnDescargas,
    compararConRespaldo: compararConRespaldo
};
