const estado = require("../datos/estado");

// aqui queda armada la hora extra con su valor ya calculado
// el valor entra ya calculado por el servicio para no mezclar responsabilidades
function crearHoraExtra(datos, valorCalculado) {
    let horaExtra = {
        id: estado.contadorId,
        empleadoId: datos.empleadoId,
        fecha: datos.fecha,
        tipo: datos.tipo,
        cantidadHoras: datos.cantidadHoras,
        valorHoraBase: datos.valorHoraBase,
        factorRecargo: datos.factorRecargo,
        valor: valorCalculado,
        estado: "Activo",
        fechaCreacion: new Date().toLocaleString()
    };

    estado.contadorId = estado.contadorId + 1; // subimos el contador para que el proximo tenga otro id

    return horaExtra;
}

module.exports = {
    crearHoraExtra: crearHoraExtra
};