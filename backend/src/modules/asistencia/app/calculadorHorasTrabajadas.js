const repositorioAsistencia = require("../datos/repositorioAsistencia");
const repositorioHorarios = require("../../horarios-turnos/datos/repositorioHorarios");

function aMinutos(horaMinuto) {
    if (!horaMinuto) return null;
    const partes = String(horaMinuto).split(":");
    const h = parseInt(partes[0], 10) || 0;
    const m = parseInt(partes[1], 10) || 0;
    return h * 60 + m;
}

function minutosAHoras(minutos) {
    if (minutos <= 0) return 0;
    return Number((minutos / 60).toFixed(2));
}

function obtenerFechaMarcaje(fechaHoraStr) {
    if (!fechaHoraStr) return null;
    return fechaHoraStr.substring(0, 10);
}

async function calcularHorasTrabajadas(empleadoId, desde, hasta) {
    const marcajes = await repositorioAsistencia.obtenerPorEmpleadoEntreFechas(empleadoId, desde, hasta);

    const porFecha = {};
    marcajes.forEach((m) => {
        const fecha = obtenerFechaMarcaje(m.fechaHora);
        if (!fecha) return;
        if (!porFecha[fecha]) porFecha[fecha] = [];
        porFecha[fecha].push(m);
    });

    const resultado = [];
    const fechaInicio = new Date(desde + "T00:00:00");
    const fechaFin = new Date(hasta + "T00:00:00");

    for (let d = new Date(fechaInicio); d <= fechaFin; d.setDate(d.getDate() + 1)) {
        const fechaStr = d.toISOString().substring(0, 10);
        const marcajesDia = porFecha[fechaStr] || [];
        const asignacion = await repositorioHorarios.obtenerAsignacionVigentePorFecha(empleadoId, fechaStr);

        marcajesDia.sort((a, b) => a.fechaHora.localeCompare(b.fechaHora));

        let entrada = null;
        let salida = null;
        for (let i = 0; i < marcajesDia.length; i++) {
            if (marcajesDia[i].tipo === "Entrada" && !entrada) {
                entrada = marcajesDia[i];
            } else if (marcajesDia[i].tipo === "Salida") {
                salida = marcajesDia[i];
            }
        }

        let horasTrabajadas = 0;
        let horasProgramadas = 0;
        let minutosTarde = 0;
        let estado = "Sin marcar";

        if (asignacion && asignacion.turno) {
            const entradaProgMin = aMinutos(asignacion.turno.horaEntrada);
            const salidaProgMin = aMinutos(asignacion.turno.horaSalida);
            if (entradaProgMin !== null && salidaProgMin !== null) {
                if (salidaProgMin > entradaProgMin) {
                    horasProgramadas = minutosAHoras(salidaProgMin - entradaProgMin);
                } else {
                    horasProgramadas = minutosAHoras((24 * 60 - entradaProgMin) + salidaProgMin);
                }
            }

            if (entrada && salida) {
                const entradaReal = new Date(entrada.fechaHora.replace(" ", "T"));
                const salidaReal = new Date(salida.fechaHora.replace(" ", "T"));
                const diffMin = Math.floor((salidaReal - entradaReal) / 60000);
                if (diffMin > 0) {
                    horasTrabajadas = minutosAHoras(diffMin);
                }
                const entradaRealMin = entradaReal.getHours() * 60 + entradaReal.getMinutes();
                if (entradaProgMin !== null && entradaRealMin > entradaProgMin + 5) {
                    minutosTarde = entradaRealMin - entradaProgMin;
                }
                estado = "Completo";
            } else if (entrada && !salida) {
                estado = "Sin salida";
            } else if (!entrada && salida) {
                estado = "Sin entrada";
            } else {
                estado = "Ausente";
            }
        } else {
            if (entrada && salida) {
                const entradaReal = new Date(entrada.fechaHora.replace(" ", "T"));
                const salidaReal = new Date(salida.fechaHora.replace(" ", "T"));
                const diffMin = Math.floor((salidaReal - entradaReal) / 60000);
                if (diffMin > 0) {
                    horasTrabajadas = minutosAHoras(diffMin);
                }
                estado = "Completo (sin turno)";
            } else if (entrada || salida) {
                estado = "Incompleto";
            } else {
                estado = "Sin turno / Ausente";
            }
        }

        resultado.push({
            fecha: fechaStr,
            turno: asignacion && asignacion.turno ? asignacion.turno.nombre : null,
            horaEntradaProgramada: asignacion && asignacion.turno ? asignacion.turno.horaEntrada : null,
            horaSalidaProgramada: asignacion && asignacion.turno ? asignacion.turno.horaSalida : null,
            entrada: entrada ? entrada.fechaHora : null,
            salida: salida ? salida.fechaHora : null,
            horasProgramadas: horasProgramadas,
            horasTrabajadas: horasTrabajadas,
            minutosTarde: minutosTarde,
            estado: estado
        });
    }

    let totalHorasTrabajadas = 0;
    let totalHorasProgramadas = 0;
    let totalMinutosTarde = 0;
    let diasCompletos = 0;
    let diasAusentes = 0;

    resultado.forEach((r) => {
        totalHorasTrabajadas += r.horasTrabajadas || 0;
        totalHorasProgramadas += r.horasProgramadas || 0;
        totalMinutosTarde += r.minutosTarde || 0;
        if (r.estado === "Completo" || r.estado === "Completo (sin turno)") diasCompletos++;
        if (r.estado === "Ausente" || r.estado === "Sin turno / Ausente") diasAusentes++;
    });

    return {
        empleadoId: empleadoId,
        desde: desde,
        hasta: hasta,
        detalle: resultado,
        totales: {
            horasTrabajadas: Number(totalHorasTrabajadas.toFixed(2)),
            horasProgramadas: Number(totalHorasProgramadas.toFixed(2)),
            minutosTarde: totalMinutosTarde,
            horasTarde: Number((totalMinutosTarde / 60).toFixed(2)),
            diasCompletos: diasCompletos,
            diasAusentes: diasAusentes,
            diasRevisados: resultado.length
        }
    };
}

module.exports = {
    calcularHorasTrabajadas: calcularHorasTrabajadas
};
