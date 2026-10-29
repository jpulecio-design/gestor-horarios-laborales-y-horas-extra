const horario = require("../dominio/horario");
const programacion = require("../dominio/programacion");
const repositorio = require("../datos/repositorioHorarios");
const repositorioProgramacion = require("../datos/repositorioProgramacion");
const repositorioEmpleados = require("../../empleados/repositorios/repositorioEmpleados");


// Acepta "1,2,3,4,5" o [1,2,3,4] y devuelve "1,2,3,4,5" ordenado y sin repetir.
// Devuelve null si no queda ningun dia valido.
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

// -------------------- crear turno --------------------
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

// -------------------- asignar turno a un empleado --------------------
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

    let existentes = await repositorio.obtenerAsignacionesPorEmpleado(empleadoId);
    let conflicto = horario.buscarConflicto(existentes,
        { fechaDesde: datos.fechaDesde, fechaHasta: fechaHasta, dias: turno.dias });
    if (conflicto !== null) {
        return {
            exito: false,
            mensaje: "ERROR: el empleado ya tiene el turno \"" + conflicto.turno.nombre + "\" entre " +
                conflicto.fechaDesde + " y " + (conflicto.fechaHasta || "indefinido") +
                ", que coincide en días con este rango."
        };
    }

    let guardada = await repositorio.agregarAsignacion({
        empleadoId: empleadoId,
        turnoId: turnoId,
        fechaDesde: datos.fechaDesde,
        fechaHasta: fechaHasta
    });

    return {
        exito: true,
        mensaje: "Horario asignado al empleado " + empleadoId + " (asignación " + guardada.id + ").",
        datos: guardada
    };
}

// -------------------- visualizacion --------------------

// Todas las asignaciones (turnos) de un empleado.
function horarioDeEmpleado(empleadoId) {
    return repositorio.obtenerAsignacionesPorEmpleado(empleadoId);
}

// Calendario operativo: el turno programado para un dia exacto (CU04, tabla
// HORARIO_ASIGNADO) tiene prioridad sobre el turno de la plantilla (TURNO +
// ASIGNACION_HORARIO). "origen" indica de donde sale cada turno.
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

// Turno vigente hoy (o en la fecha indicada).
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

// Grilla de 7 dias (lunes a domingo) con el turno de cada dia.
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
    horarioDeHoy: horarioDeHoy,
    semanaDeEmpleado: semanaDeEmpleado
};
