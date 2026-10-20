const consola = require("./cli/consolaRelevos");
const controlador = require("./app/controladorRelevos");
const repositorio = require("./datos/repositorioRelevos");

async function iniciar(empleadoId) {
    let continuar = true;

    while (continuar) {
        let opcion = consola.mostrarMenu(empleadoId);

        if (opcion === "1") {
            consola.mostrarAgenda(await controlador.agendaDeEmpleado(empleadoId));

        } else if (opcion === "2") {
            let fecha = consola.pedirTexto("Fecha del turno que quieres ceder (AAAA-MM-DD)");
            let idCompanero = consola.pedirId("ID del compañero que lo cubriría");
            let resultado = await controlador.solicitarRelevo({
                fecha: fecha,
                idSolicitante: empleadoId,
                idCompanero: idCompanero
            });
            console.log(resultado.mensaje);

        } else if (opcion === "3") {
            consola.mostrarRelevos("SOLICITUDES QUE ENVIÉ",
                await controlador.relevosEnviados(empleadoId), false);

        } else if (opcion === "4") {
            consola.mostrarRelevos("SOLICITUDES QUE RECIBÍ",
                await controlador.relevosRecibidos(empleadoId), true);

        } else if (opcion === "5") {
            let idSolicitud = consola.pedirId("ID de la solicitud");
            let solicitud = await repositorio.buscarSolicitudPorId(idSolicitud);

            if (solicitud === null) {
                console.log("ERROR: no existe esa solicitud.");
            } else {
                console.log(
                    "\n" + solicitud.solicitante.nombre + " " + solicitud.solicitante.apellido +
                    " te pidió cubrir el turno del " + solicitud.horario.fecha +
                    " (" + solicitud.horario.tipoTurno + ", " +
                    solicitud.horario.horaEntrada + "-" + solicitud.horario.horaSalida + ")."
                );

                let respuesta = consola.confirmar("¿Aceptas cubrir ese turno?")
                    ? "Confirmado"
                    : "Rechazado";

                let resultado = await controlador.responderRelevo({
                    idSolicitud: idSolicitud,
                    idEmpleado: empleadoId,
                    respuesta: respuesta
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

iniciar(consola.pedirId("Tu ID de empleado")).catch(function (error) {
    console.log("ERROR: " + error.message);
});