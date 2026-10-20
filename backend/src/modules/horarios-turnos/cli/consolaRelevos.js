const prompt = require("prompt-sync")({ sigint: true });

function pedirId(texto) {
    return Number(prompt(texto + ": "));
}

function confirmar(texto) {
    return prompt(texto + " (si/no): ").toLowerCase() === "s";
}

function pedirTexto(texto) {
    return prompt(texto + ": ").trim();
}

// muestra la agenda con los dias con turno, ya con los relevos aplicados
function mostrarAgenda(lista) {
    console.log("\n===== TU AGENDA (próximos días) =====");

    if (lista.length === 0) {
        console.log("No tienes turnos asignados de hoy en adelante.");
        return;
    }

    for (let i = 0; i < lista.length; i++) {
        let t = lista[i];
        console.log(
            t.fecha +
            " | " + t.tipoTurno +
            " | " + t.horaEntrada + "-" + t.horaSalida +
            " | " + t.origen
        );
    }
}

// muestra una lista de solicitudes, true en las recibidas y false en las enviadas

function mostrarRelevos(titulo, lista, comoCompanero) {
    console.log("\n===== " + titulo + " =====");

    if (lista.length === 0) {
        console.log("No hay solicitudes.");
        return;
    }

    for (let i = 0; i < lista.length; i++) {
        let r = lista[i];
        let otra = comoCompanero ? r.solicitante : r.companero;
        let etiqueta = comoCompanero ? "De: " : "Para: ";

        console.log(
            "#" + r.id +
            " | " + etiqueta + otra.nombre + " " + otra.apellido +
            " | Turno " + r.horario.id + ": " + r.horario.fecha +
            " (" + r.horario.tipoTurno + ", " + r.horario.horaEntrada + "-" + r.horario.horaSalida + ")" +
            " | Estado: " + r.estado
        );
    }
}

// muestra el menu y devuelve la opcion elegida
function mostrarMenu(empleadoId) {
    console.log("\n===== RELEVOS DE TURNO (CU15) - empleado " + empleadoId + " =====");
    console.log("1. Ver mi agenda");
    console.log("2. Solicitar un relevo (por fecha)");
    console.log("3. Ver solicitudes que envié");
    console.log("4. Ver solicitudes que recibí");
    console.log("5. Responder una solicitud");
    console.log("0. Salir");
    return prompt("Elige una opción: ");
}

module.exports = {
    pedirId: pedirId,
    pedirTexto: pedirTexto,
    confirmar: confirmar,
    mostrarAgenda: mostrarAgenda,
    mostrarRelevos: mostrarRelevos,
    mostrarMenu: mostrarMenu
};