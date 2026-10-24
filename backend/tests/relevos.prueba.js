const controladorEmpleados = require("../src/modules/empleados/controladores/controladorEmpleados");
const controlador = require("../src/modules/horarios-turnos/app/controladorRelevos");
const consola = require("../src/modules/horarios-turnos/cli/consolaRelevos");
const database = require("../src/config/database");

const sufijo = String(Date.now()).slice(-6);
const CHAT_DE_PRUEBA = "1897437521";

function fechaFutura(dias) {
    let f = new Date();
    f.setDate(f.getDate() + dias);
    let mes = String(f.getMonth() + 1).padStart(2, "0");
    let dia = String(f.getDate()).padStart(2, "0");
    return f.getFullYear() + "-" + mes + "-" + dia;
}

function datosEmpleado(nombre, numero) {
    return {
        nombre: nombre, apellido: "Prueba", cedula: "PRB" + sufijo + numero,
        correo: nombre.toLowerCase() + sufijo + "@prueba.com", contrasena: "1234",
        telefono: "300000000" + numero, fechaIngreso: "2026-01-15", cargo: "Operario",
        salarioBase: "1500000", contactoNombre: "", contactoTelefono: "",
        contactoParentesco: "", telegramChatId: CHAT_DE_PRUEBA
    };
}

// Crea la plantilla (tablas del modulo de horarios del compañero).
function crearTurnoPlantilla() {
    let sql =
        "INSERT INTO TURNO (nombre, hora_entrada, hora_salida, dias) " +
        "VALUES (:nombre, '08:00', '17:00', '1,2,3,4,5,6,7') " +
        "RETURNING id_turno INTO :id";

    return database.ejecutar(sql, {
        nombre: "PRB Diurno " + sufijo,
        id: { dir: database.oracledb.BIND_OUT, type: database.oracledb.NUMBER }
    }).then(function (r) { return r.outBinds.id[0]; });
}

function asignarPlantilla(empleadoId, turnoId) {
    let sql =
        "INSERT INTO ASIGNACION_HORARIO (id_empleado, id_turno, fecha_desde, fecha_hasta) " +
        "VALUES (:empleadoId, :turnoId, TO_DATE(:desde, 'YYYY-MM-DD'), NULL)";

    return database.ejecutar(sql, {
        empleadoId: empleadoId, turnoId: turnoId, desde: "2026-01-01"
    });
}

function buscarIdPorCedula(cedula) {
    return database.ejecutar(
        "SELECT id_empleado FROM EMPLEADO WHERE cedula = :cedula", { cedula: cedula }
    ).then(function (r) { return r.rows[0].ID_EMPLEADO; });
}

async function correrPruebas() {
    console.log("\n=== PREPARACIÓN: empleados, plantilla y asignaciones ===");
    await controladorEmpleados.registrarEmpleado(datosEmpleado("Ana", "1"));
    await controladorEmpleados.registrarEmpleado(datosEmpleado("Carlos", "2"));

    let idAna = await buscarIdPorCedula("PRB" + sufijo + "1");
    let idCarlos = await buscarIdPorCedula("PRB" + sufijo + "2");
    let turnoId = await crearTurnoPlantilla();
    await asignarPlantilla(idAna, turnoId);
    console.log("Ana = " + idAna + " (con plantilla), Carlos = " + idCarlos + " (sin plantilla)");

    let fechaUno = fechaFutura(3);
    let fechaDos = fechaFutura(4);

    console.log("\n=== PRUEBA 1: la agenda de Ana sale de la PLANTILLA ===");
    consola.mostrarAgenda(await controlador.agendaDeEmpleado(idAna, 5));

    console.log("\n=== PRUEBA 2: fecha sin turno para Carlos (debe fallar) ===");
    console.log((await controlador.solicitarRelevo({
        fecha: fechaUno, idSolicitante: idCarlos, idCompanero: idAna
    })).mensaje);

    console.log("\n=== PRUEBA 3: pedirse relevo a sí mismo (debe fallar) ===");
    console.log((await controlador.solicitarRelevo({
        fecha: fechaUno, idSolicitante: idAna, idCompanero: idAna
    })).mensaje);

    console.log("\n=== PRUEBA 4: fecha pasada (debe fallar) ===");
    console.log((await controlador.solicitarRelevo({
        fecha: "2020-01-01", idSolicitante: idAna, idCompanero: idCarlos
    })).mensaje);

    console.log("\n=== PRUEBA 5: solicitud válida (Ana cede el " + fechaUno + ") ===");
    let creada = await controlador.solicitarRelevo({
        fecha: fechaUno, idSolicitante: idAna, idCompanero: idCarlos
    });
    console.log(creada.mensaje);

    console.log("\n=== PRUEBA 6: pedir el MISMO día otra vez (debe fallar) ===");
    console.log((await controlador.solicitarRelevo({
        fecha: fechaUno, idSolicitante: idAna, idCompanero: idCarlos
    })).mensaje);

    console.log("\n=== PRUEBA 7: responder sin ser el compañero (debe fallar) ===");
    console.log((await controlador.responderRelevo({
        idSolicitud: creada.datos.id, idEmpleado: idAna, respuesta: "Confirmado"
    })).mensaje);

    console.log("\n=== PRUEBA 8: Carlos CONFIRMA ===");
    console.log((await controlador.responderRelevo({
        idSolicitud: creada.datos.id, idEmpleado: idCarlos, respuesta: "Confirmado"
    })).mensaje);

    console.log("\n=== PRUEBA 9: el día cedido desaparece de la agenda de Ana ===");
    consola.mostrarAgenda(await controlador.agendaDeEmpleado(idAna, 5));

    console.log("\n=== PRUEBA 10: y aparece en la de Carlos (que no tiene plantilla) ===");
    consola.mostrarAgenda(await controlador.agendaDeEmpleado(idCarlos, 5));

    console.log("\n=== PRUEBA 11: responder una solicitud ya respondida (debe fallar) ===");
    console.log((await controlador.responderRelevo({
        idSolicitud: creada.datos.id, idEmpleado: idCarlos, respuesta: "Rechazado"
    })).mensaje);

    console.log("\n=== PRUEBA 12: segunda solicitud, esta vez RECHAZADA ===");
    let segunda = await controlador.solicitarRelevo({
        fecha: fechaDos, idSolicitante: idAna, idCompanero: idCarlos
    });
    console.log(segunda.mensaje);
    console.log((await controlador.responderRelevo({
        idSolicitud: segunda.datos.id, idEmpleado: idCarlos, respuesta: "Rechazado"
    })).mensaje);

    console.log("\n=== PRUEBA 13: tras el rechazo, el día sigue siendo de Ana ===");
    consola.mostrarAgenda(await controlador.agendaDeEmpleado(idAna, 5));

    console.log("\n=== LISTADOS ===");
    consola.mostrarRelevos("ENVIADAS POR ANA", await controlador.relevosEnviados(idAna), false);
    consola.mostrarRelevos("RECIBIDAS POR CARLOS", await controlador.relevosRecibidos(idCarlos), true);

    // ----- LIMPIEZA (comenta este bloque para revisar los datos) -----
    console.log("\n=== LIMPIEZA ===");
    await database.ejecutar(
        "DELETE FROM SOLICITUD_RELEVO WHERE id_horario IN " +
        "(SELECT id_horario FROM HORARIO_ASIGNADO WHERE id_empleado IN " +
        "(SELECT id_empleado FROM EMPLEADO WHERE cedula LIKE 'PRB%'))", {});
    await database.ejecutar(
        "DELETE FROM HORARIO_ASIGNADO WHERE id_empleado IN " +
        "(SELECT id_empleado FROM EMPLEADO WHERE cedula LIKE 'PRB%')", {});
    await database.ejecutar(
        "DELETE FROM ASIGNACION_HORARIO WHERE id_empleado IN " +
        "(SELECT id_empleado FROM EMPLEADO WHERE cedula LIKE 'PRB%')", {});
    await database.ejecutar("DELETE FROM TURNO WHERE nombre LIKE 'PRB%'", {});
    await database.ejecutar(
        "DELETE FROM CONTACTO_EMERGENCIA WHERE id_empleado IN " +
        "(SELECT id_empleado FROM EMPLEADO WHERE cedula LIKE 'PRB%')", {});
    let borrados = await database.ejecutar("DELETE FROM EMPLEADO WHERE cedula LIKE 'PRB%'", {});
    console.log("Se borraron " + borrados.rowsAffected + " empleados de prueba.\n");
}

correrPruebas().catch(function (error) {
    console.log("\nLAS PRUEBAS SE DETUVIERON: " + error.message);
});