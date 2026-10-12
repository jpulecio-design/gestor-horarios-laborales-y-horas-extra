const consola = require("./cli/consola");
const controlador = require("./app/controladorMonitoreo");

// Consola para probar el CU07 de forma individual, sin levantar el servidor.
//   node src/modules/monitoreo/main.js
async function iniciar() {
    let continuar = true;

    while (continuar) {
        let opcion = consola.mostrarMenu();

        if (opcion === "1" || opcion === "2") {
            let desde = consola.pedirTexto("Fecha desde (AAAA-MM-DD)");
            let hasta = consola.pedirTexto("Fecha hasta (AAAA-MM-DD)");

            if (opcion === "1") {
                let id = consola.pedirId("ID del empleado");
                let resultado = await controlador.monitorearEmpleado(id, desde, hasta);
                if (resultado.exito) {
                    consola.mostrarResumenEmpleado(resultado.datos);
                } else {
                    console.log(resultado.mensaje);
                }
            } else {
                let resultado = await controlador.monitorearGeneral(desde, hasta);
                if (resultado.exito) {
                    consola.mostrarResumenGeneral(resultado.datos);
                } else {
                    console.log(resultado.mensaje);
                }
            }

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
