// Arma el objeto nomina con la liquidacion ya calculada por el dominio.
// El id, el estado y la fecha de creacion los asigna la base de datos,
// por eso aqui no aparecen.
function crearNomina(datos, liquidacion) {
    return {
        empleadoId: datos.empleadoId,
        periodo: datos.periodo,
        horasRecargoNocturno: datos.horasRecargoNocturno,
        horasRecargoFestivo: datos.horasRecargoFestivo,
        salarioBase: liquidacion.salarioBase,
        valorHora: liquidacion.valorHora,
        pagoRecargoNocturno: liquidacion.pagoRecargoNocturno,
        pagoRecargoFestivo: liquidacion.pagoRecargoFestivo,
        pagoHorasExtra: liquidacion.pagoHorasExtra,
        totalDevengado: liquidacion.totalDevengado,
        salud: liquidacion.salud,
        pension: liquidacion.pension,
        totalDeducciones: liquidacion.totalDeducciones,
        netoPagar: liquidacion.netoPagar
    };
}

module.exports = {
    crearNomina: crearNomina
};
