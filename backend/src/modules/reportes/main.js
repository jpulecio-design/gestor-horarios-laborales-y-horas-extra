const fs = require("fs");

const prompt = require("prompt-sync")({ sigint: true });

const controlador = require("./app/controladorReportes");

// Consola para probar el CU13 de forma individual, sin levantar el servidor.
//   node src/modules/reportes/main.js
async function iniciar() {
    console.log("===== EXPORTAR REPORTES A EXCEL (CU13) =====");
    console.log("Genera un .xlsx con las hojas Resumen, Horas extra y Asistencia.");

    let desde = prompt("Fecha desde (AAAA-MM-DD): ").trim();
    let hasta = prompt("Fecha hasta (AAAA-MM-DD): ").trim();

    let resultado = await controlador.exportarReporte(desde, hasta);

    if (!resultado.exito) {
        console.log(resultado.mensaje);
        return;
    }

    fs.writeFileSync(resultado.datos.nombreArchivo, Buffer.from(resultado.datos.buffer));

    console.log("Reporte generado: " + resultado.datos.nombreArchivo);
    console.log("  Empleados: " + resultado.datos.conteos.empleados);
    console.log("  Filas de horas extra: " + resultado.datos.conteos.horasExtra);
    console.log("  Jornadas de asistencia: " + resultado.datos.conteos.jornadas);
}

iniciar().catch(function (error) {
    console.log("ERROR: " + error.message);
});
