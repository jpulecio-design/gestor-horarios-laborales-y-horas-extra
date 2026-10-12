const prompt = require("prompt-sync")({ sigint: true });

// pide el codigo QR y quita espacios
function pedirCodigoQr() {
    return prompt("Escanea o pega el codigo QR: ").trim();
}

// pide un id y lo convierte a numero
function pedirId(texto) {
    return Number(prompt(texto + ": "));
}

// muestra la lista de marcajes
function mostrarMarcajes(lista) {
    console.log("\n===== MARCAJES DE ASISTENCIA =====");

    if (lista.length === 0) {
        console.log("No hay marcajes registrados.");
        return;
    }

    for (let i = 0; i < lista.length; i++) {
        let m = lista[i];
        console.log(
            "ID: " + m.id +
            " | Empleado: " + m.empleadoId +
            " | " + m.tipo +
            " | " + m.fechaHora +
            " | Origen: " + m.origen +
            " | Estado: " + m.estado
        );
    }
}

// muestra el menu y devuelve la opcion elegida
function mostrarMenu() {
    console.log("\n===== ASISTENCIA POR QR (CU03) =====");
    console.log("1. Simular escaneo de QR (registra entrada o salida)");
    console.log("2. Ver todos los marcajes");
    console.log("3. Ver marcajes de un empleado");
    console.log("4. Generar el QR de un empleado (guarda un .png)");
    console.log("0. Salir");
    return prompt("Elige una opción: ");
}

module.exports = {
    pedirCodigoQr: pedirCodigoQr,
    pedirId: pedirId,
    mostrarMarcajes: mostrarMarcajes,
    mostrarMenu: mostrarMenu
};
