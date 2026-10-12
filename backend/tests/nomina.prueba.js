const controladorEmpleados = require("../src/modules/empleados/controladores/controladorEmpleados");
const controladorHorasExtra = require("../src/modules/horas-extra/app/controladorHorasExtra");
const controlador = require("../src/modules/nomina/app/controladorNomina");
const repositorio = require("../src/modules/nomina/datos/repositorioNomina");

async function probar() {
    // dejamos de base un empleado y sus horas extra del periodo 2026-08
    await controladorEmpleados.registrarEmpleado({
        nombre: "Ana", apellido: "Gómez", cedula: "1001", correo: "ana@correo.com",
        contrasena: "1234", telefono: "3001112233",
        contactoNombre: "Luis Gómez", contactoTelefono: "3104445566",
        fechaIngreso: "2026-01-15"
    });

    await controladorHorasExtra.registrarHoraExtra({
        empleadoId: 1, fecha: "2026-08-10", tipo: "Diurna",
        cantidadHoras: 2, valorHoraBase: 5000
    });
    await controladorHorasExtra.registrarHoraExtra({
        empleadoId: 1, fecha: "2026-08-11", tipo: "Nocturna",
        cantidadHoras: 3, valorHoraBase: 5000
    });

    console.log("\n=== PRUEBA 1: registrar nomina valida de Ana (periodo 2026-08) ===");
    let r1 = await controlador.registrarNomina({
        empleadoId: 1, periodo: "2026-08", salarioBase: 1600000,
        horasRecargoNocturno: 10, horasRecargoFestivo: 4
    });
    console.log(r1.mensaje);
    if (r1.exito) {
        let n = r1.datos;
        console.log("  Horas extra incluidas: $" + n.pagoHorasExtra);
        console.log("  Total devengado:      $" + n.totalDevengado);
        console.log("  Neto a pagar:         $" + n.netoPagar);
    }

    console.log("\n=== PRUEBA 2: nomina repetida del mismo empleado/periodo (debe fallar) ===");
    console.log((await controlador.registrarNomina({
        empleadoId: 1, periodo: "2026-08", salarioBase: 1600000,
        horasRecargoNocturno: 0, horasRecargoFestivo: 0
    })).mensaje);

    console.log("\n=== PRUEBA 3: salario base en cero (debe fallar) ===");
    console.log((await controlador.registrarNomina({
        empleadoId: 1, periodo: "2026-09", salarioBase: 0,
        horasRecargoNocturno: 0, horasRecargoFestivo: 0
    })).mensaje);

    console.log("\n=== PRUEBA 4: periodo vacio (debe fallar) ===");
    console.log((await controlador.registrarNomina({
        empleadoId: 1, periodo: "", salarioBase: 1600000,
        horasRecargoNocturno: 0, horasRecargoFestivo: 0
    })).mensaje);

    console.log("\n=== RESULTADO FINAL ===");
    for (let n of await repositorio.obtenerTodas()) {
        console.log("ID: " + n.id + " | Empleado: " + n.empleadoId +
            " | Periodo: " + n.periodo +
            " | Devengado: $" + n.totalDevengado +
            " | Neto: $" + n.netoPagar);
    }
    console.log("");
}

probar().catch(function (error) {
    console.log("ERROR: " + error.message);
});
