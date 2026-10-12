const controladorEmpleados = require("../src/modules/empleados/controladores/controladorEmpleados");
const repositorioEmpleados = require("../src/modules/empleados/repositorios/repositorioEmpleados");
const controladorAsistencia = require("../src/modules/asistencia/app/controladorAsistencia");
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
    await controladorEmpleados.registrarEmpleado({
        nombre: "Carla", apellido: "Ruiz", cedula: "4001", correo: "carla.correccion@correo.com",
        contrasena: "1234", telefono: "3001114455",
        contactoNombre: "Marta Ruiz", contactoTelefono: "3109998877",
        fechaIngreso: "2026-02-01"
    });

    let lista = await repositorioEmpleados.obtenerTodos();
    let empleado = lista.find(function (e) { return e.usuario.correo === "carla.correccion@correo.com"; });
    verificar("el empleado de prueba existe", empleado !== undefined, "correo carla.correccion@correo.com");
    if (empleado === undefined) {
        return;
    }
    let id = empleado.usuario.id;

    // dos marcajes: Entrada y Salida
    let qr = await controladorAsistencia.obtenerQrDeEmpleado(id);
    await controladorAsistencia.registrarPorQr(qr.codigoQr);
    await controladorAsistencia.registrarPorQr(qr.codigoQr);

    let marcajes = await repositorio.obtenerPorEmpleado(id);
    verificar("se registraron 2 marcajes", marcajes.length === 2, "len=" + marcajes.length);
    if (marcajes.length < 2) {
        return;
    }

    let primera = marcajes[0];

    console.log("\n=== PRUEBA 1: corregir tipo, fecha/hora, observacion y estado ===");
    let correccion = await controladorAsistencia.corregirRegistro(primera.id, {
        tipo: "Salida",
        fechaHora: "2026-08-10 08:03:00",
        observacion: "llegó tarde, se corrige",
        estado: "Anulado"
    });
    verificar("la correccion tiene exito", correccion.exito, correccion.mensaje);

    let corregida = await repositorio.buscarPorId(primera.id);
    verificar("tipo actualizado a Salida", corregida.tipo === "Salida", corregida.tipo);
    verificar("fechaHora actualizada", corregida.fechaHora === "2026-08-10 08:03:00", corregida.fechaHora);
    verificar("observacion actualizada", corregida.observacion === "llegó tarde, se corrige", corregida.observacion);
    verificar("estado actualizado a Anulado", corregida.estado === "Anulado", corregida.estado);

    console.log("\n=== PRUEBA 2: correccion parcial conserva los demas campos ===");
    let parcial = await controladorAsistencia.corregirRegistro(primera.id, { observacion: "solo observacion" });
    let trasParcial = await repositorio.buscarPorId(primera.id);
    verificar("la correccion parcial tiene exito", parcial.exito, parcial.mensaje);
    verificar("el tipo sigue siendo Salida", trasParcial.tipo === "Salida", trasParcial.tipo);
    verificar("la fechaHora no cambio", trasParcial.fechaHora === "2026-08-10 08:03:00", trasParcial.fechaHora);
    verificar("la observacion cambio", trasParcial.observacion === "solo observacion", trasParcial.observacion);

    console.log("\n=== PRUEBA 3: validaciones ===");
    let malTipo = await controladorAsistencia.corregirRegistro(primera.id, { tipo: "Cualquiera" });
    verificar("tipo invalido se rechaza", malTipo.exito === false, malTipo.mensaje);

    let malFecha = await controladorAsistencia.corregirRegistro(primera.id, { fechaHora: "10/08/2026" });
    verificar("fecha con formato invalido se rechaza", malFecha.exito === false, malFecha.mensaje);

    let malEstado = await controladorAsistencia.corregirRegistro(primera.id, { estado: "Borrado" });
    verificar("estado invalido se rechaza", malEstado.exito === false, malEstado.mensaje);

    let noExiste = await controladorAsistencia.corregirRegistro(999999, { tipo: "Entrada" });
    verificar("id inexistente se rechaza", noExiste.exito === false, noExiste.mensaje);

    console.log("");
}

probar()
    .catch(function (error) {
        fallas = fallas + 1;
        console.log("  [ERROR FATAL] " + error.message);
    })
    .finally(function () {
        console.log(fallas === 0 ? "TODAS LAS PRUEBAS DE CORRECCION PASARON ✅" : "PRUEBAS CON FALLOS: " + fallas);
        process.exitCode = fallas === 0 ? 0 : 1;
    });
