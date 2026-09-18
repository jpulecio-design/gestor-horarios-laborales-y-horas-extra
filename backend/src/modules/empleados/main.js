const consola = require("./vistas/consola");
const controlador = require("./controladores/controladorEmpleados");
const repositorio = require("./repositorios/repositorioEmpleados");

function iniciar() {
    let opcion = consola.mostrarMenu();
    let tarea; // aqui se guarda la promesa de la opcion elegida

    if (opcion === "1") {
        tarea = opcionRegistrar();
    } else if (opcion === "2") {
        tarea = opcionVerEmpleados();
    } else if (opcion === "3") {
        tarea = opcionEditar();
    } else if (opcion === "0") {
        console.log("Hasta luego.");
        return; // no llamamos a iniciar() otra vez y el programa termina
    } else {
        console.log("Opción no válida.");
        tarea = Promise.resolve(); // promesa ya terminada para seguir igual
    }

    tarea
        .catch(function (error) {
            // errores inesperados 
            console.log("ERROR: " + error.message);
        })
        .then(function () {
            iniciar(); // volver al menú
        });
}

function opcionRegistrar() {
    let datos = consola.pedirDatosEmpleado(null);
    return controlador.registrarEmpleado(datos);
}

function opcionVerEmpleados() {
    return repositorio.obtenerTodos()
        .then(function (lista) {
            consola.mostrarEmpleados(lista);
        });
}

function opcionEditar() {
    let id = consola.pedirId("ID del empleado a editar");

    return repositorio.buscarEmpleadoPorId(id)
        .then(function (empleado) {
            if (empleado === null) {
                console.log("ERROR: no existe un empleado con ese id.");
                return;
            }
            let datosNuevos = consola.pedirDatosEmpleado(empleado);
            return controlador.guardarEdicion(id, datosNuevos);
        });
}

iniciar();