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

        } else if (opcion === "5") {
            let id = consola.pedirId("ID del marcaje a corregir");
            let actual = await repositorio.buscarPorId(id);

            if (actual === null) {
                console.log("ERROR: no existe un marcaje con ese id.");
            } else {
                console.log("Actual -> " + actual.tipo + " | " + actual.fechaHora +
                    " | " + actual.estado + " | " + (actual.observacion || ""));
                let tipo = consola.pedirConDefecto("Tipo (Entrada/Salida)", actual.tipo);
                let fechaHora = consola.pedirConDefecto("Fecha y hora (AAAA-MM-DD HH:MM:SS)", actual.fechaHora);
                let observacion = consola.pedirConDefecto("Observación", actual.observacion);
                let estado = consola.pedirConDefecto("Estado (Activo/Anulado)", actual.estado);
                let resultado = await controlador.corregirRegistro(id, {
                    tipo: tipo,
                    fechaHora: fechaHora,
                    observacion: observacion,
                    estado: estado
                });
                console.log(resultado.mensaje);
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
