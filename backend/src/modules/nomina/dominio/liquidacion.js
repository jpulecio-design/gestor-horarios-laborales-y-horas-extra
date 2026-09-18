const repositorioHorasExtra = require("../../horas-extra/datos/repositorioHorasExtra");

// supuestos de calculo (legislacion laboral)
const HORAS_POR_MES = 240;          // 30 dias x 8 horas
const RECARGO_NOCTURNO = 0.35;      // 35%
const RECARGO_FESTIVO = 0.75;       // 75% por dominical/festivo
const PORCENTAJE_SALUD = 0.04;      // 4% a cargo del trabajador
const PORCENTAJE_PENSION = 0.04;    // 4% a cargo del trabajador

function redondear(numero) {
    return Math.round(numero * 100) / 100;
}

// valor de la hora ordinaria: salario base mensual / 240
function valorHora(salarioBase) {
    return redondear(salarioBase / HORAS_POR_MES);
}

// pago por horas con recargo nocturno o festivo
function pagoRecargo(valorHoraCalculado, horas, porcentaje) {
    return redondear(valorHoraCalculado * horas * porcentaje);
}

// suma el valor de las horas extra del empleado dentro del periodo
function pagoHorasExtra(empleadoId, periodo) {
    let lista = repositorioHorasExtra.obtenerPorEmpleadoPeriodo(empleadoId, periodo);
    let total = 0;
    for (let i = 0; i < lista.length; i++) {
        total = total + lista[i].valor;
    }
    return redondear(total);
}

// liquida la nomina y devuelve el desglose completo
function liquidar(datos) {
    let vh = valorHora(datos.salarioBase);

    let recNocturno = pagoRecargo(vh, datos.horasRecargoNocturno, RECARGO_NOCTURNO);
    let recFestivo = pagoRecargo(vh, datos.horasRecargoFestivo, RECARGO_FESTIVO);
    let extras = pagoHorasExtra(datos.empleadoId, datos.periodo);

    let totalDevengado = redondear(datos.salarioBase + recNocturno + recFestivo + extras);

    let salud = redondear(datos.salarioBase * PORCENTAJE_SALUD);
    let pension = redondear(datos.salarioBase * PORCENTAJE_PENSION);
    let totalDeducciones = redondear(salud + pension);

    let netoPagar = redondear(totalDevengado - totalDeducciones);

    return {
        salarioBase: datos.salarioBase,
        valorHora: vh,
        pagoRecargoNocturno: recNocturno,
        pagoRecargoFestivo: recFestivo,
        pagoHorasExtra: extras,
        totalDevengado: totalDevengado,
        salud: salud,
        pension: pension,
        totalDeducciones: totalDeducciones,
        netoPagar: netoPagar
    };
}

module.exports = {
    liquidar: liquidar,
    valorHora: valorHora
};