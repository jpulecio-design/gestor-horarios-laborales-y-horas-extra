const ExcelJS = require("exceljs");

const controladorEmpleados = require("../src/modules/empleados/controladores/controladorEmpleados");
const repositorioEmpleados = require("../src/modules/empleados/repositorios/repositorioEmpleados");
const controladorAsistencia = require("../src/modules/asistencia/app/controladorAsistencia");
const repositorioAsistencia = require("../src/modules/asistencia/datos/repositorioAsistencia");
const controladorHorasExtra = require("../src/modules/horas-extra/app/controladorHorasExtra");
const controlador = require("../src/modules/reportes/app/controladorReportes");

let fallas = 0;

function verificar(nombre, condicion, detalle) {
    if (condicion) {
        console.log("  [OK] " + nombre);
    } else {
        fallas = fallas + 1;
        console.log("  [FALLO] " + nombre + (detalle ? " -> " + detalle : ""));
    }
}

async function probar() {
    await controladorEmpleados.registrarEmpleado({
        nombre: "Elena", apellido: "Soto", cedula: "6001", correo: "elena.reportes@correo.com",
        contrasena: "1234", telefono: "3001116677",
        contactoNombre: "Raúl Soto", contactoTelefono: "3105554433",
        fechaIngreso: "2026-04-01"
    });

    let lista = await repositorioEmpleados.obtenerTodos();
    let empleado = lista.find(function (e) { return e.usuario.correo === "elena.reportes@correo.com"; });
    verificar("el empleado de prueba existe", empleado !== undefined);
    if (empleado === undefined) {
        return;
    }
    let id = empleado.usuario.id;

    let qr = await controladorAsistencia.obtenerQrDeEmpleado(id);
    await controladorAsistencia.registrarPorQr(qr.codigoQr);
    await controladorAsistencia.registrarPorQr(qr.codigoQr);

    let marcajes = await repositorioAsistencia.obtenerPorEmpleado(id);
    await controladorAsistencia.corregirRegistro(marcajes[0].id, { fechaHora: "2026-08-10 08:00:00" });
    await controladorAsistencia.corregirRegistro(marcajes[1].id, { fechaHora: "2026-08-10 17:00:00" });

    await controladorHorasExtra.registrarHoraExtra({
        empleadoId: id, fecha: "2026-08-10", tipo: "Diurna", cantidadHoras: 2, valorHoraBase: 10000
    });

    console.log("\n=== PRUEBA 1: generar el reporte .xlsx ===");
    let r = await controlador.exportarReporte("2026-08-10", "2026-08-10");
    verificar("la exportacion tiene exito", r.exito, r.mensaje);
    if (!r.exito) {
        return;
    }

    let buffer = Buffer.from(r.datos.buffer);
    verificar("el nombre del archivo es .xlsx", r.datos.nombreArchivo.slice(-5) === ".xlsx", r.datos.nombreArchivo);
    verificar("el contenido es un .xlsx (firma PK)", buffer[0] === 0x50 && buffer[1] === 0x4B,
        "bytes=" + buffer[0] + "," + buffer[1]);
    verificar("el reporte trae al menos una fila de resumen", r.datos.conteos.empleados >= 1,
        JSON.stringify(r.datos.conteos));
    verificar("el reporte trae la hora extra del empleado", r.datos.conteos.horasExtra >= 1,
        JSON.stringify(r.datos.conteos));
    verificar("el reporte trae la jornada del empleado", r.datos.conteos.jornadas >= 1,
        JSON.stringify(r.datos.conteos));

    console.log("\n=== PRUEBA 2: el libro tiene las 3 hojas esperadas ===");
    let libro = new ExcelJS.Workbook();
    await libro.xlsx.load(buffer);
    let nombres = libro.worksheets.map(function (h) { return h.name; });
    verificar("hoja Resumen", nombres.indexOf("Resumen") !== -1, nombres.join(","));
    verificar("hoja Horas extra", nombres.indexOf("Horas extra") !== -1, nombres.join(","));
    verificar("hoja Asistencia", nombres.indexOf("Asistencia") !== -1, nombres.join(","));

    console.log("\n=== PRUEBA 3: los datos del empleado estan en la hoja Resumen ===");
    let resumen = libro.getWorksheet("Resumen");
    let encontrado = false;
    resumen.eachRow(function (fila, numero) {
        if (numero === 1) { return; }
        let nombre = String(fila.getCell(2).value);
        if (nombre.indexOf("Elena Soto") !== -1) {
            encontrado = true;
            verificar("horas trabajadas del empleado = 9", fila.getCell(4).value === 9, "valor=" + fila.getCell(4).value);
            verificar("horas extra del empleado = 2", fila.getCell(6).value === 2, "valor=" + fila.getCell(6).value);
        }
    });
    verificar("el empleado aparece en la hoja Resumen", encontrado);

    console.log("\n=== PRUEBA 4: validaciones del periodo ===");
    let malPeriodo = await controlador.exportarReporte("2026-08-11", "2026-08-10");
    verificar("periodo invertido se rechaza", malPeriodo.exito === false, malPeriodo.mensaje);

    let sinFecha = await controlador.exportarReporte("", "");
    verificar("periodo vacio se rechaza", sinFecha.exito === false, sinFecha.mensaje);

    console.log("");
}

probar()
    .catch(function (error) {
        fallas = fallas + 1;
        console.log("  [ERROR FATAL] " + error.message);
    })
    .finally(function () {
        console.log(fallas === 0 ? "TODAS LAS PRUEBAS DE REPORTES PASARON ✅" : "PRUEBAS CON FALLOS: " + fallas);
        process.exitCode = fallas === 0 ? 0 : 1;
    });
