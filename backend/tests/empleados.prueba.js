const controlador = require("../src/modules/empleados/controladores/controladorEmpleados");

const repositorio = require("../src/modules/empleados/repositorios/repositorioEmpleados");

const consola = require("../src/modules/empleados/vistas/consola");

const database = require("../src/config/database");

// Date.now() da los milisegundos actuales, un número distinto en cada ejecución

// Tomamos los últimos 6 dígitos para que la cédula no pase de 20 caracteres
const sufijo = String(Date.now()).slice(-6);

// Chat de Telegram de la persona que recibirá el aviso de la prueba 8
// Cámbialo por el chat ID de quien quieras avisar
const CHAT_DE_PRUEBA = "6924883157";

// Funciones que crean los datos de prueba
function datosAna() {
    return {
        nombre: "Ana",
        apellido: "Gómez",
        cedula: "PRB" + sufijo + "1",
        correo: "ana" + sufijo + "@prueba.com",
        contrasena: "1234",
        telefono: "3001112233",
        fechaIngreso: "2026-01-15",
        cargo: "Cajera",
        salarioBase: "1500000",
        contactoNombre: "Luis Gómez",
        contactoTelefono: "3104445566",
        contactoParentesco: "Padre",
        telegramChatId: ""
    };
}

function datosCarlos() {
    return {
        nombre: "Carlos",
        apellido: "Ruiz",
        cedula: "PRB" + sufijo + "2",
        correo: "carlos" + sufijo + "@prueba.com",
        contrasena: "abcd",
        telefono: "3009998877",
        fechaIngreso: "2026-03-01",
        cargo: "Vigilante",
        salarioBase: "1400000",
        contactoNombre: "Marta Ruiz",
        contactoTelefono: "3151234567",
        contactoParentesco: "Madre",
        telegramChatId: ""
    };
}

let idAna = null;
let datosDeAna = null;

// Cada prueba es un .then():
// la siguiente empieza solo cuando la anterior terminó

console.log("\n=== PRUEBA 1: registrar un empleado válido ===");

controlador.registrarEmpleado(datosAna())

    .then(function () {
        console.log("\n=== PRUEBA 2: registrar otro empleado válido ===");

        return controlador.registrarEmpleado(datosCarlos());
    })

    .then(function () {
        console.log("\n=== PRUEBA 3: campos obligatorios vacíos (debe fallar) ===");

        return controlador.registrarEmpleado({
            nombre: "",
            apellido: ""
        });
    })

    .then(function () {
        console.log("\n=== PRUEBA 4: cédula repetida (debe fallar) ===");

        let repetido = datosCarlos();

        repetido.cedula = datosAna().cedula;
        repetido.correo = "otro" + sufijo + "@prueba.com";

        return controlador.registrarEmpleado(repetido);
    })

    .then(function () {
        // Buscamos el ID que Oracle le dio a Ana para poder editarla

        return database.ejecutar(
            "SELECT id_empleado FROM EMPLEADO WHERE cedula = :cedula",
            {
                cedula: datosAna().cedula
            }
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

        // Guardamos los datos para reutilizarlos en la prueba 8
        datosDeAna = datos;

        return controlador.guardarEdicion(idAna, datos);
    })

    .then(function () {
        console.log("\n=== PRUEBA 8: asignarle a Ana su propio chat de Telegram ===");

        // Partimos de cómo quedó en la prueba 7
        // y solamente agregamos el chat

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
        console.log("\n=== PRUEBA 11: editar un ID que no existe (debe fallar) ===");

        return controlador.guardarEdicion(999999, datosAna());
    })

    .then(function () {
        console.log("\n=== RESULTADO: empleados en la base de datos ===");

        return repositorio.obtenerTodos();
    })

    .then(function (lista) {
        consola.mostrarEmpleados(lista);

        console.log("\n=== FIN DE LAS PRUEBAS ===");
        console.log("Los empleados de prueba NO fueron eliminados.");
        console.log("Ana y Carlos permanecen en la base de datos.\n");
    })

    .catch(function (error) {
        console.log("\nLAS PRUEBAS SE DETUVIERON: " + error.message);
    });