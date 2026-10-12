const QRCode = require("qrcode");

const consola = require("./cli/consola");
const controlador = require("./app/controladorAsistencia");
const repositorio = require("./datos/repositorioAsistencia");

// Consola para probar el CU03 de forma individual, sin levantar el servidor.
//   node src/modules/asistencia/main.js
async function iniciar() {
    let continuar = true;

    while (continuar) {
        let opcion = consola.mostrarMenu();

        if (opcion === "1") {
            let codigo = consola.pedirCodigoQr();
            let resultado = await controlador.registrarPorQr(codigo);
            console.log(resultado.mensaje);

        } else if (opcion === "2") {
            consola.mostrarMarcajes(await repositorio.obtenerTodos());

        } else if (opcion === "3") {
            let id = consola.pedirId("ID del empleado");
            consola.mostrarMarcajes(await repositorio.obtenerPorEmpleado(id));

        } else if (opcion === "4") {
            let id = consola.pedirId("ID del empleado");
            let qr = await controlador.obtenerQrDeEmpleado(id);

            if (qr === null) {
                console.log("ERROR: no existe un empleado con ese id.");
            } else {
                let archivo = "qr-empleado-" + id + ".png";
                await QRCode.toFile(archivo, qr.codigoQr);
                console.log("Codigo QR: " + qr.codigoQr);
                console.log("Imagen guardada en " + archivo);
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
