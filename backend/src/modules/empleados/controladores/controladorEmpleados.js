const repositorio = require("../repositorios/repositorioEmpleados");

const detector = require("../servicios/detectorCambios");

const mensajeCambios = require("../servicios/mensajeCambios");

const telegram = require("../../notificaciones/telegram");

const seguridad = require("../../auth/compartido/seguridad");

// todos los campos que maneja el formulario
const CAMPOS = [
    "nombre", "apellido", "cedula", "correo", "contrasena", "telefono", "estado",
    "fechaIngreso", "cargo", "salarioBase",
    "contactoNombre", "contactoTelefono", "contactoParentesco", "telegramChatId"
];

// si falta un campo se deja como texto vacio
function completarDatos(datos) {
    for (let i = 0; i < CAMPOS.length; i++) {
        if (datos[CAMPOS[i]] === undefined) {
            datos[CAMPOS[i]] = "";
        }
    }

    // todo empleado nace activo y not null
    if (datos.estado === "") {
        datos.estado = "Activo";
    }
}

// revisa los datos y envia "" si todo esta bien y si no un mensaje de error
function validarDatos(datos) {

    // Estas columnas son NOT NULL en la tabla EMPLEADO
    if (
        datos.nombre === "" ||
        datos.apellido === "" ||
        datos.cedula === "" ||
        datos.correo === "" ||
        datos.contrasena === ""
    ) {
        return "completa nombre, apellido, cédula, correo y contraseña.";
    }
    // la tabla solo acepta estos dos valores 
    if (datos.estado !== "Activo" && datos.estado !== "Inactivo") {
        return "el estado debe ser 'Activo' o 'Inactivo'.";
    }
    // el chat de Telegram es un numero largo guardado como texto
    if (
        datos.telegramChatId !== "" &&
        isNaN(Number(datos.telegramChatId))
    ) {
        return "el chat ID de Telegram debe ser solo números, ej: 1897437521.";
    }

    // salario_base es NUMBER si escribieron algo tiene que ser un numero
    if (
        datos.salarioBase !== "" &&
        isNaN(Number(datos.salarioBase))
    ) {
        return "el salario base debe ser un número (sin puntos ni signos), ej: 1500000.";
    }

    return "";
}


// REGISTRAR

// registra un empleado nuevo en Oracle
// devuelve una promesa con el ID generado por Oracle
function registrarEmpleado(datos) {

    completarDatos(datos);

    let error = validarDatos(datos);

    if (error !== "") {
        console.log("ERROR: " + error);
        return Promise.resolve(false); //la promesa fallo
    }

    // guardamos solo el hash de la contrasena, nunca el texto plano
    datos.contrasena = seguridad.hashearSiHaceFalta(datos.contrasena);

    return repositorio.existeCedulaOCorreo(
        datos.cedula,
        datos.correo,
        0
    )

        .then(function (existe) {

            if (existe) {
                throw new Error(
                    "ya existe un empleado con esa cédula o ese correo."
                );
            }

            return repositorio.insertarEmpleado(datos);
        })

        .then(function (idNuevo) {

            console.log(
                "Empleado registrado con id " + idNuevo + "."
            );

            // IMPORTANTE:
            // devolvemos el ID real generado por Oracle
            return idNuevo;
        })

        .catch(function (error) {

            console.log("ERROR: " + error.message);

            return false;
        });
}


// EDITAR

// aplica los cambios sobre el empleado con ese id y avisa por Telegram
// devuelve una promesa con true o false
// detalle es opcional si se envia un objeto, ahi se deja el motivo cuando la API pueda responderle al frontend con el mensaje real
function guardarEdicion(id, datosNuevos, detalle) {

    detalle = detalle || {};

    // si no mandan estado o contraseña se conservan los que ya tenia
    // (completarDatos pondria el estado en "Activo" y reactivaria a un inactivo)
    let sinEstado = datosNuevos.estado === undefined || datosNuevos.estado === "";
    let sinContrasena = datosNuevos.contrasena === undefined || datosNuevos.contrasena === "";

    completarDatos(datosNuevos);

    let empleadoViejo = null;

    return repositorio.buscarEmpleadoPorId(id)

        .then(function (empleado) {

            if (empleado === null) {
                detalle.noExiste = true;
                throw new Error(
                    "no existe un empleado con id " + id + "."
                );
            }

            empleadoViejo = empleado;

            if (sinEstado) {
                datosNuevos.estado = empleado.usuario.estado;
            }

            if (sinContrasena) {
                datosNuevos.contrasena = empleado.usuario.contrasena;
            }

            let error = validarDatos(datosNuevos);

            if (error !== "") {
                throw new Error(error);
            }

            // guardamos solo el hash de la contrasena, nunca el texto plano
            datosNuevos.contrasena = seguridad.hashearSiHaceFalta(datosNuevos.contrasena);

            // para que la cedula y correo no choquen con otro empleado
            return repositorio.existeCedulaOCorreo(
                datosNuevos.cedula,
                datosNuevos.correo,
                id
            );
        })

        .then(function (existe) {

            if (existe) {
                throw new Error(
                    "ese correo o cédula ya lo tiene otro empleado."
                );
            }

            // se detectan los cambios antes de guardar los datos nuevos
            let cambios = detector.detectarCambios(
                empleadoViejo,
                datosNuevos
            );

            if (cambios.length === 0) {

                console.log("No hubo cambios.");

                detalle.sinCambios = true;

                return false;
            }

            return guardarYNotificar(
                id,
                empleadoViejo,
                datosNuevos,
                cambios
            );
        })

        .catch(function (error) {

            console.log("ERROR: " + error.message);

            detalle.error = error.message;

            return false;
        });
}


// guarda en Oracle, muestra los cambios y avisa por Telegram

function guardarYNotificar(
    id,
    empleadoViejo,
    datosNuevos,
    cambios
) {

    return repositorio.actualizarEmpleado(
        id,
        datosNuevos
    )

        .then(function () {

            console.log(
                "Empleado actualizado. Cambios detectados:"
            );

            for (let i = 0; i < cambios.length; i++) {

                console.log(
                    "  - " + cambios[i]
                );
            }

            let mensaje =
                mensajeCambios.armarMensajeCambios(
                    empleadoViejo,
                    cambios
                );

            return telegram.enviarMensaje(
                datosNuevos.telegramChatId,
                mensaje
            );
        })

        .then(function () {

            // Aunque Telegram falle, el empleado ya quedó guardado
            return true;
        });
}

// ---------- ACTIVAR / INACTIVAR (borrado lógico) ----------

// Cambia el estado de un empleado y le avisa por Telegram.
// NO existe una función para borrar: un empleado inactivo conserva su
// historial de marcaciones, horas extra y nómina.
// Devuelve una promesa con true si cambió y false si no.
function cambiarEstado(id, nuevoEstado) {
    let empleadoViejo = null;

    return repositorio.buscarEmpleadoPorId(id)
        .then(function (empleado) {
            if (empleado === null) {
                throw new Error("no existe un empleado con id " + id + ".");
            }

            if (nuevoEstado !== "Activo" && nuevoEstado !== "Inactivo") {
                throw new Error("el estado debe ser 'Activo' o 'Inactivo'.");
            }

            empleadoViejo = empleado;

            // Si ya está en ese estado, no tiene sentido guardar ni notificar.
            if (empleado.usuario.estado === nuevoEstado) {
                console.log("El empleado ya estaba " + nuevoEstado + ".");
                return false;
            }

            return aplicarCambioDeEstado(id, empleadoViejo, nuevoEstado);
        })
        .catch(function (error) {
            console.log("ERROR: " + error.message);
            return false;
        });
}

// guarda el nuevo estado y manda el aviso
function aplicarCambioDeEstado(id, empleadoViejo, nuevoEstado) {
    return repositorio.cambiarEstado(id, nuevoEstado)
        .then(function () {
            let cambios = [
                "estado: '" + empleadoViejo.usuario.estado + "' -> '" + nuevoEstado + "'"
            ];

            console.log("Empleado actualizado. Cambios detectados:");
            console.log("  - " + cambios[0]);

            let mensaje = mensajeCambios.armarMensajeCambios(empleadoViejo, cambios);
            return telegram.enviarMensaje(empleadoViejo.telegramChatId, mensaje);
        })
        .then(function () {
            return true;
        });
}


module.exports = {
    registrarEmpleado: registrarEmpleado,
    guardarEdicion: guardarEdicion,
    cambiarEstado: cambiarEstado
};