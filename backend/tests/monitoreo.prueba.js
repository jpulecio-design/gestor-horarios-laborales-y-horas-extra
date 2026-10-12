const controladorEmpleados = require("../src/modules/empleados/controladores/controladorEmpleados");
const repositorioEmpleados = require("../src/modules/empleados/repositorios/repositorioEmpleados");
const controladorAsistencia = require("../src/modules/asistencia/app/controladorAsistencia");
const repositorioAsistencia = require("../src/modules/asistencia/datos/repositorioAsistencia");
const controladorHorasExtra = require("../src/modules/horas-extra/app/controladorHorasExtra");
const controlador = require("../src/modules/monitoreo/app/controladorMonitoreo");

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
        nombre: "Diego", apellido: "Lara", cedula: "5001", correo: "diego.monitoreo@correo.com",
        contrasena: "1234", telefono: "3001115566",
        contactoNombre: "Sara Lara", contactoTelefono: "3102223344",
        fechaIngreso: "2026-03-01"
    });

    let lista = await repositorioEmpleados.obtenerTodos();
    let empleado = lista.find(function (e) { return e.usuario.correo === "diego.monitoreo@correo.com"; });
    verificar("el empleado de prueba existe", empleado !== undefined);
    if (empleado === undefined) {
        return;
    }
    let id = empleado.usuario.id;

    // 4 marcajes que alternan Entrada/Salida, mas un 5to que anularemos
    let qr = await controladorAsistencia.obtenerQrDeEmpleado(id);
    await controladorAsistencia.registrarPorQr(qr.codigoQr);
    await controladorAsistencia.registrarPorQr(qr.codigoQr);
    await controladorAsistencia.registrarPorQr(qr.codigoQr);
    await controladorAsistencia.registrarPorQr(qr.codigoQr);
    await controladorAsistencia.registrarPorQr(qr.codigoQr);

    let marcajes = await repositorioAsistencia.obtenerPorEmpleado(id);
    verificar("se registraron 5 marcajes", marcajes.length === 5, "len=" + marcajes.length);
    if (marcajes.length < 5) {
        return;
    }

    // fijamos fecha/hora para que el monitoreo sea determinista (CU10)
    await controladorAsistencia.corregirRegistro(marcajes[0].id, { fechaHora: "2026-08-10 08:00:00" }); // Entrada
    await controladorAsistencia.corregirRegistro(marcajes[1].id, { fechaHora: "2026-08-10 17:00:00" }); // Salida
    await controladorAsistencia.corregirRegistro(marcajes[2].id, { fechaHora: "2026-08-11 08:00:00" }); // Entrada
    await controladorAsistencia.corregirRegistro(marcajes[3].id, { fechaHora: "2026-08-11 16:30:00" }); // Salida
    await controladorAsistencia.corregirRegistro(marcajes[4].id, {
        fechaHora: "2026-08-12 08:00:00", estado: "Anulado"
    });

    // horas extra dentro y fuera del periodo
    await controladorHorasExtra.registrarHoraExtra({
        empleadoId: id, fecha: "2026-08-10", tipo: "Diurna", cantidadHoras: 2, valorHoraBase: 10000
    });
    await controladorHorasExtra.registrarHoraExtra({
        empleadoId: id, fecha: "2026-08-11", tipo: "Nocturna", cantidadHoras: 1.5, valorHoraBase: 10000
    });
    await controladorHorasExtra.registrarHoraExtra({
        empleadoId: id, fecha: "2026-09-15", tipo: "Diurna", cantidadHoras: 5, valorHoraBase: 10000
    });

    console.log("\n=== PRUEBA 1: monitoreo de un empleado en el periodo ===");
    let r = await controlador.monitorearEmpleado(id, "2026-08-10", "2026-08-11");
    verificar("el monitoreo tiene exito", r.exito, r.mensaje);
    if (!r.exito) {
        return;
    }
    let a = r.datos.asistencia;
    let h = r.datos.horasExtra;

    verificar("marcajes activos = 4 (el anulado no cuenta)", a.marcajes === 4, "marcajes=" + a.marcajes);
    verificar("dias con marcajes = 2", a.dias === 2, "dias=" + a.dias);
    verificar("horas trabajadas = 17.5", a.horasTrabajadas === 17.5, "horas=" + a.horasTrabajadas);
    verificar("sin jornadas incompletas", a.jornadasIncompletas === 0, "incompletas=" + a.jornadasIncompletas);

    verificar("horas extra del periodo = 2 registros", h.registros === 2, "registros=" + h.registros);
    verificar("total horas extra = 3.5", h.totalHoras === 3.5, "totalHoras=" + h.totalHoras);
    verificar("Diurna = 2 h", h.porTipo.Diurna !== undefined && h.porTipo.Diurna.horas === 2,
        JSON.stringify(h.porTipo));
    verificar("Nocturna = 1.5 h", h.porTipo.Nocturna !== undefined && h.porTipo.Nocturna.horas === 1.5,
        JSON.stringify(h.porTipo));
    verificar("total valor hora extra = 51250", h.totalValor === 51250, "totalValor=" + h.totalValor);

    console.log("\n=== PRUEBA 2: resumen general incluye al empleado ===");
    let g = await controlador.monitorearGeneral("2026-08-10", "2026-08-11");
    verificar("el resumen general tiene exito", g.exito, g.mensaje);
    if (g.exito) {
        let fila = g.datos.empleados.find(function (f) { return f.empleado.id === id; });
        verificar("el empleado aparece en el resumen", fila !== undefined);
        if (fila !== undefined) {
            verificar("el resumen general coincide (17.5 h, $51250)",
                fila.asistencia.horasTrabajadas === 17.5 && fila.horasExtra.totalValor === 51250,
                JSON.stringify(fila));
        }
    }

    console.log("\n=== PRUEBA 3: validaciones ===");
    let malPeriodo = await controlador.monitorearEmpleado(id, "2026-08-11", "2026-08-10");
    verificar("periodo invertido se rechaza", malPeriodo.exito === false, malPeriodo.mensaje);

    let sinFecha = await controlador.monitorearEmpleado(id, "", "");
    verificar("periodo vacio se rechaza", sinFecha.exito === false, sinFecha.mensaje);

    let noExiste = await controlador.monitorearEmpleado(999999, "2026-08-10", "2026-08-11");
    verificar("empleado inexistente se rechaza", noExiste.exito === false, noExiste.mensaje);

    console.log("");
}

probar()
    .catch(function (error) {
        fallas = fallas + 1;
        console.log("  [ERROR FATAL] " + error.message);
    })
    .finally(function () {
        console.log(fallas === 0 ? "TODAS LAS PRUEBAS DE MONITOREO PASARON ✅" : "PRUEBAS CON FALLOS: " + fallas);
        process.exitCode = fallas === 0 ? 0 : 1;
    });
