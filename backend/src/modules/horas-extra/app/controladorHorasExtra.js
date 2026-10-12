const horaExtra = require("../dominio/horaExtra");
const repositorio = require("../datos/repositorioHorasExtra");
const calculador = require("../dominio/calculadorHorasExtra");
const repositorioEmpleados = require("../../empleados/repositorios/repositorioEmpleados");

// registra una hora extra nueva
// devuelve { exito: true, datos } si se guardo y { exito: false, mensaje } si no
// los errores de base de datos se propagan como promesa rechazada
async function registrarHoraExtra(datos) {
    let empleadoId = Number(datos.empleadoId);

    if (isNaN(empleadoId) || empleadoId <= 0) {
        return { exito: false, mensaje: "ERROR: el id del empleado es inválido." };
    }

    let empleado = await repositorioEmpleados.buscarEmpleadoPorId(empleadoId);

    if (empleado === null) {
        return { exito: false, mensaje: "ERROR: no existe un empleado con ese id." };
    }

    if (datos.fecha === undefined || datos.fecha.trim() === "") {
        return { exito: false, mensaje: "ERROR: la fecha es obligatoria (AAAA-MM-DD)." };
    }

    let tipo = datos.tipo;
    if (!calculador.tipoValido(tipo)) {
        return { exito: false, mensaje: "ERROR: el tipo debe ser Diurna, Nocturna o Festiva." };
    }

    let cantidadHoras = Number(datos.cantidadHoras);
    if (isNaN(cantidadHoras) || cantidadHoras <= 0) {
        return { exito: false, mensaje: "ERROR: la cantidad de horas debe ser mayor que 0." };
    }

    let valorHoraBase = Number(datos.valorHoraBase);
    if (isNaN(valorHoraBase) || valorHoraBase <= 0) {
        return { exito: false, mensaje: "ERROR: el valor de la hora base debe ser mayor que 0." };
    }

    let valorCalculado = calculador.calcularValor(tipo, valorHoraBase, cantidadHoras);

    let nuevaHoraExtra = horaExtra.crearHoraExtra({
        empleadoId: empleadoId,
        fecha: datos.fecha.trim(),
        tipo: tipo,
        cantidadHoras: cantidadHoras,
        valorHoraBase: valorHoraBase,
        factorRecargo: calculador.factorRecargo(tipo)
    }, valorCalculado);

    let guardada = await repositorio.agregarHoraExtra(nuevaHoraExtra);

    return {
        exito: true,
        mensaje: "Hora extra registrada con id " + guardada.id + ".",
        datos: guardada
    };
}

module.exports = {
    registrarHoraExtra: registrarHoraExtra
};
