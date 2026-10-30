
process.env.DB_USER = process.env.DB_USER || "prueba";
process.env.DB_PASSWORD = process.env.DB_PASSWORD || "prueba";
process.env.DB_CONNECT_STRING = process.env.DB_CONNECT_STRING || "localhost:1521/prueba";

const repositorioHorarios = require("../src/modules/horarios-turnos/datos/repositorioHorarios");
const repositorioProgramacion = require("../src/modules/horarios-turnos/datos/repositorioProgramacion");
const repositorioEmpleados = require("../src/modules/empleados/repositorios/repositorioEmpleados");
const controladorHorarios = require("../src/modules/horarios-turnos/app/controladorHorarios");
const controladorProgramacion = require("../src/modules/horarios-turnos/app/controladorProgramacion");
const rutaHorarios = require("../src/modules/horarios-turnos/api/rutaHorarios");

let fallas = 0;

function verificar(nombre, condicion, detalle) {
    if (condicion) {
        console.log("  [OK] " + nombre);
    } else {
        fallas = fallas + 1;
        console.log("  [FALLO] " + nombre + (detalle ? " -> " + detalle : ""));
    }
}

let turnos = {};
let asignaciones = [];
let programacion = [];
let siguienteTurno = 1;

function reiniciar() {
    turnos = {};
    asignaciones = [];
    programacion = [];
    siguienteTurno = 1;
}

repositorioEmpleados.buscarEmpleadoPorId = async function (id) {
    return { usuario: { id: id, nombre: "Ana", apellido: "Prueba", estado: "Activo" } };
};
repositorioHorarios.existeNombreTurno = async function (nombre) {
    return Object.values(turnos).some(function (t) { return t.nombre === nombre; });
};
repositorioHorarios.agregarTurno = async function (datos) {
    let turno = Object.assign({ id: siguienteTurno++, estado: "Activo" }, datos);
    turnos[turno.id] = turno;
    return turno;
};
repositorioHorarios.buscarTurnoPorId = async function (id) { return turnos[id] || null; };
repositorioHorarios.agregarAsignacion = async function (datos) {
    let fila = Object.assign({ id: asignaciones.length + 1, estado: "Activo" }, datos);
    asignaciones.push(fila);
    return fila;
};
repositorioHorarios.buscarAsignacionPorId = async function (id) {
    let fila = asignaciones.find(function (a) { return a.id === id; });
    return fila === undefined ? null : Object.assign({}, fila, { turno: turnos[fila.turnoId] });
};
repositorioHorarios.obtenerAsignacionesPorEmpleado = async function (empleadoId, incluirInactivas) {
    return asignaciones
        .filter(function (a) {
            return a.empleadoId === empleadoId &&
                (incluirInactivas || ["Activo", "Descanso"].indexOf(a.estado || "Activo") !== -1);
        })
        .map(function (a) { return Object.assign({}, a, { turno: turnos[a.turnoId] }); });
};
repositorioHorarios.desactivarAsignacion = async function (id) {
    let fila = asignaciones.find(function (a) { return a.id === id && (a.estado || "Activo") === "Activo"; });
    if (fila === undefined) {
        return false;
    }
    fila.estado = "Inactivo";
    return true;
};
repositorioHorarios.activarAsignacion = async function (id) {
    let fila = asignaciones.find(function (a) { return a.id === id && a.estado === "Inactivo"; });
    if (fila === undefined) {
        return false;
    }
    fila.estado = "Activo";
    return true;
};
repositorioHorarios.agregarDiaLibre = async function (datos) {
    let fila = { id: asignaciones.length + 1, empleadoId: datos.empleadoId, turnoId: datos.turnoId,
        fechaDesde: datos.fecha, fechaHasta: datos.fecha, estado: "Descanso" };
    asignaciones.push(fila);
    return fila;
};
repositorioHorarios.eliminarDiaLibre = async function (id) {
    let antes = asignaciones.length;
    asignaciones = asignaciones.filter(function (a) { return !(a.id === id && a.estado === "Descanso"); });
    return asignaciones.length < antes;
};
repositorioProgramacion.obtenerPorEmpleadoEntre = async function (id, desde, hasta) {
    return programacion
        .filter(function (f) { return f.empleadoId === id && f.fecha >= desde && f.fecha <= hasta; })
        .map(function (f) { return Object.assign({}, f); });
};
repositorioProgramacion.eliminarDia = async function (id, fecha) {
    let antes = programacion.length;
    programacion = programacion.filter(function (f) { return !(f.empleadoId === id && f.fecha === fecha); });
    return programacion.length < antes;
};

async function crearTurno(nombre, entrada, salida, dias) {
    let r = await controladorHorarios.registrarTurno({ nombre: nombre, horaEntrada: entrada, horaSalida: salida, dias: dias });
    if (!r.exito) {
        throw new Error("no se pudo crear el turno de prueba: " + r.mensaje);
    }
    return r.datos.id;
}

function asignar(turnoId, desde, hasta, empleadoId) {
    return controladorHorarios.asignarHorario({
        empleadoId: empleadoId || 1, turnoId: turnoId, fechaDesde: desde, fechaHasta: hasta
    });
}

async function probar() {
    console.log("\n=== PRUEBA 1: dias distintos no chocan ===");
    reiniciar();
    let lunes = await crearTurno("Lunes 08-17", "08:00", "17:00", "1");
    let martes = await crearTurno("Martes 08-17", "08:00", "17:00", "2");
    let r = await asignar(lunes, "2026-11-02", "2026-11-30");
    verificar("turno de lunes en un empleado sin programacion se permite", r.exito, r.mensaje);
    r = await asignar(martes, "2026-11-02", "2026-11-30");
    verificar("turno de martes (mismas fechas, mismo horario) se permite", r.exito, r.mensaje);

    console.log("\n=== PRUEBA 2: mismo dia y horario que se cruza ===");
    reiniciar();
    let a = await crearTurno("A 08-17 L-V", "08:00", "17:00", "1,2,3,4,5");
    let b = await crearTurno("B 10-18 miercoles", "10:00", "18:00", "3");
    await asignar(a, "2026-11-02", "2026-11-30");
    r = await asignar(b, "2026-11-10", "2026-11-20");
    verificar("horarios que se superponen un mismo dia se rechazan", !r.exito, r.mensaje);
    verificar("el mensaje explica el cruce", !r.exito && r.mensaje.indexOf("A 08-17 L-V") !== -1, r.mensaje);

    console.log("\n=== PRUEBA 3: turnos consecutivos (uno termina cuando empieza el otro) ===");
    reiniciar();
    let manana = await crearTurno("Manana 06-14", "06:00", "14:00", "1,2,3,4,5");
    let tarde = await crearTurno("Tarde 14-22", "14:00", "22:00", "1,2,3,4,5");
    await asignar(manana, "2026-11-02", null);
    r = await asignar(tarde, "2026-11-02", null);
    verificar("06-14 seguido de 14-22 se permite", r.exito, r.mensaje);
    let solapado = await crearTurno("Tarde 13-21", "13:00", "21:00", "1,2,3,4,5");
    r = await asignar(solapado, "2026-11-02", null);
    verificar("13-21 contra 06-14 se rechaza", !r.exito, r.mensaje);

    console.log("\n=== PRUEBA 4: rangos de fechas que no se cruzan ===");
    reiniciar();
    let t = await crearTurno("T 08-17 L-V", "08:00", "17:00", "1,2,3,4,5");
    await asignar(t, "2026-11-02", "2026-11-13");
    r = await asignar(t, "2026-11-16", "2026-11-27");
    verificar("mismo turno en la semana siguiente se permite", r.exito, r.mensaje);
    r = await asignar(t, "2026-11-10", "2026-11-20");
    verificar("mismo turno con fechas que se cruzan se rechaza", !r.exito, r.mensaje);

    console.log("\n=== PRUEBA 5: turno nocturno (22:00-06:00) cruza al dia siguiente ===");
    reiniciar();
    let noche = await crearTurno("Noche lunes 22-06", "22:00", "06:00", "1");
    let temprano = await crearTurno("Martes 05-13", "05:00", "13:00", "2");
    let martes6 = await crearTurno("Martes 06-14", "06:00", "14:00", "2");
    let lunes8 = await crearTurno("Lunes 08-17", "08:00", "17:00", "1");
    let lunes21 = await crearTurno("Lunes 21-23", "21:00", "23:00", "1");
    await asignar(noche, "2026-11-02", null);
    r = await asignar(temprano, "2026-11-02", null);
    verificar("martes 05-13 choca con la noche del lunes que termina martes 06:00", !r.exito, r.mensaje);
    r = await asignar(martes6, "2026-11-02", null);
    verificar("martes 06-14 empieza justo cuando termina la noche -> se permite", r.exito, r.mensaje);
    r = await asignar(lunes8, "2026-11-02", null);
    verificar("lunes 08-17 no toca la noche del lunes -> se permite", r.exito, r.mensaje);
    r = await asignar(lunes21, "2026-11-02", null);
    verificar("lunes 21-23 choca con la noche del lunes 22:00", !r.exito, r.mensaje);

    console.log("\n=== PRUEBA 6: la noche invade el dia siguiente aunque la asignacion empiece despues ===");
    reiniciar();
    let nocheDom = await crearTurno("Noche domingo 22-06", "22:00", "06:00", "7");
    let lunes5 = await crearTurno("Lunes 05-09", "05:00", "09:00", "1");
    await asignar(nocheDom, "2026-11-01", "2026-11-01");
    r = await asignar(lunes5, "2026-11-02", "2026-11-02");
    verificar("lunes 05-09 choca con la noche del domingo anterior", !r.exito, r.mensaje);
    r = await asignar(lunes5, "2026-11-09", "2026-11-09");
    verificar("el mismo turno una semana despues no choca (rangos sin contacto)", r.exito, r.mensaje);

    console.log("\n=== PRUEBA 6b: validacion de la hora al crear el turno ===");
    r = await controladorHorarios.registrarTurno({ nombre: "Igual", horaEntrada: "08:00", horaSalida: "08:00", dias: "1" });
    verificar("entrada igual a salida se rechaza", !r.exito, r.mensaje);

    console.log("\n=== PRUEBA 7: eliminar un dia de la programacion ===");
    reiniciar();
    let hoy = "2026-11-01";
    programacion = [
        { empleadoId: 1, fecha: "2026-11-02", horaEntrada: "08:00", horaSalida: "17:00", tipoTurno: "Diurno" },
        { empleadoId: 1, fecha: "2026-11-03", horaEntrada: "08:00", horaSalida: "17:00", tipoTurno: "Diurno" },
        { empleadoId: 2, fecha: "2026-11-02", horaEntrada: "08:00", horaSalida: "17:00", tipoTurno: "Diurno" }
    ];
    asignaciones = [{ id: 1, empleadoId: 1, turnoId: 1, fechaDesde: "2026-11-01", fechaHasta: null }];
    r = await controladorProgramacion.eliminarDia(1, "2026-11-02", hoy);
    verificar("elimina el dia indicado", r.exito, r.mensaje);
    verificar("solo se borro ese registro",
        programacion.length === 2 &&
        programacion.some(function (f) { return f.empleadoId === 1 && f.fecha === "2026-11-03"; }) &&
        programacion.some(function (f) { return f.empleadoId === 2 && f.fecha === "2026-11-02"; }));
    verificar("las asignaciones de plantilla no se tocan", asignaciones.length === 1);

    console.log("\n=== PRUEBA 8: eliminar una programacion inexistente ===");
    r = await controladorProgramacion.eliminarDia(1, "2026-11-02", hoy);
    verificar("responde noEncontrado", r.exito === false && r.noEncontrado === true, JSON.stringify(r));
    verificar("el mensaje dice que no hay turno programado", r.mensaje.indexOf("no tiene turno programado") !== -1, r.mensaje);
    r = await controladorProgramacion.eliminarDia(1, "2026-10-01", hoy);
    verificar("un dia pasado se rechaza sin tocar nada", r.exito === false && !r.noEncontrado, JSON.stringify(r));

    console.log("\n=== PRUEBA 9: permisos de las rutas DELETE ===");
    ["/programacion/:empleadoId/:fecha", "/asignaciones/:id"].forEach(function (ruta) {
        let capa = rutaHorarios.stack.find(function (c) {
            return c.route && c.route.path === ruta && c.route.methods.delete;
        });
        verificar("la ruta DELETE " + ruta + " existe", capa !== undefined);
        if (capa !== undefined) {
            let intentar = function (rol) {
                let estado = { codigo: null, siguio: false };
                let res = { status: function (c) { estado.codigo = c; return res; }, json: function () { return res; } };
                capa.route.stack[0].handle({ usuario: rol === null ? undefined : { rol: rol } }, res, function () { estado.siguio = true; });
                return estado;
            };
            verificar("  Empleado recibe 403", intentar("Empleado").codigo === 403);
            verificar("  Contadora recibe 403", intentar("Contadora").codigo === 403);
            verificar("  sin sesion recibe 401", intentar(null).codigo === 401);
            verificar("  Administrador pasa al controlador", intentar("Administrador").siguio === true);
        }
    });

    console.log("\n=== PRUEBA 10: desactivar una asignacion de plantilla ===");
    reiniciar();
    let diurno = await crearTurno("Diurno 08-17 L-V", "08:00", "17:00", "1,2,3,4,5");
    r = await asignar(diurno, "2026-11-02", null);
    let idAsignacion = r.datos.id;
    let semana = await controladorHorarios.semanaDeEmpleado(1, "2026-11-02");
    verificar("la semana trae el turno de plantilla con el id de su asignacion",
        semana.dias[0].turno !== null && semana.dias[0].turno.origen === "Plantilla" &&
        semana.dias[0].turno.asignacionId === idAsignacion, JSON.stringify(semana.dias[0].turno));

    r = await controladorHorarios.desactivarAsignacion(idAsignacion);
    verificar("se desactiva la asignacion", r.exito, r.mensaje);
    semana = await controladorHorarios.semanaDeEmpleado(1, "2026-11-02");
    verificar("la semana ya no muestra el turno", semana.dias.every(function (d) { return d.turno === null; }));
    let hoyLunes = await controladorHorarios.horarioDeHoy(1, "2026-11-02");
    verificar("horarioDeHoy tampoco", hoyLunes.turno === null);
    let lista = await controladorHorarios.horarioDeEmpleado(1);
    verificar("la lista de asignaciones la sigue mostrando, como Inactivo",
        lista.length === 1 && lista[0].estado === "Inactivo", JSON.stringify(lista.map(function (x) { return x.estado; })));
    r = await asignar(diurno, "2026-11-02", null);
    verificar("una asignacion desactivada ya no genera choques: se puede volver a asignar", r.exito, r.mensaje);
    lista = await controladorHorarios.horarioDeEmpleado(1);
    verificar("ahora hay una Inactivo y una Activo",
        lista.length === 2 && lista[0].estado === "Inactivo" && lista[1].estado === "Activo");

    r = await controladorHorarios.desactivarAsignacion(idAsignacion);
    verificar("desactivar de nuevo una ya desactivada se rechaza", !r.exito && !r.noEncontrado, r.mensaje);
    r = await controladorHorarios.desactivarAsignacion(9999);
    verificar("una asignacion inexistente da noEncontrado", !r.exito && r.noEncontrado === true, r.mensaje);
    r = await controladorHorarios.desactivarAsignacion("abc");
    verificar("un id invalido se rechaza", !r.exito && !r.noEncontrado, r.mensaje);

    console.log("\n=== PRUEBA 11: la programacion diaria tiene prioridad y se borra aparte ===");
    reiniciar();
    let plantilla = await crearTurno("Plantilla 08-17", "08:00", "17:00", "1,2,3,4,5");
    await asignar(plantilla, "2026-11-02", null);
    programacion = [{ empleadoId: 1, fecha: "2026-11-03", horaEntrada: "22:00", horaSalida: "06:00", tipoTurno: "Nocturno" }];
    semana = await controladorHorarios.semanaDeEmpleado(1, "2026-11-02");
    verificar("el martes muestra el turno programado (origen Programacion)",
        semana.dias[1].turno.origen === "Programación", JSON.stringify(semana.dias[1].turno));
    verificar("los demas dias muestran la plantilla", semana.dias[0].turno.origen === "Plantilla");
    await controladorProgramacion.eliminarDia(1, "2026-11-03", "2026-11-01");
    semana = await controladorHorarios.semanaDeEmpleado(1, "2026-11-02");
    verificar("al borrar el dia programado vuelve a verse la plantilla; la asignacion sigue Activa",
        semana.dias[1].turno.origen === "Plantilla" && asignaciones[0].estado === "Activo");

    console.log("\n=== PRUEBA 12: turno especial (con 'hasta') sobre el horario base ===");
    reiniciar();
    let base = await crearTurno("Base 08-17 L-V", "08:00", "17:00", "1,2,3,4,5");
    let especialMie = await crearTurno("Especial miercoles 10-12", "10:00", "12:00", "3");
    let especialJue = await crearTurno("Especial jueves 14-16", "14:00", "16:00", "4");
    let especialMie2 = await crearTurno("Otro miercoles 18-20", "18:00", "20:00", "3");
    r = await asignar(base, "2026-11-02", null);
    verificar("horario base (sin hasta) asignado", r.exito, r.mensaje);

    r = await asignar(especialMie, "2026-11-04", "2026-11-25");
    verificar("un especial se puede cruzar con el base (lo reemplaza)", r.exito, r.mensaje);
    let idEspecial = r.datos.id;

    semana = await controladorHorarios.semanaDeEmpleado(1, "2026-11-02");
    verificar("el miercoles del especial muestra el especial",
        semana.dias[2].turno.nombre === "Especial miercoles 10-12" && semana.dias[2].turno.tipoAsignacion === "Especial",
        JSON.stringify(semana.dias[2].turno));
    verificar("los demas dias de esa semana siguen con el base",
        [0, 1, 3, 4].every(function (i) { return semana.dias[i].turno.tipoAsignacion === "Base"; }));
    semana = await controladorHorarios.semanaDeEmpleado(1, "2026-11-23");
    verificar("el ultimo miercoles del rango (25) aun es especial", semana.dias[2].turno.tipoAsignacion === "Especial");
    semana = await controladorHorarios.semanaDeEmpleado(1, "2026-11-30");
    verificar("pasada la fecha hasta, el horario base vuelve solo (miercoles 2 de diciembre)",
        semana.dias[2].fecha === "2026-12-02" && semana.dias[2].turno.nombre === "Base 08-17 L-V" &&
        semana.dias[2].turno.tipoAsignacion === "Base", JSON.stringify(semana.dias[2].turno));
    semana = await controladorHorarios.semanaDeEmpleado(1, "2026-10-26");
    verificar("antes de la fecha desde tampoco se aplica el especial", semana.dias[2].turno === null || semana.dias[2].turno.tipoAsignacion === "Base");

    r = await asignar(especialMie2, "2026-11-18", "2026-12-09");
    verificar("otro especial en una fecha que ya tiene especial se rechaza", !r.exito, r.mensaje);
    verificar("el mensaje dice 'ya tiene un horario asignado' y la fecha",
        !r.exito && r.mensaje.indexOf("2026-11-18 ya tiene un horario asignado") !== -1, r.mensaje);
    r = await asignar(especialMie2, "2026-11-26", "2026-12-09");
    verificar("el mismo turno en fechas posteriores libres se permite", r.exito, r.mensaje);
    r = await asignar(especialJue, "2026-11-04", "2026-11-25");
    verificar("un especial en otro dia de la semana se permite", r.exito, r.mensaje);

    let baseTarde = await crearTurno("Base 16-20 L-V", "16:00", "20:00", "1,2,3,4,5");
    r = await asignar(baseTarde, "2026-11-02", null);
    verificar("otro base que pisa las horas del base existente se rechaza", !r.exito, r.mensaje);
    verificar("el mensaje sugiere usar 'Hasta' para un turno temporal", !r.exito && r.mensaje.indexOf("\"Hasta\"") !== -1, r.mensaje);

    console.log("\n=== PRUEBA 13: el especial no puede caer en un dia con programacion diaria ===");
    reiniciar();
    let base2 = await crearTurno("Base2 08-17 L-V", "08:00", "17:00", "1,2,3,4,5");
    let especialJue2 = await crearTurno("Especial jueves", "14:00", "16:00", "4");
    await asignar(base2, "2026-11-02", null);
    programacion = [{ empleadoId: 1, fecha: "2026-11-12", horaEntrada: "22:00", horaSalida: "06:00", tipoTurno: "Nocturno" }];
    r = await asignar(especialJue2, "2026-11-05", "2026-11-26");
    verificar("se rechaza porque el 12 ya tiene programacion diaria", !r.exito, r.mensaje);
    verificar("el mensaje menciona la fecha ocupada", !r.exito && r.mensaje.indexOf("2026-11-12 ya tiene un horario asignado") !== -1, r.mensaje);
    r = await asignar(especialJue2, "2026-11-13", "2026-11-26");
    verificar("el mismo especial en fechas sin programacion se permite", r.exito, r.mensaje);

    console.log("\n=== PRUEBA 14: desactivar un especial devuelve el base al instante ===");
    reiniciar();
    let base3 = await crearTurno("Base3 08-17 L-V", "08:00", "17:00", "1,2,3,4,5");
    let esp3 = await crearTurno("Especial3 mie", "10:00", "12:00", "3");
    await asignar(base3, "2026-11-02", null);
    r = await asignar(esp3, "2026-11-04", "2026-11-25");
    r = await controladorHorarios.desactivarAsignacion(r.datos.id);
    verificar("se desactiva el especial", r.exito, r.mensaje);
    semana = await controladorHorarios.semanaDeEmpleado(1, "2026-11-02");
    verificar("el miercoles vuelve a mostrar el horario base", semana.dias[2].turno.tipoAsignacion === "Base");
    verificar("el horario base sigue Activo", asignaciones[0].estado === "Activo" && asignaciones[1].estado === "Inactivo");

    console.log("\n=== PRUEBA 15: quitar el turno base de UN solo dia ===");
    reiniciar();
    let base4 = await crearTurno("Base4 08-17 L-V", "08:00", "17:00", "1,2,3,4,5");
    await asignar(base4, "2026-11-02", null);
    r = await controladorHorarios.quitarDiaBase(1, "2026-11-04");
    verificar("se quita el miercoles 4", r.exito, r.mensaje);
    semana = await controladorHorarios.semanaDeEmpleado(1, "2026-11-02");
    verificar("ese miercoles queda sin turno", semana.dias[2].fecha === "2026-11-04" && semana.dias[2].turno === null);
    verificar("el resto de la semana conserva el base",
        [0, 1, 3, 4].every(function (i) { return semana.dias[i].turno !== null && semana.dias[i].turno.tipoAsignacion === "Base"; }));
    semana = await controladorHorarios.semanaDeEmpleado(1, "2026-11-09");
    verificar("el miercoles de la semana siguiente sigue con base", semana.dias[2].turno !== null && semana.dias[2].turno.tipoAsignacion === "Base");
    verificar("el horario base sigue Activo y sin cambios",
        asignaciones[0].estado === "Activo" && asignaciones[0].fechaHasta === null);
    r = await controladorHorarios.quitarDiaBase(1, "2026-11-04");
    verificar("quitar de nuevo ese dia da noEncontrado", !r.exito && r.noEncontrado === true, r.mensaje);
    r = await controladorHorarios.quitarDiaBase(1, "2026-11-07");
    verificar("un dia sin horario base da noEncontrado", !r.exito && r.noEncontrado === true, r.mensaje);
    r = await controladorHorarios.quitarDiaBase(1, "2026-02-30");
    verificar("una fecha invalida se rechaza", !r.exito && !r.noEncontrado, r.mensaje);

    let libre = (await controladorHorarios.horarioDeEmpleado(1)).find(function (a) { return a.estado === "Descanso"; });
    verificar("el dia libre aparece en la lista de asignaciones", libre !== undefined && libre.fechaDesde === "2026-11-04");
    r = await controladorHorarios.desactivarAsignacion(libre.id);
    verificar("restaurar el dia libre", r.exito, r.mensaje);
    semana = await controladorHorarios.semanaDeEmpleado(1, "2026-11-02");
    verificar("el miercoles 4 vuelve a tener el turno base", semana.dias[2].turno !== null && semana.dias[2].turno.tipoAsignacion === "Base");
    verificar("el dia libre ya no esta en la lista",
        (await controladorHorarios.horarioDeEmpleado(1)).every(function (a) { return a.estado !== "Descanso"; }));

    console.log("\n=== PRUEBA 16: quitar un dia base y luego agregar y quitar un especial ===");
    reiniciar();
    let base5 = await crearTurno("Base5 08-17 L-V", "08:00", "17:00", "1,2,3,4,5");
    let esp5 = await crearTurno("Especial5 mie", "10:00", "12:00", "3");
    await asignar(base5, "2026-11-02", null);
    await controladorHorarios.quitarDiaBase(1, "2026-11-11");
    r = await asignar(esp5, "2026-11-04", "2026-11-25");
    verificar("el especial se puede asignar aunque un miercoles del base este libre", r.exito, r.mensaje);
    let idEsp5 = r.datos.id;
    semana = await controladorHorarios.semanaDeEmpleado(1, "2026-11-09");
    verificar("el miercoles libre muestra el especial (el dia libre solo anula el base)",
        semana.dias[2].turno !== null && semana.dias[2].turno.tipoAsignacion === "Especial");
    r = await controladorHorarios.quitarDiaBase(1, "2026-11-11");
    verificar("ese dia lo cubre un especial: no se trata como base", !r.exito, r.mensaje);
    await controladorHorarios.desactivarAsignacion(idEsp5);
    semana = await controladorHorarios.semanaDeEmpleado(1, "2026-11-02");
    verificar("al quitar el especial reaparece el base el miercoles 4", semana.dias[2].turno.tipoAsignacion === "Base");
    semana = await controladorHorarios.semanaDeEmpleado(1, "2026-11-09");
    verificar("y el miercoles 11 sigue libre (su dia libre se conserva)", semana.dias[2].turno === null);
    verificar("el resto de dias de esa semana conserva el base",
        [0, 1, 3, 4].every(function (i) { return semana.dias[i].turno !== null; }));

    console.log("\n=== PRUEBA 17: reactivar una asignacion desactivada ===");
    reiniciar();
    let base6 = await crearTurno("Base6 08-17 L-V", "08:00", "17:00", "1,2,3,4,5");
    r = await asignar(base6, "2026-11-02", null);
    let idBase6 = r.datos.id;
    await controladorHorarios.desactivarAsignacion(idBase6);
    semana = await controladorHorarios.semanaDeEmpleado(1, "2026-11-02");
    verificar("desactivado el base, la semana queda vacia", semana.dias.every(function (d) { return d.turno === null; }));
    r = await controladorHorarios.reactivarAsignacion(idBase6);
    verificar("se reactiva el base", r.exito, r.mensaje);
    semana = await controladorHorarios.semanaDeEmpleado(1, "2026-11-02");
    verificar("el horario base reaparece", semana.dias[0].turno !== null && semana.dias[0].turno.tipoAsignacion === "Base");
    r = await controladorHorarios.reactivarAsignacion(idBase6);
    verificar("reactivar una ya activa se rechaza", !r.exito && !r.noEncontrado, r.mensaje);
    r = await controladorHorarios.reactivarAsignacion(9999);
    verificar("reactivar una inexistente da noEncontrado", !r.exito && r.noEncontrado === true, r.mensaje);

    await controladorHorarios.desactivarAsignacion(idBase6);
    let otroBase = await crearTurno("Otro base 10-18 L-V", "10:00", "18:00", "1,2,3,4,5");
    await asignar(otroBase, "2026-11-02", null);
    r = await controladorHorarios.reactivarAsignacion(idBase6);
    verificar("no se reactiva si ahora choca con otro horario base", !r.exito && r.mensaje.indexOf("se cruza") !== -1, r.mensaje);

    console.log("\n=== PRUEBA 18: permisos de las rutas nuevas ===");
    [["delete", "/base/:empleadoId/:fecha"], ["put", "/asignaciones/:id/reactivar"]].forEach(function (par) {
        let capa = rutaHorarios.stack.find(function (c) {
            return c.route && c.route.path === par[1] && c.route.methods[par[0]];
        });
        verificar("la ruta " + par[0].toUpperCase() + " " + par[1] + " existe", capa !== undefined);
        if (capa !== undefined) {
            let intentar = function (rol) {
                let estado = { codigo: null, siguio: false };
                let res = { status: function (c) { estado.codigo = c; return res; }, json: function () { return res; } };
                capa.route.stack[0].handle({ usuario: { rol: rol } }, res, function () { estado.siguio = true; });
                return estado;
            };
            verificar("  Empleado recibe 403", intentar("Empleado").codigo === 403);
            verificar("  Administrador pasa al controlador", intentar("Administrador").siguio === true);
        }
    });
}

probar()
    .catch(function (error) {
        fallas = fallas + 1;
        console.log("  [ERROR FATAL] " + error.stack);
    })
    .finally(function () {
        console.log(fallas === 0 ? "TODAS LAS PRUEBAS DE CONFLICTOS PASARON" : "PRUEBAS CON FALLOS: " + fallas);
        process.exit(fallas === 0 ? 0 : 1);
    });
