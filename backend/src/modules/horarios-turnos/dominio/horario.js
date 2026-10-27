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

// true si la fecha "AAAA-MM-DD" existe de verdad (rechaza 2026-02-30, 2026-13-01...)
function fechaExiste(texto) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(texto || ""))) {
        return false;
    }
    return aTexto(aFecha(texto)) === texto;
}

// Fecha hasta vacia = indefinida. Se compara como un valor muy lejano.
const FIN_INDEFINIDO = "9999-12-31";

function finDeRango(fechaHasta) {
    return fechaHasta === null || fechaHasta === undefined || fechaHasta === "" ? FIN_INDEFINIDO : fechaHasta;
}

// true si dos asignaciones ponen al empleado en dos turnos el mismo dia:
// sus fechas se cruzan y, dentro del cruce, cae un dia de la semana que ambos turnos cubren.
// Cada asignacion es { fechaDesde, fechaHasta, dias } con dias = "1,2,3,4,5".
// Ej: Diurno (1-5) y Fin de semana (6,7) en las mismas fechas NO se solapan.
function asignacionesSeSolapan(a, b) {
    let inicio = a.fechaDesde > b.fechaDesde ? a.fechaDesde : b.fechaDesde;
    let finA = finDeRango(a.fechaHasta);
    let finB = finDeRango(b.fechaHasta);
    let fin = finA < finB ? finA : finB;
    if (inicio > fin) {
        return false; // las fechas no se cruzan
    }

    let diasB = listaDias(b.dias);
    let comunes = listaDias(a.dias).filter(function (d) { return diasB.indexOf(d) !== -1; });
    if (comunes.length === 0) {
        return false; // los turnos no comparten dias de la semana
    }

    // basta con revisar los primeros 7 dias del cruce: ahi aparece cada dia de la semana
    let fecha = aFecha(inicio);
    for (let i = 0; i < 7 && aTexto(fecha) <= fin; i++) {
        if (comunes.indexOf(diaIso(fecha)) !== -1) {
            return true;
        }
        fecha = sumarDias(fecha, 1);
    }
    return false;
}

// Devuelve la primera asignacion existente (con su turno) que se solapa con la nueva, o null.
// nueva = { fechaDesde, fechaHasta, dias }
function buscarConflicto(asignaciones, nueva) {
    for (let i = 0; i < asignaciones.length; i++) {
        let a = asignaciones[i];
        let existente = { fechaDesde: a.fechaDesde, fechaHasta: a.fechaHasta, dias: a.turno.dias };
        if (asignacionesSeSolapan(existente, nueva)) {
            return a;
        }
    }
    return null;
}

module.exports = {
    fechaExiste: fechaExiste,
    asignacionesSeSolapan: asignacionesSeSolapan,
    buscarConflicto: buscarConflicto,
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
