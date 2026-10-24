const fs = require("fs");
const os = require("os");
const path = require("path");
const ExcelJS = require("exceljs");

const database = require("../src/config/database");
const repositorio = require("../src/modules/backups/repositorios/repositorioBackups");
const repositorioDatos = require("../src/modules/backups/repositorios/repositorioDatos");
const generador = require("../src/modules/backups/servicios/generadorBackup");
const regla = require("../src/modules/backups/servicios/reglaBackups");
const comparador = require("../src/modules/backups/servicios/comparadorBackup");
const controlador = require("../src/modules/backups/controladores/controladorBackups");
const tarea = require("../src/modules/backups/tareas/tareaBackupAutomatico");
const telegram = require("../src/modules/notificaciones/telegram");
const servicioAutenticacion = require("../src/modules/auth/compartido/servicioAutenticacion");
const app = require("../src/app");

let fallas = 0;

function verificar(nombre, condicion, detalle) {
    if (condicion) {
        console.log("  [OK] " + nombre);
    } else {
        fallas = fallas + 1;
        console.log("  [FALLO] " + nombre + (detalle ? " -> " + detalle : ""));
    }
}

let consultasALaBD = 0;
database.ejecutar = function (sql) {
    consultasALaBD = consultasALaBD + 1;
    return Promise.reject(new Error("Las pruebas no deben usar la BD: " + sql));
};

let historial = [];
let avisos = [];
let llamadasGenerar = 0;

const generarArchivoReal = generador.generarArchivo;

function reiniciarFalsos() {
    historial = [];
    avisos = [];
    llamadasGenerar = 0;

    repositorio.insertarBackup = function (datos) {
        historial.push(datos);
        return Promise.resolve(historial.length);
    };
    repositorio.buscarPorId = function (id) {
        let fila = historial[id - 1];
        if (fila === undefined) {
            return Promise.resolve(null);
        }
        return Promise.resolve(Object.assign({ id: id, fechaHora: "2026-10-17 10:00:00" }, fila));
    };
    repositorio.obtenerTodos = function () {
        return Promise.resolve([]);
    };
    repositorio.obtenerUltimoExitoso = function () {
        return Promise.resolve(null);
    };
    telegram.enviarMensaje = function (chatId, texto) {
        avisos.push({ chatId: chatId, texto: texto });
        return Promise.resolve(true);
    };
    generador.generarArchivo = generarArchivoReal;
}

function generadorQueFalla(fallos) {
    return function () {
        llamadasGenerar = llamadasGenerar + 1;
        if (llamadasGenerar <= fallos) {
            return Promise.reject(new Error("Espacio insuficiente en disco (simulado)"));
        }
        return Promise.resolve({ nombreArchivo: "backup_falso.json", tamanoBytes: 100 });
    };
}

function tablasDeEjemplo() {
    return {
        EMPLEADO: {
            pk: "ID_EMPLEADO",
            filas: [
                { ID_EMPLEADO: 1, NOMBRE: "Ana", CARGO: "Cajera", CONTRASENA: "1234" },
                { ID_EMPLEADO: 2, NOMBRE: "Carlos", CARGO: "Vigilante", CONTRASENA: "abcd" }
            ]
        },
        NOMINA: { pk: "ID_NOMINA", filas: [] }
    };
}

function haceDias(ahora, dias) {
    return new Date(ahora.getTime() - dias * regla.MS_POR_DIA);
}

async function probar() {
    const AHORA = new Date("2026-10-17T10:00:00");

    console.log("\n=== PRUEBA 1: RN24 - regla de los 5 días ===");
    verificar("sin respaldos previos -> toca backup", regla.necesitaBackup(null, AHORA) === true);
    verificar("hace 4 días -> NO toca", regla.necesitaBackup(haceDias(AHORA, 4), AHORA) === false);
    verificar("hace 4 días y 23 h -> NO toca",
        regla.necesitaBackup(new Date(haceDias(AHORA, 5).getTime() + 60 * 60 * 1000), AHORA) === false);
    verificar("hace 5 días exactos -> toca", regla.necesitaBackup(haceDias(AHORA, 5), AHORA) === true);
    verificar("hace 6 días -> toca", regla.necesitaBackup(haceDias(AHORA, 6), AHORA) === true);
    verificar("el próximo automático es 5 días después del último",
        regla.fechaATexto(regla.fechaProximoBackup(haceDias(AHORA, 2))) === "2026-10-20 10:00:00");

    console.log("\n=== PRUEBA 2: RN24 - la tarea programada ===");
    reiniciarFalsos();
    generador.generarArchivo = generadorQueFalla(0);
    repositorio.obtenerUltimoExitoso = function () {
        return Promise.resolve({ fechaHora: regla.fechaATexto(haceDias(AHORA, 2)) });
    };
    let r = await tarea.verificarYEjecutar(AHORA);
    verificar("último respaldo hace 2 días -> no genera", r.ejecutado === false && llamadasGenerar === 0, r.motivo);
    verificar("si no toca backup, no se envía ningún aviso", avisos.length === 0);

    repositorio.obtenerUltimoExitoso = function () {
        return Promise.resolve({ fechaHora: regla.fechaATexto(haceDias(AHORA, 5)) });
    };
    r = await tarea.verificarYEjecutar(AHORA);
    verificar("último respaldo hace 5 días -> genera sin intervención manual",
        r.ejecutado === true && llamadasGenerar === 1, r.motivo);
    verificar("queda registrado como Automatico / Exitoso y sin usuario",
        historial.length === 1 && historial[0].tipo === "Automatico" &&
        historial[0].estado === "Exitoso" && !historial[0].idEmpleado,
        JSON.stringify(historial));
    verificar("cada 5 días llega UN aviso por Telegram al administrador",
        avisos.length === 1 && avisos[0].texto.indexOf("Backup automático generado correctamente") !== -1,
        JSON.stringify(avisos));

    reiniciarFalsos();
    generador.generarArchivo = generadorQueFalla(0);
    r = await tarea.verificarYEjecutar(AHORA);
    verificar("sin respaldos previos -> genera", r.ejecutado === true && llamadasGenerar === 1, r.motivo);

    let dosALaVez = await Promise.all([tarea.verificarYEjecutar(AHORA), tarea.verificarYEjecutar(AHORA)]);
    verificar("dos revisiones al mismo tiempo -> solo una genera (candado)",
        dosALaVez[0].ejecutado !== dosALaVez[1].ejecutado);

    process.env.BACKUP_AUTOMATICO = "false";
    verificar("BACKUP_AUTOMATICO=false desactiva la tarea", tarea.iniciar() === null);
    delete process.env.BACKUP_AUTOMATICO;

    console.log("\n=== PRUEBA 3: FA1 - backup automático fallido ===");
    reiniciarFalsos();
    generador.generarArchivo = generadorQueFalla(99);
    r = await controlador.generarBackupAutomatico({ esperaMs: 0 });
    verificar("se intenta " + controlador.MAX_INTENTOS_AUTOMATICO + " veces",
        llamadasGenerar === controlador.MAX_INTENTOS_AUTOMATICO, "llamadas=" + llamadasGenerar);
    verificar("el resultado es fallido", r.exito === false && r.intentos === 3, r.mensaje);
    verificar("queda UNA fila Automatico / Fallido con 3 intentos y el error",
        historial.length === 1 && historial[0].estado === "Fallido" && historial[0].tipo === "Automatico" &&
        historial[0].intentos === 3 && historial[0].detalleError.indexOf("Espacio insuficiente") !== -1,
        JSON.stringify(historial));
    verificar("se notifica UNA vez al administrador (chat vacío = chat del admin)",
        avisos.length === 1 && avisos[0].chatId === "" && r.notificado === true, JSON.stringify(avisos));
    verificar("el aviso dice los intentos y el error",
        avisos.length === 1 && avisos[0].texto.indexOf("Intentos realizados: 3") !== -1 &&
        avisos[0].texto.indexOf("Espacio insuficiente") !== -1);

    reiniciarFalsos();
    generador.generarArchivo = generadorQueFalla(2);
    r = await controlador.generarBackupAutomatico({ esperaMs: 0 });
    verificar("falla 2 veces y al 3er intento funciona -> Exitoso con 3 intentos",
        r.exito === true && historial.length === 1 && historial[0].estado === "Exitoso" && historial[0].intentos === 3,
        JSON.stringify(historial));
    verificar("si al final funciona se avisa el ÉXITO (no la alerta de fallo)",
        avisos.length === 1 && avisos[0].chatId === "" &&
        avisos[0].texto.indexOf("generado correctamente") !== -1 && avisos[0].texto.indexOf("ALERTA") === -1,
        JSON.stringify(avisos));
    verificar("el aviso de éxito dice el archivo y cómo descargarlo en Excel",
        avisos.length === 1 && avisos[0].texto.indexOf("backup_falso.json") !== -1 &&
        avisos[0].texto.indexOf("opción 4") !== -1);

    reiniciarFalsos();
    generador.generarArchivo = generadorQueFalla(0);
    telegram.enviarMensaje = function () {
        return Promise.resolve(false);
    };
    r = await controlador.generarBackupAutomatico({ esperaMs: 0 });
    verificar("si Telegram falla al avisar el éxito, el backup sigue siendo exitoso",
        r.exito === true && r.notificado === false && historial[0].estado === "Exitoso");

    reiniciarFalsos();
    generador.generarArchivo = generadorQueFalla(99);
    telegram.enviarMensaje = function () {
        return Promise.resolve(false);
    };
    r = await controlador.generarBackupAutomatico({ esperaMs: 0 });
    verificar("si Telegram falla, el fallo igual queda registrado",
        r.exito === false && r.notificado === false && historial.length === 1);

    reiniciarFalsos();
    generador.generarArchivo = generadorQueFalla(99);
    repositorio.insertarBackup = function () {
        return Promise.reject(new Error("ORA-12541 (simulado)"));
    };
    r = await controlador.generarBackupAutomatico({ esperaMs: 0 });
    verificar("si la BD está caída, igual se avisa por Telegram", r.exito === false && avisos.length === 1);

    reiniciarFalsos();
    generador.generarArchivo = generadorQueFalla(1);
    let inicio = Date.now();
    await controlador.generarBackupAutomatico({ esperaMs: 50 });
    verificar("espera entre un intento y otro", Date.now() - inicio >= 45, (Date.now() - inicio) + " ms");

    console.log("\n=== PRUEBA 4: EX01 - no hay respaldos previos ===");
    reiniciarFalsos();
    r = await controlador.compararConRespaldo(1);
    verificar("muestra 'No hay respaldos disponibles para comparación'",
        r.exito === false && r.codigo === 404 && r.mensaje === "No hay respaldos disponibles para comparación",
        JSON.stringify(r));

    repositorio.obtenerUltimoExitoso = function () {
        return Promise.resolve({ id: 1 });
    };
    r = await controlador.compararConRespaldo(999);
    verificar("con respaldos pero id inexistente -> otro mensaje",
        r.exito === false && r.mensaje === "El respaldo seleccionado no existe en el histórico.", r.mensaje);

    historial.push({ estado: "Fallido", tipo: "Manual" });
    r = await controlador.compararConRespaldo(1);
    verificar("un respaldo Fallido no se puede comparar", r.exito === false && r.codigo === 400, r.mensaje);

    console.log("\n=== PRUEBA 5: generar el archivo y comparar (en una carpeta temporal) ===");
    let carpetaTemporal = fs.mkdtempSync(path.join(os.tmpdir(), "prueba-backups-"));
    process.env.BACKUP_DIR = carpetaTemporal;

    let datosBD = tablasDeEjemplo();
    repositorioDatos.leerTabla = function (nombre) {
        let tabla = datosBD[nombre];
        return Promise.resolve(tabla ? JSON.parse(JSON.stringify(tabla.filas)) : []);
    };

    try {
        reiniciarFalsos();
        r = await controlador.generarBackupManual(7);
        verificar("backup manual -> archivo creado y registrado como Manual / Exitoso con el usuario",
            r.exito === true && fs.existsSync(path.join(carpetaTemporal, r.datos.nombreArchivo)) &&
            historial[0].tipo === "Manual" && historial[0].idEmpleado === 7,
            r.mensaje);

        let contenido = await generador.leerArchivo(r.datos.nombreArchivo);
        verificar("el archivo trae las tablas de la lista blanca",
            contenido.tablas.EMPLEADO.filas.length === 2 &&
            Object.keys(contenido.tablas).length === repositorioDatos.TABLAS_RESPALDO.length);

        repositorio.obtenerUltimoExitoso = function () {
            return Promise.resolve({ id: 1 });
        };
        r = await controlador.compararConRespaldo(1);
        verificar("recién generado -> sin diferencias", r.exito === true && r.datos.hayDiferencias === false,
            JSON.stringify(r.datos && r.datos.totales));

        datosBD.EMPLEADO.filas[0].CARGO = "Supervisora";
        datosBD.EMPLEADO.filas[0].CONTRASENA = "nueva";
        datosBD.EMPLEADO.filas.splice(1, 1);
        datosBD.EMPLEADO.filas.push({ ID_EMPLEADO: 3, NOMBRE: "Luis", CARGO: "Cajero", CONTRASENA: "x" });

        r = await controlador.compararConRespaldo(1);
        let empleados = r.datos.tablas.filter(function (t) { return t.tabla === "EMPLEADO"; })[0];
        verificar("detecta 1 nuevo, 1 eliminado y 1 modificado",
            r.datos.totales.nuevos === 1 && r.datos.totales.eliminados === 1 && r.datos.totales.modificados === 1,
            JSON.stringify(r.datos.totales));
        verificar("el nuevo es Luis y el eliminado es Carlos",
            empleados.nuevos[0].id === "3" && empleados.eliminados[0].registro.NOMBRE === "Carlos");

        let campoCargo = empleados.modificados[0].campos.filter(function (c) { return c.campo === "CARGO"; })[0];
        verificar("muestra el cargo antes -> después",
            campoCargo.antes === "Cajera" && campoCargo.despues === "Supervisora", JSON.stringify(campoCargo));

        let texto = JSON.stringify(r.datos);
        verificar("la contraseña nunca aparece en el informe",
            texto.indexOf("1234") === -1 && texto.indexOf("nueva") === -1 && texto.indexOf("abcd") === -1);

        verificar("la descarga no se sale de la carpeta de respaldos",
            path.dirname(generador.rutaDeArchivo("../../.env")) === carpetaTemporal);

        let carpetaDescargas = path.join(carpetaTemporal, "Descargas");

        r = await controlador.guardarEnDescargas(1, "excel", carpetaDescargas);
        verificar("descargar en Excel -> crea el .xlsx en la carpeta Descargas",
            r.exito === true && path.extname(r.ruta) === ".xlsx" && fs.existsSync(r.ruta), JSON.stringify(r));

        let libro = new ExcelJS.Workbook();
        await libro.xlsx.readFile(r.ruta);
        let hojaEmpleado = libro.getWorksheet("EMPLEADO");
        let encabezados = hojaEmpleado.getRow(1).values.filter(function (v) { return v; });
        verificar("el Excel trae una hoja Resumen y una hoja por tabla",
            libro.getWorksheet("Resumen") !== undefined &&
            libro.worksheets.length === repositorioDatos.TABLAS_RESPALDO.length + 1,
            libro.worksheets.length + " hojas");
        verificar("la hoja EMPLEADO tiene los 2 registros del respaldo",
            hojaEmpleado.rowCount === 3 &&
            hojaEmpleado.getRow(2).getCell(hojaEmpleado.getRow(1).values.indexOf("NOMBRE")).value === "Ana",
            "filas=" + hojaEmpleado.rowCount);
        verificar("el Excel NO incluye la columna CONTRASENA",
            encabezados.indexOf("CONTRASENA") === -1 && encabezados.indexOf("CARGO") !== -1,
            JSON.stringify(encabezados));

        let segunda = await controlador.guardarEnDescargas(1, "excel", carpetaDescargas);
        verificar("descargar dos veces no sobrescribe: crea 'nombre (1).xlsx'",
            segunda.exito === true && path.basename(segunda.ruta).indexOf("(1).xlsx") !== -1,
            path.basename(segunda.ruta));

        r = await controlador.guardarEnDescargas(1, "json", carpetaDescargas);
        verificar("descargar en JSON -> copia completa del respaldo",
            r.exito === true && JSON.parse(fs.readFileSync(r.ruta, "utf8")).tablas.EMPLEADO.filas.length === 2,
            JSON.stringify(r));

        r = await controlador.guardarEnDescargas(999, "excel", carpetaDescargas);
        verificar("descargar un respaldo que no existe -> 404", r.exito === false && r.codigo === 404, r.mensaje);
    } finally {
        fs.rmSync(carpetaTemporal, { recursive: true, force: true });
        delete process.env.BACKUP_DIR;
    }

    let informe = comparador.compararDatos(
        { NOMINA: { pk: "ID_NOMINA", filas: [] } },
        { NOMINA: { pk: "ID_NOMINA", filas: [] }, MARCACION: { pk: "ID_MARCACION", filas: [{ ID_MARCACION: 1 }] } }
    );
    verificar("tabla que no estaba en el respaldo -> sus filas son nuevas",
        informe.totales.nuevos === 1 && informe.hayDiferencias === true);

    console.log("\n=== PRUEBA 6: solo el Administrador entra (CU01) ===");
    servicioAutenticacion.iniciarSesion = function (correo, clave) {
        if (correo === "admin@empresa.com" && clave === "admin123") {
            return Promise.resolve({ exito: true, usuario: { id: 2, username: correo, rol: "Administrador" } });
        }
        if (correo === "carlos@empresa.com" && clave === "clave123") {
            return Promise.resolve({ exito: true, usuario: { id: 1, username: correo, rol: "Empleado" } });
        }
        return Promise.resolve({ exito: false, mensaje: "Usuario o contraseña incorrectos" });
    };

    function basic(correo, clave) {
        return { Authorization: "Basic " + Buffer.from(correo + ":" + clave).toString("base64") };
    }

    reiniciarFalsos();
    await new Promise(function (terminar) {
        const server = app.listen(0, async function () {
            const base = "http://localhost:" + server.address().port + "/api/backups";
            try {
                let res = await fetch(base);
                verificar("sin credenciales -> 401", res.status === 401, "status=" + res.status);

                res = await fetch(base, { headers: basic("admin@empresa.com", "mala") });
                verificar("clave incorrecta -> 401", res.status === 401, "status=" + res.status);

                res = await fetch(base, { headers: basic("carlos@empresa.com", "clave123") });
                verificar("rol Empleado -> 403", res.status === 403, "status=" + res.status);

                res = await fetch(base, { headers: basic("admin@empresa.com", "admin123") });
                let body = await res.json();
                verificar("Administrador -> 200 con la fecha del último respaldo",
                    res.status === 200 && body.ultimoRespaldo === null && Array.isArray(body.historial),
                    "status=" + res.status);

                res = await fetch(base + "/1/comparacion", { headers: basic("admin@empresa.com", "admin123") });
                body = await res.json();
                verificar("EX01 por HTTP -> 404 con el mensaje",
                    res.status === 404 && body.error === "No hay respaldos disponibles para comparación",
                    JSON.stringify(body));

                res = await fetch(base + "/abc/descarga", { headers: basic("admin@empresa.com", "admin123") });
                verificar("id inválido -> 400", res.status === 400, "status=" + res.status);

                res = await fetch(base + "/5/excel", { headers: basic("admin@empresa.com", "admin123") });
                verificar("Excel de un respaldo que no existe -> 404", res.status === 404, "status=" + res.status);

                res = await fetch(base + "/5/excel");
                verificar("Excel sin credenciales -> 401", res.status === 401, "status=" + res.status);
            } finally {
                server.closeAllConnections();
                server.close(terminar);
            }
        });
    });

    console.log("\n=== PRUEBA 7: las pruebas no tocaron la base de datos ===");
    verificar("cero consultas a la BD real", consultasALaBD === 0, consultasALaBD + " consulta(s)");
}

probar()
    .catch(function (error) {
        fallas = fallas + 1;
        console.log("  [ERROR FATAL] " + error.message);
    })
    .then(function () {
        console.log("\n" + (fallas === 0 ? "TODAS LAS PRUEBAS DE BACKUPS PASARON ✅" : "PRUEBAS CON FALLOS: " + fallas));
        process.exitCode = fallas === 0 ? 0 : 1;
    });
