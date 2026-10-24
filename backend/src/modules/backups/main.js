const consola = require("./vistas/consola");
const controlador = require("./controladores/controladorBackups");
const generador = require("./servicios/generadorBackup");
const servicioAutenticacion = require("../auth/compartido/servicioAutenticacion");

let administrador = null;

function entrar() {
    let credenciales = consola.pedirCredenciales();

    servicioAutenticacion.iniciarSesion(credenciales.correo, credenciales.clave)
        .then(function (resultado) {
            if (!resultado.exito) {
                console.log("ERROR: " + resultado.mensaje);
                return;
            }
            if (resultado.usuario.rol !== "Administrador") {
                console.log("ERROR: solo el Administrador puede acceder a Seguridad y Backups.");
                return;
            }

            administrador = resultado.usuario;

            return controlador.consultarEstado()
                .then(function (estado) {
                    consola.mostrarEstado(estado);
                    iniciar();
                });
        })
        .catch(function (error) {
            console.log("ERROR: " + error.message);
        });
}

function iniciar() {
    let opcion = consola.mostrarMenu();
    let tarea;

    if (opcion === "1") {
        tarea = opcionGenerar();
    } else if (opcion === "2") {
        tarea = opcionVerRespaldos();
    } else if (opcion === "3") {
        tarea = opcionComparar();
    } else if (opcion === "4") {
        tarea = opcionDescargar();
    } else if (opcion === "0") {
        console.log("Hasta luego.");
        return;
    } else {
        console.log("Opción no válida.");
        tarea = Promise.resolve();
    }

    tarea
        .catch(function (error) {
            console.log("ERROR: " + error.message);
        })
        .then(function () {
            iniciar();
        });
}

function opcionGenerar() {
    return controlador.generarBackupManual(administrador.id)
        .then(function (resultado) {
            console.log(resultado.mensaje);
        });
}

function opcionVerRespaldos() {
    return controlador.consultarEstado()
        .then(function (estado) {
            consola.mostrarHistorial(estado.historial, generador.carpetaRespaldos());
        });
}

function opcionComparar() {
    return controlador.consultarEstado()
        .then(function (estado) {
            if (estado.ultimoRespaldo === null) {
                return { exito: false, mensaje: controlador.MENSAJE_SIN_RESPALDOS };
            }
            let id = consola.pedirRespaldoAComparar(estado.historial);
            return controlador.compararConRespaldo(id);
        })
        .then(function (resultado) {
            if (!resultado.exito) {
                console.log("ERROR: " + resultado.mensaje);
                return;
            }
            consola.mostrarComparacion(resultado.datos);
        });
}

function opcionDescargar() {
    return controlador.consultarEstado()
        .then(function (estado) {
            if (estado.ultimoRespaldo === null) {
                return { exito: false, mensaje: "Aún no hay respaldos para descargar." };
            }
            let id = consola.pedirRespaldoADescargar(estado.historial, estado.ultimoRespaldo);
            let formato = consola.pedirFormato();
            return controlador.guardarEnDescargas(id, formato);
        })
        .then(function (resultado) {
            if (!resultado.exito) {
                console.log("ERROR: " + resultado.mensaje);
                return;
            }
            console.log("Descargado en: " + resultado.ruta);
        });
}

entrar();
