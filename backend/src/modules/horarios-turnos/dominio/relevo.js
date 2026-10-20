// null  "" y cualquier otro valor en texto
function textoOVacio(valor) {
    if (valor === null || valor === undefined) {
        return "";
    }
    return String(valor);
}

// una solicitud junta datos de tres tablas: SOLICITUD_RELEVO, el turno
// de HORARIO_ASIGNADO y los dos empleados. Aqui esa fila plana se vuelve
// un objeto ordenado por temas
function relevoDesdeFila(fila) {
    return {
        id: fila.ID_SOLICITUD,
        estado: textoOVacio(fila.ESTADO),              
        fechaSolicitud: textoOVacio(fila.FECHA_SOLICITUD),
        fechaRespuesta: textoOVacio(fila.FECHA_RESPUESTA),

        horario: {
            id: fila.ID_HORARIO,
            fecha: textoOVacio(fila.FECHA_TURNO),     
            horaEntrada: textoOVacio(fila.HORA_ENTRADA_PROG),
            horaSalida: textoOVacio(fila.HORA_SALIDA_PROG),
            tipoTurno: textoOVacio(fila.TIPO_TURNO)
        },

        solicitante: {
            id: fila.ID_EMPLEADO_SOLICITANTE,
            nombre: textoOVacio(fila.SOLICITANTE_NOMBRE),
            apellido: textoOVacio(fila.SOLICITANTE_APELLIDO),
            telegramChatId: textoOVacio(fila.SOLICITANTE_CHAT)
        },

        companero: {
            id: fila.ID_EMPLEADO_COMPANERO,
            nombre: textoOVacio(fila.COMPANERO_NOMBRE),
            apellido: textoOVacio(fila.COMPANERO_APELLIDO),
            telegramChatId: textoOVacio(fila.COMPANERO_CHAT)
        }
    };
}

// una fila de HORARIO_ASIGNADO equivale a un objeto turno de un dia.
function horarioDesdeFila(fila) {
    return {
        id: fila.ID_HORARIO,
        empleadoId: fila.ID_EMPLEADO,
        fecha: textoOVacio(fila.FECHA_TURNO),
        horaEntrada: textoOVacio(fila.HORA_ENTRADA_PROG),
        horaSalida: textoOVacio(fila.HORA_SALIDA_PROG),
        tipoTurno: textoOVacio(fila.TIPO_TURNO)
    };
}

function describirTurno(horario) {
    return horario.fecha + " (" + horario.tipoTurno + ", " +
        horario.horaEntrada + " a " + horario.horaSalida + ")";
}

// Fecha de hoy como AAAA-MM-DD, la devuelve al repositorio como texto pa compararla
function fechaDeHoy() {
    let hoy = new Date();
    let mes = String(hoy.getMonth() + 1).padStart(2, "0");
    let dia = String(hoy.getDate()).padStart(2, "0");
    return hoy.getFullYear() + "-" + mes + "-" + dia;
}

//  asigna PLANTILLA del compañero 
//  - de HORARIO_ASIGNADO
// Esta funcion convierte un turno de plantilla al formato que tenemos
function turnoDesdePlantilla(turnoPlantilla, fecha) {
    return {
        id: null,                       // todavia no existe como fila
        fecha: fecha,
        horaEntrada: turnoPlantilla.horaEntrada,
        horaSalida: turnoPlantilla.horaSalida,
        tipoTurno: tipoDeTurno(turnoPlantilla.horaEntrada),
        origen: "Plantilla"
    };
}

function tipoDeTurno(horaEntrada) {
    let hora = Number(String(horaEntrada).slice(0, 2));
    if (hora >= 6 && hora < 12) {
        return "Diurno";
    }
    if (hora >= 12 && hora < 18) {
        return "Vespertino";
    }
    return "Nocturno";
}

// suma dias a una fecha "AAAA-MM-DD" y devuelve el texto resultante
function sumarDias(fechaTexto, dias) {
    let fecha = new Date(fechaTexto + "T00:00:00");
    fecha.setDate(fecha.getDate() + dias);
    let mes = String(fecha.getMonth() + 1).padStart(2, "0");
    let dia = String(fecha.getDate()).padStart(2, "0");
    return fecha.getFullYear() + "-" + mes + "-" + dia;
}

// lista de fechas "AAAA-MM-DD" desde una fecha, durante N dias
function rangoDeFechas(desde, cantidadDias) {
    let fechas = [];
    for (let i = 0; i < cantidadDias; i++) {
        fechas.push(sumarDias(desde, i));
    }
    return fechas;
}

// texto para el COMPAÑERO , le acabaron de pedir cambio
function mensajeSolicitud(relevo) {
    return "Hola " + relevo.companero.nombre + ", " +
        relevo.solicitante.nombre + " " + relevo.solicitante.apellido +
        " te pidió cubrir su turno del " + describirTurno(relevo.horario) + ".\n" +
        "Solicitud #" + relevo.id + ". Entra al sistema para confirmar o rechazar.";
}

// texto para el SOLICITANTE, su compañero ya respondio
function mensajeRespuesta(relevo, respuesta) {
    let mensaje = "Hola " + relevo.solicitante.nombre + ", " +
        relevo.companero.nombre + " " + relevo.companero.apellido;

    if (respuesta === "Confirmado") {
        return mensaje + " CONFIRMÓ tu solicitud de relevo #" + relevo.id + ".\n" +
            "El turno del " + describirTurno(relevo.horario) + " queda a su cargo.";
    }

    return mensaje + " RECHAZÓ tu solicitud de relevo #" + relevo.id + ".\n" +
        "El turno del " + describirTurno(relevo.horario) + " sigue siendo tuyo.";
}

module.exports = {
    relevoDesdeFila: relevoDesdeFila,
    turnoDesdePlantilla: turnoDesdePlantilla,
    tipoDeTurno: tipoDeTurno,
    sumarDias: sumarDias,
    rangoDeFechas: rangoDeFechas,
    horarioDesdeFila: horarioDesdeFila,
    describirTurno: describirTurno,
    fechaDeHoy: fechaDeHoy,
    mensajeSolicitud: mensajeSolicitud,
    mensajeRespuesta: mensajeRespuesta
};