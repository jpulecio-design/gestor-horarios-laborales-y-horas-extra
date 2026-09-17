const prompt = require("prompt-sync")({ sigint: true });

// hace pregunta pa pasar a modo editor y editar
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
//  si empleadoActual es null entonces modo crear 
// si trae un empleado entonces modo editar
function pedirDatosEmpleado(empleadoActual) {
    let actual = {}; // en modo crear todas las propiedades quedan undefined

    if (empleadoActual !== null) {
        console.log("(Presiona Enter para dejar el valor que está entre corchetes)");
        actual = {
            nombre: empleadoActual.usuario.nombre,
            apellido: empleadoActual.usuario.apellido,
            cedula: empleadoActual.usuario.cedula,
            correo: empleadoActual.usuario.correo,
            contrasena: empleadoActual.usuario.contrasena,
            telefono: empleadoActual.usuario.telefono,
            horaEntrada: empleadoActual.horaEntrada,
            horaSalida: empleadoActual.horaSalida,
            turno: empleadoActual.turno,
            fechaIngreso: empleadoActual.fechaIngreso,
            acudienteNombre: empleadoActual.acudiente.nombre,
            acudienteTelefono: empleadoActual.acudiente.telefono
        };
    }

    console.log("\n--- Datos del usuario (molde) ---");
    let nombre = preguntar("Nombre", actual.nombre);
    let apellido = preguntar("Apellido", actual.apellido);
    let cedula = preguntar("Cédula", actual.cedula);
    let correo = preguntar("Correo", actual.correo);

    // la contraseña se oculta con prompt.hide() y no se muestra en la consola
    let contrasena = prompt.hide("Contraseña" + (empleadoActual !== null ? " (Enter = sin cambios)" : "") + ": ");
    if (contrasena === "" && empleadoActual !== null) {
        contrasena = actual.contrasena;
    }

    let telefono = preguntar("Teléfono", actual.telefono);

    console.log("\n--- Datos propios del empleado ---");
    let horaEntrada = preguntar("Hora de entrada (HH:MM)", actual.horaEntrada);
    let horaSalida = preguntar("Hora de salida (HH:MM)", actual.horaSalida);
    let turno = preguntar("Turno (Diurno/Nocturno)", actual.turno);
    let fechaIngreso = preguntar("Fecha de ingreso (AAAA-MM-DD)", actual.fechaIngreso);

    console.log("\n--- Información del acudiente ---");
    let acudienteNombre = preguntar("Nombre del acudiente", actual.acudienteNombre);
    let acudienteTelefono = preguntar("Teléfono del acudiente", actual.acudienteTelefono);

    return {
        nombre: nombre,
        apellido: apellido,
        cedula: cedula,
        correo: correo,
        contrasena: contrasena,
        telefono: telefono,
        horaEntrada: horaEntrada,
        horaSalida: horaSalida,
        turno: turno,
        acudienteNombre: acudienteNombre,
        acudienteTelefono: acudienteTelefono,
        fechaIngreso: fechaIngreso
    };
}

// Pide un id y lo convierte a numero
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
            " | Turno: " + emp.turno +
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