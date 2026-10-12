const prompt = require("prompt-sync")({ sigint: true });

function pedirTexto(texto) {
    return prompt(texto + ": ").trim();
}

function pedirId(texto) {
    return Number(prompt(texto + ": "));
}

// Muestra el resumen de un empleado (asistencia + horas extra).
function mostrarResumenEmpleado(datos) {
    console.log("\n===== MONITOREO: " + datos.empleado.nombre + " " + datos.empleado.apellido +
        " (id " + datos.empleado.id + ") =====");
    console.log("Periodo: " + datos.periodo.desde + " a " + datos.periodo.hasta);

    let a = datos.asistencia;
    console.log("\n-- Asistencia --");
    console.log("  Marcajes activos: " + a.marcajes);
    console.log("  Dias con marcajes: " + a.dias);
    console.log("  Horas trabajadas: " + a.horasTrabajadas);
    console.log("  Jornadas incompletas: " + a.jornadasIncompletas);

    for (let i = 0; i < a.detalle.length; i++) {
        let j = a.detalle[i];
        let entrada = j.entrada === null ? "--" : j.entrada.slice(11);
        let salida = j.salida === null ? "--" : j.salida.slice(11);
        console.log("    " + j.fecha + "  " + entrada + " -> " + salida +
            (j.completa ? "" : "  (incompleta)"));
    }

    let h = datos.horasExtra;
    console.log("\n-- Horas extra --");
    console.log("  Registros: " + h.registros);
    console.log("  Total horas: " + h.totalHoras);
    console.log("  Total valor: " + h.totalValor);
    for (let tipo in h.porTipo) {
        console.log("    " + tipo + ": " + h.porTipo[tipo].horas + " h, $" + h.porTipo[tipo].valor);
    }
}

// Muestra el resumen general (todos los empleados).
function mostrarResumenGeneral(datos) {
    console.log("\n===== MONITOREO GENERAL =====");
    console.log("Periodo: " + datos.periodo.desde + " a " + datos.periodo.hasta);

    if (datos.empleados.length === 0) {
        console.log("No hay empleados.");
        return;
    }

    for (let i = 0; i < datos.empleados.length; i++) {
        let f = datos.empleados[i];
        console.log(
            "Empleado " + f.empleado.id + " (" + f.empleado.nombre + " " + f.empleado.apellido + ") " +
            "| Dias: " + f.asistencia.dias +
            " | Horas trabajadas: " + f.asistencia.horasTrabajadas +
            " | Horas extra: " + f.horasExtra.totalHoras +
            " ($" + f.horasExtra.totalValor + ")"
        );
    }
}

function mostrarMenu() {
    console.log("\n===== MONITOREAR ASISTENCIA Y HORAS EXTRA (CU07) =====");
    console.log("1. Monitorear un empleado");
    console.log("2. Monitorear a todos");
    console.log("0. Salir");
    return prompt("Elige una opción: ");
}

module.exports = {
    pedirTexto: pedirTexto,
    pedirId: pedirId,
    mostrarResumenEmpleado: mostrarResumenEmpleado,
    mostrarResumenGeneral: mostrarResumenGeneral,
    mostrarMenu: mostrarMenu
};
