const consola = require("./vistas/consola");
const controlador = require("./controladores/controladorEmpleados");
const repositorio = require("./repositorios/repositorioEmpleados");

function iniciar() {
    let continuar = true;

    while (continuar) {
        let opcion = consola.mostrarMenu();

        if (opcion === "1") {
            let datos = consola.pedirDatosEmpleado(null);
            controlador.registrarEmpleado(datos);

        } else if (opcion === "2") {
            consola.mostrarEmpleados(repositorio.obtenerTodos());

        } else if (opcion === "3") {
            let id = consola.pedirId("ID del empleado a editar");
            let emp = repositorio.buscarEmpleadoPorId(id);

            if (emp === null) {
                console.log("ERROR: no existe un empleado con ese id.");
            } else {
                let datosNuevos = consola.pedirDatosEmpleado(emp);
                controlador.guardarEdicion(id, datosNuevos);
            }

        } else if (opcion === "0") {
            continuar = false;
            console.log("Hasta luego.");

        } else {
            console.log("Opción no válida.");
        }
    }
}

iniciar();