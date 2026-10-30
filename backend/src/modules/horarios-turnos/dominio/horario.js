
const NOMBRES_DIA = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

function listaDias(dias) {
    if (dias === null || dias === undefined || dias === "") {
        return [];
    }
    return String(dias)
        .split(",")
        .map(function (n) { return Number(n); })
        .filter(function (n) { return !isNaN(n); });
}

function aFecha(texto) {
    return new Date(texto + "T00:00:00");
}

function aTexto(fecha) {
    let y = fecha.getFullYear();
    let m = String(fecha.getMonth() + 1).padStart(2, "0");
    let d = String(fecha.getDate()).padStart(2, "0");
    return y + "-" + m + "-" + d;
}

function diaIso(fecha) {
    return fecha.getDay() === 0 ? 7 : fecha.getDay();
}

function sumarDias(fecha, dias) {
    let copia = new Date(fecha.getTime());
    copia.setDate(copia.getDate() + dias);
    return copia;
}

function inicioSemana(fecha) {
    return sumarDias(fecha, 1 - diaIso(fecha));
}

function turnoCubreDia(turno, fecha) {
    return listaDias(turno.dias).indexOf(diaIso(fecha)) !== -1;
}

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

function esEspecial(asignacion) {
    return !esDiaLibre(asignacion) &&
        asignacion.fechaHasta !== null && asignacion.fechaHasta !== undefined && asignacion.fechaHasta !== "";
}

function esDiaLibre(asignacion) {
    return asignacion.estado === "Descanso";
}

function asignacionAplicaEn(asignacion, fechaTexto) {
    return asignacionCubreFecha(asignacion, fechaTexto) &&
        turnoCubreDia(asignacion.turno, aFecha(fechaTexto));
}

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

function fechaExiste(texto) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(texto || ""))) {
        return false;
    }
    return aTexto(aFecha(texto)) === texto;
}

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
