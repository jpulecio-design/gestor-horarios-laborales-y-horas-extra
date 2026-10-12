// Arma el objeto hora extra con el valor ya calculado por el servicio.
// El id, el estado y la fecha de creacion los asigna la base de datos,
// por eso aqui no aparecen.
function crearHoraExtra(datos, valorCalculado) {
    return {
        empleadoId: datos.empleadoId,
        fecha: datos.fecha,
        tipo: datos.tipo,
        cantidadHoras: datos.cantidadHoras,
        valorHoraBase: datos.valorHoraBase,
        factorRecargo: datos.factorRecargo,
        valor: valorCalculado
    };
}

module.exports = {
    crearHoraExtra: crearHoraExtra
};
