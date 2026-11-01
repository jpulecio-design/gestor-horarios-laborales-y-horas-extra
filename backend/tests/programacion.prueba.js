// Pruebas del CU04 (Parametrizar Horarios y Plantillas de Turnos).
// NO usan Oracle: los repositorios se reemplazan por datos en memoria y la
// transaccion se prueba con una conexion simulada. Se pueden correr sin base de datos:
//   node tests/programacion.prueba.js

// credenciales falsas para que database.js no intente leer una base real
process.env.DB_USER = process.env.DB_USER || "prueba";
process.env.DB_PASSWORD = process.env.DB_PASSWORD || "prueba";
process.env.DB_CONNECT_STRING = process.env.DB_CONNECT_STRING || "localhost:1521/prueba";

const ExcelJS = require("exceljs");

const database = require("../src/config/database");
const programacion = require("../src/modules/horarios-turnos/dominio/programacion");
const repositorioProgramacion = require("../src/modules/horarios-turnos/datos/repositorioProgramacion");
const repositorioHorarios = require("../src/modules/horarios-turnos/datos/repositorioHorarios");
const repositorioEmpleados = require("../src/modules/empleados/repositorios/repositorioEmpleados");
const controlador = require("../src/modules/horarios-turnos/app/controladorProgramacion");
const controladorHorarios = require("../src/modules/horarios-turnos/app/controladorHorarios");

let fallas = 0;

function verificar(nombre, condicion, detalle) {
    if (condicion) {
        console.log("  [OK] " + nombre);
    } else {
        fallas = fallas + 1;
        console.log("  [FALLO] " + nombre + (detalle ? " -> " + detalle : ""));
    }
}

const HOY = programacion.hoyTexto();
const D = function (n) { return programacion.sumarDias(HOY, n); }; // fecha relativa a hoy

// ---------------- conexion Oracle simulada (para la transaccion) ----------------
let conexionFalsa = null;

function crearConexionFalsa(fallarEnLlamada) {
    return {
        llamadas: [],
        confirmado: false,
        deshecho: false,
        cerrada: false,
        execute: function (sql) {
            this.llamadas.push(sql.trim().split(/\s+/)[0]);
            if (fallarEnLlamada !== undefined && this.llamadas.length === fallarEnLlamada) {
                return Promise.reject(new Error("ORA-00001: fallo simulado"));
            }
            // el UPDATE no encuentra filas (el dia es nuevo) -> el repositorio hace INSERT
            return Promise.resolve({ rowsAffected: sql.indexOf("UPDATE") === 0 ? 0 : 1, rows: [] });
        },
        commit: function () { this.confirmado = true; return Promise.resolve(); },
        rollback: function () { this.deshecho = true; return Promise.resolve(); },
        close: function () { this.cerrada = true; return Promise.resolve(); }
    };
}

database.oracledb.createPool = function () {
    return Promise.resolve({
        getConnection: function () { return Promise.resolve(conexionFalsa); },
        close: function () { return Promise.resolve(); }
    });
};

//  base en memoria para el controlador 
const empleados = {
    1: { usuario: { id: 1, nombre: "Ana", apellido: "Prueba", estado: "Activo" } },
    2: { usuario: { id: 2, nombre: "Beto", apellido: "Prueba", estado: "Activo" } },
    3: { usuario: { id: 3, nombre: "Ciro", apellido: "Inactivo", estado: "Inactivo" } }
};
let tabla = []; // filas de HORARIO_ASIGNADO

function usarBaseEnMemoria() {
    repositorioEmpleados.buscarEmpleadoPorId = async function (id) { return empleados[id] || null; };
    repositorioProgramacion.obtenerPorEmpleadoEntre = async function (id, desde, hasta) {
        return tabla.filter(function (f) { return f.empleadoId === id && f.fecha >= desde && f.fecha <= hasta; })
            .map(function (f) { return Object.assign({}, f); });
    };
    // todo o nada, igual que la transaccion real
    repositorioProgramacion.guardarDias = async function (dias) {
        let copia = tabla.map(function (f) { return Object.assign({}, f); });
        let insertados = 0;
        let actualizados = 0;
        dias.forEach(function (d) {
            let fila = copia.find(function (f) { return f.empleadoId === d.empleadoId && f.fecha === d.fecha; });
            if (fila) { Object.assign(fila, d); actualizados++; } else { copia.push(Object.assign({ id: copia.length + 1 }, d)); insertados++; }
        });
        tabla = copia;
        return { insertados: insertados, actualizados: actualizados };
    };
    repositorioProgramacion.eliminarDia = async function (id, fecha) {
        let antes = tabla.length;
        tabla = tabla.filter(function (f) { return !(f.empleadoId === id && f.fecha === fecha); });
        return tabla.length < antes;
    };
    repositorioHorarios.obtenerAsignacionesPorEmpleado = async function () {
        return [{ fechaDesde: "2000-01-01", fechaHasta: null,
            turno: { id: 9, nombre: "Plantilla L-D", horaEntrada: "08:00", horaSalida: "17:00", dias: "1,2,3,4,5,6,7" } }];
    };
}

async function excel(filas, encabezados) {
    let libro = new ExcelJS.Workbook();
    let hoja = libro.addWorksheet("Programacion");
    hoja.addRow(encabezados || ["empleadoId", "fecha", "horaEntrada", "horaSalida", "tipoTurno"]);
    filas.forEach(function (f) { hoja.addRow(f); });
    return Buffer.from(await libro.xlsx.writeBuffer());
}

function dia(fecha, entrada, salida, tipo) {
    return { fecha: fecha, horaEntrada: entrada, horaSalida: salida, tipoTurno: tipo };
}

async function probar() {
    console.log("\n=== PRUEBA 1: reglas del dominio ===");
    verificar("catalogo = Diurno, Vespertino, Nocturno", programacion.TIPOS_TURNO.join(",") === "Diurno,Vespertino,Nocturno");
    verificar("Nocturno 22:00-06:00 cruza medianoche", programacion.cruzaMedianoche(dia(D(1), "22:00", "06:00", "Nocturno")));
    verificar("Nocturno 22:00-06:00 = 8 horas", programacion.horasProgramadas(dia(D(1), "22:00", "06:00", "Nocturno")) === 8);
    verificar("Nocturno valido NO se rechaza por cruzar medianoche", programacion.validarDia(dia(D(1), "22:00", "06:00", "Nocturno"), HOY).errores.length === 0);
    verificar("Nocturno del dia 1 se solapa con turno 05:00 del dia 2",
        programacion.seSolapan(dia(D(1), "22:00", "06:00", "Nocturno"), dia(D(2), "05:00", "13:00", "Diurno")));
    verificar("Nocturno del dia 1 NO se solapa con turno 06:00 del dia 2 (termina justo)",
        !programacion.seSolapan(dia(D(1), "22:00", "06:00", "Nocturno"), dia(D(2), "06:00", "14:00", "Diurno")));
    verificar("06:00-14:00 y 14:00-22:00 el mismo dia NO se solapan",
        !programacion.seSolapan(dia(D(1), "06:00", "14:00", "Diurno"), dia(D(1), "14:00", "22:00", "Vespertino")));
    verificar("tipo en minusculas se normaliza", programacion.validarDia(dia(D(1), "06:00", "14:00", "vespertino"), HOY).dia.tipoTurno === "Vespertino");

    let campos = function (r) { return r.errores.map(function (e) { return e.campo; }).join(","); };
    verificar("tipo arbitrario se rechaza", campos(programacion.validarDia(dia(D(1), "06:00", "14:00", "Mixto"), HOY)) === "tipoTurno");
    verificar("fecha imposible se rechaza", campos(programacion.validarDia(dia("2026-02-30", "06:00", "14:00", "Diurno"), HOY)) === "fecha");
    verificar("fecha anterior a hoy se rechaza", campos(programacion.validarDia(dia(D(-1), "06:00", "14:00", "Diurno"), HOY)) === "fecha");
    verificar("hoy SI se permite", programacion.validarDia(dia(HOY, "06:00", "14:00", "Diurno"), HOY).errores.length === 0);
    verificar("campos vacios -> 4 errores", programacion.validarDia({}, HOY).errores.length === 4);
    verificar("hora 25:00 se rechaza", campos(programacion.validarDia(dia(D(1), "25:00", "14:00", "Diurno"), HOY)) === "horaEntrada");
    verificar("entrada igual a salida se rechaza", campos(programacion.validarDia(dia(D(1), "08:00", "08:00", "Diurno"), HOY)) === "horaSalida");

    console.log("\n=== PRUEBA 2: transaccion real con conexion simulada ===");
    conexionFalsa = crearConexionFalsa();
    let r = await repositorioProgramacion.guardarDias([
        { empleadoId: 1, fecha: D(1), horaEntrada: "06:00", horaSalida: "14:00", tipoTurno: "Diurno" },
        { empleadoId: 1, fecha: D(2), horaEntrada: "14:00", horaSalida: "22:00", tipoTurno: "Vespertino" }
    ]);
    verificar("dia nuevo: UPDATE sin filas -> INSERT", conexionFalsa.llamadas.join(",") === "UPDATE,INSERT,UPDATE,INSERT", conexionFalsa.llamadas.join(","));
    verificar("todo bien -> commit, sin rollback", conexionFalsa.confirmado && !conexionFalsa.deshecho);
    verificar("devuelve 2 insertados", r.insertados === 2 && r.actualizados === 0, JSON.stringify(r));
    verificar("la conexion se devuelve al pool", conexionFalsa.cerrada);

    conexionFalsa = crearConexionFalsa(4); // falla el segundo INSERT
    let error = null;
    try {
        await repositorioProgramacion.guardarDias([
            { empleadoId: 1, fecha: D(1), horaEntrada: "06:00", horaSalida: "14:00", tipoTurno: "Diurno" },
            { empleadoId: 1, fecha: D(2), horaEntrada: "14:00", horaSalida: "22:00", tipoTurno: "Vespertino" }
        ]);
    } catch (e) { error = e; }
    verificar("fallo de base de datos -> rollback y sin commit", conexionFalsa.deshecho && !conexionFalsa.confirmado);
    verificar("el error original llega al llamador", error !== null && error.message.indexOf("fallo simulado") !== -1);
    verificar("la conexion se cierra aunque falle", conexionFalsa.cerrada);

    usarBaseEnMemoria();

    console.log("\n=== PRUEBA 3: programar dias (carga manual) ===");
    tabla = [];
    r = await controlador.programarDias(1, [
        dia(D(1), "06:00", "14:00", "Diurno"),
        dia(D(2), "14:00", "22:00", "Vespertino"),
        dia(D(3), "22:00", "06:00", "Nocturno")
    ], HOY);
    verificar("programacion valida se guarda", r.exito && r.datos.insertados === 3, r.mensaje);
    verificar("resumen con 24 horas programadas", r.exito && r.datos.horasProgramadas === 24, r.exito ? r.datos.horasProgramadas : "");
    verificar("resumen marca el nocturno como 'termina al dia siguiente'", r.exito && r.datos.dias[2].terminaAlDiaSiguiente === true);

    r = await controlador.programarDias(1, [dia(D(2), "06:00", "14:00", "Diurno")], HOY);
    verificar("reprogramar una fecha existente la ACTUALIZA", r.exito && r.datos.actualizados === 1 && r.datos.insertados === 0, r.mensaje);
    verificar("no se crean duplicados", tabla.filter(function (f) { return f.empleadoId === 1 && f.fecha === D(2); }).length === 1 && tabla.length === 3);
    verificar("el dia quedo con el nuevo horario", tabla.find(function (f) { return f.fecha === D(2); }).tipoTurno === "Diurno");

    r = await controlador.programarDias(999, [dia(D(1), "06:00", "14:00", "Diurno")], HOY);
    verificar("empleado inexistente se rechaza", !r.exito && r.mensaje.indexOf("no existe") !== -1, r.mensaje);
    r = await controlador.programarDias(3, [dia(D(1), "06:00", "14:00", "Diurno")], HOY);
    verificar("empleado inactivo se rechaza", !r.exito && r.mensaje.indexOf("inactivo") !== -1, r.mensaje);
    r = await controlador.programarDias(1, [], HOY);
    verificar("lista de dias vacia se rechaza", !r.exito);

    console.log("\n=== PRUEBA 4: solapamientos (no guarda nada) ===");
    let antes = JSON.stringify(tabla);
    // el nocturno guardado en D(3) termina a las 06:00 de D(4)
    r = await controlador.programarDias(1, [dia(D(4), "05:00", "13:00", "Diurno")], HOY);
    verificar("choque con el nocturno guardado del dia anterior", !r.exito && r.errores[0].mensaje.indexOf("ya guardado Nocturno 22:00-06:00 del " + D(3)) !== -1,
        r.errores ? r.errores[0].mensaje : r.mensaje);
    r = await controlador.programarDias(1, [
        dia(D(10), "22:00", "06:00", "Nocturno"),
        dia(D(11), "04:00", "12:00", "Diurno")
    ], HOY);
    verificar("choque entre dias de la misma programacion", !r.exito && r.errores[0].mensaje.indexOf("misma programación") !== -1);
    r = await controlador.programarDias(1, [dia(D(12), "06:00", "14:00", "Diurno"), dia(D(12), "14:00", "22:00", "Vespertino")], HOY);
    verificar("fecha repetida en la misma programacion se rechaza", !r.exito && r.errores[0].campo === "fecha");
    r = await controlador.programarDias(1, [dia(D(13), "06:00", "14:00", "Diurno"), dia(D(-2), "06:00", "14:00", "Diurno")], HOY);
    verificar("un dia invalido invalida toda la programacion", !r.exito && r.errores.length === 1 && r.errores[0].dia === 2);
    verificar("la programacion anterior queda intacta", JSON.stringify(tabla) === antes);

    console.log("\n=== PRUEBA 5: consultar y quitar dias ===");
    r = await controlador.consultarProgramacion(1, D(1), D(7));
    verificar("consulta del periodo devuelve 3 dias", r.exito && r.datos.dias.length === 3, r.mensaje);
    r = await controlador.consultarProgramacion(1, D(7), D(1));
    verificar("periodo invertido se rechaza", !r.exito);
    r = await controlador.consultarProgramacion(1, D(1), D(400));
    verificar("periodo de mas de 366 dias se rechaza", !r.exito);
    r = await controlador.eliminarDia(1, D(1), HOY);
    verificar("quitar el turno de un dia", r.exito && tabla.length === 2, r.mensaje);
    r = await controlador.eliminarDia(1, D(1), HOY);
    verificar("quitar un dia sin turno -> no encontrado", !r.exito && r.noEncontrado === true);

    console.log("\n=== PRUEBA 6: muestra la programacion en el calendario ===");
    let semana = await controladorHorarios.semanaDeEmpleado(1, D(2));
    let delDia = semana.dias.find(function (d) { return d.fecha === D(2); });
    verificar("el dia programado muestra el turno programado", delDia.turno.origen === "Programación" && delDia.turno.tipoTurno === "Diurno", JSON.stringify(delDia.turno));
    let sinProgramar = semana.dias.find(function (d) { return d.fecha !== D(2) && d.fecha !== D(3); });
    verificar("los demas dias muestran la plantilla", sinProgramar.turno.origen === "Plantilla", JSON.stringify(sinProgramar.turno));
    let hoy = await controladorHorarios.horarioDeHoy(1, D(3));
    verificar("'hoy' devuelve el nocturno programado", hoy.turno.tipoTurno === "Nocturno" && hoy.turno.horaSalida === "06:00");

    console.log("\n=== PRUEBA 7: importar plantilla Excel ===");
    tabla = [];
    r = await controlador.importarProgramacion(await excel([
        [1, D(1), "06:00", "14:00", "Diurno"],
        [1, D(2), "22:00", "06:00", "Nocturno"],
        [2, D(1), "14:00", "22:00", "Vespertino"]
    ]), HOY);
    verificar("Excel valido se importa", r.exito && r.datos.totalDias === 3 && r.datos.totalEmpleados === 2, r.mensaje);

    // celdas con formato de fecha y hora de Excel (no texto)
    let p = D(5).split("-").map(Number);
    r = await controlador.importarProgramacion(await excel([
        [2, new Date(Date.UTC(p[0], p[1] - 1, p[2])), new Date(Date.UTC(1899, 11, 30, 6, 0)), 14 / 24, "Diurno"]
    ]), HOY);
    verificar("celdas con formato fecha/hora de Excel se leen bien", r.exito && tabla.some(function (f) { return f.empleadoId === 2 && f.fecha === D(5) && f.horaEntrada === "06:00" && f.horaSalida === "14:00"; }), r.mensaje);

    antes = JSON.stringify(tabla);
    r = await controlador.importarProgramacion(await excel([
        ["", D(6), "06:00", "14:00", "Diurno"],           // fila 2: empleado vacio
        [1, "2026-02-30", "06:00", "14:00", "Diurno"],    // fila 3: fecha imposible
        [1, D(7), "6am", "14:00", "Diurno"],              // fila 4: hora invalida
        [1, D(8), "06:00", "14:00", "Mixto"],             // fila 5: tipo invalido
        [999, D(9), "06:00", "14:00", "Diurno"],          // fila 6: empleado inexistente
        [3, D(9), "06:00", "14:00", "Diurno"],            // fila 7: empleado inactivo
        [1, D(3), "05:00", "13:00", "Diurno"],            // fila 8: choca con el nocturno guardado de D(2)
        [1, D(11), "06:00", "14:00", "Diurno"],           // fila 9
        [1, D(11), "14:00", "22:00", "Vespertino"]        // fila 10: fecha repetida
    ]), HOY);
    let en = function (fila, col) { return r.errores && r.errores.some(function (e) { return e.fila === fila && e.columna.indexOf(col) === 0; }); };
    verificar("FA1: Excel con errores se rechaza completo", !r.exito && JSON.stringify(tabla) === antes, r.mensaje);
    verificar("fila 2 empleadoId vacio", en(2, "empleadoId (A)"));
    verificar("fila 3 fecha invalida", en(3, "fecha (B)"));
    verificar("fila 4 hora de entrada invalida", en(4, "horaEntrada (C)"));
    verificar("fila 5 tipo de turno invalido", en(5, "tipoTurno (E)"));
    verificar("fila 6 empleado inexistente", en(6, "empleadoId"));
    verificar("fila 7 empleado inactivo", en(7, "empleadoId") && r.errores.some(function (e) { return e.fila === 7 && e.mensaje.indexOf("inactivo") !== -1; }));
    verificar("fila 8 solapamiento con lo guardado", r.errores.some(function (e) { return e.fila === 8 && e.mensaje.indexOf("ya guardado") !== -1; }));
    verificar("fila 10 fecha repetida en el archivo", en(10, "fecha"));

    r = await controlador.importarProgramacion(await excel([[1, D(1), "06:00", "14:00"]], ["empleadoId", "fecha", "horaEntrada", "horaSalida"]), HOY);
    verificar("falta una columna obligatoria", !r.exito && r.errores[0].mensaje.indexOf("tipoTurno") !== -1);
    r = await controlador.importarProgramacion(await excel([]), HOY);
    verificar("archivo sin filas de datos", !r.exito && r.errores[0].mensaje.indexOf("no tiene filas") !== -1);
    error = null;
    try { await controlador.importarProgramacion(Buffer.from("no es excel"), HOY); } catch (e) { error = e; }
    verificar("archivo danado se marca como invalido", error !== null && error.esArchivoInvalido === true);

    // reintentar el mismo archivo valido: actualiza, no duplica
    r = await controlador.importarProgramacion(await excel([[1, D(1), "07:00", "15:00", "Diurno"]]), HOY);
    verificar("reimportar una fecha la actualiza sin duplicar", r.exito && r.datos.actualizados === 1 &&
        tabla.filter(function (f) { return f.empleadoId === 1 && f.fecha === D(1); }).length === 1, r.mensaje);
}

probar()
    .catch(function (error) {
        fallas = fallas + 1;
        console.log("  [ERROR FATAL] " + error.stack);
    })
    .finally(function () {
        console.log(fallas === 0 ? "\nTODAS LAS PRUEBAS DE PROGRAMACION PASARON " : "\nPRUEBAS CON FALLOS: " + fallas);
        process.exitCode = fallas === 0 ? 0 : 1;
    });
