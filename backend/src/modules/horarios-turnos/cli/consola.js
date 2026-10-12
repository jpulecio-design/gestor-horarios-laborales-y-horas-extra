const prompt = require("prompt-sync")({ sigint: true });

// pide un texto y quita espacios
function pedirTexto(texto) {
    return prompt(texto + ": ").trim();
}

// pide un id y lo convierte a numero
function pedirId(texto) {
    return Number(prompt(texto + ": "));
}

// pide un texto; si el usuario deja vacio, devuelve el valor por defecto
function pedirTextoConDefecto(texto, defecto) {
    let valor = prompt(texto + " (" + defecto + "): ").trim();
    return valor === "" ? defecto : valor;
}

// muestra la lista de turnos
function mostrarTurnos(lista) {
    console.log("\n===== TURNOS =====");

    if (lista.length === 0) {
        console.log("No hay turnos creados.");
        return;
    }

    for (let i = 0; i < lista.length; i++) {
        let t = lista[i];
        console.log(
            "ID: " + t.id +
            " | " + t.nombre +
            " | " + t.horaEntrada + "-" + t.horaSalida +
            " | Días: " + t.dias +
            " | Estado: " + t.estado
        );
    }
}

// muestra las asignaciones (horarios) de un empleado
function mostrarAsignaciones(lista) {
    console.log("\n===== HORARIOS ASIGNADOS =====");

    if (lista.length === 0) {
        console.log("El empleado no tiene horarios asignados.");
        return;
    }

    for (let i = 0; i < lista.length; i++) {
        let a = lista[i];
        console.log(
            "Asignación: " + a.id +
            " | Turno: " + a.turno.nombre +
            " (" + a.turno.horaEntrada + "-" + a.turno.horaSalida + ", días " + a.turno.dias + ")" +
            " | Desde: " + a.fechaDesde +
            " | Hasta: " + (a.fechaHasta === null ? "indefinido" : a.fechaHasta)
        );
    }
}

// muestra la grilla semanal
function mostrarSemana(semana) {
    console.log("\n===== SEMANA DEL EMPLEADO " + semana.empleadoId +
        " (inicia " + semana.inicio + ") =====");

    for (let i = 0; i < semana.dias.length; i++) {
        let d = semana.dias[i];
        let turno = d.turno === null
            ? "Descanso"
            : d.turno.nombre + " (" + d.turno.horaEntrada + "-" + d.turno.horaSalida + ")";
        console.log("  " + d.dia + " " + d.fecha + ": " + turno);
    }
}

// muestra el turno de hoy
function mostrarHoy(hoy) {
    console.log("\n===== HORARIO DE HOY (" + hoy.fecha + ") =====");

    if (hoy.turno === null) {
        console.log("El empleado " + hoy.empleadoId + " no tiene turno hoy.");
    } else {
        console.log(
            "Empleado " + hoy.empleadoId + " -> " + hoy.turno.nombre +
            " (" + hoy.turno.horaEntrada + "-" + hoy.turno.horaSalida + ")"
        );
    }
}

// muestra el menu y devuelve la opcion elegida
function mostrarMenu() {
    console.log("\n===== HORARIOS Y TURNOS (CU05) =====");
    console.log("1. Crear turno");
    console.log("2. Ver turnos");
    console.log("3. Asignar horario a un empleado");
    console.log("4. Ver horarios asignados de un empleado");
    console.log("5. Ver horario de hoy de un empleado");
    console.log("6. Ver semana de un empleado");
    console.log("0. Salir");
    return prompt("Elige una opción: ");
}

module.exports = {
    pedirTexto: pedirTexto,
    pedirId: pedirId,
    pedirTextoConDefecto: pedirTextoConDefecto,
    mostrarTurnos: mostrarTurnos,
    mostrarAsignaciones: mostrarAsignaciones,
    mostrarSemana: mostrarSemana,
    mostrarHoy: mostrarHoy,
    mostrarMenu: mostrarMenu
};
