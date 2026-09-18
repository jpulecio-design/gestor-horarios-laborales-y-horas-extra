const controladorEmpleados = require("../src/modules/empleados/controladores/controladorEmpleados");
const controladorHorasExtra = require("../src/modules/horas-extra/app/controladorHorasExtra");
const controlador = require("../src/modules/nomina/app/controladorNomina");
const repositorio = require("../src/modules/nomina/datos/repositorioNomina");

// dejamos de base dos empleados y sus horas extra del periodo 2026-08
controladorEmpleados.registrarEmpleado({
    nombre: "Ana", apellido: "Gómez", cedula: "1001", correo: "ana@correo.com",
    contrasena: "1234", telefono: "3001112233", horaEntrada: "08:00",
    horaSalida: "17:00", turno: "Diurno", acudienteNombre: "Luis Gómez",
    acudienteTelefono: "3104445566", fechaIngreso: "2026-01-15"
});

controladorEmpleados.registrarEmpleado({
    nombre: "Carlos", apellido: "Ruiz", cedula: "1002", correo: "carlos@correo.com",
    contrasena: "abcd", telefono: "3009998877", horaEntrada: "22:00",
    horaSalida: "06:00", turno: "Nocturno", acudienteNombre: "Marta Ruiz",
    acudienteTelefono: "3151234567", fechaIngreso: "2026-03-01"
});

// horas extra que debe retomar la liquidación de Ana en 2026-08
controladorHorasExtra.registrarHoraExtra({
    empleadoId: 1, fecha: "2026-08-10", tipo: "Diurna",
    cantidadHoras: 2, valorHoraBase: 5000
});
controladorHorasExtra.registrarHoraExtra({
    empleadoId: 1, fecha: "2026-08-11", tipo: "Nocturna",
    cantidadHoras: 3, valorHoraBase: 5000
});

console.log("\n=== PRUEBA 1: registrar nomina valida de Ana (periodo 2026-08) ===");
let r1 = controlador.registrarNomina({
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
console.log(controlador.registrarNomina({
    empleadoId: 1, periodo: "2026-08", salarioBase: 1600000,
    horasRecargoNocturno: 0, horasRecargoFestivo: 0
}).mensaje);

console.log("\n=== PRUEBA 3: empleado que no existe (debe fallar) ===");
console.log(controlador.registrarNomina({
    empleadoId: 99, periodo: "2026-08", salarioBase: 1600000,
    horasRecargoNocturno: 0, horasRecargoFestivo: 0
}).mensaje);

console.log("\n=== PRUEBA 4: salario base en cero (debe fallar) ===");
console.log(controlador.registrarNomina({
    empleadoId: 2, periodo: "2026-09", salarioBase: 0,
    horasRecargoNocturno: 0, horasRecargoFestivo: 0
}).mensaje);

console.log("\n=== PRUEBA 5: periodo vacio (debe fallar) ===");
console.log(controlador.registrarNomina({
    empleadoId: 2, periodo: "", salarioBase: 1600000,
    horasRecargoNocturno: 0, horasRecargoFestivo: 0
}).mensaje);

console.log("\n=== RESULTADO FINAL ===");
for (let n of repositorio.obtenerTodas()) {
    console.log("ID: " + n.id + " | Empleado: " + n.empleadoId +
        " | Periodo: " + n.periodo +
        " | Devengado: $" + n.totalDevengado +
        " | Neto: $" + n.netoPagar);
}
console.log("");