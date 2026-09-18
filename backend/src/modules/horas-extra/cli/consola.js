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

// pide todos los datos de una hora extra y los junta en un objeto simple
function pedirDatosHoraExtra(horaExtraActual) {
    let actual = {}; // en modo crear todas las propiedades quedan undefined

    if (horaExtraActual !== null) {
        console.log("(Presiona Enter para dejar el valor que está entre corchetes)");
        actual = {
            cantidadHoras: horaExtraActual.cantidadHoras,
            valorHoraBase: horaExtraActual.valorHoraBase
        };
    }

    console.log("\n--- Datos de la hora extra ---");
    let empleadoId = pedirId("ID del empleado");
    let fecha = preguntar("Fecha (AAAA-MM-DD)", actual.fecha);
    let tipo = preguntar("Tipo (Diurna/Nocturna/Festiva)", actual.tipo);
    let cantidadHoras = preguntar("Cantidad de horas", actual.cantidadHoras);
    let valorHoraBase = preguntar("Valor de la hora base (COP)", actual.valorHoraBase);

    return {
        empleadoId: empleadoId,
        fecha: fecha,
        tipo: tipo,
        cantidadHoras: cantidadHoras,
        valorHoraBase: valorHoraBase
    };
}

// pide un id y lo convierte a numero
function pedirId(texto) {
    return Number(prompt(texto + ": "));
}

// muestra la lista de horas extra
function mostrarHorasExtras(lista) {
    console.log("\n===== HORAS EXTRA REGISTRADAS =====");

    if (lista.length === 0) {
        console.log("No hay horas extra registradas.");
        return;
    }

    for (let i = 0; i < lista.length; i++) {
        let h = lista[i];
        console.log(
            "ID: " + h.id +
            " | Empleado: " + h.empleadoId +
            " | Fecha: " + h.fecha +
            " | Tipo: " + h.tipo +
            " | Horas: " + h.cantidadHoras +
            " | Factor: " + h.factorRecargo +
            " | Valor: $" + h.valor +
            " | Estado: " + h.estado
        );
    }
}

// muestra el menu y devuelve la opcion elegida
function mostrarMenu() {
    console.log("\n========= GESTIÓN DE HORAS EXTRA =========");
    console.log("1. Registrar hora extra");
    console.log("2. Ver todas las horas extra");
    console.log("3. Ver horas extra de un empleado");
    console.log("0. Salir");
    return prompt("Elige una opción: ");
}

module.exports = {
    pedirDatosHoraExtra: pedirDatosHoraExtra,
    pedirId: pedirId,
    mostrarHorasExtras: mostrarHorasExtras,
    mostrarMenu: mostrarMenu
};