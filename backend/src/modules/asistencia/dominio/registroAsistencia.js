// Reglas del dominio de asistencia (CU03: Registro de Entrada/Salida por QR).

// La entrada y la salida se alternan de forma automatica: si el ultimo
// marcaje fue una salida (o no hay marcajes) el siguiente es una entrada;
// si el ultimo fue una entrada, el siguiente es una salida.
function siguienteTipo(ultimoRegistro) {
    if (ultimoRegistro === null || ultimoRegistro === undefined) {
        return "Entrada";
    }
    if (ultimoRegistro.tipo === "Salida") {
        return "Entrada";
    }
    return "Salida";
}

// Arma el objeto que se va a guardar. El id y la fecha_hora los pone la base
// de datos, por eso aqui no aparecen.
function crearRegistro(datos) {
    return {
        empleadoId: datos.empleadoId,
        tipo: datos.tipo,
        origen: datos.origen || "QR",
        observacion: datos.observacion || null
    };
}

module.exports = {
    siguienteTipo: siguienteTipo,
    crearRegistro: crearRegistro
};
