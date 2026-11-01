// Dominio de la programacion diaria de horarios (CU04: Parametrizar Horarios y Plantillas de Turnos).
// Funciones puras: reciben los datos ya leidos y no tocan la base de datos.
// Las usan por igual la carga manual (PUT) y la importacion desde Excel.
//
// Cada dia programado es { fecha: "AAAA-MM-DD", horaEntrada: "HH:MM", horaSalida: "HH:MM", tipoTurno }.
// Si la hora de salida es menor o igual que la de entrada, el turno termina al dia
// siguiente (ej. Nocturno 22:00 -> 06:00).

const horario = require("./horario");

// Catalogo de tipos de turno. Coincide con el CHECK ck_horario_tipo de HORARIO_ASIGNADO.
const TIPOS_TURNO = ["Diurno", "Vespertino", "Nocturno"];

const FORMATO_HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

const MINUTOS_DIA = 24 * 60;

function estaVacio(valor) {
    return valor === undefined || valor === null || String(valor).trim() === "";
}

function horaValida(texto) {
    return FORMATO_HORA.test(String(texto || ""));
}

// "diurno" -> "Diurno"; devuelve null si no es un tipo del catalogo.
function normalizarTipo(texto) {
    let buscado = String(texto || "").trim().toLowerCase();
    let tipo = TIPOS_TURNO.find(function (t) { return t.toLowerCase() === buscado; });
    return tipo === undefined ? null : tipo;
}

function aMinutos(hora) {
    let partes = hora.split(":");
    return Number(partes[0]) * 60 + Number(partes[1]);
}

// Numero de dia absoluto de una fecha "AAAA-MM-DD", calculado en UTC para que
// la zona horaria del servidor no mueva la fecha.
function numeroDeDia(fecha) {
    let p = fecha.split("-").map(Number);
    return Date.UTC(p[0], p[1] - 1, p[2]) / 86400000;
}

function cruzaMedianoche(dia) {
    return aMinutos(dia.horaSalida) <= aMinutos(dia.horaEntrada);
}

// Intervalo del turno en minutos absolutos: [inicio, fin).
function intervalo(dia) {
    let base = numeroDeDia(dia.fecha) * MINUTOS_DIA;
    let inicio = base + aMinutos(dia.horaEntrada);
    let fin = base + aMinutos(dia.horaSalida) + (cruzaMedianoche(dia) ? MINUTOS_DIA : 0);
    return { inicio: inicio, fin: fin };
}

// Horas programadas del turno (ej. 22:00 -> 06:00 = 8). Sirve de base para CU06.
function horasProgramadas(dia) {
    let i = intervalo(dia);
    return Math.round(((i.fin - i.inicio) / 60) * 100) / 100;
}

// true si dos turnos del mismo empleado se pisan. Que uno termine justo cuando
// el otro empieza (ej. 06:00-14:00 y 14:00-22:00) NO es solapamiento.
function seSolapan(a, b) {
    let x = intervalo(a);
    let y = intervalo(b);
    return x.inicio < y.fin && y.inicio < x.fin;
}

function sumarDias(fecha, dias) {
    return horario.aTexto(new Date(horario.aFecha(fecha).getTime() + dias * 86400000 + 12 * 3600000));
}

// Fecha de hoy "AAAA-MM-DD" segun el reloj local del servidor.
function hoyTexto() {
    return horario.aTexto(new Date());
}

function textoTurno(dia) {
    return dia.tipoTurno + " " + dia.horaEntrada + "-" + dia.horaSalida + " del " + dia.fecha;
}

// Valida un dia. Devuelve { dia, errores }:
//   dia     -> el dia normalizado (tipoTurno con mayuscula inicial, textos sin espacios) o null
//   errores -> [{ campo, mensaje }]
function validarDia(datos, hoy) {
    let errores = [];
    let fecha = estaVacio(datos.fecha) ? "" : String(datos.fecha).trim();
    let horaEntrada = estaVacio(datos.horaEntrada) ? "" : String(datos.horaEntrada).trim();
    let horaSalida = estaVacio(datos.horaSalida) ? "" : String(datos.horaSalida).trim();

    if (fecha === "") {
        errores.push({ campo: "fecha", mensaje: "es obligatoria." });
    } else if (!horario.fechaExiste(fecha)) {
        errores.push({ campo: "fecha", mensaje: "no es una fecha válida (use AAAA-MM-DD)." });
    } else if (fecha < hoy) {
        errores.push({ campo: "fecha", mensaje: "es anterior a hoy (" + hoy + "); no se pueden programar fechas pasadas." });
    }

    if (horaEntrada === "") {
        errores.push({ campo: "horaEntrada", mensaje: "es obligatoria." });
    } else if (!horaValida(horaEntrada)) {
        errores.push({ campo: "horaEntrada", mensaje: "debe tener formato HH:MM de 24 horas (ej. 08:00)." });
    }

    if (horaSalida === "") {
        errores.push({ campo: "horaSalida", mensaje: "es obligatoria." });
    } else if (!horaValida(horaSalida)) {
        errores.push({ campo: "horaSalida", mensaje: "debe tener formato HH:MM de 24 horas (ej. 17:00)." });
    }

    if (horaValida(horaEntrada) && horaValida(horaSalida) && horaEntrada === horaSalida) {
        errores.push({ campo: "horaSalida", mensaje: "no puede ser igual a la hora de entrada." });
    }

    let tipoTurno = null;
    if (estaVacio(datos.tipoTurno)) {
        errores.push({ campo: "tipoTurno", mensaje: "es obligatorio." });
    } else {
        tipoTurno = normalizarTipo(datos.tipoTurno);
        if (tipoTurno === null) {
            errores.push({ campo: "tipoTurno", mensaje: "\"" + datos.tipoTurno + "\" no es válido. Use: " + TIPOS_TURNO.join(", ") + "." });
        }
    }

    if (errores.length > 0) {
        return { dia: null, errores: errores };
    }

    return {
        dia: { fecha: fecha, horaEntrada: horaEntrada, horaSalida: horaSalida, tipoTurno: tipoTurno },
        errores: []
    };
}

// Busca solapamientos de un mismo empleado.
//   nuevos     -> dias que se quieren guardar (cada uno con una "ref" para ubicar el error)
//   existentes -> dias ya guardados en la base
// Un dia nuevo REEMPLAZA al dia guardado con la misma fecha, asi que ese dia guardado no se compara.
// Devuelve [{ ref, fecha, mensaje }].
function buscarSolapamientos(nuevos, existentes) {
    let conflictos = [];
    let fechasNuevas = {};
    nuevos.forEach(function (d) { fechasNuevas[d.fecha] = true; });

    let quedan = existentes.filter(function (e) { return !fechasNuevas[e.fecha]; });

    for (let i = 0; i < nuevos.length; i++) {
        let n = nuevos[i];

        for (let j = 0; j < i; j++) {
            if (seSolapan(nuevos[j], n)) {
                conflictos.push({ ref: n.ref, fecha: n.fecha,
                    mensaje: "el turno " + textoTurno(n) + " se cruza con el turno " + textoTurno(nuevos[j]) + " de la misma programación." });
                break;
            }
        }

        for (let k = 0; k < quedan.length; k++) {
            if (seSolapan(quedan[k], n)) {
                conflictos.push({ ref: n.ref, fecha: n.fecha,
                    mensaje: "el turno " + textoTurno(n) + " se cruza con el turno ya guardado " + textoTurno(quedan[k]) + "." });
                break;
            }
        }
    }

    return conflictos;
}

// ---------------- plantillas semanales (TURNO + ASIGNACION_HORARIO) ----------------
// Una asignacion aplica un turno (horas + dias de la semana) en un rango de fechas.
// Dos asignaciones del mismo empleado chocan solo si, en alguna fecha concreta, sus
// horas se pisan: no basta con que compartan dias de la semana ni con que sus rangos
// de fechas se crucen. Cada asignacion es
// { fechaDesde, fechaHasta, dias: "1,2,3", horaEntrada, horaSalida }.

// Fecha hasta vacia = vigente indefinidamente.
const FIN_INDEFINIDO = "9999-12-31";

function finDeRango(fechaHasta) {
    return estaVacio(fechaHasta) ? FIN_INDEFINIDO : fechaHasta;
}

// El dia siguiente a una fecha de fin; el fin indefinido no se mueve.
function diaDespuesDelFin(fin) {
    return fin === FIN_INDEFINIDO ? fin : sumarDias(fin, 1);
}

// true si la asignacion esta vigente en esa fecha y su turno cubre ese dia de la semana.
function aplicaEn(asignacion, fecha) {
    return fecha >= asignacion.fechaDesde && fecha <= finDeRango(asignacion.fechaHasta) &&
        horario.turnoCubreDia(asignacion, horario.aFecha(fecha));
}

// Turnos concretos (uno por fecha) que genera la asignacion entre "desde" y "hasta".
function ocurrenciasDeAsignacion(asignacion, desde, hasta) {
    let ocurrencias = [];

    for (let fecha = desde; fecha <= hasta; fecha = sumarDias(fecha, 1)) {
        if (aplicaEn(asignacion, fecha)) {
            ocurrencias.push({ fecha: fecha, horaEntrada: asignacion.horaEntrada, horaSalida: asignacion.horaSalida });
        }
    }
    return ocurrencias;
}

// Primera fecha en que las dos asignaciones aplican a la vez (mismo dia), o null.
// El patron semanal se repite, asi que si existe esa fecha aparece en los primeros 7 dias del cruce.
function primeraFechaEnComun(a, b) {
    let inicio = a.fechaDesde > b.fechaDesde ? a.fechaDesde : b.fechaDesde;
    let fin = finDeRango(a.fechaHasta) < finDeRango(b.fechaHasta) ? finDeRango(a.fechaHasta) : finDeRango(b.fechaHasta);
    let limite = sumarDias(inicio, 6);
    let hasta = fin < limite ? fin : limite;

    for (let fecha = inicio; fecha <= hasta; fecha = sumarDias(fecha, 1)) {
        if (aplicaEn(a, fecha) && aplicaEn(b, fecha)) {
            return fecha;
        }
    }
    return null;
}

// true si en alguna fecha concreta los dos turnos se pisan (los nocturnos invaden el dia siguiente).
function asignacionesSeSolapan(a, b) {
    let inicio = a.fechaDesde > b.fechaDesde ? a.fechaDesde : b.fechaDesde;
    let fin = finDeRango(a.fechaHasta) < finDeRango(b.fechaHasta) ? finDeRango(a.fechaHasta) : finDeRango(b.fechaHasta);
    // Rangos contiguos (uno termina el dia que el otro empieza) tambien se revisan:
    // un turno nocturno del ultimo dia invade el primero del siguiente rango.
    if (inicio > diaDespuesDelFin(fin)) {
        return false; // los rangos de fechas no se tocan
    }

    // El patron semanal se repite: basta con revisar dos semanas del cruce, mas un dia a cada
    // lado porque un turno nocturno del dia anterior (o posterior) puede invadir el cruce.
    let desde = sumarDias(inicio, -1);
    let limite = sumarDias(inicio, 14);
    let hasta = diaDespuesDelFin(fin) < limite ? diaDespuesDelFin(fin) : limite;

    let delA = ocurrenciasDeAsignacion(a, desde, hasta);
    let delB = ocurrenciasDeAsignacion(b, desde, hasta);

    return delA.some(function (x) {
        return delB.some(function (y) { return seSolapan(x, y); });
    });
}

// Devuelve el primer choque de la nueva asignacion con las existentes, o null:
//   { asignacion, fecha }  fecha = dia en que ambas aplican, o null si el choque es solo de horas.
// Reglas (el horario base es la asignacion sin "hasta"; el especial, la que tiene "hasta"):
//   - un especial puede cruzarse con el base: lo reemplaza mientras dura;
//   - dos especiales no pueden aplicar el mismo dia ni pisarse en horas;
//   - dos horarios base no pueden pisarse en horas.
// nueva = { fechaDesde, fechaHasta, dias, horaEntrada, horaSalida }
function buscarConflictoAsignacion(asignaciones, nueva) {
    let nuevaEsEspecial = horario.esEspecial(nueva);

    for (let i = 0; i < asignaciones.length; i++) {
        let a = asignaciones[i];
        if (horario.esDiaLibre(a)) {
            continue; // un dia libre no ocupa horario
        }
        let existente = {
            fechaDesde: a.fechaDesde,
            fechaHasta: a.fechaHasta,
            dias: a.turno.dias,
            horaEntrada: a.turno.horaEntrada,
            horaSalida: a.turno.horaSalida
        };

        if (horario.esEspecial(existente) !== nuevaEsEspecial) {
            continue; // un especial y el base conviven
        }
        if (nuevaEsEspecial) {
            let fecha = primeraFechaEnComun(existente, nueva);
            if (fecha !== null) {
                return { asignacion: a, fecha: fecha };
            }
        }
        if (asignacionesSeSolapan(existente, nueva)) {
            return { asignacion: a, fecha: null };
        }
    }
    return null;
}

module.exports = {
    TIPOS_TURNO: TIPOS_TURNO,
    asignacionesSeSolapan: asignacionesSeSolapan,
    buscarConflictoAsignacion: buscarConflictoAsignacion,
    horaValida: horaValida,
    normalizarTipo: normalizarTipo,
    cruzaMedianoche: cruzaMedianoche,
    horasProgramadas: horasProgramadas,
    seSolapan: seSolapan,
    sumarDias: sumarDias,
    hoyTexto: hoyTexto,
    validarDia: validarDia,
    buscarSolapamientos: buscarSolapamientos
};
