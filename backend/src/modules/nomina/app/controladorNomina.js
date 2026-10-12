const nomina = require("../dominio/nomina");
const repositorio = require("../datos/repositorioNomina");
const liquidacion = require("../dominio/liquidacion");
const repositorioEmpleados = require("../../empleados/repositorios/repositorioEmpleados");

// registra una nomina nueva con su liquidacion calculada
// devuelve { exito: true, datos } si se guardo y { exito: false, mensaje } si no
// los errores de base de datos se propagan como promesa rechazada
async function registrarNomina(datos) {
    let empleadoId = Number(datos.empleadoId);

    if (isNaN(empleadoId) || empleadoId <= 0) {
        return { exito: false, mensaje: "ERROR: el id del empleado es inválido." };
    }

    let empleado = await repositorioEmpleados.buscarEmpleadoPorId(empleadoId);

    if (empleado === null) {
        return { exito: false, mensaje: "ERROR: no existe un empleado con ese id." };
    }

    if (datos.periodo === undefined || datos.periodo.trim() === "") {
        return { exito: false, mensaje: "ERROR: el periodo es obligatorio (AAAA-MM)." };
    }

    let periodo = datos.periodo.trim();

    if (await repositorio.existePeriodoEmpleado(empleadoId, periodo)) {
        return { exito: false, mensaje: "ERROR: ya existe una nómina para ese empleado en ese periodo." };
    }

    let salarioBase = Number(datos.salarioBase);
    if (isNaN(salarioBase) || salarioBase <= 0) {
        return { exito: false, mensaje: "ERROR: el salario base debe ser mayor que 0." };
    }

    let horasRecargoNocturno = Number(datos.horasRecargoNocturno);
    if (isNaN(horasRecargoNocturno) || horasRecargoNocturno < 0) {
        horasRecargoNocturno = 0;
    }

    let horasRecargoFestivo = Number(datos.horasRecargoFestivo);
    if (isNaN(horasRecargoFestivo) || horasRecargoFestivo < 0) {
        horasRecargoFestivo = 0;
    }

    let liquida = await liquidacion.liquidar({
        empleadoId: empleadoId,
        periodo: periodo,
        salarioBase: salarioBase,
        horasRecargoNocturno: horasRecargoNocturno,
        horasRecargoFestivo: horasRecargoFestivo
    });

    let nuevaNomina = nomina.crearNomina({
        empleadoId: empleadoId,
        periodo: periodo,
        horasRecargoNocturno: horasRecargoNocturno,
        horasRecargoFestivo: horasRecargoFestivo
    }, liquida);

    let guardada = await repositorio.agregarNomina(nuevaNomina);

    return {
        exito: true,
        mensaje: "Nómina del periodo " + periodo + " registrada con id " + guardada.id + ".",
        datos: guardada
    };
}

module.exports = {
    registrarNomina: registrarNomina
};
