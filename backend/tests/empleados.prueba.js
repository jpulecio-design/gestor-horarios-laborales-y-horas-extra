const controlador = require("../src/modules/empleados/controladores/controladorEmpleados");
const repositorio = require("../src/modules/empleados/repositorios/repositorioEmpleados");
const consola = require("../src/modules/empleados/vistas/consola");

console.log("\n=== PRUEBA 1: registrar un empleado valido ===");
controlador.registrarEmpleado({
    nombre: "Ana", apellido: "Gómez", cedula: "1001", correo: "ana@correo.com",
    contrasena: "1234", telefono: "3001112233", horaEntrada: "08:00",
    horaSalida: "17:00", turno: "Diurno", acudienteNombre: "Luis Gómez",
    acudienteTelefono: "3104445566", fechaIngreso: "2026-01-15"
});

console.log("\n=== PRUEBA 2: registrar otro empleado valido ===");
controlador.registrarEmpleado({
    nombre: "Carlos", apellido: "Ruiz", cedula: "1002", correo: "carlos@correo.com",
    contrasena: "abcd", telefono: "3009998877", horaEntrada: "22:00",
    horaSalida: "06:00", turno: "Nocturno", acudienteNombre: "Marta Ruiz",
    acudienteTelefono: "3151234567", fechaIngreso: "2026-03-01"
});

console.log("\n=== PRUEBA 3: campos obligatorios vaicos (debe fallar) ===");
controlador.registrarEmpleado({
    nombre: "", apellido: "", cedula: "", correo: "",
    contrasena: "", telefono: "", horaEntrada: "", horaSalida: "",
    turno: "Diurno", acudienteNombre: "", acudienteTelefono: "", fechaIngreso: ""
});

console.log("\n=== PRUEBA 4: cédula repetida (debe fallar) ===");
controlador.registrarEmpleado({
    nombre: "Pedro", apellido: "López", cedula: "1001", correo: "pedro@correo.com",
    contrasena: "0000", telefono: "3000000000", horaEntrada: "08:00",
    horaSalida: "17:00", turno: "Diurno", acudienteNombre: "X",
    acudienteTelefono: "0", fechaIngreso: "2026-02-02"
});

console.log("\n=== PRUEBA 5: editar a Ana sin cambiar nada ===");
let ana = repositorio.buscarEmpleadoPorId(1);
controlador.guardarEdicion(1, {
    nombre: ana.usuario.nombre, apellido: ana.usuario.apellido,
    cedula: ana.usuario.cedula, correo: ana.usuario.correo,
    contrasena: ana.usuario.contrasena, telefono: ana.usuario.telefono,
    horaEntrada: ana.horaEntrada, horaSalida: ana.horaSalida, turno: ana.turno,
    acudienteNombre: ana.acudiente.nombre, acudienteTelefono: ana.acudiente.telefono,
    fechaIngreso: ana.fechaIngreso
});

console.log("\n=== PRUEBA 6: editar a Ana con el correo de Carlos (debe fallar) ===");
controlador.guardarEdicion(1, {
    nombre: "Ana", apellido: "Gómez", cedula: "1001", correo: "carlos@correo.com",
    contrasena: "1234", telefono: "3001112233", horaEntrada: "08:00",
    horaSalida: "17:00", turno: "Diurno", acudienteNombre: "Luis Gómez",
    acudienteTelefono: "3104445566", fechaIngreso: "2026-01-15"
});

console.log("\n=== PRUEBA 7: editar a Ana cambiando turno, teléfono y contraseña ===");
controlador.guardarEdicion(1, {
    nombre: "Ana", apellido: "Gómez", cedula: "1001", correo: "ana@correo.com",
    contrasena: "nueva123", telefono: "3200000000", horaEntrada: "22:00",
    horaSalida: "06:00", turno: "Nocturno", acudienteNombre: "Luis Gómez",
    acudienteTelefono: "3104445566", fechaIngreso: "2026-01-15"
});

console.log("\n=== PRUEBA 8: editar un id que no existe (debe fallar) ===");
controlador.guardarEdicion(99, {});

console.log("\n=== RESULTADO FINAL ===");
consola.mostrarEmpleados(repositorio.obtenerTodos());
console.log("");