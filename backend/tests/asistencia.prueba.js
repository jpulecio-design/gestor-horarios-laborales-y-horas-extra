const controladorEmpleados = require("../src/modules/empleados/controladores/controladorEmpleados");
const repositorioEmpleados = require("../src/modules/empleados/repositorios/repositorioEmpleados");
const controlador = require("../src/modules/asistencia/app/controladorAsistencia");
const repositorio = require("../src/modules/asistencia/datos/repositorioAsistencia");

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
    // empleado de base para escanear su QR
    await controladorEmpleados.registrarEmpleado({
        nombre: "Ana", apellido: "Gómez", cedula: "2001", correo: "ana.qr@correo.com",
        contrasena: "1234", telefono: "3001112233",
        contactoNombre: "Luis Gómez", contactoTelefono: "3104445566",
        fechaIngreso: "2026-01-15"
    });

    let lista = await repositorioEmpleados.obtenerTodos();
    let empleado = lista.find(function (e) { return e.usuario.correo === "ana.qr@correo.com"; });
    verificar("el empleado tiene un id", empleado !== undefined, "correo ana.qr@correo.com");
    if (empleado === undefined) {
        return;
    }
    let id = empleado.usuario.id;

    console.log("\n=== PRUEBA 1: cada empleado recibe un codigo QR unico ===");
    verificar("el empleado nace con codigoQr", empleado.codigoQr !== "", "codigo='" + empleado.codigoQr + "'");

    let qr = await controlador.obtenerQrDeEmpleado(id);
    verificar("se genera la imagen PNG del QR", qr !== null && qr.imagen.indexOf("data:image/png;base64,") === 0, "imagen");

    console.log("\n=== PRUEBA 2: el primer escaneo registra Entrada ===");
    let e1 = await controlador.registrarPorQr(qr.codigoQr);
    verificar("primer escaneo = Entrada", e1.exito && e1.datos.tipo === "Entrada", JSON.stringify(e1));

    console.log("\n=== PRUEBA 3: el segundo escaneo registra Salida ===");
    let e2 = await controlador.registrarPorQr(qr.codigoQr);
    verificar("segundo escaneo = Salida", e2.exito && e2.datos.tipo === "Salida", JSON.stringify(e2));

    console.log("\n=== PRUEBA 4: el tercer escaneo vuelve a Entrada (alterna) ===");
    let e3 = await controlador.registrarPorQr(qr.codigoQr);
    verificar("tercer escaneo = Entrada", e3.exito && e3.datos.tipo === "Entrada", JSON.stringify(e3));

    console.log("\n=== PRUEBA 5: codigo QR inexistente (debe fallar) ===");
    let e4 = await controlador.registrarPorQr("EMPQR-no-existe");
    verificar("codigo desconocido devuelve exito=false", e4.exito === false, JSON.stringify(e4));

    console.log("\n=== PRUEBA 6: codigo vacio (debe fallar) ===");
    let e5 = await controlador.registrarPorQr("");
    verificar("codigo vacio devuelve exito=false", e5.exito === false, JSON.stringify(e5));

    console.log("\n=== RESULTADO FINAL ===");
    let marcajes = await repositorio.obtenerPorEmpleado(id);
    verificar("el empleado tiene 3 marcajes", marcajes.length === 3, "len=" + marcajes.length);
    for (let m of marcajes) {
        console.log("  ID: " + m.id + " | " + m.tipo + " | " + m.fechaHora);
    }
    console.log("");
}

probar()
    .catch(function (error) {
        fallas = fallas + 1;
        console.log("  [ERROR FATAL] " + error.message);
    })
    .finally(function () {
        console.log(fallas === 0 ? "TODAS LAS PRUEBAS DE ASISTENCIA PASARON ✅" : "PRUEBAS CON FALLOS: " + fallas);
        process.exitCode = fallas === 0 ? 0 : 1;
    });
