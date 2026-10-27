const horaExtra = require("../dominio/horaExtra");
const repositorio = require("../datos/repositorioHorasExtra");
const calculador = require("../dominio/calculadorHorasExtra");
const repositorioEmpleados = require("../../empleados/repositorios/repositorioEmpleados");

// registra una hora extra nueva
async function registrarHoraExtra(datos) {
    let empleadoId = Number(datos.empleadoId);

    if (isNaN(empleadoId) || empleadoId <= 0) {
        return { exito: false, mensaje: "ERROR: el id del empleado es inválido." };
    }

    let empleado = await repositorioEmpleados.buscarEmpleadoPorId(empleadoId);

    if (empleado === null) {
        return { exito: false, mensaje: "ERROR: no existe un empleado con ese id." };
    }

    if (datos.fecha === undefined || datos.fecha === null || String(datos.fecha).trim() === "") {
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
        fecha: String(datos.fecha).trim(),
        tipo: tipo,
        cantidadHoras: cantidadHoras,
        valorHoraBase: valorHoraBase,
        factorRecargo: calculador.factorRecargo(tipo)
    }, valorCalculado);

    let guardada = await repositorio.agregarHoraExtra(nuevaHoraExtra);

    return {
        exito: true,
        mensaje: "Hora extra registrada con id " + guardada.id + ". Pendiente de aprobación.",
        datos: guardada
    };
}

async function aprobarHoraExtra(idHoraExtra, aprobadoPorId, observacion) {
    if (!idHoraExtra) {
        return { exito: false, mensaje: "ERROR: ID de hora extra requerido." };
    }
    if (!aprobadoPorId) {
        return { exito: false, mensaje: "ERROR: ID del aprobador requerido." };
    }
    const existente = await repositorio.buscarPorId(Number(idHoraExtra));
    if (!existente) {
        return { exito: false, mensaje: "ERROR: no existe una hora extra con ese id." };
    }
    if (existente.estadoAprobacion === "Aprobado") {
        return { exito: false, mensaje: "ERROR: la hora extra ya se encuentra aprobada." };
    }
    const actualizado = await repositorio.aprobarHoraExtra(Number(idHoraExtra), Number(aprobadoPorId), observacion || null);
    return { exito: true, mensaje: "Hora extra aprobada correctamente.", datos: actualizado };
}

async function rechazarHoraExtra(idHoraExtra, aprobadoPorId, observacion) {
    if (!idHoraExtra) {
        return { exito: false, mensaje: "ERROR: ID de hora extra requerido." };
    }
    if (!aprobadoPorId) {
        return { exito: false, mensaje: "ERROR: ID del aprobador requerido." };
    }
    const existente = await repositorio.buscarPorId(Number(idHoraExtra));
    if (!existente) {
        return { exito: false, mensaje: "ERROR: no existe una hora extra con ese id." };
    }
    if (existente.estadoAprobacion === "Rechazado") {
        return { exito: false, mensaje: "ERROR: la hora extra ya se encuentra rechazada." };
    }
    const actualizado = await repositorio.rechazarHoraExtra(Number(idHoraExtra), Number(aprobadoPorId), observacion || null);
    return { exito: true, mensaje: "Hora extra rechazada correctamente.", datos: actualizado };
}

module.exports = {
    registrarHoraExtra: registrarHoraExtra,
    aprobarHoraExtra: aprobarHoraExtra,
    rechazarHoraExtra: rechazarHoraExtra
};
