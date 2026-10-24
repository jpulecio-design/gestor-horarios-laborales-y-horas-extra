const relevo = require("../dominio/relevo");
const repositorio = require("../datos/repositorioRelevos");
const repositorioEmpleados = require("../../empleados/repositorios/repositorioEmpleados");
const telegram = require("../../notificaciones/telegram");

const horario = require("../dominio/horario");
const repositorioHorarios = require("../datos/repositorioHorarios");

const FORMATO_FECHA = /^\d{4}-\d{2}-\d{2}$/;
const DIAS_AGENDA = 14; // cuantos dias hacia adelante se muestran

// turno de un empleado en una fecha: primero la excepcion, si no la plantilla

async function turnoDeFecha(empleadoId, fecha) {
    let excepcion = await repositorio.buscarHorarioPorFecha(empleadoId, fecha);
    if (excepcion !== null) {
        excepcion.origen = "Fijado";   // ese dia ya es una fila real, no un calculo
        return excepcion;
    }

    let asignaciones = await repositorioHorarios.obtenerAsignacionesPorEmpleado(empleadoId);
    let turnoPlantilla = horario.turnoDeFecha(asignaciones, fecha);
    if (turnoPlantilla === null) {
        return null;
    }

    return relevo.turnoDesdePlantilla(turnoPlantilla, fecha);
}

// agenda de turnos actuales

// dias con turno del empleado de hoy en adelante, ya con los relevos aplicados
async function agendaDeEmpleado(empleadoId, cantidadDias) {
    let dias = cantidadDias || DIAS_AGENDA;
    let desde = relevo.fechaDeHoy();
    let hasta = relevo.sumarDias(desde, dias - 1);

    let asignaciones = await repositorioHorarios.obtenerAsignacionesPorEmpleado(empleadoId);
    let excepciones = await repositorio.obtenerHorariosEntre(empleadoId, desde, hasta);
    let cedidas = await repositorio.obtenerFechasCedidas(empleadoId, desde, hasta);

    let agenda = [];

    for (let fecha of relevo.rangoDeFechas(desde, dias)) {
        //1 excepcion para la plantilla
        let excepcion = excepciones.find(function (h) { return h.fecha === fecha; });
        if (excepcion !== undefined) {
            excepcion.origen = "Fijado";
            agenda.push(excepcion);
            continue;
        }

        // 2. mira si ya cedio ese dia
        if (cedidas.indexOf(fecha) !== -1) {
            continue;
        }

        // 3 afirma la plantilla
        let turnoPlantilla = horario.turnoDeFecha(asignaciones, fecha);
        if (turnoPlantilla !== null) {
            agenda.push(relevo.turnoDesdePlantilla(turnoPlantilla, fecha));
        }
    }

    return agenda;
}

// solicitar relevo
async function solicitarRelevo(datos) {
    let idSolicitante = Number(datos.idSolicitante);
    if (isNaN(idSolicitante) || idSolicitante <= 0) {
        return { exito: false, mensaje: "ERROR: el id del solicitante es inválido." };
    }

    let idCompanero = Number(datos.idCompanero);
    if (isNaN(idCompanero) || idCompanero <= 0) {
        return { exito: false, mensaje: "ERROR: el id del compañero es inválido." };
    }

    // la tabla prohibe el autopedirte relevo
    if (idSolicitante === idCompanero) {
        return { exito: false, mensaje: "ERROR: no puedes pedirte un relevo a ti mismo." };
    }

    if (!FORMATO_FECHA.test(datos.fecha || "")) {
        return { exito: false, mensaje: "ERROR: la fecha del turno es obligatoria (AAAA-MM-DD)." };
    }

    if (datos.fecha < relevo.fechaDeHoy()) {
        return { exito: false, mensaje: "ERROR: ese turno ya pasó (" + datos.fecha + ")." };
    }

    // ese dia si trabaja?
    let turno = await turnoDeFecha(idSolicitante, datos.fecha);
    if (turno === null) {
        return { exito: false, mensaje: "ERROR: no tienes turno asignado el " + datos.fecha + "." };
    }

    // buscarEmpleadoPorId solo devuelve usuarios con rol 'Empleado'
    let companero = await repositorioEmpleados.buscarEmpleadoPorId(idCompanero);
    if (companero === null) {
        return { exito: false, mensaje: "ERROR: no existe un empleado con ese id." };
    }

    if (companero.usuario.estado !== "Activo") {
        return { exito: false, mensaje: "ERROR: ese compañero está Inactivo." };
    }

    // si el turno todavia es un calculo de la plantilla, lo volvemos fila real
    if (turno.id === null) {
        turno = await repositorio.materializarHorario(idSolicitante, turno);
    }

    // un turno no puede estar ofrecido a dos personas a la vez
    if (await repositorio.existeSolicitudPendiente(turno.id)) {
        return { exito: false, mensaje: "ERROR: ese turno ya tiene una solicitud pendiente." };
    }

    let guardada = await repositorio.agregarSolicitud({
        idHorario: turno.id,
        idSolicitante: idSolicitante,
        idCompanero: idCompanero
    });

    // avisamos al compañero, si Telegram falla, la solicitud ya quedo guardada
    await telegram.enviarMensaje(
        guardada.companero.telegramChatId,
        relevo.mensajeSolicitud(guardada)
    );

    return {
        exito: true,
        mensaje: "Solicitud " + guardada.id + " creada para el turno del " +
            relevo.describirTurno(guardada.horario) + ".",
        datos: guardada
    };
}

// responder o confirma o rechaza
async function responderRelevo(datos) {
    let idSolicitud = Number(datos.idSolicitud);
    if (isNaN(idSolicitud) || idSolicitud <= 0) {
        return { exito: false, mensaje: "ERROR: el id de la solicitud es inválido." };
    }

    let idEmpleado = Number(datos.idEmpleado);
    if (isNaN(idEmpleado) || idEmpleado <= 0) {
        return { exito: false, mensaje: "ERROR: el id del empleado es inválido." };
    }

    let respuesta = datos.respuesta;
    if (respuesta !== "Confirmado" && respuesta !== "Rechazado") {
        return { exito: false, mensaje: "ERROR: la respuesta debe ser 'Confirmado' o 'Rechazado'." };
    }

    let solicitud = await repositorio.buscarSolicitudPorId(idSolicitud);
    if (solicitud === null) {
        return { exito: false, mensaje: "ERROR: no existe una solicitud con ese id." };
    }

    // Solo el compañero decide: ni el solicitante ni un tercero.
    if (solicitud.companero.id !== idEmpleado) {
        return { exito: false, mensaje: "ERROR: esa solicitud no es tuya para responder." };
    }

    if (solicitud.estado !== "Pendiente") {
        return { exito: false, mensaje: "ERROR: esa solicitud ya está " + solicitud.estado + "." };
    }

    // que no le quede el turno cruzado con uno propio del mismo dia
    if (respuesta === "Confirmado") {
        let turnoPropio = await turnoDeFecha(idEmpleado, solicitud.horario.fecha);
        if (turnoPropio !== null) {
            return {
                exito: false,
                mensaje: "ERROR: ya tienes tu propio turno el " + solicitud.horario.fecha + "."
            };
        }
    }

    // false = alguien respondio entre la lectura y el guardado
    if (!await repositorio.responderSolicitud(idSolicitud, respuesta)) {
        return { exito: false, mensaje: "ERROR: esa solicitud ya había sido respondida." };
    }

    // solo al confirmar cambia de dueño el turno, y SOLO el de ese dia
    if (respuesta === "Confirmado") {
        await repositorio.reasignarHorario(solicitud.horario.id, solicitud.companero.id);
    }

    await telegram.enviarMensaje(
        solicitud.solicitante.telegramChatId,
        relevo.mensajeRespuesta(solicitud, respuesta)
    );

    let actualizada = await repositorio.buscarSolicitudPorId(idSolicitud);
    let detalle = respuesta === "Confirmado"
        ? " El turno del " + solicitud.horario.fecha + " pasó a " +
          solicitud.companero.nombre + " " + solicitud.companero.apellido + "."
        : " El turno sigue siendo de " + solicitud.solicitante.nombre + ".";

    return {
        exito: true,
        mensaje: "Solicitud " + idSolicitud + " marcada como " + respuesta + "." + detalle,
        datos: actualizada
    };
}

// consultas 

function relevosEnviados(empleadoId) {
    return repositorio.obtenerEnviadas(empleadoId);
}

function relevosRecibidos(empleadoId) {
    return repositorio.obtenerRecibidas(empleadoId);
}

module.exports = {
    turnoDeFecha: turnoDeFecha,
    agendaDeEmpleado: agendaDeEmpleado,
    solicitarRelevo: solicitarRelevo,
    responderRelevo: responderRelevo,
    relevosEnviados: relevosEnviados,
    relevosRecibidos: relevosRecibidos
};