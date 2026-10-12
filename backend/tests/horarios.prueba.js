const controladorEmpleados = require("../src/modules/empleados/controladores/controladorEmpleados");
const repositorioEmpleados = require("../src/modules/empleados/repositorios/repositorioEmpleados");
const controlador = require("../src/modules/horarios-turnos/app/controladorHorarios");
const repositorio = require("../src/modules/horarios-turnos/datos/repositorioHorarios");

let fallas = 0;

function verificar(nombre, condicion, detalle) {
    if (condicion) {
        console.log("  [OK] " + nombre);
    } else {
        fallas = fallas + 1;
        console.log("  [FALLO] " + nombre + (detalle ? " -> " + detalle : ""));
    }
}

// crea (si no existe) un empleado de prueba y devuelve su id
async function empleadoDePrueba(nombre, cedula, correo) {
    await controladorEmpleados.registrarEmpleado({
        nombre: nombre, apellido: "Prueba", cedula: cedula, correo: correo,
        contrasena: "1234", telefono: "3001112233",
        contactoNombre: "Contacto", contactoTelefono: "3104445566",
        fechaIngreso: "2026-01-15"
    });

    let lista = await repositorioEmpleados.obtenerTodos();
    let empleado = lista.find(function (e) { return e.usuario.correo === correo; });
    return empleado === undefined ? null : empleado.usuario.id;
}

async function probar() {
    let idA = await empleadoDePrueba("Ana", "3001", "ana.horario@correo.com");
    let idB = await empleadoDePrueba("Beto", "3002", "beto.horario@correo.com");
    verificar("se crearon los empleados de prueba", idA !== null && idB !== null);
    if (idA === null || idB === null) {
        return;
    }

    console.log("\n=== PRUEBA 1: crear turnos (dias se normalizan) ===");
    let tDiurno = await controlador.registrarTurno({
        nombre: "Diurno Prueba CU05", horaEntrada: "08:00", horaSalida: "17:00",
        dias: [1, 2, 3, 4, 5, 5]
    });
    verificar("turno Diurno creado", tDiurno.exito, tDiurno.mensaje);
    verificar("dias normalizados a '1,2,3,4,5'", tDiurno.exito && tDiurno.datos.dias === "1,2,3,4,5",
        tDiurno.exito ? tDiurno.datos.dias : tDiurno.mensaje);

    let tFin = await controlador.registrarTurno({
        nombre: "Fin de semana CU05", horaEntrada: "08:00", horaSalida: "12:00",
        dias: "6,7"
    });
    verificar("turno Fin de semana creado", tFin.exito, tFin.mensaje);

    console.log("\n=== PRUEBA 2: validaciones de turno ===");
    let malHora = await controlador.registrarTurno({
        nombre: "Malo", horaEntrada: "25:00", horaSalida: "17:00", dias: "1"
    });
    verificar("hora invalida se rechaza", malHora.exito === false, malHora.mensaje);

    let dup = await controlador.registrarTurno({
        nombre: "Diurno Prueba CU05", horaEntrada: "08:00", horaSalida: "17:00", dias: "1"
    });
    verificar("nombre duplicado se rechaza", dup.exito === false, dup.mensaje);

    let sinDias = await controlador.registrarTurno({
        nombre: "Sin dias", horaEntrada: "08:00", horaSalida: "17:00", dias: "9,0"
    });
    verificar("dias fuera de rango se rechazan", sinDias.exito === false, sinDias.mensaje);

    console.log("\n=== PRUEBA 3: asignar horarios al empleado A ===");
    let a1 = await controlador.asignarHorario({
        empleadoId: idA, turnoId: tDiurno.datos.id, fechaDesde: "2026-01-01"
    });
    verificar("Diurno asignado (sin fecha hasta)", a1.exito, a1.mensaje);

    let a2 = await controlador.asignarHorario({
        empleadoId: idA, turnoId: tFin.datos.id, fechaDesde: "2026-01-01"
    });
    verificar("Fin de semana asignado", a2.exito, a2.mensaje);

    console.log("\n=== PRUEBA 4: validaciones de asignacion ===");
    let sinEmpleado = await controlador.asignarHorario({
        empleadoId: 999999, turnoId: tDiurno.datos.id, fechaDesde: "2026-01-01"
    });
    verificar("empleado inexistente se rechaza", sinEmpleado.exito === false, sinEmpleado.mensaje);

    let malRango = await controlador.asignarHorario({
        empleadoId: idA, turnoId: tDiurno.datos.id,
        fechaDesde: "2026-06-01", fechaHasta: "2026-05-01"
    });
    verificar("rango invertido se rechaza", malRango.exito === false, malRango.mensaje);

    console.log("\n=== PRUEBA 5: ver horarios asignados del empleado ===");
    let asignados = await controlador.horarioDeEmpleado(idA);
    verificar("el empleado A tiene 2 horarios asignados", asignados.length === 2, "len=" + asignados.length);

    console.log("\n=== PRUEBA 6: horario de hoy (turno vigente) ===");
    let hoyLunes = await controlador.horarioDeHoy(idA, "2026-08-10"); // lunes
    verificar("lunes -> Diurno", hoyLunes.turno !== null && hoyLunes.turno.nombre === "Diurno Prueba CU05",
        JSON.stringify(hoyLunes));

    let hoySabado = await controlador.horarioDeHoy(idA, "2026-08-15"); // sabado
    verificar("sabado -> Fin de semana", hoySabado.turno !== null && hoySabado.turno.nombre === "Fin de semana CU05",
        JSON.stringify(hoySabado));

    let antesDeAsignar = await controlador.horarioDeHoy(idA, "2025-06-01");
    verificar("fecha previa a la asignacion -> sin turno", antesDeAsignar.turno === null,
        JSON.stringify(antesDeAsignar));

    console.log("\n=== PRUEBA 7: vista semanal (lunes a domingo) ===");
    let semana = await controlador.semanaDeEmpleado(idA, "2026-08-12"); // miercoles, inicia lunes 10
    verificar("la semana inicia el lunes 2026-08-10", semana.inicio === "2026-08-10", semana.inicio);
    verificar("la semana tiene 7 dias", semana.dias.length === 7, "len=" + semana.dias.length);
    for (let d of semana.dias) {
        console.log("  " + d.dia + " " + d.fecha + ": " + (d.turno === null ? "Descanso" : d.turno.nombre));
    }
    verificar("lunes tiene Diurno", semana.dias[0].turno !== null && semana.dias[0].turno.nombre === "Diurno Prueba CU05");
    verificar("sabado tiene Fin de semana", semana.dias[5].turno !== null && semana.dias[5].turno.nombre === "Fin de semana CU05");
    verificar("domingo tiene Fin de semana", semana.dias[6].turno !== null && semana.dias[6].turno.nombre === "Fin de semana CU05");

    console.log("\n=== PRUEBA 8: fecha hasta = fin de vigencia ===");
    let a3 = await controlador.asignarHorario({
        empleadoId: idB, turnoId: tDiurno.datos.id,
        fechaDesde: "2026-09-01", fechaHasta: "2026-09-30"
    });
    verificar("horario con fecha hasta asignado al empleado B", a3.exito, a3.mensaje);

    let dentro = await controlador.horarioDeHoy(idB, "2026-09-15");
    verificar("dentro del rango -> Diurno", dentro.turno !== null && dentro.turno.nombre === "Diurno Prueba CU05");
    let fuera = await controlador.horarioDeHoy(idB, "2026-10-01");
    verificar("fuera del rango -> sin turno", fuera.turno === null, JSON.stringify(fuera));

    console.log("");
    console.log("Turnos creados: " + (await repositorio.obtenerTurnos()).length);
}

probar()
    .catch(function (error) {
        fallas = fallas + 1;
        console.log("  [ERROR FATAL] " + error.message);
    })
    .finally(function () {
        console.log(fallas === 0 ? "TODAS LAS PRUEBAS DE HORARIOS PASARON ✅" : "PRUEBAS CON FALLOS: " + fallas);
        process.exitCode = fallas === 0 ? 0 : 1;
    });
