const controlador = require("../src/modules/empleados/controladores/controladorEmpleados");
const repositorio = require("../src/modules/empleados/repositorios/repositorioEmpleados");
const consola = require("../src/modules/empleados/vistas/consola");
const database = require("../src/config/database");

// Date.now() da los milisegundos actuales un numero distinto en cada ejecucion
// tomamos los ultimos 6 digitos para que la cedula no pase de 20 caracteres
const sufijo = String(Date.now()).slice(-6);

// chat de Telegram de la persona que recibira el aviso de la prueba 8
// Cambialo por el chat id de quien quieras avisar 
const CHAT_DE_PRUEBA = "6924883157";

// funciones que crean los datos de prueba 
function datosAna() {
    return {
        nombre: "Ana", apellido: "Gómez", cedula: "PRB" + sufijo + "1",
        correo: "ana" + sufijo + "@prueba.com", contrasena: "1234", telefono: "3001112233",
        fechaIngreso: "2026-01-15", cargo: "Cajera", salarioBase: "1500000",
        contactoNombre: "Luis Gómez", contactoTelefono: "3104445566", contactoParentesco: "Padre",
        telegramChatId: "" // empieza sin chat y sus avisos van al administrador
    };
}

function datosCarlos() {
    return {
        nombre: "Carlos", apellido: "Ruiz", cedula: "PRB" + sufijo + "2",
        correo: "carlos" + sufijo + "@prueba.com", contrasena: "abcd", telefono: "3009998877",
        fechaIngreso: "2026-03-01", cargo: "Vigilante", salarioBase: "1400000",
        contactoNombre: "Marta Ruiz", contactoTelefono: "3151234567", contactoParentesco: "Madre",
        telegramChatId: ""
    };
}

let idAna = null;
let datosDeAna = null; // guarda los datos de Ana tal como quedaron en la prueba 7

// cada prueba es un .then(): la siguiente empieza solo cuando la anterior termino
console.log("\n=== PRUEBA 1: registrar un empleado válido ===");
controlador.registrarEmpleado(datosAna())
    .then(function () {
        console.log("\n=== PRUEBA 2: registrar otro empleado válido ===");
        return controlador.registrarEmpleado(datosCarlos());
    })
    .then(function () {
        console.log("\n=== PRUEBA 3: campos obligatorios vacíos (debe fallar) ===");
        return controlador.registrarEmpleado({ nombre: "", apellido: "" });
    })
    .then(function () {
        console.log("\n=== PRUEBA 4: cédula repetida (debe fallar) ===");
        let repetido = datosCarlos();
        repetido.cedula = datosAna().cedula;
        repetido.correo = "otro" + sufijo + "@prueba.com";
        return controlador.registrarEmpleado(repetido);
    })
    .then(function () {
        // buscamos el id que Oracle le dio a Ana para poder editarla
        return database.ejecutar(
            "SELECT id_empleado FROM EMPLEADO WHERE cedula = :cedula",
            { cedula: datosAna().cedula }
        );
    })
    .then(function (resultado) {
        idAna = resultado.rows[0].ID_EMPLEADO;
        console.log("\n=== PRUEBA 5: editar a Ana sin cambiar nada ===");
        return controlador.guardarEdicion(idAna, datosAna());
    })
    .then(function () {
        console.log("\n=== PRUEBA 6: editar a Ana con el correo de Carlos (debe fallar) ===");
        let datos = datosAna();
        datos.correo = datosCarlos().correo;
        return controlador.guardarEdicion(idAna, datos);
    })
    .then(function () {
        console.log("\n=== PRUEBA 7: editar a Ana cambiando cargo, salario, teléfono y contraseña ===");
        let datos = datosAna();
        datos.cargo = "Supervisora";
        datos.salarioBase = "1800000";
        datos.telefono = "3200000000";
        datos.contrasena = "nueva123";
        datosDeAna = datos; // los reusamos en la prueba 8
        return controlador.guardarEdicion(idAna, datos);
    })
    .then(function () {
        console.log("\n=== PRUEBA 8: asignarle a Ana su propio chat de Telegram ===");
        // partimos de como quedó en la prueba 7 y SOLO le agregamos el chat
        // para que se vea un único cambio el aviso de ESTA edición ya le llega a ella
        let datos = datosDeAna;
        datos.telegramChatId = CHAT_DE_PRUEBA;
        return controlador.guardarEdicion(idAna, datos);
    })
    .then(function () {
        console.log("\n=== PRUEBA 9: chat ID con letras (debe fallar) ===");
        let datos = datosAna();
        datos.telegramChatId = "arroba_ana";
        return controlador.guardarEdicion(idAna, datos);
    })
    .then(function () {
        console.log("\n=== PRUEBA 10: salario que no es número (debe fallar) ===");
        let datos = datosAna();
        datos.salarioBase = "mil pesos";
        return controlador.guardarEdicion(idAna, datos);
    })
    .then(function () {
        console.log("\n=== PRUEBA 11: editar un id que no existe (debe fallar) ===");
        return controlador.guardarEdicion(999999, datosAna());
    })
    .then(function () {
        console.log("\n=== RESULTADO: empleados en la base de datos ===");
        return repositorio.obtenerTodos();
    })
    .then(function (lista) {
        consola.mostrarEmpleados(lista);

        console.log("\n=== LIMPIEZA: borrando los empleados de prueba ===");
        // primero los contactos  despues los empleado
        return database.ejecutar(
            "DELETE FROM CONTACTO_EMERGENCIA WHERE id_empleado IN " +
            "(SELECT id_empleado FROM EMPLEADO WHERE cedula LIKE 'PRB%')",
            {}
        );
    })
    .then(function () {
        return database.ejecutar("DELETE FROM EMPLEADO WHERE cedula LIKE 'PRB%'", {});
    })
    .then(function (resultado) {
        console.log("Se borraron " + resultado.rowsAffected + " empleados de prueba.\n");
    })
    .catch(function (error) {
        console.log("\nLAS PRUEBAS SE DETUVIERON: " + error.message);
    });