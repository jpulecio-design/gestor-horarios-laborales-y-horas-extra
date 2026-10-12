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

// Devuelve el turno vigente para esa fecha o null si no hay ninguno.
function turnoDeFecha(asignaciones, fechaTexto) {
    let fecha = aFecha(fechaTexto);
    for (let i = 0; i < asignaciones.length; i++) {
        let a = asignaciones[i];
        if (asignacionCubreFecha(a, fechaTexto) && turnoCubreDia(a.turno, fecha)) {
            return a.turno;
        }
    }
    return null;
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

module.exports = {
    NOMBRES_DIA: NOMBRES_DIA,
    listaDias: listaDias,
    aFecha: aFecha,
    aTexto: aTexto,
    inicioSemana: inicioSemana,
    turnoCubreDia: turnoCubreDia,
    asignacionCubreFecha: asignacionCubreFecha,
    turnoDeFecha: turnoDeFecha,
    construirSemana: construirSemana
};
