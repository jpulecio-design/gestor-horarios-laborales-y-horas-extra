const prompt = require("prompt-sync")({ sigint: true });

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

// pide todos los datos de una nomina y los junta en un objeto simple
function pedirDatosNomina(nominaActual) {
    let actual = {}; // en modo crear todas las propiedades quedan undefined

    if (nominaActual !== null) {
        console.log("(Presiona Enter para dejar el valor que está entre corchetes)");
        actual = {
            periodo: nominaActual.periodo,
            salarioBase: nominaActual.salarioBase,
            horasRecargoNocturno: nominaActual.horasRecargoNocturno,
            horasRecargoFestivo: nominaActual.horasRecargoFestivo
        };
    }

    console.log("\n--- Datos de la nómina ---");
    let empleadoId = pedirId("ID del empleado");
    let periodo = preguntar("Periodo (AAAA-MM)", actual.periodo);

    let salarioBase = preguntar("Salario base mensual (COP)", actual.salarioBase);
    let horasRecargoNocturno = preguntar("Horas trabadas con recargo nocturno", actual.horasRecargoNocturno);
    let horasRecargoFestivo = preguntar("Horas trabajadas dominicales/festivas", actual.horasRecargoFestivo);

    console.log("(Las horas extra del periodo se toman automáticamente del módulo horas extra)");

    return {
        empleadoId: empleadoId,
        periodo: periodo,
        salarioBase: salarioBase,
        horasRecargoNocturno: horasRecargoNocturno,
        horasRecargoFestivo: horasRecargoFestivo
    };
}

// pide un id y lo convierte a numero
function pedirId(texto) {
    return Number(prompt(texto + ": "));
}

// muestra el desglose completo de una nomina
function mostrarNomina(n) {
    console.log("ID: " + n.id + " | Empleado: " + n.empleadoId + " | Periodo: " + n.periodo);
    console.log("  Salario base:          $" + n.salarioBase);
    console.log("  Valor hora:            $" + n.valorHora);
    console.log("  Recargo nocturno:      $" + n.pagoRecargoNocturno);
    console.log("  Recargo festivo:       $" + n.pagoRecargoFestivo);
    console.log("  Pago horas extra:      $" + n.pagoHorasExtra);
    console.log("  Total devengado:       $" + n.totalDevengado);
    console.log("  Salud (4%):            -$" + n.salud);
    console.log("  Pensión (4%):          -$" + n.pension);
    console.log("  NETA A PAGAR:          $" + n.netoPagar);
}

// muestra la lista de nominas en resumen
function mostrarNominas(lista) {
    console.log("\n===== NÓMINAS REGISTRADAS =====");

    if (lista.length === 0) {
        console.log("No hay nóminas registradas.");
        return;
    }

    for (let i = 0; i < lista.length; i++) {
        let n = lista[i];
        console.log(
            "ID: " + n.id +
            " | Empleado: " + n.empleadoId +
            " | Periodo: " + n.periodo +
            " | Devengado: $" + n.totalDevengado +
            " | Neto: $" + n.netoPagar +
            " | Estado: " + n.estado
        );
    }
}

// muestra el menu y devuelve la opcion elegida
function mostrarMenu() {
    console.log("\n========= GESTIÓN DE NÓMINA =========");
    console.log("1. Registrar nómina");
    console.log("2. Ver todas las nóminas");
    console.log("3. Ver nóminas de un empleado");
    console.log("0. Salir");
    return prompt("Elige una opción: ");
}

module.exports = {
    pedirDatosNomina: pedirDatosNomina,
    pedirId: pedirId,
    mostrarNomina: mostrarNomina,
    mostrarNominas: mostrarNominas,
    mostrarMenu: mostrarMenu
};