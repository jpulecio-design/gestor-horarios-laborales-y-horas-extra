const consola = require("./cli/consola");
const controlador = require("./app/controladorHorasExtra");
const repositorio = require("./datos/repositorioHorasExtra");

async function iniciar() {
    let continuar = true;

    while (continuar) {
        let opcion = consola.mostrarMenu();

        if (opcion === "1") {
            let datos = consola.pedirDatosHoraExtra(null);
            let resultado = await controlador.registrarHoraExtra(datos);
            console.log(resultado.mensaje);

        } else if (opcion === "2") {
            consola.mostrarHorasExtras(await repositorio.obtenerTodas());

        } else if (opcion === "3") {
            let id = consola.pedirId("ID del empleado");
            consola.mostrarHorasExtras(await repositorio.obtenerPorEmpleado(id));

        } else if (opcion === "0") {
            continuar = false;
            console.log("Hasta luego.");

        } else {
            console.log("Opción no válida.");
        }
    }
}

iniciar().catch(function (error) {
    console.log("ERROR: " + error.message);
});
