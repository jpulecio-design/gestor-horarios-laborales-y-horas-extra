const programacion = require("../dominio/programacion");
const horario = require("../dominio/horario");
const importadorExcel = require("./importadorExcel");
const repositorio = require("../datos/repositorioProgramacion");
const repositorioEmpleados = require("../../empleados/repositorios/repositorioEmpleados");

const MAX_DIAS_CONSULTA = 366;

async function validarEmpleado(empleadoId) {
    let id = Number(empleadoId);
    if (!Number.isInteger(id) || id <= 0) {
        return { mensaje: "el id del empleado es inválido." };
    }
    let empleado = await repositorioEmpleados.buscarEmpleadoPorId(id);
    if (empleado === null) {
        return { mensaje: "no existe un empleado con el id " + id + "." };
    }
    if (empleado.usuario.estado !== "Activo") {
        return { mensaje: "el empleado " + id + " está inactivo; no se le pueden programar horarios." };
    }
    return { empleado: empleado };
}

function nombreDe(empleado) {
    return (empleado.usuario.nombre + " " + empleado.usuario.apellido).trim();
}

function primeraYUltima(dias) {
    let fechas = dias.map(function (d) { return d.fecha; }).sort();
    return { desde: fechas[0], hasta: fechas[fechas.length - 1] };
}

function existentesAlrededor(empleadoId, dias) {
    let rango = primeraYUltima(dias);
    return repositorio.obtenerPorEmpleadoEntre(empleadoId,
        programacion.sumarDias(rango.desde, -1), programacion.sumarDias(rango.hasta, 1));
}

function resumenDias(dias) {
    return dias
        .slice()
        .sort(function (a, b) { return a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0; })
        .map(function (d) {
            return {
                fecha: d.fecha,
                horaEntrada: d.horaEntrada,
                horaSalida: d.horaSalida,
                tipoTurno: d.tipoTurno,
                horas: programacion.horasProgramadas(d),
                terminaAlDiaSiguiente: programacion.cruzaMedianoche(d)
            };
        });
}

function totalHoras(dias) {
    let total = dias.reduce(function (suma, d) { return suma + programacion.horasProgramadas(d); }, 0);
    return Math.round(total * 100) / 100;
}

function tiposTurno() {
    return programacion.TIPOS_TURNO.slice();
}

async function programarDias(empleadoId, dias, hoy) {
    hoy = hoy || programacion.hoyTexto();

    let validacion = await validarEmpleado(empleadoId);
    if (validacion.empleado === undefined) {
        return { exito: false, mensaje: "ERROR: " + validacion.mensaje };
    }
    let empleado = validacion.empleado;
    let id = empleado.usuario.id;

    if (!Array.isArray(dias) || dias.length === 0) {
        return { exito: false, mensaje: "ERROR: envía al menos un día en \"dias\"." };
    }

    let errores = [];
    let validos = [];
    let vistas = {};

    dias.forEach(function (datos, indice) {
        let r = programacion.validarDia(datos || {}, hoy);
        r.errores.forEach(function (e) {
            errores.push({ dia: indice + 1, fecha: (datos && datos.fecha) || "", campo: e.campo, mensaje: e.mensaje });
        });
        if (r.dia !== null) {
            if (vistas[r.dia.fecha]) {
                errores.push({ dia: indice + 1, fecha: r.dia.fecha, campo: "fecha",
                    mensaje: "está repetida en la programación (solo se permite un turno por día)." });
            } else {
                vistas[r.dia.fecha] = true;
                r.dia.ref = indice + 1;
                validos.push(r.dia);
            }
        }
    });

    if (errores.length === 0) {
        let existentes = await existentesAlrededor(id, validos);
        programacion.buscarSolapamientos(validos, existentes).forEach(function (c) {
            errores.push({ dia: c.ref, fecha: c.fecha, campo: "horario", mensaje: c.mensaje });
        });
    }

    if (errores.length > 0) {
        return {
            exito: false,
            mensaje: "La programación tiene " + errores.length + " error(es). No se guardó ningún día.",
            errores: errores
        };
    }

    let guardado = await repositorio.guardarDias(validos.map(function (d) {
        return { empleadoId: id, fecha: d.fecha, horaEntrada: d.horaEntrada, horaSalida: d.horaSalida, tipoTurno: d.tipoTurno };
    }));

    let rango = primeraYUltima(validos);

    return {
        exito: true,
        mensaje: "Programación guardada para " + nombreDe(empleado) + ": " + guardado.insertados +
            " día(s) nuevo(s) y " + guardado.actualizados + " actualizado(s).",
        datos: {
            empleado: { id: id, nombre: nombreDe(empleado) },
            desde: rango.desde,
            hasta: rango.hasta,
            totalDias: validos.length,
            insertados: guardado.insertados,
            actualizados: guardado.actualizados,
            horasProgramadas: totalHoras(validos),
            dias: resumenDias(validos)
        }
    };
}

async function importarProgramacion(buffer, hoy) {
    hoy = hoy || programacion.hoyTexto();

    let lectura = await importadorExcel.leerFilas(buffer);
    let errores = lectura.errores.slice();

    function columna(campo) {
        let nombre = campo === "horario" ? "horaEntrada" : campo;
        return nombre + " (" + (lectura.letras[nombre] || "-") + ")";
    }

    let validas = [];
    lectura.filas.forEach(function (f) {
        let id = Number(f.empleadoId);
        let filaValida = true;

        if (f.empleadoId === "") {
            errores.push({ fila: f.fila, columna: columna("empleadoId"), mensaje: "es obligatorio." });
            filaValida = false;
        } else if (!Number.isInteger(id) || id <= 0) {
            errores.push({ fila: f.fila, columna: columna("empleadoId"), mensaje: "debe ser un número entero mayor que 0." });
            filaValida = false;
        }

        let r = programacion.validarDia(f, hoy);
        r.errores.forEach(function (e) {
            errores.push({ fila: f.fila, columna: columna(e.campo), mensaje: e.mensaje });
        });

        if (filaValida && r.dia !== null) {
            r.dia.empleadoId = id;
            r.dia.ref = f.fila;
            validas.push(r.dia);
        }
    });

    let porEmpleado = {};
    validas.forEach(function (d) {
        if (porEmpleado[d.empleadoId] === undefined) {
            porEmpleado[d.empleadoId] = { dias: [], fechas: {} };
        }
        let grupo = porEmpleado[d.empleadoId];
        if (grupo.fechas[d.fecha] !== undefined) {
            errores.push({ fila: d.ref, columna: columna("fecha"),
                mensaje: "el empleado " + d.empleadoId + " ya tiene la fecha " + d.fecha + " en la fila " + grupo.fechas[d.fecha] + " (solo un turno por día)." });
            return;
        }
        grupo.fechas[d.fecha] = d.ref;
        grupo.dias.push(d);
    });

    let empleados = {};
    let ids = Object.keys(porEmpleado);
    for (let i = 0; i < ids.length; i++) {
        let id = Number(ids[i]);
        let validacion = await validarEmpleado(id);
        if (validacion.empleado === undefined) {
            porEmpleado[id].dias.forEach(function (d) {
                errores.push({ fila: d.ref, columna: columna("empleadoId"), mensaje: validacion.mensaje });
            });
            continue;
        }
        empleados[id] = validacion.empleado;

        let existentes = await existentesAlrededor(id, porEmpleado[id].dias);
        programacion.buscarSolapamientos(porEmpleado[id].dias, existentes).forEach(function (c) {
            errores.push({ fila: c.ref, columna: columna("horario"), mensaje: c.mensaje });
        });
    }

    if (errores.length > 0) {
        errores.sort(function (a, b) { return a.fila - b.fila; });
        return {
            exito: false,
            mensaje: "El archivo tiene " + errores.length + " error(es). No se guardó ninguna fila; corrige el archivo y vuelve a importarlo.",
            errores: errores
        };
    }

    let todos = [];
    ids.forEach(function (id) {
        porEmpleado[id].dias.forEach(function (d) {
            todos.push({ empleadoId: Number(id), fecha: d.fecha, horaEntrada: d.horaEntrada, horaSalida: d.horaSalida, tipoTurno: d.tipoTurno });
        });
    });

    let guardado = await repositorio.guardarDias(todos);

    let detalle = ids.map(function (id) {
        let dias = porEmpleado[id].dias;
        let rango = primeraYUltima(dias);
        return {
            empleado: { id: Number(id), nombre: nombreDe(empleados[id]) },
            dias: dias.length,
            desde: rango.desde,
            hasta: rango.hasta,
            horasProgramadas: totalHoras(dias)
        };
    });

    return {
        exito: true,
        mensaje: "Plantilla importada: " + todos.length + " día(s) para " + ids.length + " empleado(s) (" +
            guardado.insertados + " nuevo(s), " + guardado.actualizados + " actualizado(s)).",
        datos: {
            totalDias: todos.length,
            totalEmpleados: ids.length,
            insertados: guardado.insertados,
            actualizados: guardado.actualizados,
            empleados: detalle
        }
    };
}

async function consultarProgramacion(empleadoId, desde, hasta) {
    let validacion = await validarEmpleado(empleadoId);
    if (validacion.empleado === undefined) {
        return { exito: false, mensaje: "ERROR: " + validacion.mensaje };
    }
    if (!horario.fechaExiste(desde) || !horario.fechaExiste(hasta)) {
        return { exito: false, mensaje: "ERROR: \"desde\" y \"hasta\" son obligatorias y deben ser fechas válidas (AAAA-MM-DD)." };
    }
    if (hasta < desde) {
        return { exito: false, mensaje: "ERROR: \"hasta\" no puede ser anterior a \"desde\"." };
    }
    let dias = Math.round((horario.aFecha(hasta) - horario.aFecha(desde)) / 86400000) + 1;
    if (dias > MAX_DIAS_CONSULTA) {
        return { exito: false, mensaje: "ERROR: el periodo no puede superar " + MAX_DIAS_CONSULTA + " días." };
    }

    let id = validacion.empleado.usuario.id;
    let guardados = await repositorio.obtenerPorEmpleadoEntre(id, desde, hasta);

    return {
        exito: true,
        datos: {
            empleado: { id: id, nombre: nombreDe(validacion.empleado) },
            desde: desde,
            hasta: hasta,
            horasProgramadas: totalHoras(guardados),
            dias: resumenDias(guardados)
        }
    };
}

async function eliminarDia(empleadoId, fecha, hoy) {
    hoy = hoy || programacion.hoyTexto();

    let validacion = await validarEmpleado(empleadoId);
    if (validacion.empleado === undefined) {
        return { exito: false, mensaje: "ERROR: " + validacion.mensaje };
    }
    if (!horario.fechaExiste(fecha)) {
        return { exito: false, mensaje: "ERROR: la fecha debe ser válida (AAAA-MM-DD)." };
    }
    if (fecha < hoy) {
        return { exito: false, mensaje: "ERROR: no se puede modificar un día pasado (" + fecha + ")." };
    }

    let borrado = await repositorio.eliminarDia(validacion.empleado.usuario.id, fecha);
    if (!borrado) {
        return { exito: false, noEncontrado: true, mensaje: "ERROR: el empleado no tiene turno programado el " + fecha + "." };
    }
    return { exito: true, mensaje: "Se quitó el turno del " + fecha + "." };
}

module.exports = {
    tiposTurno: tiposTurno,
    programarDias: programarDias,
    importarProgramacion: importarProgramacion,
    consultarProgramacion: consultarProgramacion,
    eliminarDia: eliminarDia
};
