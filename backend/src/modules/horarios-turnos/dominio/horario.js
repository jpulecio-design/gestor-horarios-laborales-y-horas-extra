// Dominio de horarios y turnos (CU05: Visualizar Horarios Asignados).
// Funciones puras: reciben los datos ya leidos y no tocan la base de datos.

const NOMBRES_DIA = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

// "1,2,3,4,5" -> [1,2,3,4,5]
function listaDias(dias) {
    if (dias === null || dias === undefined || dias === "") {
        return [];
    }
    return String(dias)
        .split(",")
        .map(function (n) { return Number(n); })
        .filter(function (n) { return !isNaN(n); });
}

// "AAAA-MM-DD" -> Date local (evita el desfase de zona horaria).
function aFecha(texto) {
    return new Date(texto + "T00:00:00");
}

// Date -> "AAAA-MM-DD"
function aTexto(fecha) {
    let y = fecha.getFullYear();
    let m = String(fecha.getMonth() + 1).padStart(2, "0");
    let d = String(fecha.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + d;
}

// dia ISO: Lunes = 1 ... Domingo = 7
function diaIso(fecha) {
    return fecha.getDay() === 0 ? 7 : fecha.getDay();
}

function sumarDias(fecha, dias) {
    let copia = new Date(fecha.getTime());
    copia.setDate(copia.getDate() + dias);
    return copia;
}

// Lunes de la semana a la que pertenece la fecha.
function inicioSemana(fecha) {
    return sumarDias(fecha, 1 - diaIso(fecha));
}

// true si el turno incluye ese dia de la semana.
function turnoCubreDia(turno, fecha) {
    return listaDias(turno.dias).indexOf(diaIso(fecha)) !== -1;
}

// true si la asignacion esta vigente en esa fecha "AAAA-MM-DD".
function asignacionCubreFecha(asignacion, fechaTexto) {
    if (fechaTexto < asignacion.fechaDesde) {
        return false;
    }
    if (asignacion.fechaHasta !== null && asignacion.fechaHasta !== "" &&
        fechaTexto > asignacion.fechaHasta) {
        return false;
    }
    return true;
}

// Una asignacion con fecha "hasta" es un turno especial (temporal): mientras dura, reemplaza
// al horario base del empleado, que es la asignacion sin fecha final. Al pasar la fecha
// "hasta" el especial deja de aplicar y el base vuelve a verse solo.
function esEspecial(asignacion) {
    return !esDiaLibre(asignacion) &&
        asignacion.fechaHasta !== null && asignacion.fechaHasta !== undefined && asignacion.fechaHasta !== "";
}

// Un "dia libre" quita el turno base de UN solo dia (desde = hasta). Se guarda como una asignacion
// de ese dia con estado "Descanso", asi no hace falta tocar la estructura de la tabla.
function esDiaLibre(asignacion) {
    return asignacion.estado === "Descanso";
}

// true si la asignacion aplica en esa fecha: esta vigente y su turno cubre ese dia de la semana.
function asignacionAplicaEn(asignacion, fechaTexto) {
    return asignacionCubreFecha(asignacion, fechaTexto) &&
        turnoCubreDia(asignacion.turno, aFecha(fechaTexto));
}

// Devuelve el turno vigente para esa fecha (con el id y el tipo de la asignacion que lo aplica)
// o null si no hay ninguno. Si coinciden un especial y el base, gana el especial.
// Un dia libre anula el turno base de ese dia, pero no un turno especial.
function turnoDeFecha(asignaciones, fechaTexto) {
    let elegida = null;
    let hayDiaLibre = false;
    for (let i = 0; i < asignaciones.length; i++) {
        let a = asignaciones[i];
        if (!asignacionAplicaEn(a, fechaTexto)) {
            continue;
        }
        if (esDiaLibre(a)) {
            hayDiaLibre = true;
        } else if (elegida === null || (esEspecial(a) && !esEspecial(elegida))) {
            elegida = a;
        }
    }
    if (elegida === null || (hayDiaLibre && !esEspecial(elegida))) {
        return null;
    }
    return Object.assign({}, elegida.turno, {
        asignacionId: elegida.id,
        tipoAsignacion: esEspecial(elegida) ? "Especial" : "Base"
    });
}

// Grilla de 7 dias (lunes a domingo) con el turno que aplica a cada uno.
function construirSemana(asignaciones, fechaReferenciaTexto) {
    let inicio = inicioSemana(aFecha(fechaReferenciaTexto));
    let dias = [];

    for (let i = 0; i < 7; i++) {
        let fecha = sumarDias(inicio, i);
        let texto = aTexto(fecha);
        dias.push({
            fecha: texto,
            dia: NOMBRES_DIA[fecha.getDay()],
            diaIso: diaIso(fecha),
            turno: turnoDeFecha(asignaciones, texto)
        });
    }

    return dias;
}

// true si la fecha "AAAA-MM-DD" existe de verdad (rechaza 2026-02-30, 2026-13-01...)
function fechaExiste(texto) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(texto || ""))) {
        return false;
    }
    return aTexto(aFecha(texto)) === texto;
}

// La deteccion de choques entre asignaciones (necesita las horas) esta en programacion.js.

module.exports = {
    fechaExiste: fechaExiste,
    NOMBRES_DIA: NOMBRES_DIA,
    listaDias: listaDias,
    aFecha: aFecha,
    aTexto: aTexto,
    inicioSemana: inicioSemana,
    turnoCubreDia: turnoCubreDia,
    asignacionCubreFecha: asignacionCubreFecha,
    asignacionAplicaEn: asignacionAplicaEn,
    esEspecial: esEspecial,
    esDiaLibre: esDiaLibre,
    turnoDeFecha: turnoDeFecha,
    construirSemana: construirSemana
};
