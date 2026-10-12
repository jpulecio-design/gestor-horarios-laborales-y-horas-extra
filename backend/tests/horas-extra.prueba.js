const controladorEmpleados = require("../src/modules/empleados/controladores/controladorEmpleados");
const controlador = require("../src/modules/horas-extra/app/controladorHorasExtra");
const repositorio = require("../src/modules/horas-extra/datos/repositorioHorasExtra");

async function probar() {
    // dejamos de base un empleado para poder asignarle horas extra
    await controladorEmpleados.registrarEmpleado({
        nombre: "Ana", apellido: "Gómez", cedula: "1001", correo: "ana@correo.com",
        contrasena: "1234", telefono: "3001112233",
        contactoNombre: "Luis Gómez", contactoTelefono: "3104445566",
        fechaIngreso: "2026-01-15"
    });

    console.log("\n=== PRUEBA 1: registrar hora extra diurna valida ===");
    console.log((await controlador.registrarHoraExtra({
        empleadoId: 1, fecha: "2026-08-10", tipo: "Diurna",
        cantidadHoras: 2, valorHoraBase: 5000
    })).mensaje);

    console.log("\n=== PRUEBA 2: registrar hora extra nocturna valida ===");
    console.log((await controlador.registrarHoraExtra({
        empleadoId: 1, fecha: "2026-08-11", tipo: "Nocturna",
        cantidadHoras: 3, valorHoraBase: 5000
    })).mensaje);

    console.log("\n=== PRUEBA 3: tipo invalido (debe fallar) ===");
    console.log((await controlador.registrarHoraExtra({
        empleadoId: 1, fecha: "2026-08-10", tipo: "Madrugada",
        cantidadHoras: 2, valorHoraBase: 5000
    })).mensaje);

    console.log("\n=== PRUEBA 4: cantidad de horas en cero (debe fallar) ===");
    console.log((await controlador.registrarHoraExtra({
        empleadoId: 1, fecha: "2026-08-10", tipo: "Diurna",
        cantidadHoras: 0, valorHoraBase: 5000
    })).mensaje);

    console.log("\n=== RESULTADO FINAL ===");
    console.log("Horas extra del empleado 1:");
    for (let h of await repositorio.obtenerPorEmpleado(1)) {
        console.log("  ID: " + h.id + " | " + h.tipo + " | " + h.cantidadHoras + "h | $" + h.valor);
    }
    console.log("");
}

probar().catch(function (error) {
    console.log("ERROR: " + error.message);
});
