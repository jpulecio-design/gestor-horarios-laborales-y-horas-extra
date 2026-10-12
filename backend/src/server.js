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
    console.log("  /api/asistencia  -> GET /, POST /qr, GET /empleado/:id, GET /empleado/:id/qr");
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