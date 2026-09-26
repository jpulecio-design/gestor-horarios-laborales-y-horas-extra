const prompt = require("prompt-sync")({ sigint: true });

// hace la pregunta y si la persona da enter se pasa al valor que ya tenai
function preguntar(texto, valorActual) {
    if (valorActual === undefined) {
        return prompt(texto + ": ");
    }

    let respuesta = prompt(texto + " [" + valorActual + "]: ");
    if (respuesta === "") {
        return valorActual;
    }
    return respuesta;
}

// pide todos los datos de un empleado y los junta en un objeto simple

function pedirDatosEmpleado(empleadoActual) {
    let actual = {}; // en modo crear, todas las propiedades quedan undefined

    if (empleadoActual !== null) {
        console.log("(Presiona Enter para dejar el valor que está entre corchetes)");
        actual = {
            nombre: empleadoActual.usuario.nombre,
            apellido: empleadoActual.usuario.apellido,
            cedula: empleadoActual.usuario.cedula,
            correo: empleadoActual.usuario.correo,
            contrasena: empleadoActual.usuario.contrasena,
            telefono: empleadoActual.usuario.telefono,
            fechaIngreso: empleadoActual.fechaIngreso,
            cargo: empleadoActual.cargo,
            salarioBase: empleadoActual.salarioBase,
            contactoNombre: empleadoActual.contactoEmergencia.nombre,
            contactoTelefono: empleadoActual.contactoEmergencia.telefono,
            contactoParentesco: empleadoActual.contactoEmergencia.parentesco,
            telegramChatId: empleadoActual.telegramChatId
        };
    }

    console.log("\n--- Datos del usuario (molde) ---");
    let nombre = preguntar("Nombre", actual.nombre);
    let apellido = preguntar("Apellido", actual.apellido);
    let cedula = preguntar("Cédula", actual.cedula);
    let correo = preguntar("Correo", actual.correo);

    // la contraseña se escribe oculta y nunca se muestra
    let contrasena = prompt.hide("Contraseña" + (empleadoActual !== null ? " (Enter = sin cambios)" : "") + ": ");
    if (contrasena === "" && empleadoActual !== null) {
        contrasena = actual.contrasena;
    }

    let telefono = preguntar("Teléfono", actual.telefono);

    console.log("\n--- Datos propios del empleado ---");
    let fechaIngreso = preguntar("Fecha de ingreso (AAAA-MM-DD)", actual.fechaIngreso);
    let cargo = preguntar("Cargo", actual.cargo);
    let salarioBase = preguntar("Salario base (solo números)", actual.salarioBase);

    console.log("\n--- Contacto de emergencia ---");
    let contactoNombre = preguntar("Nombre del contacto", actual.contactoNombre);
    let contactoTelefono = preguntar("Teléfono del contacto", actual.contactoTelefono);
    let contactoParentesco = preguntar("Parentesco (ej: Madre, Hermano)", actual.contactoParentesco);

    // El empleado debe haberle dado "Iniciar" al bot para poder recibir avisos.
    // Si se deja vacío, los avisos de este empleado van al administrador.
    console.log("\n--- Notificaciones ---");
    let telegramChatId = preguntar("Chat ID de Telegram (opcional, Enter para omitir)", actual.telegramChatId);

    return {
        nombre: nombre,
        apellido: apellido,
        cedula: cedula,
        correo: correo,
        contrasena: contrasena,
        telefono: telefono,
        fechaIngreso: fechaIngreso,
        cargo: cargo,
        salarioBase: salarioBase,
        contactoNombre: contactoNombre,
        contactoTelefono: contactoTelefono,
        contactoParentesco: contactoParentesco,
        telegramChatId: telegramChatId
    };
}

// convierte id a numero y el prompt devuelve texto
function pedirId(texto) {
    return Number(prompt(texto + ": "));
}

// muestra la lista de empleados
function mostrarEmpleados(lista) {
    console.log("\n===== EMPLEADOS REGISTRADOS =====");

    if (lista.length === 0) {
        console.log("No hay empleados registrados.");
        return;
    }

    for (let i = 0; i < lista.length; i++) {
        let emp = lista[i];
        console.log(
            "ID: " + emp.usuario.id +
            " | " + emp.usuario.nombre + " " + emp.usuario.apellido +
            " | Cédula: " + emp.usuario.cedula +
            " | Correo: " + emp.usuario.correo +
            " | Tel: " + emp.usuario.telefono +
            " | Cargo: " + emp.cargo +
            " | Estado: " + emp.usuario.estado
        );
    }
}

// muestra el menu y devuelve la opción elegida
function mostrarMenu() {
    console.log("\n========= GESTIÓN DE EMPLEADOS =========");
    console.log("1. Registrar empleado");
    console.log("2. Ver empleados");
    console.log("3. Editar empleado");
    console.log("0. Salir");
    return prompt("Elige una opción: ");
}

module.exports = {
    pedirDatosEmpleado: pedirDatosEmpleado,
    pedirId: pedirId,
    mostrarEmpleados: mostrarEmpleados,
    mostrarMenu: mostrarMenu
};