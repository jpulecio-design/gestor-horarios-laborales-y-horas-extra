const repositorio = require("../repositorios/repositorioEmpleados");
const detector = require("../servicios/detectorCambios");
const mensajeCambios = require("../servicios/mensajeCambios");
const telegram = require("../../notificaciones/telegram");

// todos los campos que maneja el formulario
const CAMPOS = [
    "nombre", "apellido", "cedula", "correo", "contrasena", "telefono",
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
}

// revisa los datos y envia "" si todo esta bien y si no un menssaje de error
function validarDatos(datos) {
    // Estas columnas son NOT NULL en la tabla EMPLEADO.
    if (datos.nombre === "" || datos.apellido === "" || datos.cedula === "" ||
        datos.correo === "" || datos.contrasena === "") {
        return "completa nombre, apellido, cédula, correo y contraseña.";
    }

    // el chat de telegram es un numero largo guardado como texto
    if (datos.telegramChatId !== "" && isNaN(Number(datos.telegramChatId))) {
        return "el chat ID de Telegram debe ser solo números, ej: 1897437521.";
    }

    // salario_base es NUMBER si escribieron algo tiene que ser un numero
    // isNaN(x) devuelve true cuando x NO es un numero
    if (datos.salarioBase !== "" && isNaN(Number(datos.salarioBase))) {
        return "el salario base debe ser un número (sin puntos ni signos), ej: 1500000.";
    }

    return "";
}


// REGISTRAR 

// registra un empleado nuevo en Oracle
// devuelve una promesa con true si se guardo y false si no
function registrarEmpleado(datos) {
    completarDatos(datos);

    let error = validarDatos(datos);
    if (error !== "") {
        console.log("ERROR: " + error);
        return Promise.resolve(false); //la promesa acabo con esa falsa
    }

    return repositorio.existeCedulaOCorreo(datos.cedula, datos.correo, 0)
        .then(function (existe) {
            if (existe) {
                throw new Error("ya existe un empleado con esa cédula o ese correo.");
            }
            return repositorio.insertarEmpleado(datos);
        })
        .then(function (idNuevo) {
            console.log("Empleado registrado con id " + idNuevo + ".");
            return true;
        })
        .catch(function (error) {
            // llega aqui por un throw de arriba con un error de oracle
            console.log("ERROR: " + error.message);
            return false;
        });
}


//  EDITAR 

// aplica los cambios sobre el empleado con ese id y avisa por Telegram
// devuelve la promesa cxon true y false si no
function guardarEdicion(id, datosNuevos) {
    completarDatos(datosNuevos);

    let empleadoViejo = null; // se guarda aqui pa usarlo en varios .then

    return repositorio.buscarEmpleadoPorId(id)
        .then(function (empleado) {
            if (empleado === null) {
                throw new Error("no existe un empleado con id " + id + ".");
            }
            empleadoViejo = empleado;

            let error = validarDatos(datosNuevos);
            if (error !== "") {
                throw new Error(error);
            }

            // para que la cedula y correo no choquen con otro empleado
            return repositorio.existeCedulaOCorreo(datosNuevos.cedula, datosNuevos.correo, id);
        })
        .then(function (existe) {
            if (existe) {
                throw new Error("ese correo o cédula ya lo tiene otro empleado.");
            }

            //  se detectan los cambios antes de guardar los datos nuevos
            let cambios = detector.detectarCambios(empleadoViejo, datosNuevos);

            if (cambios.length === 0) {
                console.log("No hubo cambios.");
                return false; // mo es error sino q no hay nada q guardar
            }

            return guardarYNotificar(id, empleadoViejo, datosNuevos, cambios);
        })
        .catch(function (error) {
            console.log("ERROR: " + error.message);
            return false;
        });
}

// guarda en Oracle muestra los cambios y avisa por telegram

function guardarYNotificar(id, empleadoViejo, datosNuevos, cambios) {
    return repositorio.actualizarEmpleado(id, datosNuevos)
        .then(function () {
            console.log("Empleado actualizado. Cambios detectados:");
            for (let i = 0; i < cambios.length; i++) {
                console.log("  - " + cambios[i]);
            }

            let mensaje = mensajeCambios.armarMensajeCambios(empleadoViejo, cambios);
            return telegram.enviarMensaje(datosNuevos.telegramChatId, mensaje);
        })
        .then(function () {
            // Aunque Telegram falle el empleado ya quedo guardado: devolve true
            return true;
        });
}

module.exports = {
    registrarEmpleado: registrarEmpleado,
    guardarEdicion: guardarEdicion
};