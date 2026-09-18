const estado = require("../datos/estado");

// aqui queda armada la nomina con la liquidacion ya calculada
// el objeto de liquidacion llega desde el servicio para guardar todos los valores en la nomina
function crearNomina(datos, liquidacion) {
    let nomina = {
        id: estado.contadorId,
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
        netoPagar: liquidacion.netoPagar,
        estado: "Activo",
        fechaCreacion: new Date().toLocaleString()
    };

    estado.contadorId = estado.contadorId + 1; // subimos el contador para que el proximo tenga otro id

    return nomina;
}

module.exports = {
    crearNomina: crearNomina
};