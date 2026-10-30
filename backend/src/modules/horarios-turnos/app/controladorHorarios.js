const horario = require("../dominio/horario");
const programacion = require("../dominio/programacion");
const repositorio = require("../datos/repositorioHorarios");
const repositorioProgramacion = require("../datos/repositorioProgramacion");
const repositorioEmpleados = require("../../empleados/repositorios/repositorioEmpleados");

function normalizarDias(dias) {
    let lista;

    if (Array.isArray(dias)) {
        lista = dias.map(Number);
    } else if (typeof dias === "string") {
        lista = dias.split(",").map(function (s) { return Number(s.trim()); });
    } else {
        return null;
    }

    lista = lista.filter(function (n) {
        return Number.isInteger(n) && n >= 1 && n <= 7;
    });

    if (lista.length === 0) {
        return null;
    }

    lista.sort(function (a, b) { return a - b; });
    let unicos = [];
    for (let i = 0; i < lista.length; i++) {
        if (unicos.indexOf(lista[i]) === -1) {
            unicos.push(lista[i]);
        }
    }

    return unicos.join(",");
}

async function registrarTurno(datos) {
    if (datos.nombre === undefined || String(datos.nombre).trim() === "") {
        return { exito: false, mensaje: "ERROR: el nombre del turno es obligatorio." };
    }
    let nombre = String(datos.nombre).trim();

    if (!programacion.horaValida(datos.horaEntrada)) {
        return { exito: false, mensaje: "ERROR: la hora de entrada debe ser HH:MM (ej: 08:00)." };
    }
    if (!programacion.horaValida(datos.horaSalida)) {
        return { exito: false, mensaje: "ERROR: la hora de salida debe ser HH:MM (ej: 17:00)." };
    }

    if (datos.horaEntrada === datos.horaSalida) {
        return { exito: false, mensaje: "ERROR: la hora de salida no puede ser igual a la hora de entrada." };
    }

    let dias = normalizarDias(datos.dias);
    if (dias === null) {
        return { exito: false, mensaje: "ERROR: los días deben ser números del 1 (lunes) al 7 (domingo)." };
    }

    if (await repositorio.existeNombreTurno(nombre)) {
        return { exito: false, mensaje: "ERROR: ya existe un turno con ese nombre." };
    }

    let guardado = await repositorio.agregarTurno({
        nombre: nombre,
        horaEntrada: datos.horaEntrada,
        horaSalida: datos.horaSalida,
        dias: dias
    });

    return {
        exito: true,
        mensaje: "Turno \"" + nombre + "\" creado con id " + guardado.id + ".",
        datos: guardado
    };
}

async function mensajeDeChoque(empleadoId, turno, fechaDesde, fechaHasta, ignorarId) {
    let existentes = (await repositorio.obtenerAsignacionesPorEmpleado(empleadoId))
        .filter(function (a) { return a.id !== ignorarId; });
    let conflicto = programacion.buscarConflictoAsignacion(existentes, {
        fechaDesde: fechaDesde, fechaHasta: fechaHasta, dias: turno.dias,
        horaEntrada: turno.horaEntrada, horaSalida: turno.horaSalida
    });
    if (conflicto !== null) {
        let otro = conflicto.asignacion;
        let descripcionOtro = "el turno \"" + otro.turno.nombre + "\" (" + otro.turno.horaEntrada + "-" +
            otro.turno.horaSalida + ") que el empleado ya tiene entre " + otro.fechaDesde + " y " +
            (otro.fechaHasta || "indefinido");

        if (conflicto.fecha !== null) {
            return "ERROR: la fecha " + conflicto.fecha + " ya tiene un horario asignado: " + descripcionOtro + ".";
        }
        return "ERROR: el turno \"" + turno.nombre + "\" (" + turno.horaEntrada + "-" + turno.horaSalida +
            ") se cruza en horario con " + descripcionOtro + "." +
            (fechaHasta === null ? " Si es un turno temporal, indica la fecha \"Hasta\"." : "");
    }

    if (fechaHasta !== null) {
        let programados = await repositorioProgramacion.obtenerPorEmpleadoEntre(empleadoId, fechaDesde, fechaHasta);
        let ocupado = programados.find(function (d) {
            return horario.turnoCubreDia(turno, horario.aFecha(d.fecha));
        });
        if (ocupado !== undefined) {
            return "ERROR: la fecha " + ocupado.fecha + " ya tiene un horario asignado: programación diaria " +
                ocupado.tipoTurno + " " + ocupado.horaEntrada + "-" + ocupado.horaSalida + ".";
        }
    }

    return null;
}

async function asignarHorario(datos) {
    let empleadoId = Number(datos.empleadoId);
    if (isNaN(empleadoId) || empleadoId <= 0) {
        return { exito: false, mensaje: "ERROR: el id del empleado es inválido." };
    }

    let turnoId = Number(datos.turnoId);
    if (isNaN(turnoId) || turnoId <= 0) {
        return { exito: false, mensaje: "ERROR: el id del turno es inválido." };
    }

    if (await repositorioEmpleados.buscarEmpleadoPorId(empleadoId) === null) {
        return { exito: false, mensaje: "ERROR: no existe un empleado con ese id." };
    }

    let turno = await repositorio.buscarTurnoPorId(turnoId);
    if (turno === null) {
        return { exito: false, mensaje: "ERROR: no existe un turno con ese id." };
    }

    if (!horario.fechaExiste(datos.fechaDesde)) {
        return { exito: false, mensaje: "ERROR: la fecha desde es obligatoria y debe ser real (AAAA-MM-DD)." };
    }

    let fechaHasta = null;
    if (datos.fechaHasta !== undefined && datos.fechaHasta !== null &&
        String(datos.fechaHasta).trim() !== "") {
        if (!horario.fechaExiste(datos.fechaHasta)) {
            return { exito: false, mensaje: "ERROR: la fecha hasta debe ser una fecha real (AAAA-MM-DD)." };
        }
        if (datos.fechaHasta < datos.fechaDesde) {
            return { exito: false, mensaje: "ERROR: la fecha hasta no puede ser anterior a la fecha desde." };
        }
        fechaHasta = datos.fechaHasta;
    }

    let choque = await mensajeDeChoque(empleadoId, turno, datos.fechaDesde, fechaHasta);
    if (choque !== null) {
        return { exito: false, mensaje: choque };
    }

    let guardada = await repositorio.agregarAsignacion({
        empleadoId: empleadoId,
        turnoId: turnoId,
        fechaDesde: datos.fechaDesde,
        fechaHasta: fechaHasta
    });

    return {
        exito: true,
        mensaje: "Horario asignado al empleado " + empleadoId + " (asignación " + guardada.id + ")." +
            (fechaHasta === null ? "" :
                " Es un turno especial: reemplaza su horario base del " + datos.fechaDesde + " al " + fechaHasta +
                " y después el horario base vuelve a aplicarse solo."),
        datos: guardada
    };
}

function horarioDeEmpleado(empleadoId) {
    return repositorio.obtenerAsignacionesPorEmpleado(empleadoId, true);
}

async function desactivarAsignacion(asignacionId) {
    let id = Number(asignacionId);
    if (!Number.isInteger(id) || id <= 0) {
        return { exito: false, mensaje: "ERROR: el id de la asignación es inválido." };
    }

    let asignacion = await repositorio.buscarAsignacionPorId(id);
    if (asignacion === null) {
        return { exito: false, noEncontrado: true, mensaje: "ERROR: no existe una asignación con el id " + id + "." };
    }

    if (asignacion.estado === "Descanso") {
        await repositorio.eliminarDiaLibre(id);
        return { exito: true, mensaje: "Se restauró el turno base del " + asignacion.fechaDesde + "." };
    }

    if (asignacion.estado !== "Activo" || !await repositorio.desactivarAsignacion(id)) {
        return { exito: false, mensaje: "ERROR: la asignación " + id + " ya está desactivada." };
    }
    return {
        exito: true,
        mensaje: "Se desactivó el turno \"" + asignacion.turno.nombre + "\" (" + asignacion.fechaDesde +
            " a " + (asignacion.fechaHasta || "sin fecha final") + ")."
    };
}

async function reactivarAsignacion(asignacionId) {
    let id = Number(asignacionId);
    if (!Number.isInteger(id) || id <= 0) {
        return { exito: false, mensaje: "ERROR: el id de la asignación es inválido." };
    }

    let asignacion = await repositorio.buscarAsignacionPorId(id);
    if (asignacion === null) {
        return { exito: false, noEncontrado: true, mensaje: "ERROR: no existe una asignación con el id " + id + "." };
    }
    if (asignacion.estado !== "Inactivo") {
        return { exito: false, mensaje: "ERROR: la asignación " + id + " ya está activa." };
    }

    let choque = await mensajeDeChoque(asignacion.empleadoId, asignacion.turno, asignacion.fechaDesde,
        asignacion.fechaHasta === undefined ? null : asignacion.fechaHasta, id);
    if (choque !== null) {
        return { exito: false, mensaje: choque };
    }

    if (!await repositorio.activarAsignacion(id)) {
        return { exito: false, mensaje: "ERROR: la asignación " + id + " ya está activa." };
    }
    return {
        exito: true,
        mensaje: "Se reactivó el turno \"" + asignacion.turno.nombre + "\" (" + asignacion.fechaDesde +
            " a " + (asignacion.fechaHasta || "sin fecha final") + ")."
    };
}

async function quitarDiaBase(empleadoId, fecha) {
    let id = Number(empleadoId);
    if (!Number.isInteger(id) || id <= 0) {
        return { exito: false, mensaje: "ERROR: el id del empleado es inválido." };
    }
    if (!horario.fechaExiste(fecha)) {
        return { exito: false, mensaje: "ERROR: la fecha debe ser válida (AAAA-MM-DD)." };
    }
    if (await repositorioEmpleados.buscarEmpleadoPorId(id) === null) {
        return { exito: false, noEncontrado: true, mensaje: "ERROR: no existe un empleado con ese id." };
    }

    let asignaciones = await repositorio.obtenerAsignacionesPorEmpleado(id);
    let turno = horario.turnoDeFecha(asignaciones, fecha);
    if (turno === null) {
        return { exito: false, noEncontrado: true, mensaje: "ERROR: el empleado no tiene horario base el " + fecha + "." };
    }
    if (turno.tipoAsignacion === "Especial") {
        return { exito: false, mensaje: "ERROR: el " + fecha + " lo cubre un turno especial, no el horario base." };
    }

    let base = asignaciones.find(function (a) { return a.id === turno.asignacionId; });
    await repositorio.agregarDiaLibre({ empleadoId: id, turnoId: base.turnoId, fecha: fecha });
    return { exito: true, mensaje: "Se quitó el turno base del " + fecha + ". Los demás días no cambian." };
}

function turnoProgramado(dia) {
    return {
        id: null,
        nombre: dia.tipoTurno,
        tipoTurno: dia.tipoTurno,
        horaEntrada: dia.horaEntrada,
        horaSalida: dia.horaSalida,
        origen: "Programación"
    };
}

function turnoDePlantilla(turno) {
    return turno === null ? null : Object.assign({}, turno, { origen: "Plantilla" });
}

async function horarioDeHoy(empleadoId, fechaTexto) {
    let asignaciones = await repositorio.obtenerAsignacionesPorEmpleado(empleadoId);
    let hoy = fechaTexto || horario.aTexto(new Date());
    let programados = await repositorioProgramacion.obtenerPorEmpleadoEntre(empleadoId, hoy, hoy);

    return {
        empleadoId: empleadoId,
        fecha: hoy,
        turno: programados.length > 0
            ? turnoProgramado(programados[0])
            : turnoDePlantilla(horario.turnoDeFecha(asignaciones, hoy))
    };
}

async function semanaDeEmpleado(empleadoId, fechaTexto) {
    let asignaciones = await repositorio.obtenerAsignacionesPorEmpleado(empleadoId);
    let referencia = fechaTexto || horario.aTexto(new Date());
    let inicio = horario.aTexto(horario.inicioSemana(horario.aFecha(referencia)));
    let dias = horario.construirSemana(asignaciones, referencia);

    let programados = await repositorioProgramacion.obtenerPorEmpleadoEntre(
        empleadoId, inicio, dias[dias.length - 1].fecha);
    let porFecha = {};
    programados.forEach(function (d) { porFecha[d.fecha] = d; });

    return {
        empleadoId: empleadoId,
        inicio: inicio,
        dias: dias.map(function (d) {
            return Object.assign({}, d, {
                turno: porFecha[d.fecha] ? turnoProgramado(porFecha[d.fecha]) : turnoDePlantilla(d.turno)
            });
        })
    };
}

module.exports = {
    registrarTurno: registrarTurno,
    asignarHorario: asignarHorario,
    horarioDeEmpleado: horarioDeEmpleado,
    desactivarAsignacion: desactivarAsignacion,
    reactivarAsignacion: reactivarAsignacion,
    quitarDiaBase: quitarDiaBase,
    horarioDeHoy: horarioDeHoy,
    semanaDeEmpleado: semanaDeEmpleado
};
