const consola = require("./cli/consola");
const controlador = require("./app/controladorNomina");
const repositorio = require("./datos/repositorioNomina");

async function iniciar() {
    let continuar = true;

    while (continuar) {
        let opcion = consola.mostrarMenu();

        if (opcion === "1") {
            let datos = consola.pedirDatosNomina(null);
            let resultado = await controlador.registrarNomina(datos);

            if (resultado.exito) {
                consola.mostrarNomina(resultado.datos);
            } else {
                console.log(resultado.mensaje);
            }

        } else if (opcion === "2") {
            consola.mostrarNominas(await repositorio.obtenerTodas());

        } else if (opcion === "3") {
            let id = consola.pedirId("ID del empleado");
            consola.mostrarNominas(await repositorio.obtenerPorEmpleado(id));

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
