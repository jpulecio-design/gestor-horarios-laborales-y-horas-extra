const controladorEmpleados = require("../src/modules/empleados/controladores/controladorEmpleados");
const controlador = require("../src/modules/horas-extra/app/controladorHorasExtra");
const repositorio = require("../src/modules/horas-extra/datos/repositorioHorasExtra");

// dejamos de base dos empleados para poder asignarles horas extra
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

console.log("\n=== PRUEBA 1: registrar hora extra diurna valida ===");
console.log(controlador.registrarHoraExtra({
    empleadoId: 1, fecha: "2026-08-10", tipo: "Diurna",
    cantidadHoras: 2, valorHoraBase: 5000
}).mensaje);

console.log("\n=== PRUEBA 2: registrar hora extra nocturna valida ===");
console.log(controlador.registrarHoraExtra({
    empleadoId: 1, fecha: "2026-08-11", tipo: "Nocturna",
    cantidadHoras: 3, valorHoraBase: 5000
}).mensaje);

console.log("\n=== PRUEBA 3: registrar hora extra festiva valida ===");
console.log(controlador.registrarHoraExtra({
    empleadoId: 2, fecha: "2026-08-15", tipo: "Festiva",
    cantidadHoras: 4, valorHoraBase: 6000
}).mensaje);

console.log("\n=== PRUEBA 4: empleado que no existe (debe fallar) ===");
console.log(controlador.registrarHoraExtra({
    empleadoId: 99, fecha: "2026-08-10", tipo: "Diurna",
    cantidadHoras: 2, valorHoraBase: 5000
}).mensaje);

console.log("\n=== PRUEBA 5: tipo invalido (debe fallar) ===");
console.log(controlador.registrarHoraExtra({
    empleadoId: 1, fecha: "2026-08-10", tipo: "Madrugada",
    cantidadHoras: 2, valorHoraBase: 5000
}).mensaje);

console.log("\n=== PRUEBA 6: cantidad de horas en cero (debe fallar) ===");
console.log(controlador.registrarHoraExtra({
    empleadoId: 1, fecha: "2026-08-10", tipo: "Diurna",
    cantidadHoras: 0, valorHoraBase: 5000
}).mensaje);

console.log("\n=== RESULTADO FINAL ===");
console.log("Horas extra del empleado 1:");
for (let h of repositorio.obtenerPorEmpleado(1)) {
    console.log("  ID: " + h.id + " | " + h.tipo + " | " + h.cantidadHoras + "h | $" + h.valor);
}
console.log("Horas extra del empleado 2:");
for (let h of repositorio.obtenerPorEmpleado(2)) {
    console.log("  ID: " + h.id + " | " + h.tipo + " | " + h.cantidadHoras + "h | $" + h.valor);
}
console.log("");