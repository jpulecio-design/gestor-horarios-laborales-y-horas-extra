// Dominio de monitoreo (CU07): convierte marcajes y horas extra en resumenes.
// Funciones puras: reciben las filas ya leidas y no tocan la base de datos.

function redondear(valor) {
    return Math.round(valor * 100) / 100;
}

// "AAAA-MM-DD HH:MM:SS" -> Date local
function aFechaHora(texto) {
    let partes = String(texto).split(" ");
    let f = partes[0].split("-").map(Number);
    let h = (partes[1] || "00:00:00").split(":").map(Number);
    return new Date(f[0], f[1] - 1, f[2], h[0] || 0, h[1] || 0, h[2] || 0);
}

function soloFecha(texto) {
    return String(texto).slice(0, 10);
}

function minutosEntre(entrada, salida) {
    let minutos = Math.round((salida.getTime() - entrada.getTime()) / 60000);
    return minutos > 0 ? minutos : 0;
}

// Empareja los marcajes Entrada/Salida en jornadas (ignora los anulados).
// Devuelve [{ fecha, entrada, salida, minutos, completa }].
function emparejarJornadas(registros) {
    let ordenados = registros.slice().sort(function (a, b) {
        if (a.fechaHora < b.fechaHora) { return -1; }
        if (a.fechaHora > b.fechaHora) { return 1; }
        return 0;
    });

    let jornadas = [];
    let abierta = null; // { fecha, entrada }

    for (let i = 0; i < ordenados.length; i++) {
        let r = ordenados[i];

        if (r.tipo === "Entrada") {
            if (abierta !== null) {
                // habia una entrada sin salida: la dejamos como incompleta
                jornadas.push({ fecha: abierta.fecha, entrada: abierta.entrada, salida: null, minutos: 0, completa: false });
            }
            abierta = { fecha: soloFecha(r.fechaHora), entrada: r.fechaHora };

        } else { // Salida
            if (abierta === null) {
                // salida sin entrada previa: incompleta
                jornadas.push({ fecha: soloFecha(r.fechaHora), entrada: null, salida: r.fechaHora, minutos: 0, completa: false });
            } else {
                let minutos = minutosEntre(aFechaHora(abierta.entrada), aFechaHora(r.fechaHora));
                jornadas.push({ fecha: abierta.fecha, entrada: abierta.entrada, salida: r.fechaHora, minutos: minutos, completa: true });
                abierta = null;
            }
        }
    }

    if (abierta !== null) {
        jornadas.push({ fecha: abierta.fecha, entrada: abierta.entrada, salida: null, minutos: 0, completa: false });
    }

    return jornadas;
}

// Resumen de asistencia de un periodo a partir de los marcajes.
function resumirAsistencia(registros) {
    let activos = registros.filter(function (r) { return r.estado !== "Anulado"; });
    let jornadas = emparejarJornadas(activos);

    let minutos = 0;
    let incompletas = 0;
    let dias = {};

    for (let i = 0; i < jornadas.length; i++) {
        let j = jornadas[i];
        dias[j.fecha] = true;
        if (j.completa) {
            minutos = minutos + j.minutos;
        } else {
            incompletas = incompletas + 1;
        }
    }

    return {
        marcajes: activos.length,
        dias: Object.keys(dias).length,
        horasTrabajadas: redondear(minutos / 60),
        jornadasIncompletas: incompletas,
        detalle: jornadas
    };
}

// Resumen de horas extra (totales y por tipo).
function resumirHorasExtra(lista) {
    let porTipo = {};
    let totalHoras = 0;
    let totalValor = 0;

    for (let i = 0; i < lista.length; i++) {
        let h = lista[i];
        let horas = Number(h.cantidadHoras);
        let valor = Number(h.valor);

        totalHoras = totalHoras + horas;
        totalValor = totalValor + valor;

        if (porTipo[h.tipo] === undefined) {
            porTipo[h.tipo] = { horas: 0, valor: 0 };
        }
        porTipo[h.tipo].horas = redondear(porTipo[h.tipo].horas + horas);
        porTipo[h.tipo].valor = redondear(porTipo[h.tipo].valor + valor);
    }

    return {
        registros: lista.length,
        totalHoras: redondear(totalHoras),
        totalValor: redondear(totalValor),
        porTipo: porTipo
    };
}

module.exports = {
    aFechaHora: aFechaHora,
    soloFecha: soloFecha,
    emparejarJornadas: emparejarJornadas,
    resumirAsistencia: resumirAsistencia,
    resumirHorasExtra: resumirHorasExtra
};
