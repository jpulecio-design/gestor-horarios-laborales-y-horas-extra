const consola = require("./cli/consola");
const controlador = require("./app/controladorHorasExtra");
const repositorio = require("./datos/repositorioHorasExtra");

function iniciar() {
    let continuar = true;

    while (continuar) {
        let opcion = consola.mostrarMenu();

        if (opcion === "1") {
            let datos = consola.pedirDatosHoraExtra(null);
            let resultado = controlador.registrarHoraExtra(datos);
            console.log(resultado.mensaje);

        } else if (opcion === "2") {
            consola.mostrarHorasExtras(repositorio.obtenerTodas());

        } else if (opcion === "3") {
            let id = consola.pedirId("ID del empleado");
            consola.mostrarHorasExtras(repositorio.obtenerPorEmpleado(id));

        } else if (opcion === "0") {
            continuar = false;
            console.log("Hasta luego.");

        } else {
            console.log("Opción no válida.");
        }
    }
}

iniciar();