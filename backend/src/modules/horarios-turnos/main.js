const consola = require("./cli/consola");
const controlador = require("./app/controladorHorarios");
const repositorio = require("./datos/repositorioHorarios");

async function iniciar() {
    let continuar = true;

    while (continuar) {
        let opcion = consola.mostrarMenu();

        if (opcion === "1") {
            let nombre = consola.pedirTexto("Nombre del turno (ej: Diurno)");
            let horaEntrada = consola.pedirTexto("Hora de entrada (HH:MM)");
            let horaSalida = consola.pedirTexto("Hora de salida (HH:MM)");
            let dias = consola.pedirTextoConDefecto("Días 1=lunes ... 7=domingo, separados por coma", "1,2,3,4,5");
            let resultado = await controlador.registrarTurno({
                nombre: nombre,
                horaEntrada: horaEntrada,
                horaSalida: horaSalida,
                dias: dias
            });
            console.log(resultado.mensaje);

        } else if (opcion === "2") {
            consola.mostrarTurnos(await repositorio.obtenerTurnos());

        } else if (opcion === "3") {
            let empleadoId = consola.pedirId("ID del empleado");
            let turnoId = consola.pedirId("ID del turno");
            let fechaDesde = consola.pedirTexto("Fecha desde (AAAA-MM-DD)");
            let fechaHasta = consola.pedirTexto("Fecha hasta (AAAA-MM-DD, vacío = indefinido)");
            let resultado = await controlador.asignarHorario({
                empleadoId: empleadoId,
                turnoId: turnoId,
                fechaDesde: fechaDesde,
                fechaHasta: fechaHasta
            });
            console.log(resultado.mensaje);

        } else if (opcion === "4") {
            let id = consola.pedirId("ID del empleado");
            consola.mostrarAsignaciones(await controlador.horarioDeEmpleado(id));

        } else if (opcion === "5") {
            let id = consola.pedirId("ID del empleado");
            consola.mostrarHoy(await controlador.horarioDeHoy(id));

        } else if (opcion === "6") {
            let id = consola.pedirId("ID del empleado");
            let fecha = consola.pedirTexto("Fecha dentro de la semana (AAAA-MM-DD, vacío = hoy)");
            consola.mostrarSemana(await controlador.semanaDeEmpleado(id, fecha === "" ? undefined : fecha));

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
