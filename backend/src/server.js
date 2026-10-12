const app = require("./app");
const database = require("./config/database");

const PORT = Number(process.env.PORT) || 3000;

const servidor = app.listen(PORT, () => {
    console.log("API escuchando en el puerto " + PORT);
    console.log("  /api/auth        -> POST /login");
    console.log("  /api/test        -> GET /health, GET /test-db");
    console.log("  /api/empleados   -> GET /, POST /, PUT /:id");
    console.log("  /api/horas-extra -> GET /, POST /");
    console.log("  /api/nomina      -> GET /, POST /");
    console.log("  /api/asistencia  -> GET /, POST /qr, PUT /:id, GET /empleado/:id[/qr]");
    console.log("  /api/horarios    -> GET/POST /turnos, POST /asignaciones, GET /empleado/:id[/hoy|/semana]");
    console.log("  /api/monitoreo   -> GET /general, GET /empleado/:id (query desde, hasta)");
    console.log("  /api/reportes    -> GET /monitoreo.xlsx (query desde, hasta)");
});

// Apagado ordenado: cierra el servidor y devuelve las conexiones al pool.
function apagar() {
    servidor.close(function () {
        database.cerrar().finally(function () {
            process.exit(0);
        });
    });
}

process.on("SIGINT", apagar);
process.on("SIGTERM", apagar);